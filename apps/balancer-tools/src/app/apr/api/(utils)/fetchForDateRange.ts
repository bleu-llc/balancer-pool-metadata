/* eslint-disable no-console */

import { Network, networkIdFor } from "@bleu-balancer-tools/utils";
import * as Sentry from "@sentry/nextjs";

import { DefiLlamaAPI } from "#/lib/defillama";
import { poolsWithCache } from "#/lib/gql/server";
import { fetcher } from "#/utils/fetcher";

import { BASE_URL } from "../../(utils)/types";
import { PoolStatsData, PoolStatsResults } from "../route";
import { dateToEpoch, formatDateToMMDDYYYY } from "./date";
import { QueryParamsSchema } from "./validate";

const fetchPoolsFromNetwork = async (
  network: string,
  params: ReturnType<typeof QueryParamsSchema.safeParse>,
  skip = 0,
) => {
  if (!params.success) return [];

  const maxTvl = params.data.maxTvl || 10_000_000_000;
  const minTvl = params.data.minTvl || 10_000;
  const limit = 1_000;

  const createdBefore = dateToEpoch(params.data.endAt);
  const tokens = params.data.tokens || [];

  let block;

  try {
    block = await DefiLlamaAPI.findBlockNumber(network, createdBefore);
  } catch (e) {
    // If this errors out, probably the network didn't exist at that timestamp
    return [];
  }
  let response;
  const tokensList = tokens.length ? { tokens_: { symbol_in: tokens } } : {};
  try {
    //TODO: not cache if createdBefore is today
    response = await poolsWithCache.gql(networkIdFor(network)).APRPools({
      skip,
      createdBefore: createdBefore,
      limit,
      minTvl,
      maxTvl,
      block,
      ...tokensList,
    });
  } catch (e) {
    // If this errors out, probably the subgraph hadn't been deployed yet at this block
    return [];
  }
  let fetchedPools: typeof response.pools;
  console.log(
    `Fetched ${response.pools.length} pools from ${network}(${networkIdFor(
      network,
    )}) for block ${block}`,
  );
  fetchedPools = response.pools;

  if (response.pools.length > limit) {
    fetchedPools = [
      ...fetchedPools,
      ...(await fetchPoolsFromNetwork(network, params, skip + limit)),
    ];
  }

  return fetchedPools;
};

const fetchPools = async (
  params: ReturnType<typeof QueryParamsSchema.safeParse>,
) => {
  if (!params.success) return [];

  const networks = params.data.network
    ? [params.data.network]
    : Object.values(Network).filter(
        (network) => network !== Network.Sepolia && network !== Network.Goerli,
      );
  const allFetchedPools = await Promise.all(
    networks.map(
      async (network) => await fetchPoolsFromNetwork(network, params),
    ),
  );

  // Flatten the array of arrays into a single array.
  return allFetchedPools.flat();
};

export async function fetchDataForDateRange(
  startDate: Date,
  endDate: Date,
  parsedParams: ReturnType<typeof QueryParamsSchema.safeParse>,
): Promise<{ [key: string]: PoolStatsData[] }> {
  if (!parsedParams.success) {
    console.log(parsedParams.error);
    return {};
  }

  const existingPoolForDate = await fetchPools(parsedParams);
  console.log(`fetched ${existingPoolForDate.length} pools`);
  const perDayData: { [key: string]: PoolStatsData[] } = {};

  await Promise.all(
    existingPoolForDate.map(async (pool) => {
      let gaugesData;
      try {
        gaugesData = await fetcher<PoolStatsResults>(
          `${BASE_URL}/apr/api?startAt=${formatDateToMMDDYYYY(
            startDate,
          )}&endAt=${formatDateToMMDDYYYY(endDate)}&poolId=${pool.id}`,
        );
      } catch (error) {
        console.log(error);
        console.log(
          `${BASE_URL}/apr/api?startAt=${formatDateToMMDDYYYY(
            startDate,
          )}&endAt=${formatDateToMMDDYYYY(endDate)}&poolId=${pool.id}`,
        );
        Sentry.captureException(error);
      }

      if (gaugesData) {
        Object.entries(gaugesData.perDay).forEach(([dayStr, poolData]) => {
          if (perDayData[dayStr]) {
            perDayData[dayStr].push(poolData[0]);
          } else {
            perDayData[dayStr] = [poolData[0]];
          }
        });
      }
    }),
  );
  return perDayData;
}

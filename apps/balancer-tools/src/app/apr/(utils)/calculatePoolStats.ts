/* eslint-disable no-console */
import * as Sentry from "@sentry/nextjs";

import * as balEmissions from "#/lib/balancer/emissions";
import { Pool } from "#/lib/balancer/gauges";
import { pools } from "#/lib/gql/server";

import { PoolStatsData, PoolTokens } from "../api/route";
import { getBALPriceByRound } from "./getBALPriceByRound";
import { getPoolRelativeWeight } from "./getRelativeWeight";
import { Round } from "./rounds";

// The enum namings should be human-readable and are based on what Balancer shows on their FE
export enum PoolTypeEnum {
  PHANTOM_STABLE = "ComposableStable",
  WEIGHTED = "Weighted",
  GYROE = "GyroE",
  STABLE = "Stable",
  META_STABLE = "MetaStable",
  UNKNOWN = "FX",
}

const WEEKS_IN_YEAR = 52;
const SECONDS_IN_DAY = 86400;
const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;

const memoryCache: { [key: string]: unknown } = {};

const getDataFromCacheOrCompute = async <T>(
  cacheKey: string,
  computeFn: () => Promise<T>,
): Promise<T> => {
  if (memoryCache[cacheKey]) {
    console.debug(`Cache hit for ${cacheKey}`);
    return memoryCache[cacheKey] as T;
  }

  console.debug(`Cache miss for ${cacheKey}`);
  const computedData = await computeFn();
  memoryCache[cacheKey] = computedData;
  return computedData;
};

const fetchPoolTVLFromSnapshotAverageFromRange = async (
  poolId: string,
  network: string,
  from: number,
  to: number,
): Promise<[number, string]> => {
  const res = await pools.gql(network).poolSnapshotInRange({
    poolId,
    from,
    to,
  });

  const avgLiquidity =
    res.poolSnapshots.reduce(
      (acc, snapshot) => acc + parseFloat(snapshot.liquidity),
      0,
    ) / res.poolSnapshots.length;

  if (res.poolSnapshots.length === 0) {
    return [0, ""];
  }

  return [avgLiquidity, res.poolSnapshots[0].pool.symbol ?? ""];
};

export async function calculatePoolStats({
  roundId,
  poolId,
}: {
  roundId: string;
  poolId: string;
}): Promise<PoolStatsData> {
  const round = Round.getRoundByNumber(roundId);
  const pool = new Pool(poolId);
  const network = String(pool.network ?? 1);

  const [balPriceUSD, [tvl, symbol], votingShare, feeAPR] = await Promise.all([
    getDataFromCacheOrCompute(`bal_price_${round.value}`, () =>
      getBALPriceByRound(round),
    ),
    getDataFromCacheOrCompute(
      `pool_data_${poolId}_${round.value}_${network}`,
      () =>
        fetchPoolTVLFromSnapshotAverageFromRange(
          poolId,
          network,
          round.startDate.getTime() / 1000,
          round.endDate.getTime() / 1000,
        ),
    ),
    getDataFromCacheOrCompute(
      `pool_weight_${poolId}_${round.value}_${network}`,
      () => getPoolRelativeWeight(poolId, round.endDate.getTime() / 1000),
    ),
    getDataFromCacheOrCompute(
      `pool_fee_apr_${poolId}_${round.value}_${network}`,
      () =>
        getFeeApr(
          poolId,
          network,
          round.startDate.getTime() / 1000,
          round.endDate.getTime() / 1000 + SECONDS_IN_DAY,
          // daily swapFee = current day's snapshot - previous day's snapshot
          // the round swapFee is the diff between the value on the last whole day of the round and the first whole day of the round
          // which are wed and thu respectively
          // thu swapFee = fri snapshot - thu snapshot
          // wed swapFee = thu snapshot - wed snapshot
          // therefore we need thu - thu, but the "to" parameter is passed to the querty as "lt"
          // so we need to add a day to the "to" parameter to make sure we get thu-thu
        ),
    ),
  ]);

  const apr = calculateRoundAPR(round, votingShare, tvl, balPriceUSD, feeAPR);

  if (apr.total === -1 || apr.breakdown.veBAL === -1) {
    Sentry.captureMessage("vebalAPR resulted in -1", {
      level: "warning",
      extra: { balPriceUSD, tvl, votingShare, roundId, poolId, apr },
    });
  }

  return {
    roundId: Number(roundId),
    poolId,
    apr,
    balPriceUSD,
    tvl,
    votingShare,
    symbol,
    network,
    tokens: pool.tokens as PoolTokens[],
    type: pool.poolType as keyof typeof PoolTypeEnum,
  };
}

function calculateRoundAPR(
  round: Round,
  votingShare: number,
  tvl: number,
  balPriceUSD: number,
  feeAPR: number,
) {
  const emissions = balEmissions.weekly(round.endDate.getTime() / 1000);
  const vebalAPR =
    balPriceUSD && tvl && votingShare
      ? ((WEEKS_IN_YEAR * (emissions * votingShare * balPriceUSD)) / tvl) * 100
      : -1;

  return {
    total: vebalAPR + feeAPR,
    breakdown: {
      veBAL: vebalAPR,
      swapFee: feeAPR,
    },
  };
}

const getFeeApr = async (
  poolId: string,
  network: string,
  from: number,
  to: number,
): Promise<number> => {
  const res = await pools.gql(network).poolSnapshotInRange({
    poolId,
    from,
    to,
  });

  const startRoundData = res.poolSnapshots[res.poolSnapshots.length - 1];

  const endRoundData = res.poolSnapshots[0];

  const feeDiff = endRoundData?.swapFees - startRoundData?.swapFees;

  const feeApr = 10000 * (feeDiff / endRoundData?.pool.totalLiquidity);
  const annualizedFeeApr =
    feeApr *
    (SECONDS_IN_YEAR / (endRoundData.timestamp - startRoundData.timestamp));

  return isNaN(annualizedFeeApr) ? 0 : annualizedFeeApr / 100;
};

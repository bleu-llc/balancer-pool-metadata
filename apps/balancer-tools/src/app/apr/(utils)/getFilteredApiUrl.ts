import { BASE_URL } from "../api/route";
import { SearchParams } from "../round/[roundId]/page";

export const INITIAL_MIN_TVL = 1000;
export const INITIAL_LIMIT = 10;

interface ExpectedSearchParams extends SearchParams {
  minTVL?: string | undefined;
  limit?: string | undefined;
  sort?: string | undefined;
  order?: string | undefined;
}

const convert = (key: string, value: string) => {
  if (["sort", "order"].includes(key)) return value || undefined;
  if (["minTVL", "maxTVL", "minAPR", "maxAPR", "limit"].includes(key))
    return Number(value) || undefined;
  if (["tokens", "type", "network"].includes(key))
    return value ? value.split(",") : undefined;
  return value;
};

function getFilterDataFromParams(searchParams: SearchParams) {
  const {
    minTVL = INITIAL_MIN_TVL,
    limit = INITIAL_LIMIT,
    sort = "apr",
    order = "desc",
    ...rest
  } = searchParams as ExpectedSearchParams;

  // Convert values for each property if needed
  const convertedParams = Object.fromEntries(
    Object.entries(rest).map(([key, value]) => [key, convert(key, value)]),
  );

  // Merge the converted params with default values
  const result = {
    minTVL,
    limit,
    sort,
    order,
    ...convertedParams,
  };

  return result;
}

export default function getFilteredRoundApiUrl(
  searchParams: SearchParams,
  roundId: string,
) {
  const filteredData = getFilterDataFromParams(searchParams);
  const params = Object.entries(filteredData)
    .map(([key, value]) => (value !== undefined ? `${key}=${value}` : ""))
    .join("&");
  return `${BASE_URL}/apr/api/?roundId=${roundId}&${params}`;
}

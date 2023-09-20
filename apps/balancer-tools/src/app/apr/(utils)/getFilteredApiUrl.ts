import { formatDateToMMDDYYYY } from "../api/(utils)/date";
import { SearchParams } from "../page";
import { BASE_URL } from "./types";

export const INITIAL_MIN_TVL = 1000;
export const INITIAL_LIMIT = 10;

interface ExpectedSearchParams extends SearchParams {
  minTVL?: string;
  limit?: string;
  sort?: string;
  order?: string;
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
  startAt: Date,
  endAt: Date,
) {
  const filteredData = getFilterDataFromParams(searchParams);
  const params = Object.entries(filteredData)
    .map(([key, value]) => (value !== undefined ? `${key}=${value}` : ""))
    .join("&");
  return `${BASE_URL}/apr/api?startAt=${formatDateToMMDDYYYY(
    startAt,
  )}&endAt=${formatDateToMMDDYYYY(endAt)}&${params}`;
}

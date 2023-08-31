import { SearchParams } from "../round/[roundId]/page";

export const MIN_TVL = 1000;

const convert = (key: string, value: string) => {
  if (["sort", "order"].includes(key)) return value || undefined;
  if (["minTVL", "maxTVL", "minAPR", "maxAPR"].includes(key))
    return Number(value) || undefined;
  if (["tokens", "type", "network"].includes(key))
    return value ? value.split(",") : undefined;
  return value;
};
function getFilterDataFromParams(searchParams: SearchParams) {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [
      key,
      convert(key, value) || (key === "minTVL" ? MIN_TVL : undefined),
    ]),
  );
}
export default function getFilteredRoundApiUrl(
  searchParams: SearchParams,
  roundId: string,
) {
  const filteredData = getFilterDataFromParams(searchParams);
  const params = Object.entries(filteredData)
    .map(([key, value]) => (value !== undefined ? `&${key}=${value}` : ""))
    .join("");
  return `${BASE_URL}/round/${roundId}/apr/api/?${params}`;
}

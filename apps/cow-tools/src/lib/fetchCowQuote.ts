import { goerli, mainnet } from "viem/chains";

import { ChainId } from "#/utils/chainsPublicClients";

const COW_API_BASE_URL = "https://api.cow.fi/";

const COW_API_URL_BY_CHAIN_ID = {
  [mainnet.id]: COW_API_BASE_URL + "mainnet",
  [goerli.id]: COW_API_BASE_URL + "goerli",
};

export async function fetchCowQuote({
  tokenIn,
  tokenOut,
  amountIn,
  chainId,
  priceQuality = "fast",
}: {
  tokenIn: {
    address: string;
    decimals: number;
    symbol: string;
  };
  tokenOut: {
    address: string;
    decimals: number;
    symbol: string;
  };
  amountIn: number;
  chainId: ChainId;
  priceQuality?: "fast" | "optimal";
}) {
  const url = COW_API_URL_BY_CHAIN_ID[chainId];

  const bodyObject = {
    sellToken: tokenIn.address,
    buyToken: tokenOut.address,
    receiver: "0x0000000000000000000000000000000000000000",
    from: "0x0000000000000000000000000000000000000000",
    kind: "sell",
    partiallyFillable: false,
    priceQuality,
    sellAmountBeforeFee: amountIn.toLocaleString().replaceAll(",", ""),
  };
  return fetch(`${url}/api/v1/quote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyObject),
  }).then((res) => res.json());
}

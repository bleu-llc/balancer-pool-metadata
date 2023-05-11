import { Network } from "@balancer-pool-metadata/shared";

import { getSdkWithHooks as arbitrumSdk } from "./__generated__/Arbitrum";
import { getSdkWithHooks as ethereumSdk } from "./__generated__/Ethereum";
import { getSdkWithHooks as goerliSdk } from "./__generated__/Goerli";
import { getSdkWithHooks as polygonSdk } from "./__generated__/Polygon";
import { getSdkWithHooks as sepoliaSdk } from "./__generated__/Sepolia";

export default {
  [Network.Ethereum]: ethereumSdk,
  [Network.Polygon]: polygonSdk,
  [Network.Arbitrum]: arbitrumSdk,
  [Network.Goerli]: goerliSdk,
  [Network.Sepolia]: sepoliaSdk,
};

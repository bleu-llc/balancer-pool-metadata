"use client";

import { bnum } from "@balancer-labs/sor";
import { MetaStableMath } from "@balancer-pool-metadata/math/src";
import { PlotType } from "plotly.js";

import Plot, { defaultAxisLayout } from "#/components/Plot";
import { AnalysisData, useStableSwap } from "#/contexts/StableSwapContext";

export function DepthCost() {
  const { indexAnalysisToken, baselineData, variantData } = useStableSwap();

  const analysisToken = baselineData?.tokens[indexAnalysisToken];
  const pairTokens = baselineData?.tokens.filter(
    (token) => token.symbol !== analysisToken.symbol
  );
  const pairTokensIndexes = pairTokens.map((token) =>
    baselineData?.tokens.indexOf(token)
  );

  const depthCostAmounts = {
    baseline: {
      in: pairTokensIndexes.map((pairTokenIndex) =>
        calculateDepthCostAmount(pairTokenIndex, baselineData, "in")
      ),
      out: pairTokensIndexes.map((pairTokenIndex) =>
        calculateDepthCostAmount(pairTokenIndex, baselineData, "out")
      ),
    },
    variant: {
      in: pairTokensIndexes.map((pairTokenIndex) =>
        calculateDepthCostAmount(pairTokenIndex, variantData, "in")
      ),
      out: pairTokensIndexes.map((pairTokenIndex) =>
        calculateDepthCostAmount(pairTokenIndex, variantData, "out")
      ),
    },
  };

  const maxDepthCostAmount = Math.max(
    ...depthCostAmounts.baseline.in,
    ...depthCostAmounts.baseline.out,
    ...depthCostAmounts.variant.in,
    ...depthCostAmounts.variant.out
  );

  const dataX = pairTokens.map((token) => token.symbol);

  const data = [
    {
      x: dataX,
      y: depthCostAmounts.baseline.in,
      type: "bar" as PlotType,
      legendgroup: "Baseline",
      name: "Baseline",
      hovertemplate: depthCostAmounts.baseline.in.map(
        (amount, i) =>
          `Swap ${amount.toFixed()} ${analysisToken?.symbol} for ${
            dataX[i]
          } to move the price ${dataX[i]}/${
            analysisToken?.symbol
          } on -2% <extra></extra>`
      ),
    },
    {
      x: dataX,
      y: depthCostAmounts.variant.in,
      type: "bar" as PlotType,
      legendgroup: "Variant",
      name: "Variant",
      hovertemplate: depthCostAmounts.variant.in.map(
        (amount, i) =>
          `Swap ${amount.toFixed()} ${analysisToken?.symbol} for ${
            dataX[i]
          } to move the price ${dataX[i]}/${
            analysisToken?.symbol
          } on -2% <extra></extra>`
      ),
    },
    {
      x: dataX,
      y: depthCostAmounts.baseline.out,
      type: "bar" as PlotType,
      legendgroup: "Baseline",
      name: "Baseline",
      showlegend: false,
      yaxis: "y2",
      xaxis: "x2",
      hovertemplate: depthCostAmounts.baseline.out.map(
        (amount, i) =>
          `Swap ${dataX[i]} for ${amount.toFixed()} ${
            analysisToken?.symbol
          } to move the price ${dataX[i]}/${
            analysisToken?.symbol
          } on +2% <extra></extra>`
      ),
    },
    {
      x: dataX,
      y: depthCostAmounts.variant.out,
      type: "bar" as PlotType,
      legendgroup: "Variant",
      name: "Variant",
      showlegend: false,
      yaxis: "y2",
      xaxis: "x2",
      hovertemplate: depthCostAmounts.variant.out.map(
        (amount, i) =>
          `Swap ${dataX[i]} for ${amount.toFixed()} ${
            analysisToken?.symbol
          } to move the price ${dataX[i]}/${
            analysisToken?.symbol
          } on +2% <extra></extra>`
      ),
    },
  ];

  const props = {
    data: data,
    title: "Depth cost (-/+ 2% of price impact)",
    toolTip:
      "Indicates the amount of tokens needed on a swap to alter the Price Impact (rate between the price of both tokens) to -2% and +2%",
    layout: {
      margin: { l: 3, r: 3 },
      xaxis: {
        tickmode: "array" as const,
        tickvals: dataX,
        ticktext: pairTokens.map((token) => token.symbol),
      },
      xaxis2: {
        ...defaultAxisLayout,
        tickmode: "array" as const,
        tickvals: dataX,
        ticktext: pairTokens.map((token) => token.symbol),
      },
      yaxis: {
        title: `${analysisToken?.symbol} in`,
        range: [0, maxDepthCostAmount],
      },
      yaxis2: {
        ...defaultAxisLayout,
        title: `${analysisToken?.symbol} out`,
        range: [0, maxDepthCostAmount],
      },
      grid: { columns: 2, rows: 1, pattern: "independent" as const },
    },

    config: { displayModeBar: false },
  };

  return <Plot {...props} />;
}

function calculateDepthCostAmount(
  pairTokenIndex: number,
  data: AnalysisData,
  poolSide: "in" | "out"
) {
  if (!data.swapFee || !data.ampFactor) return;

  const { indexAnalysisToken } = useStableSwap();

  const indexIn = poolSide === "in" ? indexAnalysisToken : pairTokenIndex;
  const indexOut = poolSide === "in" ? pairTokenIndex : indexAnalysisToken;

  const poolPairData = MetaStableMath.preparePoolPairData({
    indexIn: indexIn,
    indexOut: indexOut,
    swapFee: data?.swapFee,
    balances: data?.tokens?.map((token) => token.balance),
    rates: data?.tokens?.map((token) => token.rate),
    amp: data?.ampFactor,
    decimals: data?.tokens?.map((token) => token.decimal),
  });

  const currentSpotPriceFromStableMath = MetaStableMath.spotPrice(poolPairData);

  const newSpotPriceToStableMath = currentSpotPriceFromStableMath.times(
    bnum(1.02)
  );

  return MetaStableMath.tokenInForExactSpotPriceAfterSwap(
    newSpotPriceToStableMath,
    poolPairData
  ).toNumber();
}

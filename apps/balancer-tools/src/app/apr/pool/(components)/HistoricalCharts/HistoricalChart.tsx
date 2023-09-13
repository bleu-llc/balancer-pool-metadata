"use client";

import { blueDark } from "@radix-ui/colors";
import { Data } from "plotly.js";
import { useState } from "react";

import { PoolStatsResults } from "#/app/apr/api/route";
import Plot from "#/components/Plot";

import FilterTabs from "./FilterTabs";
import formatAPRChartData from "./HistoricalData/formatAPRChartData";
import formatSwapFeeChartData from "./HistoricalData/formatSwapFeeChartData";
import formatTvlChartData from "./HistoricalData/formatTvlChartData";
import formatVolumeChartData from "./HistoricalData/formatVolumeChartData";

function getActiveData(
  enabledIndices: number[],
  ...arrays: (Data[] | Data)[]
): Data[] {
  const activeVars: Data[] = [];

  for (const idx of enabledIndices) {
    if (Array.isArray(arrays[idx])) {
      activeVars.push(...(arrays[idx] as Data[]));
    } else {
      activeVars.push(arrays[idx] as Data);
    }
  }

  return activeVars;
}

export default function HistoricalChartWrapper({
  apiResult,
  roundId,
}: {
  apiResult: PoolStatsResults;
  roundId?: string;
}) {
  const charts = ["APR", "Weekly Swap Fees", "TVL", "Volume"];
  const [selectedTabs, setselectedTabs] = useState([0]);

  const aprChartData = formatAPRChartData(apiResult, "y2");
  const tvlChartData = formatTvlChartData(apiResult, "y3");
  const volumeChartData = formatVolumeChartData(apiResult, "y4");
  const feeChartData = formatSwapFeeChartData(apiResult, roundId, "y5");
  const activeCharts = getActiveData(
    selectedTabs,
    aprChartData,
    feeChartData,
    tvlChartData,
    volumeChartData,
  );

  // This is needed to enable an axis that isn't meant to be shown
  // If the anchor axis isn't enabled the other it'll only show one trace at a time
  activeCharts.push({
    name: " ",
    yaxis: "y",
    x: [],
    y: [],
  });

  const selectedRoundShape =
    // @ts-ignore: 2322
    roundId && aprChartData[0].x.includes(`#${roundId}`)
      ? [
          {
            type: "line",
            x0: roundId,
            y0: 0,
            x1: roundId,
            y1: 2,
            line: {
              color: "rgb(55, 128, 191)",
              width: 3,
              dash: "dot",
            },
            label: {
              text: "Selected Round",
            },
          },
        ]
      : [];

  return (
    <div className="border border-blue6 bg-blue3 rounded p-4 w-full">
      <div className="flex justify-between flex-col sm:flex-row gap-2 sm:gap-0">
        <span className="text-2xl">Historical Data</span>
        <FilterTabs
          tabs={charts}
          selectedTabs={selectedTabs}
          setSelectedTabs={setselectedTabs}
        />
      </div>
      <Plot
        data={activeCharts}
        config={{ displayModeBar: false }}
        layout={{
          // @ts-ignore: 2322
          shapes: selectedRoundShape,
          plot_bgcolor: blueDark.blue3,
          margin: { t: 30, r: 20, l: 20, b: 30 },
          autosize: true,
          legend: { orientation: "h", y: -0.2, xanchor: "center", x: 0.5 },
          hovermode: "x unified",
          hoverlabel: {
            bordercolor: blueDark.blue9,
            bgcolor: blueDark.blue6,
          },
          xaxis: {
            dtick: 1,
            title: "Round Number",
            gridcolor: blueDark.blue6,
            linecolor: blueDark.blue6,
            mirror: true,
          },
          yaxis: {
            // This is a dull axis, not meant to be shown
            // It's needed since all other axis are anchored on this one
            // If this axis isn't enabled the others it'll only show one at a time
            visible: false,
            position: 0.5,
          },
          yaxis2: {
            gridcolor: blueDark.blue6,
            linecolor: blueDark.blue6,
            mirror: true,
            fixedrange: true,
            title: "APR %",
            overlaying: "y",
            anchor: "free",
            // @ts-ignore: 2322
            autoshift: true,
          },
          yaxis3: {
            gridcolor: blueDark.blue6,
            linecolor: blueDark.blue6,
            mirror: true,
            fixedrange: true,
            title: "TVL",
            overlaying: "y",
            side: "right",
            anchor: "free",
            // @ts-ignore: 2322
            autoshift: true,
          },
          yaxis4: {
            gridcolor: blueDark.blue6,
            linecolor: blueDark.blue6,
            mirror: true,
            fixedrange: true,
            title: "Volume",
            overlaying: "y",
            side: "right",
            anchor: "free",
            // @ts-ignore: 2322
            autoshift: true,
          },
          yaxis5: {
            gridcolor: blueDark.blue6,
            linecolor: blueDark.blue6,
            mirror: true,
            fixedrange: true,
            title: "Swap Fee",
            overlaying: "y",
            side: "right",
            anchor: "free",
            // @ts-ignore: 2322
            autoshift: true,
          },
        }}
      />
    </div>
  );
}
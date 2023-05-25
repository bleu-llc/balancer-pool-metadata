"use client";

import { StableSwapSimulatorDataSchema } from "@balancer-pool-metadata/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FieldValues, useForm } from "react-hook-form";

import Button from "#/components/Button";
import { Input } from "#/components/Input";
import { AnalysisData, useStableSwap } from "#/contexts/StableSwapContext";

import { TokenTable } from "./TokenTable";

export default function InitialDataForm() {
  const { push } = useRouter();
  const { baselineData, setBaselineData, setVariantData } = useStableSwap();
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    clearErrors,
    formState: { errors },
  } = useForm<typeof StableSwapSimulatorDataSchema._type>({
    resolver: zodResolver(StableSwapSimulatorDataSchema),
    mode: "onSubmit",
  });

  const onSubmit = (data: FieldValues) => {
    setBaselineData(data as AnalysisData);
    setVariantData(data as AnalysisData);
    push("/stableswapsimulator/analysis");
  };

  useEffect(() => {
    // TODO: BAL 401
    clearErrors();
    if (baselineData == getValues()) return;
    if (baselineData?.swapFee) setValue("swapFee", baselineData?.swapFee);
    if (baselineData?.ampFactor) setValue("ampFactor", baselineData?.ampFactor);
    if (baselineData?.tokens) setValue("tokens", baselineData?.tokens);
  }, [baselineData]);

  useEffect(() => {
    register("tokens", { required: true, value: baselineData?.tokens });
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit(onSubmit)} id="initial-data-form" />
      <Input
        {...register("swapFee", {
          required: true,
          value: baselineData?.swapFee,
          valueAsNumber: true,
        })}
        label="Swap fee"
        placeholder="Define the initial swap fee"
        errorMessage={errors?.swapFee?.message}
        form="initial-data-form"
      />
      <Input
        {...register("ampFactor", {
          required: true,
          value: baselineData?.ampFactor,
          valueAsNumber: true,
        })}
        label="Amp factor"
        placeholder="Define the initial amp factor"
        errorMessage={errors?.ampFactor?.message}
        form="initial-data-form"
      />
      <div className="flex flex-col">
        <label className="mb-2 block text-sm text-slate12">Tokens</label>
        {errors?.tokens?.message && (
          <div className="h-6 mt-1 text-tomato10 text-sm">
            <span>{errors?.tokens?.message}</span>
          </div>
        )}
        <TokenTable />
      </div>
      <Button
        form="initial-data-form"
        type="submit"
        shade="light"
        className="w-32 h-min self-end"
      >
        Next step
      </Button>
    </div>
  );
}

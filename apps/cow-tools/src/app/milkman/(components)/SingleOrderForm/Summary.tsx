import { NetworkChainId, networkFor } from "@bleu-fi/utils";
import { formatDateToLocalDatetime } from "@bleu-fi/utils/date";
import { Pencil1Icon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { FieldValues } from "react-hook-form";

import { TransactionStatus } from "#/app/milkman/utils/type";
import { Button } from "#/components";
import { useRawTxData } from "#/hooks/useRawTxData";
import { priceCheckersArgumentsMapping } from "#/lib/priceCheckersMappings";
import {
  MILKMAN_ADDRESS,
  MilkmanOrderArgs,
  TRANSACTION_TYPES,
} from "#/lib/transactionFactory";
import { PRICE_CHECKERS } from "#/lib/types";
import { truncateAddress } from "#/utils/truncate";

import { FormFooter } from "./Footer";
import { TWAP_DELAY_OPTIONS, TwapDelayValues } from "./Twap";

export function OrderSummary({
  data,
  handleBack,
  chainId,
}: {
  data: FieldValues;
  handleBack: () => void;
  chainId?: NetworkChainId;
}) {
  const fieldsToDisplay = [
    { label: "Token to sell", key: "tokenSell" },
    { label: "Token to buy", key: "tokenBuy" },
    { label: "Amount to sell", key: "tokenSellAmount" },
    { label: "Price checker", key: "priceChecker" },
    { label: "Token to buy minimum amount", key: "tokenBuyMinimumAmount" },
    data.isValidFromNeeded && {
      label: "Valid from",
      key: "validFrom",
    },
    data.isTwapNeeded && {
      label: "Number of TWAP orders",
      key: "numberOfOrders",
    },
    data.isTwapNeeded && { label: "TWAP delay", key: "delay" },
    ...priceCheckersArgumentsMapping[data.priceChecker as PRICE_CHECKERS].map(
      (arg) => ({
        label: arg.label,
        key: arg.name,
      }),
    ),
  ];

  const router = useRouter();

  const { sendTransactions } = useRawTxData();

  async function handleButtonClick() {
    const sellAmountBigInt = BigInt(
      Number(data.tokenSellAmount) * 10 ** data.tokenSell.decimals,
    );
    const priceCheckersArgs = priceCheckersArgumentsMapping[
      data.priceChecker as PRICE_CHECKERS
    ].map((arg) => arg.convertInput(data[arg.name], data.tokenBuy.decimals));

    const ordersNumber = data.isTwapNeeded ? data.numberOfOrders : 1;
    const delay = data.isTwapNeeded
      ? TwapDelayValues[data.delay as TWAP_DELAY_OPTIONS]
      : 0;
    const validFrom =
      !data.isValidFromNeeded && data.isTwapNeeded
        ? formatDateToLocalDatetime(new Date())
        : data.validFrom;

    await sendTransactions([
      {
        type: TRANSACTION_TYPES.ERC20_APPROVE,
        tokenAddress: data.tokenSell.address,
        spender: MILKMAN_ADDRESS,
        amount: sellAmountBigInt,
      },
      ...[...Array(ordersNumber).keys()].map((index) => {
        return {
          type: TRANSACTION_TYPES.MILKMAN_ORDER,
          tokenAddressToSell: data.tokenSell.address,
          tokenAddressToBuy: data.tokenBuy.address,
          toAddress: data.receiverAddress,
          amount: sellAmountBigInt / BigInt(ordersNumber),
          priceChecker: data.priceChecker,
          validFrom: validFrom,
          isValidFromNeeded: data.isValidFromNeeded || data.isTwapNeeded,
          args: priceCheckersArgs,
          twapDelay: index * delay,
          chainId: chainId,
        } as MilkmanOrderArgs;
      }),
    ]);
    router.push(`/milkman/${networkFor(chainId)}`);
  }

  return (
    <div>
      <div className="font-semibold text-2xl flex justify-between">
        Order #1 - {truncateAddress(data.tokenSell.symbol)} for{" "}
        {data.tokenBuy.symbol}
        <Button
          type="button"
          className="bg-transparent border-0 hover:bg-transparent"
          onClick={handleBack}
        >
          <Pencil1Icon className="text-amber9" />
        </Button>
      </div>
      <hr className="mb-2" />
      <div className="flex flex-col">
        {fieldsToDisplay.map((field) => {
          const value = data[field.key];
          switch (field.key) {
            case "tokenSell":
              return (
                value && (
                  <span key={field.key}>
                    {field.label}: {value.symbol} (
                    {truncateAddress(data.tokenSell.address)})
                  </span>
                )
              );
            case "tokenBuy":
              return (
                value && (
                  <span key={field.key}>
                    {field.label}: {value.symbol} (
                    {truncateAddress(data.tokenBuy.address)})
                  </span>
                )
              );
            case "addressesPriceFeeds":
              return (
                value && (
                  <span key={field.key}>
                    {field.label}:{" "}
                    {value.map((address: string) => truncateAddress(address))}
                  </span>
                )
              );

            case "revertPriceFeeds":
              return (
                value && (
                  <span key={field.key}>
                    {field.label}: {value.toString()}
                  </span>
                )
              );
            default:
              return (
                value && (
                  <span key={field.key}>
                    {field.label}: {value}
                  </span>
                )
              );
          }
        })}
      </div>
      <div className="mt-5">
        <FormFooter
          transactionStatus={TransactionStatus.ORDER_SUMMARY}
          onClick={handleButtonClick}
        />
      </div>
    </div>
  );
}

"use client";

import {
  MinusCircledIcon,
  Pencil1Icon,
  PlusCircledIcon,
} from "@radix-ui/react-icons";

import { Dialog } from "#/components/Dialog";
import Table from "#/components/Table";
import { TokensData, useStableSwap } from "#/contexts/StableSwapContext";

import TokenForm from "./TokenForm";

const customPadding = "py-4 px-1";

export function TokenTable() {
  const { initialData } = useStableSwap();
  return (
    <div className="h-full flex-1 flex w-full justify-center text-white">
      <Table>
        <Table.HeaderRow>
          <Table.HeaderCell padding={customPadding}>
            <span className="sr-only">Edit</span>
          </Table.HeaderCell>
          <Table.HeaderCell padding={customPadding}>Symbol</Table.HeaderCell>
          <Table.HeaderCell padding={customPadding}>Balance</Table.HeaderCell>
          <Table.HeaderCell padding={customPadding}>Rate</Table.HeaderCell>
          <Table.HeaderCell padding={customPadding}>
            <ButtonToOpenTokenForm
              icon={
                <PlusCircledIcon
                  width={22}
                  height={22}
                  className="text-green9 hover:text-green11"
                />
              }
            />
          </Table.HeaderCell>
        </Table.HeaderRow>
        <Table.Body>
          {initialData?.tokens?.map((token) => (
            <TableRow token={token} key={token.symbol} />
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}

function ButtonToOpenTokenForm({
  icon,
  symbolToEdit,
}: React.PropsWithChildren<{
  icon: React.ReactElement;
  symbolToEdit?: string;
}>) {
  return (
    <Dialog
      title="Add token parameters"
      content={<TokenForm symbolToEdit={symbolToEdit} />}
    >
      <button type="button" className="flex items-center">
        {icon}
      </button>
    </Dialog>
  );
}

function TableRow({ token }: { token: TokensData }) {
  const { setInitialData, initialData } = useStableSwap();

  const deleteToken = (symbol?: string) => {
    setInitialData({
      ...initialData,
      tokens: initialData.tokens.filter((token) => token.symbol !== symbol),
    });
  };

  return (
    <Table.BodyRow key={token.symbol}>
      <Table.BodyCell padding={customPadding}>
        <ButtonToOpenTokenForm
          icon={
            <Pencil1Icon
              width={19}
              height={19}
              className="text-amber9 hover:text-amber11"
            />
          }
          symbolToEdit={token.symbol}
        />
      </Table.BodyCell>
      <Table.BodyCell padding={customPadding}>{token.symbol}</Table.BodyCell>
      <Table.BodyCell padding={customPadding}>
        {token.balance?.toFixed()}
      </Table.BodyCell>
      <Table.BodyCell padding={customPadding}>
        {token.rate?.toPrecision(2)}
      </Table.BodyCell>
      <Table.BodyCell padding={customPadding}>
        <button
          type="button"
          className="flex items-center"
          onClick={() => deleteToken(token?.symbol)}
        >
          <MinusCircledIcon
            width={20}
            height={20}
            className="text-tomato9 hover:text-tomato11"
          />
        </button>
      </Table.BodyCell>
    </Table.BodyRow>
  );
}

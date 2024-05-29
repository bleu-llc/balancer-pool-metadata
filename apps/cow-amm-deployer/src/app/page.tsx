"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bleu/ui";
import { formatDate } from "@bleu/utils";
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { graphql } from "gql.tada";
import request from "graphql-request";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";

import { Button } from "#/components/Button";
import Fathom from "#/components/Fathom";
import { LinkComponent } from "#/components/Link";
import { UnsuportedChain } from "#/components/UnsuportedChain";
import WalletNotConnected from "#/components/WalletNotConnected";
import { NEXT_PUBLIC_API_URL } from "#/lib/ponderApi";
import { supportedChainIds } from "#/utils/chainsPublicClients";

const CREATED_AMMS_FOR_USER_QUERY = graphql(`
  query ($userId: String!) {
    constantProductDatas(where: { userId: $userId, version: "Standalone" }) {
      items {
        id
        disabled
        token0 {
          address
          decimals
          symbol
        }
        token1 {
          address
          decimals
          symbol
        }
        order {
          blockTimestamp
        }
      }
    }
  }
`);

export default function Page() {
  const { connected, safe } = useSafeAppsSDK();

  if (!connected) {
    return <WalletNotConnected />;
  }

  if (!supportedChainIds.includes(safe.chainId)) {
    return <UnsuportedChain />;
  }

  const title = "Create a CoW AMM";

  const userId = `${safe.safeAddress}-${safe.chainId}`;

  const { data, isLoading } = useSWR(CREATED_AMMS_FOR_USER_QUERY, (query) =>
    request(NEXT_PUBLIC_API_URL, query, { userId }),
  );

  if (isLoading || !data) return <>Loading...</>;

  const rows = data.constantProductDatas.items.map((item) => ({
    id: item.id,
    token0: item.token0.symbol,
    token1: item.token1.symbol,
    state: item.disabled ? "Stopped" : "Running",
    link: `/amms/${item.id}`,
    createdAt: new Date((item.order.blockTimestamp as number) * 1000),
  }));

  return (
    <div className="flex size-full justify-center">
      <div className="flex flex-col items-center gap-8 justify-center">
        <Image
          src="/assets/cow-amm.svg"
          height={100}
          width={400}
          alt="CoW AMM Logo"
        />
        <h2 className="text-6xl mt-8 leading-snug text-center w-full font-serif">
          The first <i className="text-purple">MEV-Capturing AMM</i>,
          <br /> brought to you by <i className="text-yellow">CoW DAO</i>
        </h2>
        <span className="text-prose w-3/4 text-lg text-center">
          CoW AMM is a production-ready implementation of an FM-AMM that
          supplies liquidity for trades made on CoW Protocol. Solvers compete
          with each other for the right to trade against the AMM
        </span>
        <LinkComponent
          href={"/new"}
          content={
            <Button
              size="lg"
              className="flex items-center gap-1 py-8 px-7 text-xl"
              title="Go to the app"
            >
              {title}
            </Button>
          }
        />
        <div className="mx-auto">
          <div className="relative w-full overflow-auto">
            <Table
              style={{
                borderCollapse: "separate",
                borderSpacing: "0 10px",
                marginTop: "-10px",
              }}
            >
              <TableHeader className="bg-primary">
                <TableRow className="hover:rounded-t-md">
                  <TableHead className="border-b px-3">Token0</TableHead>
                  <TableHead className="border-b px-3">Token1</TableHead>
                  <TableHead className="border-b px-3">State</TableHead>
                  <TableHead className="border-b px-3">Link</TableHead>
                  <TableHead className="border-b px-3">Updated At</TableHead>
                  <TableHead className="border-b px-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows?.length ? (
                  rows.map((row, index) => {
                    return (
                      <TableRow
                        className="hover:bg-background hover:rounded-md bg-secondary  "
                        key={`row-${index}`}
                      >
                        <TableCell>{row.token0}</TableCell>
                        <TableCell>{row.token1}</TableCell>
                        <TableCell>{row.state}</TableCell>
                        <TableCell>
                          <Link href={row.link}>Link</Link>
                        </TableCell>
                        <TableCell>{formatDate(row.createdAt)}</TableCell>

                        <TableCell className="space-x-2">
                          <Link href="#">Edit</Link>
                          <Link href="#">Delete</Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <div className="mt-4 w-full mr-4 overflow-y-auto max-h-[80vh] min-h-[10vh]">
                    Nenhum resultado encontrado.
                  </div>
                )}
              </TableBody>
            </Table>
          </div>{" "}
        </div>

        <Fathom />
      </div>
    </div>
  );
}

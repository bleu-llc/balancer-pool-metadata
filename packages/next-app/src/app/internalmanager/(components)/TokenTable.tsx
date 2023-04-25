"use client";
import { InternalBalanceQuery } from "@balancer-pool-metadata/gql/src/balancer-internal-manager/__generated__/Mainnet";
import { networkFor } from "@balancer-pool-metadata/shared";
import {
  MinusCircledIcon,
  PlusCircledIcon,
  WidthIcon,
} from "@radix-ui/react-icons";
import Image from "next/image";
import Link from "next/link";
import { tokenLogoUri } from "public/tokens/logoUri";
import { useAccount, useNetwork } from "wagmi";

import { ToastContent } from "#/app/metadata/[network]/pool/[poolId]/(components)/MetadataAttributesTable/TransactionModal";
import genericTokenLogo from "#/assets/generic-token-logo.png";
import Table from "#/components/Table";
import { Toast } from "#/components/Toast";
import { useInternalBalance } from "#/contexts/InternalManagerContext";
import { impersonateWhetherDAO, internalBalances } from "#/lib/gql";
import { ArrElement, GetDeepProp } from "#/utils/getTypes";

export function TokenTable() {
  const { chain } = useNetwork();
  let { address } = useAccount();
  address = impersonateWhetherDAO(chain?.id.toString() || "1", address);

  const addressLower = address ? address?.toLowerCase() : "";

  const { notification, setIsNotifierOpen, isNotifierOpen, transactionUrl } =
    useInternalBalance();

  const { data: internalBalanceData } = internalBalances
    .gql(chain?.id.toString() || "1")
    .useInternalBalance({
      userAddress: addressLower as `0x${string}`,
    });

  const tokensWithBalance = internalBalanceData?.user?.userInternalBalances;

  return (
    <div className="flex-1 flex w-full text-white justify-center">
      {tokensWithBalance && tokensWithBalance?.length > 0 && (
        <Table>
          <Table.HeaderRow>
            <Table.HeaderCell>
              <span className="sr-only">Token Logo</span>
            </Table.HeaderCell>
            <Table.HeaderCell>Token</Table.HeaderCell>
            <Table.HeaderCell>Balance</Table.HeaderCell>
            <Table.HeaderCell>Manage</Table.HeaderCell>
          </Table.HeaderRow>
          <Table.Body>
            {tokensWithBalance.map((token) => (
              <TableRow
                key={token.tokenInfo.address}
                token={token}
                chainId={chain!.id?.toString?.()}
                userAddress={addressLower as `0x${string}`}
              />
            ))}
          </Table.Body>
        </Table>
      )}
      {notification && (
        <Toast
          content={
            <ToastContent
              title={notification.title}
              description={notification.description}
              link={transactionUrl}
            />
          }
          isOpen={isNotifierOpen}
          setIsOpen={setIsNotifierOpen}
          variant={notification.variant}
        />
      )}
    </div>
  );
}

function TableRow({
  token,
  chainId,
  userAddress,
}: {
  token: ArrElement<GetDeepProp<InternalBalanceQuery, "userInternalBalances">>;
  chainId: string;
  userAddress: `0x${string}`;
}) {
  const network = networkFor(chainId).toLowerCase();
  const { setToken, setUserAddress } = useInternalBalance();
  return (
    <Table.BodyRow key={token.tokenInfo.address}>
      <Table.BodyCell>
        <div className="flex justify-center items-center">
          <div className="bg-white rounded-full p-1">
            <Image
              src={
                tokenLogoUri[
                  token?.tokenInfo?.symbol as keyof typeof tokenLogoUri
                ] || genericTokenLogo
              }
              className="rounded-full"
              alt="Token Logo"
              height={28}
              width={28}
              quality={100}
            />
          </div>
        </div>
      </Table.BodyCell>
      <Table.BodyCell>
        {token.tokenInfo.name} ({token.tokenInfo.symbol})
      </Table.BodyCell>
      <Table.BodyCell>{token.balance}</Table.BodyCell>
      <Table.BodyCell>
        <div className="flex items-center gap-2">
          {transactionButtons.map((button) => (
            <TransactionButton
              key={button.operation}
              icon={button.icon}
              operation={button.operation}
              network={network}
              token={token}
              setToken={setToken}
              disabled={button?.disabled}
              userAddress={userAddress}
              setUserAddress={setUserAddress}
            />
          ))}
        </div>
      </Table.BodyCell>
    </Table.BodyRow>
  );
}

const transactionButtons = [
  {
    icon: <PlusCircledIcon width={22} height={22} />,
    operation: "deposit",
    disabled: true,
  },
  {
    icon: <MinusCircledIcon width={22} height={22} />,
    operation: "withdraw",
  },
  {
    icon: <WidthIcon height={22} width={22} />,
    operation: "transfer",
  },
];

function TransactionButton({
  network,
  token,
  userAddress,
  setToken,
  setUserAddress,
  icon,
  operation,
  disabled = false,
}: {
  network: string;
  token: ArrElement<GetDeepProp<InternalBalanceQuery, "userInternalBalances">>;
  userAddress: `0x${string}`;
  setToken: React.Dispatch<
    ArrElement<GetDeepProp<InternalBalanceQuery, "userInternalBalances">>
  >;
  setUserAddress: React.Dispatch<`0x${string}`>;
  icon: React.ReactElement;
  operation: string;
  disabled?: boolean;
}) {
  return (
    <>
      {!disabled ? (
        <Link
          href={`/internalmanager/${network}/${operation}/${token.tokenInfo.address}`}
          className="leading-none"
        >
          <button
            type="button"
            className="leading-none"
            onClick={() => {
              setToken(token);
              setUserAddress(userAddress);
            }}
          >
            {icon}
          </button>
        </Link>
      ) : (
        <button
          type="button"
          className="leading-none disabled:cursor-not-allowed disabled:text-gray-600"
          disabled={disabled}
        >
          {icon}
        </button>
      )}
    </>
  );
}

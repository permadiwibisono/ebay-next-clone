import React, { FormEvent, useEffect, useState } from "react";
import {
  useAddress,
  useContract,
  MediaRenderer,
  useNetwork,
  useNetworkMismatch,
  useOwnedNFTs,
  useCreateAuctionListing,
  useCreateDirectListing,
} from "@thirdweb-dev/react";
import { NFT, NATIVE_TOKEN_ADDRESS } from "@thirdweb-dev/sdk";
import { useRouter } from "next/router";
import clsx from "clsx";
import { Toaster, toast } from "react-hot-toast";

import Header from "../components/Header";
import { contracts } from "../config/thirdweb";
import network from "../utils/network";
import Spinner from "../components/Spinner";
import Layout from "../components/Layout";

type Props = {};

function SellItemPage({}: Props) {
  const router = useRouter();
  const address = useAddress();
  const { contract } = useContract(contracts.marketplace, "marketplace");
  const { contract: collectionContract } = useContract(
    contracts.collection,
    "nft-collection"
  );

  const { data: ownNfts, isLoading } = useOwnedNFTs(
    collectionContract,
    address
  );
  const [selected, setSelected] = useState<NFT>();
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const networkMismatch = useNetworkMismatch();
  const [, switchNetwork] = useNetwork();

  const { mutate: createDirectListing } = useCreateDirectListing(contract);
  const { mutate: createAuctionListing } = useCreateAuctionListing(contract);

  useEffect(() => {
    let loadingID = "";
    if (isLoading) {
      loadingID = toast.loading("Loading...");
    }
    if (!isLoading) {
      toast.remove(loadingID);
    }
    return () => {
      toast.remove(loadingID);
    };
  }, [isLoading]);

  async function handleCreateListing(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (networkMismatch) {
      switchNetwork && switchNetwork(network);
      return;
    }

    if (!selected) return;

    if (loadingSubmit) return;

    const form = e.target as typeof e.target & {
      elements: {
        listingType: { value: "direct" | "auction" };
        price: { value: string };
      };
    };

    const {
      listingType: { value: listingType },
      price: { value: price },
    } = form.elements;

    let loadingID = "";
    if (listingType === "direct") {
      setLoadingSubmit(true);
      loadingID = toast.loading("Processing...");
      createDirectListing(
        {
          assetContractAddress: contracts.collection!,
          tokenId: selected.metadata.id,
          currencyContractAddress: NATIVE_TOKEN_ADDRESS,
          listingDurationInSeconds: 60 * 60 * 24 * 7,
          quantity: 1,
          buyoutPricePerToken: price,
          startTimestamp: new Date(),
        },
        {
          onSuccess(data, variables, context) {
            setLoadingSubmit(false);
            toast.remove(loadingID);
            toast.success("Listing Direct Item successfully", {
              duration: 3000,
            });
            router.replace("/");
          },
          onError(error, _variables, _context) {
            setLoadingSubmit(false);
            toast.remove(loadingID);
            toast.error("ERROR: Listing Direct Item failed", {
              duration: 3000,
            });
            console.error("ERROR: ", error);
          },
        }
      );
    }
    if (listingType === "auction") {
      setLoadingSubmit(true);
      loadingID = toast.loading("Processing...");
      createAuctionListing(
        {
          assetContractAddress: contracts.collection!,
          tokenId: selected.metadata.id,
          currencyContractAddress: NATIVE_TOKEN_ADDRESS,
          listingDurationInSeconds: 60 * 60 * 24 * 7,
          quantity: 1,
          buyoutPricePerToken: price,
          startTimestamp: new Date(),
          reservePricePerToken: 0,
        },
        {
          onSuccess(data, variables, context) {
            toast.remove(loadingID);
            toast.success("Listing Auction Item successfully", {
              duration: 3000,
            });
            setLoadingSubmit(false);
            console.log("SUCCESS: ", data, variables, context);
            router.replace("/");
          },
          onError(error, _variables, _context) {
            toast.remove(loadingID);
            toast.error("ERROR: Listing Auction Item failed", {
              duration: 3000,
            });
            setLoadingSubmit(false);
            console.error("ERROR: ", error);
          },
        }
      );
    }
  }

  return (
    <>
      <Toaster />
      <Header />

      <Layout>
        <h1 className="text-4xl font-bold">List an Item</h1>
        <h2 className="text-xl font-semibold pt-5">
          Select an Item you would like to Sell
        </h2>

        <hr className="mt-2 mb-5" />

        <p>Below you will finde the NFT's you own in your wallet</p>

        <div className="flex overflow-x-auto space-x-2 p-4">
          {ownNfts?.map((nft) => {
            const { metadata } = nft;
            return (
              <div
                key={metadata.id}
                className={clsx(
                  "flex flex-col w-60 space-x-2 card cursor-pointer border-2 bg-gray-100",
                  { "border-black": selected?.metadata.id === metadata.id }
                )}
                onClick={() => {
                  if (selected && selected.metadata.id === metadata.id) {
                    setSelected(undefined);
                    return;
                  }
                  setSelected(nft);
                }}
              >
                <MediaRenderer
                  className="h-48 rounded-lg"
                  src={metadata.image}
                />
                <p className="text-lg truncate font-bold">{metadata.name}</p>
                <p className="text-xs truncate">{metadata.description}</p>
              </div>
            );
          })}
        </div>
        {selected ? (
          <form onSubmit={handleCreateListing}>
            <div className="flex flex-col p-10 space-y-5">
              <div>
                <h1 className="text-lg truncate font-bold">
                  {selected.metadata.name}
                </h1>
                <h2 className="text-md truncate font-light">
                  {selected.metadata.description}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <label className="border-r font-light">
                  Direct Listing / Fixed Price
                </label>
                <input
                  type="radio"
                  name="listingType"
                  className="ml-auto h-10 w-10"
                  value="direct"
                />

                <label className="border-r font-light">Auction</label>
                <input
                  type="radio"
                  name="listingType"
                  className="ml-auto h-10 w-10"
                  value="auction"
                />

                <label className="border-r font-light">Price</label>
                <input
                  type="text"
                  name="price"
                  className="bg-gray-100 p-5"
                  placeholder="0.005"
                />
              </div>
              <button
                type="submit"
                className={clsx(
                  "flex items-center justify-center text-white rounded-lg p-4 mt-8",
                  {
                    "bg-blue-600": !loadingSubmit,
                    "bg-blue-400 cursor-not-allowed disabled": loadingSubmit,
                  }
                )}
                disabled={loadingSubmit}
              >
                {loadingSubmit ? <Spinner /> : null} Create Listing
              </button>
            </div>
          </form>
        ) : null}
      </Layout>
    </>
  );
}

export default SellItemPage;

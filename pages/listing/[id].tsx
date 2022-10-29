import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  MediaRenderer,
  useContract,
  useListing,
  useAddress,
  useNetwork,
  useOffers,
  useNetworkMismatch,
  useBuyNow,
  useMakeOffer,
  useMakeBid,
  useAcceptDirectListingOffer,
  AcceptDirectOffer,
} from "@thirdweb-dev/react";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import Countdown from "react-countdown";

import { contracts } from "../../config/thirdweb";
import Header from "../../components/Header";
import Layout from "../../components/Layout";
import { ListingType, NATIVE_TOKENS } from "@thirdweb-dev/sdk";
import network from "../../utils/network";
import { ethers } from "ethers";

type Props = {};

function ListingDetailPage({}: Props) {
  const router = useRouter();
  const { id } = router.query as { id: string };

  const address = useAddress();
  const { contract } = useContract(contracts.marketplace, "marketplace");
  const [, switchNetwork] = useNetwork();
  const networkMismatch = useNetworkMismatch();

  const { data: listing, isLoading, error } = useListing(contract, id);
  const { mutate: buyNow } = useBuyNow(contract);
  const { mutate: makeOffer } = useMakeOffer(contract);
  const { mutate: makeBid } = useMakeBid(contract);
  const { mutate: acceptDirectOffer } = useAcceptDirectListingOffer(contract);
  const { data: offers } = useOffers(contract, id);

  const [minBid, setMinBid] = useState<{
    displayValue: string;
    symbol: string;
  }>();
  const [bidAmount, setBidAmount] = useState<string>();

  useEffect(() => {
    if (!id || !contract) return;

    async function fetchMinimumBid() {
      if (!contract) return;
      try {
        const { displayValue, symbol } =
          await contract?.auction.getMinimumNextBid(id);
        setMinBid({
          displayValue,
          symbol,
        });
      } catch (error) {
        console.error(error);
      }
    }

    if (listing?.type === ListingType.Auction) {
      fetchMinimumBid();
    }
  }, [id, contract, listing]);

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="text-center animate-pulse text-blue-600">
          <p>Loading...</p>
        </div>
      </>
    );
  }

  if (!listing) {
    return (
      <>
        <Header />
        <p>Listing not found</p>
      </>
    );
  }

  function formatPlaceholder() {
    if (!listing) return;
    if (listing.type === ListingType.Direct) return "Enter offer amount...";
    return minBid && Number(minBid.displayValue) === 0
      ? "Enter bid amount..."
      : `${minBid?.displayValue} ${minBid?.symbol} or more`;
  }

  function buyNowHandler() {
    if (networkMismatch) {
      switchNetwork && switchNetwork(network);
      return;
    }
    if (!contract || !listing) return;

    return new Promise((resolve, reject) => {
      buyNow(
        {
          id,
          buyAmount: 1,
          type: listing.type,
        },
        {
          onSuccess(data, variables, context) {
            alert("NFT bought successfully!");
            console.log("SUCCESS: ", data, variables, context);
            resolve(data);
          },
          onError(error, variables, context) {
            alert("NFT could not be bought!");
            console.error("ERROR: ", error, variables, context);
            reject(error);
          },
        }
      );
    });
  }

  async function makeOfferHandler() {
    if (networkMismatch) {
      switchNetwork && switchNetwork(network);
      return;
    }
    if (!contract || !listing || !bidAmount) return;

    return new Promise((resolve, reject) => {
      makeOffer(
        {
          listingId: id,
          quantity: 1,
          pricePerToken: bidAmount,
        },
        {
          onSuccess(data, variables, context) {
            alert("Offer made successfully!");
            console.log("SUCCESS: ", data, variables, context);
            resolve(data);
          },
          onError(error, variables, context) {
            alert("ERROR: Offer could not be made!");
            console.error("ERROR: ", error, variables, context);
            reject(error);
          },
        }
      );
    });
  }

  async function makeBidHandler() {
    if (networkMismatch) {
      switchNetwork && switchNetwork(network);
      return;
    }
    if (!contract || !listing || !bidAmount) return;

    return new Promise((resolve, reject) => {
      makeBid(
        {
          listingId: id,
          bid: bidAmount,
        },
        {
          onSuccess(data, variables, context) {
            alert("Bid made successfully!");
            console.log("SUCCESS: ", data, variables, context);
            resolve(data);
          },
          onError(error, variables, context) {
            alert("ERROR: Bid could not be made!");
            console.error("ERROR: ", error, variables, context);
            reject(error);
          },
        }
      );
    });
  }
  async function acceptDirectOfferHandler(offer: AcceptDirectOffer) {
    if (networkMismatch) {
      switchNetwork && switchNetwork(network);
      return;
    }
    if (!contract || !listing || !bidAmount) return;

    return new Promise((resolve, reject) => {
      acceptDirectOffer(
        {
          listingId: id,
          addressOfOfferor: offer.addressOfOfferor,
        },
        {
          onSuccess(data, variables, context) {
            alert("Offer accepted successfully!");
            console.log("SUCCESS: ", data, variables, context);
            resolve(data);
          },
          onError(error, variables, context) {
            alert("ERROR: Offer could not be accepted!");
            console.error("ERROR: ", error, variables, context);
            reject(error);
          },
        }
      );
    });
  }

  async function handleBuyNow() {
    if (networkMismatch) {
      switchNetwork && switchNetwork(network);
      return;
    }

    try {
      await buyNowHandler();
      router.replace("/");
    } catch (error) {
      console.error(error);
    }
  }

  async function handleMakeOffer() {
    if (networkMismatch) {
      switchNetwork && switchNetwork(network);
      return;
    }
    if (!bidAmount) {
      alert("Amount is required");
      return;
    }
    try {
      if (listing?.type === ListingType.Direct) {
        if (
          listing.buyoutPrice.toString() ===
          ethers.utils.parseEther(bidAmount).toString()
        ) {
          console.log("Buyout price met, buying NFT...");
          await buyNowHandler();
          router.replace("/");
          return;
        }

        console.log("Buyout price not met, making offer...");
        await makeOfferHandler();
        router.replace("/");
        return;
      }
      if (listing?.type === ListingType.Auction) {
        await makeBidHandler();
        setBidAmount(undefined);
      }
    } catch (error) {
      console.error(error);
    }
  }

  console.log("offers: ", offers);
  return (
    <>
      <Header />

      <Layout className="flex flex-col lg:flex-row space-y-10 space-x-5 pr-10">
        <div className="p-10 border mx-auto lg:mx-0 max-w-md lg:max-w-xl">
          <MediaRenderer src={listing.asset.image} />
        </div>

        <section className="flex-1 space-y-5 pb-20 lg:pb-10">
          <div>
            <h1 className="text-xl font-bold">{listing.asset.name}</h1>
            <p className="text-gray-600">{listing.asset.description}</p>
            <p className="flex items-center text-xs sm:text-base">
              <UserCircleIcon className="h-5" />
              <span className="font-bold pr-1">Seller:</span>
              {listing.sellerAddress}
            </p>
          </div>
          <div className="grid grid-cols-2 items-center py-2">
            <p className="font-bold">Listing Type:</p>
            <p>
              {listing.type === ListingType.Direct
                ? "Direct Listing"
                : "Auction Listing"}
            </p>

            <p className="font-bold">Buy It Now Price:</p>
            <p className="text-xl font-bold">
              {listing.buyoutCurrencyValuePerToken.displayValue}{" "}
              {listing.buyoutCurrencyValuePerToken.symbol}
            </p>

            <button
              className="col-start-2 bg-blue-600 font-bold text-white text-sm md:text-base rounded-full w-44 py-4 px-10"
              onClick={handleBuyNow}
            >
              Buy Now
            </button>
          </div>

          {listing.type === ListingType.Direct && offers ? (
            <div className="grid grid-cols-2 gap-y-2">
              <p className="font-bold">Offers:</p>
              <p className="font-bold">{offers.length ? offers.length : 0}</p>

              {offers.map((offer) => {
                return (
                  <>
                    <p
                      key={`user-${offer.listingId}-${
                        offer.offeror
                      }-${offer.totalOfferAmount.toString()}`}
                      className="flex items-center ml-5 text-sm italic"
                    >
                      <UserCircleIcon className="h-3 mr-2" />
                      {offer.offeror.slice(0, 5) +
                        "..." +
                        offer.offeror.slice(-5)}
                    </p>

                    <div
                      key={`amount-${offer.listingId}-${
                        offer.offeror
                      }-${offer.totalOfferAmount.toString()}`}
                    >
                      <p className="text-sm italic">
                        {ethers.utils.formatEther(offer.totalOfferAmount)}{" "}
                        {NATIVE_TOKENS[network].symbol}
                      </p>

                      {listing.sellerAddress === address && (
                        <button
                          onClick={async () => {
                            try {
                              await acceptDirectOfferHandler({
                                listingId: id,
                                addressOfOfferor: offer.offeror,
                              });
                              router.replace("/");
                            } catch (error) {
                              console.error(error);
                            }
                          }}
                          className="p2 w-32 bg-red-500/50 rounded-lg font-bold text-xs cursor-pointer"
                        >
                          Accept Offer
                        </button>
                      )}
                    </div>
                  </>
                );
              })}
            </div>
          ) : null}

          <div className="grid grid-cols-2 space-y-2 items-center justify-end">
            <hr className="col-span-2" />

            <p className="col-span-2 font-bold">
              {listing.type === ListingType.Direct
                ? "Make an Offer"
                : "Bid on this Auction"}
            </p>

            {listing.type === ListingType.Auction ? (
              <>
                <p>Current Minimum Bid:</p>
                <p className="font-bold">
                  {minBid?.displayValue} {minBid?.symbol}
                </p>

                <p>Time Remaining:</p>
                <Countdown
                  date={Number(listing.endTimeInEpochSeconds.toString()) * 1000}
                />
              </>
            ) : null}

            <input
              value={bidAmount || ""}
              className="outline-none border p-2 rounded-lg mr-5"
              type="text"
              placeholder={formatPlaceholder()}
              onChange={(e) => setBidAmount(e.target.value)}
            />
            <button
              className="bg-red-600 text-sm md:text-base font-bold text-white rounded-full w-44 py-4 px-10"
              onClick={handleMakeOffer}
            >
              {listing.type === ListingType.Direct ? "Offer" : "Bid"}
            </button>
          </div>
        </section>
      </Layout>
    </>
  );
}

export default ListingDetailPage;

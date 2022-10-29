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
import { ethers } from "ethers";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import Countdown from "react-countdown";
import clsx from "clsx";
import { Toaster, toast } from "react-hot-toast";

import { contracts } from "../../config/thirdweb";
import { ListingType, NATIVE_TOKENS } from "@thirdweb-dev/sdk";
import network from "../../utils/network";
import Header from "../../components/Header";
import Layout from "../../components/Layout";
import Spinner from "../../components/Spinner";

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

  const [loadingBuyNowSubmit, setLoadingBuyNowSubmit] = useState(false);
  const [loadingOfferSubmit, setLoadingOfferSubmit] = useState(false);

  const [minBid, setMinBid] = useState<{
    displayValue: string;
    symbol: string;
  }>();
  const [bidAmount, setBidAmount] = useState<string>();

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

  useEffect(() => {
    if (error) {
      toast.error("ERROR: Cannot fetch listing", { duration: 3000 });
    }
  }, [error]);

  useEffect(() => {
    if (!id || !contract) return;

    async function fetchMinimumBid() {
      if (!contract) return;

      let loadingID = "";
      try {
        loadingID = toast.loading("Loading...");
        const { displayValue, symbol } =
          await contract?.auction.getMinimumNextBid(id);
        setMinBid({
          displayValue,
          symbol,
        });
        toast.remove(loadingID);
      } catch (error) {
        toast.remove(loadingID);
        console.error(error);
      }
    }

    if (listing?.type === ListingType.Auction) {
      fetchMinimumBid();
    }
  }, [id, contract, listing]);

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
            console.log("SUCCESS: ", data, variables, context);
            resolve(data);
          },
          onError(error, variables, context) {
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
            console.log("SUCCESS: ", data, variables, context);
            resolve(data);
          },
          onError(error, variables, context) {
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
            console.log("SUCCESS: ", data, variables, context);
            resolve(data);
          },
          onError(error, variables, context) {
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
            console.log("SUCCESS: ", data, variables, context);
            resolve(data);
          },
          onError(error, variables, context) {
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

    const loadingID = toast.loading("Processing...");
    setLoadingBuyNowSubmit(true);
    try {
      await buyNowHandler();
      setLoadingBuyNowSubmit(false);
      toast.remove(loadingID);
      toast.success("NFT bought successfully!", { duration: 3000 });
      router.replace("/");
    } catch (error) {
      setLoadingBuyNowSubmit(false);
      toast.remove(loadingID);
      toast.error("ERROR: NFT could not be bought!", { duration: 3000 });
      console.error(error);
    }
  }

  async function handleMakeOffer() {
    if (networkMismatch) {
      switchNetwork && switchNetwork(network);
      return;
    }
    if (!bidAmount) {
      toast.error("Amount is required", { duration: 3000 });
      return;
    }
    let loadingID = "";
    let operation = "";
    try {
      if (listing?.type === ListingType.Direct) {
        if (
          listing.buyoutPrice.toString() ===
          ethers.utils.parseEther(bidAmount).toString()
        ) {
          console.log("Buyout price met, buying NFT...");
          operation = "BUY_NOW";
          loadingID = toast.loading("Processing...");
          setLoadingBuyNowSubmit(true);

          await buyNowHandler();

          setLoadingBuyNowSubmit(false);
          toast.success("NFT bought successfully!", { duration: 3000 });
          toast.remove(loadingID);

          router.replace("/");
          return;
        }

        console.log("Buyout price not met, making offer...");
        operation = "MAKE_OFFER";
        loadingID = toast.loading("Processing...");
        setLoadingOfferSubmit(true);

        await makeOfferHandler();

        setLoadingOfferSubmit(false);
        toast.success("Offer made successfully!", { duration: 3000 });
        toast.remove(loadingID);

        router.replace("/");
        return;
      }
      if (listing?.type === ListingType.Auction) {
        operation = "MAKE_BID";
        loadingID = toast.loading("Processing...");
        setLoadingOfferSubmit(true);

        await makeBidHandler();

        toast.success("Bid made successfully!", { duration: 3000 });
        toast.remove(loadingID);
        setLoadingOfferSubmit(false);
        setBidAmount(undefined);
      }
    } catch (error) {
      let message = "Error occurred while submitting";
      if (operation === "BUY_NOW") message = "NFT could not be bought!";
      if (operation === "MAKE_OFFER") message = "Offer could not be made!";
      if (operation === "MAKE_BID") message = "Bid could not be made!";
      toast.error(`ERROR: ${message}`, { duration: 3000 });
      toast.remove(loadingID);
      setLoadingOfferSubmit(false);
      setLoadingBuyNowSubmit(false);
      console.error(error);
    }
  }

  const disabled = loadingBuyNowSubmit || loadingOfferSubmit;
  return (
    <>
      <Toaster />
      <Header />
      <Layout className="flex flex-col lg:flex-row space-y-10 space-x-5 pr-10">
        {!isLoading && listing ? (
          <>
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
                  className={clsx(
                    "col-start-2 flex items-center justify-center font-bold text-white text-sm md:text-base rounded-full w-48 py-4 px-10",
                    {
                      "bg-blue-600": !disabled,
                      "bg-blue-400 cursor-not-allowed disabled": disabled,
                    }
                  )}
                  disabled={disabled}
                  onClick={handleBuyNow}
                >
                  {loadingBuyNowSubmit ? <Spinner /> : null} Buy Now
                </button>
              </div>

              {listing.type === ListingType.Direct && offers ? (
                <div className="grid grid-cols-2 gap-y-2">
                  <p className="font-bold">Offers:</p>
                  <p className="font-bold">
                    {offers.length ? offers.length : 0}
                  </p>

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
                                const loadingID =
                                  toast.loading("Processing...");
                                try {
                                  await acceptDirectOfferHandler({
                                    listingId: id,
                                    addressOfOfferor: offer.offeror,
                                  });
                                  toast.success(
                                    "Offer accepted successfully!",
                                    { duration: 3000 }
                                  );
                                  toast.remove(loadingID);
                                  router.replace("/");
                                } catch (error) {
                                  toast.error(
                                    "ERROR: Offer could not be accepted!",
                                    { duration: 3000 }
                                  );

                                  toast.remove(loadingID);
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
                      date={
                        Number(listing.endTimeInEpochSeconds.toString()) * 1000
                      }
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
                  className={clsx(
                    "flex items-center justify-center text-sm md:text-base font-bold text-white rounded-full w-48 py-4 px-10",
                    {
                      "bg-red-600": !disabled,
                      "bg-red-400 cursor-not-allowed disabled": disabled,
                    }
                  )}
                  disabled={disabled}
                  onClick={handleMakeOffer}
                >
                  {loadingOfferSubmit ? <Spinner /> : null}{" "}
                  {listing.type === ListingType.Direct ? "Offer" : "Bid"}
                </button>
              </div>
            </section>
          </>
        ) : !listing && !isLoading ? (
          <p>Listing not found</p>
        ) : null}
      </Layout>
    </>
  );
}

export default ListingDetailPage;

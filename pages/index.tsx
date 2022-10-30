import { BanknotesIcon, ClockIcon } from "@heroicons/react/24/outline";
import {
  useActiveListings,
  useContract,
  MediaRenderer,
} from "@thirdweb-dev/react";
import { ListingType } from "@thirdweb-dev/sdk";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Toaster, toast } from "react-hot-toast";

import Header from "../components/Header";
import { contracts } from "../config/thirdweb";

const Home = () => {
  const { contract } = useContract(contracts.marketplace, "marketplace");
  const { data: listings, isLoading: loading } = useActiveListings(contract);
  const loadingRef = useRef<string>();

  useEffect(() => {
    if (loading) {
      loadingRef.current = toast.loading("Loading...");
    }
    if (!loading) {
      toast.remove(loadingRef.current);
      loadingRef.current = undefined;
    }
    return () => {
      toast.remove(loadingRef.current);
      loadingRef.current = undefined;
    };
  }, [loading]);

  return (
    <>
      <Toaster />
      <Header />
      <main className="max-w-6xl mx-auto py-2 px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mx-auto">
          {listings?.map((listing) => (
            <Link
              key={listing.id}
              href={`/listing/${listing.id}`}
              className="flex flex-col card hover:scale-105 transition-all duration-150 ease-out"
            >
              <div className="flex flex-1 flex-col pb-2 items-center">
                <MediaRenderer className="w-44" src={listing.asset.image} />
              </div>
              <div className="pt-2 space-y-4">
                <div>
                  <h2 className="text-lg truncate">{listing.asset.name}</h2>
                  <hr />
                  <p className="truncate text-sm text-gray-600 mt-2">
                    {listing.asset.description}
                  </p>
                </div>
                <p>
                  <span className="text-bold mr-1">
                    {listing.buyoutCurrencyValuePerToken.displayValue}
                  </span>
                  {listing.buyoutCurrencyValuePerToken.symbol}
                </p>
                <div
                  className={`flex items-center space-x-1 justify-end text-xs border w-fit ml-auto p-2 rounded-lg text-white ${
                    listing.type === ListingType.Direct
                      ? "bg-blue-500"
                      : "bg-red-500"
                  }`}
                >
                  <p>
                    {listing.type === ListingType.Direct
                      ? "Buy Now"
                      : "Auction"}
                  </p>
                  {listing.type === ListingType.Direct ? (
                    <BanknotesIcon className="h-4" />
                  ) : (
                    <ClockIcon className="h-4" />
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
};

export default Home;

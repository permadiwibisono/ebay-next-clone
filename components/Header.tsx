import Link from "next/link";
import { useAddress, useDisconnect, useMetamask } from "@thirdweb-dev/react";
import {
  BellIcon,
  ShoppingCartIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

type Props = {};

export default function Header({}: Props) {
  const connect = useMetamask();
  const disconnect = useDisconnect();
  const address = useAddress();

  async function handleConnect() {
    if (address) {
      await disconnect();
      return;
    }
    await connect();
  }
  return (
    <div className="max-w-6xl mx-auto p-2">
      <nav className="flex justify-between">
        <div className="flex items-center space-x-2 text-sm">
          <button onClick={handleConnect} className="btn-primary">
            {address
              ? `Hi ${address.slice(0, 5)}...${address.slice(-4)}`
              : "Connect your wallet"}
          </button>
          <p className="hidden md:inline-flex">Daily Deals</p>
          <p className="hidden md:inline-flex">Help & Contact</p>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <p className="hidden md:inline-flex cursor-pointer">Ship to</p>
          <p className="hidden md:inline-flex cursor-pointer">Sell</p>
          <p className="hidden md:inline-flex cursor-pointer">Watchlist</p>

          <Link href="/create-item" className="flex items-center hover:link">
            Add to inventory
            <ChevronDownIcon className="h-4" />
          </Link>
          <BellIcon className="h-6 w-6" />
          <ShoppingCartIcon className="h-6 w-6" />
        </div>
      </nav>
      <hr className="mt-2" />
      <section className="flex items-center space-x-2 py-5">
        <div className="h-16 w-16 sm:w-28 md:w-44 cursor-pointer flex-shrink-0">
          <Link href="/">
            <Image
              className="h-full w-full object-contain"
              alt="Thirdweb logo"
              src="https://links.papareact.com/bdb"
              width={100}
              height={100}
            />
          </Link>
        </div>

        <button className="hidden lg:flex items-center space-x-2 w-20">
          <p className="text-gray-600 text-sm">Shop by Category</p>
          <ChevronDownIcon className="h-4 flex-shrink-0" />
        </button>

        <div className="flex items-center space-x-2 px-2 md:px-5 py-2 border-black border-2 flex-1">
          <MagnifyingGlassIcon className="w-5 text-gray-400" />
          <input
            className="flex-1 outline-none"
            type="text"
            placeholder="Search for anything"
          />
        </div>

        <button className="hidden sm:inline bg-blue-600 text-white px-5 md:px-10 py-2 border-2 border-blue-600">
          Search
        </button>

        <Link href="/sell-item">
          <button className="border-2 border-blue-600 px-5 md:px-10 py-2 text-blue-600 hover:bg-blue-600/50 hover:text-white cursor-pointer">
            List Item
          </button>
        </Link>
      </section>

      <hr />
      <section className="flex py-3 space-x-6 text-xs md:text-sm whitespace-nowrap justify-center px-6">
        <p className="link">Home</p>
        <p className="link">Electronics</p>
        <p className="link">Computers</p>
        <p className="link hidden sm:inline">Video Games</p>
        <p className="link hidden sm:inline">Home & Garden</p>
        <p className="link hidden md:inline">Health & Beauty</p>
        <p className="link hidden lg:inline">Collectible & Art</p>
        <p className="link hidden lg:inline">Books</p>
        <p className="link hidden lg:inline">Musics</p>
        <p className="link hidden xl:inline">Deals</p>
        <p className="link hidden xl:inline">Other</p>
        <p className="link">More</p>
      </section>
      <hr />
    </div>
  );
}

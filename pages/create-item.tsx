import React, { FormEvent, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAddress, useContract } from "@thirdweb-dev/react";
import clsx from "clsx";
import { Toaster, toast } from "react-hot-toast";

import { contracts } from "../config/thirdweb";
import Header from "../components/Header";
import Layout from "../components/Layout";
import Spinner from "../components/Spinner";
import { XCircleIcon } from "@heroicons/react/24/outline";

type Props = {};

function CreateItemPage({}: Props) {
  const router = useRouter();
  const address = useAddress();
  const imgRef = useRef<HTMLInputElement | null>(null);

  const { contract } = useContract(contracts.collection, "nft-collection");

  const [preview, setPreview] = useState<string>();
  const [image, setImage] = useState<File>();
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  async function handleOnSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!contract || !address) return;

    if (loadingSubmit) return;

    if (!image) {
      toast.error("Please select an image", { duration: 3000 });
      return;
    }

    const form = e.target as typeof e.target & {
      elements: {
        name: { value: string };
        description: { value: string };
      };
    };

    const {
      name: { value: name },
      description: { value: description },
    } = form.elements;

    const metadata = {
      name,
      description,
      image, // URL or file
    };

    setLoadingSubmit(true);
    const val = toast.loading("Processing...");
    try {
      await contract.mintTo(address, metadata);
      setLoadingSubmit(false);
      toast.remove(val);
      toast.success("Mint an Item successfully", { duration: 3000 });

      router.replace("/");
    } catch (error) {
      setLoadingSubmit(false);
      toast.remove(val);
      toast.error("ERROR: Mint an Item failed", { duration: 3000 });
      console.error(error);
    }
  }

  return (
    <>
      <Toaster />
      <Header />
      <Layout>
        <h1 className="text-4xl font-bold">Add an Item to the Marketplace</h1>
        <h2 className="text-xl font-semibold pt-5">Item Details</h2>
        <p className="pb-5">
          By adding an item to the marketplcae, you're essentially Minting an
          NFT of the item into your wallet which we can then list for sale!
        </p>
        <div className="flex flex-col items-center justify-center md:flex-row md:space-x-5 pt-5">
          <div className="relative">
            {preview ? (
              <XCircleIcon
                onClick={() => {
                  setImage(undefined);
                  setPreview(undefined);
                  if (imgRef.current) {
                    imgRef.current.value = "";
                  }
                }}
                className="h-8 absolute -right-4 -top-4 text-red-500 cursor-pointer"
              />
            ) : null}
            <Image
              className="border h-80 w-80 object-contain"
              width={500}
              height={500}
              src={preview ? preview : "https://links.papareact.com/ucj"}
              alt=""
            />
          </div>
          <form
            onSubmit={handleOnSubmit}
            className="flex flex-col flex-1 p-2 space-y-2"
          >
            <label className="font-light">Name of Item</label>
            <input
              id="name"
              name="name"
              className="form-field"
              type="text"
              placeholder="Name of item..."
            />

            <label className="font-light">Description</label>
            <input
              id="description"
              name="description"
              className="form-field"
              type="text"
              placeholder="Enter Description..."
            />

            <label className="font-light">Image of the Item</label>
            <input
              type="file"
              ref={(ref) => (imgRef.current = ref)}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setPreview(URL.createObjectURL(e.target.files[0]));
                  setImage(e.target.files[0]);
                }
              }}
            />

            <div className="flex flex-col items-center">
              <button
                className={clsx(
                  "font-bold text-white rounded-full py-4 px-10 w-56 mt-5 flex items-center justify-center",
                  {
                    "bg-blue-600": !loadingSubmit,
                    "bg-blue-400 cursor-not-allowed disabled": loadingSubmit,
                  }
                )}
                disabled={loadingSubmit}
              >
                {loadingSubmit ? <Spinner /> : null} Add/Mint Item
              </button>
            </div>
          </form>
        </div>
      </Layout>
    </>
  );
}

export default CreateItemPage;

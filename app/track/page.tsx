"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import * as rawIdl from "../../idl.json";
import type { DecentralizedAgSupply } from "../../types/decentralized_ag_supply";
import Link from "next/link";
import { ChevronLeft, Search, Leaf, Truck, Store, CheckCircle, AlertTriangle, Package } from "lucide-react";
import { AnchorProvider, BN, Program, setProvider } from "@coral-xyz/anchor";
import { toast } from "react-hot-toast";
import { initializeApp } from "firebase/app";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";

// Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: "hackprojec-77a77.firebaseapp.com",
  projectId: "hackprojec-77a77",
  storageBucket: "hackprojec-77a77.appspot.com",
  messagingSenderId: "452533063595",
  appId: "1:452533063595:web:93ddcc0c36ca5c98c50cee",
  measurementId: "G-Q8FYL07XMQ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const programId = new PublicKey(rawIdl.address);

type ProduceStatus = {
  id: string;
  status: "Harvested" | "PickedUp" | "InTransit" | "Delivered" | "QualityVerified" | "Disputed";
  farmer: string;
  produceType: string;
  quantity: number;
  harvestDate: string;
  quality: number;
  verifiedQuality: number;
  lastUpdated: string;
  transportTemp: number;
  transportHumidity: number;
  deliveryConfirmed: boolean;
  disputeRaised: boolean;
  qrCodeUri: string;
  farmerPrice: number;
  transporterFee: number;
  images?: string[]; // Added for Firebase image URLs
};

const ProduceStatusPage = () => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [produceId, setProduceId] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [produceData, setProduceData] = useState<ProduceStatus | null>(null);

  const fetchProduceStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anchorWallet) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!produceId) {
      toast.error("Please enter a produce ID");
      return;
    }

    setIsFetching(true);
    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      setProvider(provider);
      const program = new Program(rawIdl as unknown as DecentralizedAgSupply, provider);

      const produceIdNum = parseInt(produceId.replace("PROD-", ""));
      if (isNaN(produceIdNum)) {
        throw new Error("Invalid Produce ID. Use format like PROD-123");
      }
      const produceIdBN = new BN(produceIdNum);
      const [producePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("produce"), produceIdBN.toArrayLike(Buffer, "le", 8)],
        programId
      );
      const produceAccount = await (program.account as any).produce.fetch(producePDA);
      if (!produceAccount) {
        throw new Error("Produce not found");
      }

      const fetchedData: ProduceStatus = {
        id: `PROD-${produceAccount.produceId.toString()}`,
        status: Object.keys(produceAccount.status)[0] as ProduceStatus["status"],
        farmer: produceAccount.farmer.toBase58(),
        produceType: produceAccount.produceType,
        quantity: produceAccount.quantity.toNumber(),
        harvestDate: new Date(produceAccount.harvestDate.toNumber() * 1000).toLocaleString(),
        quality: produceAccount.quality,
        verifiedQuality: produceAccount.verifiedQuality,
        lastUpdated: new Date(produceAccount.lastUpdated.toNumber() * 1000).toLocaleString(),
        transportTemp: produceAccount.transportTemp,
        transportHumidity: produceAccount.transportHumidity,
        deliveryConfirmed: produceAccount.deliveryConfirmed,
        disputeRaised: produceAccount.disputeRaised,
        qrCodeUri: produceAccount.qrCodeUri,
        farmerPrice: produceAccount.farmerPrice.toNumber(),
        transporterFee: produceAccount.transporterFee.toNumber(),
      };

      // Fetch images from Firebase Storage
      const images = await fetchImagesFromFirebase(fetchedData.id);
      fetchedData.images = images;

      setProduceData(fetchedData);
      toast.success("Produce status retrieved!");
    } catch (err) {
      console.error("Error fetching produce status:", err);
      toast.error("Failed to fetch produce status. Check the ID and try again.");
      setProduceData(null);
    } finally {
      setIsFetching(false);
    }
  };

  // Function to fetch images from Firebase Storage
  const fetchImagesFromFirebase = async (produceId: string): Promise<string[]> => {
    try {
      const storageRef = ref(storage, `produce/${produceId}`);
      const result = await listAll(storageRef);
      const imageUrls = await Promise.all(
        result.items.map(async (itemRef) => {
          return await getDownloadURL(itemRef);
        })
      );
      return imageUrls;
    } catch (err) {
      console.error("Error fetching images from Firebase:", err);
      return [];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Harvested": return <Leaf className="w-6 h-6 text-green-500" />;
      case "PickedUp": return <Package className="w-6 h-6 text-orange-500" />;
      case "InTransit": return <Truck className="w-6 h-6 text-blue-500" />;
      case "Delivered": return <Store className="w-6 h-6 text-yellow-500" />;
      case "QualityVerified": return <CheckCircle className="w-6 h-6 text-purple-500" />;
      case "Disputed": return <AlertTriangle className="w-6 h-6 text-red-500" />;
      default: return <Leaf className="w-6 h-6 text-green-500" />;
    }
  };

  return (
    <section className="bg-gradient-to-r from-green-50 to-blue-50 min-h-screen py-20 px-4">
      <motion.div
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <Link href="/" className="text-gray-600 hover:text-green-600 mb-6 flex items-center font-medium">
          <ChevronLeft className="mr-2" /> Back to Home
        </Link>

        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Form Side */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl p-8 border border-gray-100"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <motion.h1
                className="text-4xl font-bold text-gray-800 mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <span className="text-green-600">FarmFlow:</span> Produce Status
              </motion.h1>
              <motion.p
                className="text-lg text-gray-600 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                Enter a produce ID to track its journey through the supply chain.
              </motion.p>

              <form onSubmit={fetchProduceStatus} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <label htmlFor="produceId" className="block text-sm font-medium text-gray-700">
                    Produce ID
                  </label>
                  <div className="flex items-center mt-1 space-x-2">
                    <input
                      id="produceId"
                      type="text"
                      value={produceId}
                      onChange={(e) => setProduceId(e.target.value)}
                      className="flex-1 bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500"
                      required
                      disabled={isFetching}
                      placeholder="e.g., PROD-123"
                    />
                    <motion.button
                      type="submit"
                      className={`whitespace-nowrap px-4 py-3 rounded-lg text-sm font-medium ${
                        isFetching
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                      disabled={isFetching}
                      whileHover={!isFetching ? { scale: 1.02 } : {}}
                      whileTap={!isFetching ? { scale: 0.98 } : {}}
                    >
                      {isFetching ? "Fetching..." : (
                        <>
                          <Search className="w-4 h-4 inline mr-1" /> Track
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              </form>

              {produceData && (
                <motion.div
                  className="mt-6 bg-green-50 border-l-4 border-green-500 p-4 rounded"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="text-lg font-semibold text-green-700 mb-2 flex items-center">
                    {getStatusIcon(produceData.status)}
                    <span className="ml-2">Current Status: {produceData.status}</span>
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Produce ID:</strong> {produceData.id}</p>
                    <p><strong>Farmer:</strong> {produceData.farmer.slice(0, 8)}...{produceData.farmer.slice(-8)}</p>
                    <p><strong>Produce Type:</strong> {produceData.produceType}</p>
                    <p><strong>Quantity:</strong> {produceData.quantity} units</p>
                    <p><strong>Harvest Date:</strong> {produceData.harvestDate}</p>
                    <p><strong>Initial Quality:</strong> {produceData.quality}</p>
                    <p><strong>Verified Quality:</strong> {produceData.verifiedQuality}</p>
                    <p><strong>Last Updated:</strong> {produceData.lastUpdated}</p>
                    <p>
                      <strong>Transport Temp:</strong>{" "}
                      {produceData.transportTemp === -999 ? "Not Set" : `${produceData.transportTemp}°C`}
                    </p>
                    <p>
                      <strong>Transport Humidity:</strong>{" "}
                      {produceData.transportHumidity === 255 ? "Not Set" : `${produceData.transportHumidity}%`}
                    </p>
                    <p><strong>Delivery Confirmed:</strong> {produceData.deliveryConfirmed ? "Yes" : "No"}</p>
                    <p><strong>Dispute Raised:</strong> {produceData.disputeRaised ? "Yes" : "No"}</p>
                    <p><strong>QR Code URI:</strong> <a href={produceData.qrCodeUri} target="_blank" className="text-blue-600">{produceData.qrCodeUri}</a></p>
                    <p><strong>Farmer Price:</strong> {produceData.farmerPrice} tokens</p>
                    <p><strong>Transporter Fee:</strong> {produceData.transporterFee} tokens</p>
                  </div>

                  {/* Display Images from Firebase */}
                  {produceData.images && produceData.images.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-2">Produce Images</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {produceData.images.map((imageUrl, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 * index, duration: 0.5 }}
                          >
                            <img
                              src={imageUrl}
                              alt={`Produce ${produceData.id} - Image ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg shadow-md"
                            />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          {/* Visual Side */}
          <motion.div
            className="w-full lg:w-1/2 relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="rounded-xl overflow-hidden shadow-2xl relative"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 3 }}
            >
              <div className="h-96 bg-gradient-to-br from-green-100 to-blue-100 p-6 relative">
                <motion.div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-white flex items-center justify-center shadow-xl z-20"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-4 border-dashed border-green-200 opacity-70"
                  />
                  <motion.div className="w-20 h-20">
                    {produceData ? getStatusIcon(produceData.status) : <Search className="w-20 h-20 text-gray-400" />}
                  </motion.div>
                </motion.div>
                <motion.div
                  className="absolute top-4 left-4 bg-green-600 text-white p-2 rounded-lg shadow-lg z-10 flex items-center space-x-2"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.8, duration: 0.6 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-sm font-medium">Blockchain Verified</span>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default ProduceStatusPage;
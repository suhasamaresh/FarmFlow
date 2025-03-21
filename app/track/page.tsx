"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import * as rawIdl from "../../idl.json";
import type { DecentralizedAgSupply } from "../../types/decentralized_ag_supply";
import Link from "next/link";
import { ChevronLeft, Search, Leaf, Truck, Store, CheckCircle } from "lucide-react";
import { AnchorProvider, Program, setProvider } from "@coral-xyz/anchor";
import { toast } from "react-hot-toast";

const programId = new PublicKey(rawIdl.address);

type ProduceStatus = {
  id: string;
  status: "Harvested" | "In Transit" | "Delivered" | "Verified";
  farmer: string;
  transporter?: string;
  retailer?: string;
  timestamp: string;
  details: {
    cropType: string;
    quantity: number;
    unit: string;
  };
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

      // Assuming produce PDA is derived from produceId
      const [producePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("produce"), Buffer.from(produceId)],
        programId
      );

      const produceAccount = await (program.account as any).produce.fetch(producePDA);
      if (!produceAccount) {
        throw new Error("Produce not found");
      }

      // Mocked data structure - adjust based on your actual IDL
      const fetchedData: ProduceStatus = {
        id: produceId,
        status: produceAccount.status, // e.g., "Harvested", "In Transit", etc.
        farmer: produceAccount.farmer.toBase58(),
        transporter: produceAccount.transporter?.toBase58() || undefined,
        retailer: produceAccount.retailer?.toBase58() || undefined,
        timestamp: new Date(produceAccount.timestamp.toNumber() * 1000).toLocaleString(),
        details: {
          cropType: produceAccount.details.cropType,
          quantity: produceAccount.details.quantity,
          unit: produceAccount.details.unit,
        },
      };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Harvested": return <Leaf className="w-6 h-6 text-green-500" />;
      case "In Transit": return <Truck className="w-6 h-6 text-blue-500" />;
      case "Delivered": return <Store className="w-6 h-6 text-yellow-500" />;
      case "Verified": return <CheckCircle className="w-6 h-6 text-purple-500" />;
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
                      placeholder="Enter produce ID (e.g., PROD-123)"
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
                      {isFetching ? "Fetching..." : <><Search className="w-4 h-4 inline mr-1" /> Track</>}
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
                    {produceData.transporter && (
                      <p><strong>Transporter:</strong> {produceData.transporter.slice(0, 8)}...{produceData.transporter.slice(-8)}</p>
                    )}
                    {produceData.retailer && (
                      <p><strong>Retailer:</strong> {produceData.retailer.slice(0, 8)}...{produceData.retailer.slice(-8)}</p>
                    )}
                    <p><strong>Last Updated:</strong> {produceData.timestamp}</p>
                    <p><strong>Crop Type:</strong> {produceData.details.cropType}</p>
                    <p><strong>Quantity:</strong> {produceData.details.quantity} {produceData.details.unit}</p>
                  </div>
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
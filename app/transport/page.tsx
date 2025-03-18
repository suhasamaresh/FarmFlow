"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import * as rawIdl from "../../idl.json";
import type { DecentralizedAgSupply } from "../../types/decentralized_ag_supply";
import {
  Truck,
  Thermometer,
  Droplet,
  Package,
  Search,
  Clock,
} from "lucide-react";
import Link from "next/link";

// Make sure programId is correctly initialized from the IDL
// Using metadata.address as shown in the console output
const programId = new PublicKey(rawIdl.address);

const TransporterDashboard = () => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [produceId, setProduceId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<null | string>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  interface TransportJob {
    produceId: string;
    transportTemp: number;
    transportHumidity: number;
    status: string;
    timestamp: number;
  }

  const [transportJobs, setTransportJobs] = useState<TransportJob[]>([]);
  const [selectedTab, setSelectedTab] = useState("pickup");

  useEffect(() => {
    if (anchorWallet) {
      checkUserRole();
      fetchTransportJobs();
    }
  }, [anchorWallet]);

  const checkUserRole = async () => {
    if (!anchorWallet) return;

    setIsCheckingRole(true);
    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      const program = new Program(
        rawIdl as unknown as DecentralizedAgSupply,
        provider
      );

      const [participantPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("participant"), anchorWallet.publicKey.toBuffer()],
        programId
      );

      const participantAccount = await (
        program.account as any
      ).participant.fetch(participantPDA);

      // Assuming the participant account has a role field that's an enum
      if (participantAccount.role.transporter) {
        setUserRole("Transporter");
      } else {
        setUserRole("Other");
      }
    } catch (err) {
      console.error("Error checking user role:", err);
      setUserRole("Other"); // Default to non-transporter if error occurs
    }
    setIsCheckingRole(false);
  };

  const fetchTransportJobs = async () => {
    try {
      if (!anchorWallet) {
        console.error("Please connect your wallet");
        return;
      }

      const provider = new AnchorProvider(connection, anchorWallet, {});
      const program = new Program(
        rawIdl as unknown as DecentralizedAgSupply,
        provider
      );
      console.log(program);

      // Use the program's account method to get all Produce accounts
      const produceAccounts = await (program.account as any).produce.all();
      console.log("Produce accounts:", produceAccounts);

      // Debug: Log the structure of the first account to understand its properties
      if (produceAccounts.length > 0) {
        console.log(
          "First account structure:",
          JSON.stringify(produceAccounts[0], null, 2)
        );
        console.log("Current wallet:", anchorWallet.publicKey.toString());
        if (produceAccounts[0].account.transporterAccount) {
          console.log(
            "Transporter account on record:",
            produceAccounts[0].account.transporterAccount.toString()
          );
        }
      }

      // Filter all produce accounts that are NOT in PickedUp status
      const jobs = produceAccounts
        .filter(
          (account: {
            account: {
              status: { toString?: any };
              transporterAccount: { toString: () => string };
            };
            publicKey: { toString: () => any };
          }) => {
            // Check if status exists and equals "PickedUp"
            const hasCorrectStatus =
              account.account.status &&
              (typeof account.account.status === "object"
                ? Object.keys(account.account.status)[0] === "pickedUp"
                : String(account.account.status) === "PickedUp");

            console.log(
              `Account ${account.publicKey.toString()}: Status match: ${hasCorrectStatus}`
            );

            return hasCorrectStatus;
          }
        )
        .map(
          (account: {
            account: {
              produceId: { toString: () => any };
              transportTemp: any;
              transportHumidity: any;
              status: { toString?: any };
              timestamp?: number;
            };
          }) => ({
            produceId:
              typeof account.account.produceId === "object"
                ? account.account.produceId.toString()
                : String(account.account.produceId),
            transportTemp: account.account.transportTemp || 0,
            transportHumidity: account.account.transportHumidity || 0,
            status:
              typeof account.account.status === "object"
                ? Object.keys(account.account.status)[0]
                : String(account.account.status),
            // Use timestamp if available, otherwise use current time as fallback
            timestamp: account.account.timestamp || Date.now(),
          })
        );

      // Sort jobs by timestamp, most recent first
      jobs.sort(
        (a: { timestamp: number }, b: { timestamp: number }) =>
          b.timestamp - a.timestamp
      );

      console.log("Filtered jobs:", jobs);
      setTransportJobs(jobs);
    } catch (err) {
      console.error("Error fetching transport jobs:", err);
    }
  };

  const handleRecordPickup = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!anchorWallet) return;

    setIsLoading(true);
    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      const program = new Program(
        rawIdl as unknown as DecentralizedAgSupply,
        provider
      );

      // Convert produceId to a number and then to a BN
      const produceIdNum = parseInt(produceId);
      if (isNaN(produceIdNum)) {
        throw new Error("Invalid Produce ID");
      }

      const produceIdBN = new BN(produceIdNum);

      const [producePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("produce"), produceIdBN.toArrayLike(Buffer, "le", 8)],
        programId
      );
      console.log("Produce PDA: ", producePDA.toString());

      const [transporterPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("participant"), anchorWallet.publicKey.toBuffer()],
        programId
      );

      await program.methods
        .recordPickup(parseInt(temperature), parseInt(humidity))
        .accounts({
          produce: producePDA,
          transporterAccount: transporterPDA,
          transporter: anchorWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Clear form fields
      setProduceId("");
      setTemperature("");
      setHumidity("");

      // Add a small delay before refreshing to allow blockchain to update
      setTimeout(() => {
        fetchTransportJobs();
      }, 2000);

      alert("Pickup recorded successfully!");
    } catch (err) {
      console.error("Error recording pickup:", err);
      alert(
        `Error recording pickup: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
    setIsLoading(false);
  };

  const handleRecordDelivery = async (produceId: string) => {
    if (!anchorWallet) return;

    setIsLoading(true);
    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      const program = new Program(
        rawIdl as unknown as DecentralizedAgSupply,
        provider
      );

      // Convert produceId to a number and then to a BN
      const produceIdNum = parseInt(produceId);
      if (isNaN(produceIdNum)) {
        throw new Error("Invalid Produce ID");
      }

      const produceIdBN = new BN(produceIdNum);

      const [producePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("produce"), produceIdBN.toArrayLike(Buffer, "le", 8)],
        programId
      );
      console.log("Produce PDA: ", producePDA.toString());

      const [transporterPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("participant"), anchorWallet.publicKey.toBuffer()],
        programId
      );

      await program.methods
        .recordDelivery()
        .accounts({
          produce: producePDA,
          transporterAccount: transporterPDA,
          transporter: anchorWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Refresh jobs after a small delay
      setTimeout(() => {
        fetchTransportJobs();
      }, 2000);

      alert("Delivery recorded successfully!");
    } catch (err) {
      console.error("Error recording delivery:", err);
      alert(
        `Error recording delivery: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
    setIsLoading(false);
  };

  // Filter jobs based on search query
  const filteredJobs = transportJobs.filter((job) =>
    job.produceId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get jobs to display based on showAll toggle
  const displayedJobs = showAll ? filteredJobs : filteredJobs.slice(0, 3);

  // Format timestamp to readable date
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (isCheckingRole) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-green-50 to-blue-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-md">
          <p className="text-gray-700">Verifying your role...</p>
        </div>
      </div>
    );
  }

  if (userRole !== "Transporter") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-md max-w-md">
          <div className="text-red-500 text-xl mb-4">Access Denied</div>
          <p className="text-gray-700 mb-6">
            Only transporters can access this page.
          </p>
          <Link href="/dashboard">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              Return to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-gradient-to-r from-green-50 to-blue-50 min-h-screen py-20 px-4">
      <motion.div
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1
          className="text-4xl font-bold text-gray-800 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <span className="text-green-600">FarmFlow:</span> Transporter
          Dashboard
        </motion.h1>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Controls Panel */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100 h-full">
              {/* Tabs */}
              <div className="flex gap-6 mb-6 border-b border-gray-200">
                <button
                  className={`pb-2 text-lg font-medium ${
                    selectedTab === "pickup"
                      ? "border-b-2 border-green-600 text-green-600"
                      : "text-gray-600 hover:text-green-600"
                  }`}
                  onClick={() => setSelectedTab("pickup")}
                >
                  Record Pickup
                </button>
                <button
                  className={`pb-2 text-lg font-medium ${
                    selectedTab === "delivery"
                      ? "border-b-2 border-green-600 text-green-600"
                      : "text-gray-600 hover:text-green-600"
                  }`}
                  onClick={() => setSelectedTab("delivery")}
                >
                  Record Delivery
                </button>
              </div>

              {selectedTab === "pickup" && (
                <form onSubmit={handleRecordPickup} className="space-y-5">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  >
                    <label className="block text-sm font-medium text-gray-700">
                      Produce ID
                    </label>
                    <input
                      type="text"
                      value={produceId}
                      onChange={(e) => setProduceId(e.target.value)}
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500"
                      placeholder="Enter Produce ID"
                      required
                      disabled={isLoading}
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                  >
                    <label className="block text-sm font-medium text-gray-700">
                      Temperature (°C)
                    </label>
                    <input
                      type="number"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500"
                      placeholder="Enter temperature"
                      required
                      disabled={isLoading}
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  >
                    <label className="block text-sm font-medium text-gray-700">
                      Humidity (%)
                    </label>
                    <input
                      type="number"
                      value={humidity}
                      onChange={(e) => setHumidity(e.target.value)}
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500"
                      placeholder="Enter humidity"
                      required
                      disabled={isLoading}
                    />
                  </motion.div>
                  <motion.button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition shadow-lg flex items-center justify-center"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      "Processing..."
                    ) : (
                      <>
                        <Truck className="mr-2" /> Record Pickup
                      </>
                    )}
                  </motion.button>
                </form>
              )}

              {selectedTab === "delivery" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="space-y-5"
                >
                  <p className="text-lg text-gray-600 mb-4">
                    Select a job from the right panel to record delivery
                  </p>
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <p className="text-green-700">
                      Recently recorded pickups will appear in the jobs panel.
                      Please allow a few moments for blockchain confirmation.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Transport Jobs Panel */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100 h-full">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Current Transport Jobs
              </h2>

              {/* Note about produce IDs */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4">
                <p className="text-blue-700 text-sm">
                  This panel shows all produce IDs that are not currently in
                  "PickedUp" stage. If you have made a change recently, your
                  produce ID should appear here after blockchain confirmation.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Search by Produce ID"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredJobs.length === 0 ? (
                  <p className="text-gray-600">
                    No active transport jobs matching your search
                  </p>
                ) : (
                  displayedJobs.map((job) => (
                    <motion.div
                      key={job.produceId}
                      className="border border-gray-200 p-4 rounded-lg shadow-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">
                            Produce ID: {job.produceId}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Thermometer className="w-4 h-4 mr-1 text-green-500" />
                            Temp: {job.transportTemp}°C
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Droplet className="w-4 h-4 mr-1 text-green-500" />
                            Humidity: {job.transportHumidity}%
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Clock className="w-4 h-4 mr-1 text-green-500" />
                            {formatTimestamp(job.timestamp)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Status: {job.status}
                          </p>
                        </div>
                        {job.status === "PickedUp" && (
                          <motion.button
                            onClick={() => handleRecordDelivery(job.produceId)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Package className="mr-2" /> Record Delivery
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Show More/Less Button */}
              {filteredJobs.length > 3 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="mt-4 text-green-600 hover:underline font-medium"
                >
                  {showAll ? "Show Less" : `Show All (${filteredJobs.length})`}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default TransporterDashboard;

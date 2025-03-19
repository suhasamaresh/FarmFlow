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
  const [produceStatus, setProduceStatus] = useState<{
    exists: boolean;
    status?: string;
  } | null>(null);

  interface TransportJob {
    produceId: string;
    transportTemp: number;
    transportHumidity: number;
    status: string;
    timestamp: number;
  }

  const [transportJobs, setTransportJobs] = useState<TransportJob[]>([]);

  useEffect(() => {
    if (anchorWallet) {
      checkUserRole();
      fetchTransportJobs();
    }
  }, [anchorWallet]);

  useEffect(() => {
    if (produceId) {
      checkProduceOnChain();
    } else {
      setProduceStatus(null);
    }
  }, [produceId, anchorWallet]);

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

      if (participantAccount.role.transporter) {
        setUserRole("Transporter");
      } else {
        setUserRole("Other");
      }
    } catch (err) {
      console.error("Error checking user role:", err);
      setUserRole("Other");
    }
    setIsCheckingRole(false);
  };

  const fetchTransportJobs = async () => {
    if (!anchorWallet) {
      console.error("Please connect your wallet");
      return;
    }

    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      const program = new Program(
        rawIdl as unknown as DecentralizedAgSupply,
        provider
      );

      const produceAccounts = await (program.account as any).produce.all();

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

      const jobs = produceAccounts
        .filter(
          (account: {
            account: {
              status: { toString?: any };
              transporterAccount: { toString: () => string };
            };
            publicKey: { toString: () => any };
          }) => {
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
            timestamp: account.account.timestamp || Date.now(),
          })
        );

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

  const checkProduceOnChain = async () => {
    if (!anchorWallet || !produceId) return;

    setIsLoading(true);
    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      const program = new Program(
        rawIdl as unknown as DecentralizedAgSupply,
        provider
      );

      const produceIdNum = parseInt(produceId);
      if (isNaN(produceIdNum)) {
        setProduceStatus({ exists: false });
        return;
      }

      const produceIdBN = new BN(produceIdNum);
      const [producePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("produce"), produceIdBN.toArrayLike(Buffer, "le", 8)],
        programId
      );

      const accountInfo = await connection.getAccountInfo(producePDA);
      if (accountInfo) {
        const produceAccount = await (program.account as any).produce.fetch(producePDA);
        const status = typeof produceAccount.status === "object"
          ? Object.keys(produceAccount.status)[0]
          : String(produceAccount.status);
        setProduceStatus({ exists: true, status });
      } else {
        setProduceStatus({ exists: false });
      }
    } catch (err) {
      console.error("Error checking produce on chain:", err);
      setProduceStatus({ exists: false });
    } finally {
      setIsLoading(false);
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

      const produceIdNum = parseInt(produceId);
      if (isNaN(produceIdNum)) {
        throw new Error("Invalid Produce ID");
      }

      const produceIdBN = new BN(produceIdNum);
      const [producePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("produce"), produceIdBN.toArrayLike(Buffer, "le", 8)],
        programId
      );

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

      setProduceId("");
      setTemperature("");
      setHumidity("");

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

      const produceIdNum = parseInt(produceId);
      if (isNaN(produceIdNum)) {
        throw new Error("Invalid Produce ID");
      }

      const produceIdBN = new BN(produceIdNum);
      const [producePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("produce"), produceIdBN.toArrayLike(Buffer, "le", 8)],
        programId
      );

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
          <span className="text-green-600">FarmFlow:</span> Transporter Dashboard
        </motion.h1>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Record Pickup Panel */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100 h-full">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Record Pickup
              </h2>
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
            </div>
          </motion.div>

          {/* Record Delivery Panel */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100 h-full">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Record Delivery
              </h2>
              
              <div className="space-y-5">
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Produce ID
                  </label>
                  <input
                    type="text"
                    value={produceId}
                    onChange={(e) => setProduceId(e.target.value)}
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500"
                    placeholder="Enter Produce ID to check status"
                    disabled={isLoading}
                  />

                  {produceId && (
                    isLoading ? (
                      <p className="text-gray-600">Checking on-chain status...</p>
                    ) : produceStatus?.exists ? (
                      <>
                        <p className="text-gray-600">
                          Status: {produceStatus.status}
                        </p>
                        {produceStatus.status === "pickedUp" && (
                          <motion.button
                            onClick={() => handleRecordDelivery(produceId)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition shadow-lg flex items-center justify-center"
                            disabled={isLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {isLoading ? (
                              "Processing..."
                            ) : (
                              <>
                                <Package className="mr-2" /> Record Delivery
                              </>
                            )}
                          </motion.button>
                        )}
                        {produceStatus.status !== "pickedUp" && (
                          <p className="text-red-600">
                            Can only record delivery for produce in "PickedUp" status
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-red-600">
                        No produce found on-chain with ID: {produceId}
                      </p>
                    )
                  )}
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <p className="text-green-700">
                    Enter a Produce ID to verify its existence on-chain. Delivery
                    can only be recorded for existing produce in "PickedUp" status.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default TransporterDashboard;
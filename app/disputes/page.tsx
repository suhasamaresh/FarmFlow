"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as rawIdl from "../../idl.json";
import type { DecentralizedAgSupply } from "../../types/decentralized_ag_supply";
import Link from "next/link";
import { ChevronLeft, AlertTriangle, Scale, CheckCircle } from "lucide-react";
import { AnchorProvider, Program, setProvider } from "@coral-xyz/anchor";
import { toast } from "react-hot-toast";

const programId = new PublicKey(rawIdl.address);

const ManageDisputesPage = () => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [raiseProduceId, setRaiseProduceId] = useState("");
  const [description, setDescription] = useState("");
  const [resolveProduceId, setResolveProduceId] = useState("");
  const [resolution, setResolution] = useState<boolean | null>(null);
  const [isRaising, setIsRaising] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [isArbitrator, setIsArbitrator] = useState(false);
  const [raiseResult, setRaiseResult] = useState<{ produceId: string; timestamp: string } | null>(null);
  const [resolveResult, setResolveResult] = useState<{ produceId: string; resolution: boolean; timestamp: string } | null>(null);

  useEffect(() => {
    if (anchorWallet) {
      checkUserRole();
    }
  }, [anchorWallet]);

  const checkUserRole = async () => {
    if (!anchorWallet) return;

    setIsCheckingRole(true);
    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      setProvider(provider);
      const program = new Program(rawIdl as unknown as DecentralizedAgSupply, provider);

      const [participantPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("participant"), anchorWallet.publicKey.toBuffer()],
        programId
      );

      const participantAccount = await (program.account as any).participant.fetch(participantPDA);
      const role = Object.keys(participantAccount.role)[0];
      setIsArbitrator(role === "arbitrator");
    } catch (err) {
      console.error("Error checking role:", err);
      setIsArbitrator(false);
    } finally {
      setIsCheckingRole(false);
    }
  };

  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anchorWallet) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!raiseProduceId || !description) {
      toast.error("Please enter both Produce ID and Description");
      return;
    }
    if (description.length > 128) {
      toast.error("Description must be 128 characters or less");
      return;
    }

    setIsRaising(true);
    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      setProvider(provider);
      const program = new Program(rawIdl as unknown as DecentralizedAgSupply, provider);

      const produceIdNum = parseInt(raiseProduceId.replace("PROD-", ""));
      if (isNaN(produceIdNum)) {
        throw new Error("Invalid Produce ID format. Use e.g., PROD-123");
      }
      const produceIdBuffer = Buffer.alloc(8);
      produceIdBuffer.writeBigUInt64LE(BigInt(produceIdNum));

      const [producePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("produce"), produceIdBuffer],
        programId
      );
      const [disputePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("dispute"), producePDA.toBuffer()],
        programId
      );

      await program.methods
        .raiseDispute(description)
        .accounts({
          produce: producePDA,
          raiser: anchorWallet.publicKey,
          dispute: disputePDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const timestamp = new Date().toLocaleString();
      setRaiseResult({ produceId: raiseProduceId, timestamp });
      toast.success("Dispute raised successfully!");
    } catch (err) {
      console.error("Error raising dispute:", err);
      toast.error("Failed to raise dispute. Ensure the Produce ID exists and try again.");
    } finally {
      setIsRaising(false);
    }
  };

  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anchorWallet) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!isArbitrator) {
      toast.error("Only Arbitrators can resolve disputes");
      return;
    }
    if (!resolveProduceId || resolution === null) {
      toast.error("Please enter Produce ID and select a resolution");
      return;
    }

    setIsResolving(true);
    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      setProvider(provider);
      const program = new Program(rawIdl as unknown as DecentralizedAgSupply, provider);

      const produceIdNum = parseInt(resolveProduceId.replace("PROD-", ""));
      if (isNaN(produceIdNum)) {
        throw new Error("Invalid Produce ID format. Use e.g., PROD-123");
      }
      const produceIdBuffer = Buffer.alloc(8);
      produceIdBuffer.writeBigUInt64LE(BigInt(produceIdNum));

      const [producePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("produce"), produceIdBuffer],
        programId
      );
      const [disputePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("dispute"), producePDA.toBuffer()],
        programId
      );
      const [arbitratorPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("participant"), anchorWallet.publicKey.toBuffer()],
        programId
      );

      await program.methods
        .resolveDispute(resolution)
        .accounts({
          dispute: disputePDA,
          produce: producePDA,
          arbitratorAccount: arbitratorPDA,
          arbitrator: anchorWallet.publicKey,
        })
        .rpc();

      const timestamp = new Date().toLocaleString();
      setResolveResult({ produceId: resolveProduceId, resolution, timestamp });
      toast.success(`Dispute resolved! Outcome: ${resolution ? "Original Terms Upheld" : "Dispute Upheld"}`);
    } catch (err) {
      console.error("Error resolving dispute:", err);
      toast.error("Failed to resolve dispute. Ensure the dispute exists and try again.");
    } finally {
      setIsResolving(false);
    }
  };

  if (isCheckingRole) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-green-50 to-blue-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-md">
          <p className="text-gray-700">Checking authorization...</p>
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
        <Link href="/" className="text-gray-600 hover:text-green-600 mb-6 flex items-center font-medium">
          <ChevronLeft className="mr-2" /> Back to Home
        </Link>

        <div className="flex flex-col lg:flex-row items-start gap-12">
          {/* Raise Dispute Section */}
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
                className="text-3xl font-bold text-gray-800 mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <span className="text-green-600">Raise</span> a Dispute
              </motion.h1>
              <motion.p
                className="text-lg text-gray-600 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                Open a dispute for a produce batch if there’s an issue.
              </motion.p>

              <form onSubmit={handleRaiseDispute} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <label htmlFor="raiseProduceId" className="block text-sm font-medium text-gray-700">
                    Produce ID
                  </label>
                  <input
                    id="raiseProduceId"
                    type="text"
                    value={raiseProduceId}
                    onChange={(e) => setRaiseProduceId(e.target.value)}
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500"
                    required
                    disabled={isRaising}
                    placeholder="e.g., PROD-123"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description (max 128 chars)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={128}
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500"
                    required
                    disabled={isRaising}
                    placeholder="Describe the issue"
                  />
                </motion.div>

                <motion.button
                  type="submit"
                  className={`w-full font-semibold py-3 px-6 rounded-lg transition shadow-lg flex items-center justify-center ${
                    isRaising ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                  disabled={isRaising}
                  whileHover={!isRaising ? { scale: 1.02 } : {}}
                  whileTap={!isRaising ? { scale: 0.98 } : {}}
                >
                  {isRaising ? "Raising..." : (
                    <>
                      <AlertTriangle className="mr-2" /> Raise Dispute
                    </>
                  )}
                </motion.button>
              </form>

              {raiseResult && (
                <motion.div
                  className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="text-lg font-semibold text-red-700 flex items-center">
                    <AlertTriangle className="w-6 h-6 mr-2" /> Dispute Raised
                  </h3>
                  <div className="space-y-2 text-gray-700 mt-2">
                    <p><strong>Produce ID:</strong> {raiseResult.produceId}</p>
                    <p><strong>Raised At:</strong> {raiseResult.timestamp}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          {/* Resolve Dispute Section */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: 50 }}
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
                className="text-3xl font-bold text-gray-800 mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <span className="text-green-600">Resolve</span> a Dispute
              </motion.h1>
              <motion.p
                className="text-lg text-gray-600 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                Arbitrators can resolve disputes. Choose "Yes" to uphold original terms, "No" to uphold the dispute.
              </motion.p>

              {!isArbitrator ? (
                <p className="text-red-600 text-center">Only Arbitrators can resolve disputes.</p>
              ) : (
                <form onSubmit={handleResolveDispute} className="space-y-5">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  >
                    <label htmlFor="resolveProduceId" className="block text-sm font-medium text-gray-700">
                      Produce ID
                    </label>
                    <input
                      id="resolveProduceId"
                      type="text"
                      value={resolveProduceId}
                      onChange={(e) => setResolveProduceId(e.target.value)}
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500"
                      required
                      disabled={isResolving}
                      placeholder="e.g., PROD-123"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                  >
                    <label className="block text-sm font-medium text-gray-700">Resolution</label>
                    <div className="mt-1 flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setResolution(true)}
                        className={`flex-1 py-2 px-4 rounded-lg ${
                          resolution === true
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                        disabled={isResolving}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setResolution(false)}
                        className={`flex-1 py-2 px-4 rounded-lg ${
                          resolution === false
                            ? "bg-red-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                        disabled={isResolving}
                      >
                        No
                      </button>
                    </div>
                  </motion.div>

                  <motion.button
                    type="submit"
                    className={`w-full font-semibold py-3 px-6 rounded-lg transition shadow-lg flex items-center justify-center ${
                      isResolving || resolution === null
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                    disabled={isResolving || resolution === null}
                    whileHover={!isResolving && resolution !== null ? { scale: 1.02 } : {}}
                    whileTap={!isResolving && resolution !== null ? { scale: 0.98 } : {}}
                  >
                    {isResolving ? "Resolving..." : (
                      <>
                        <Scale className="mr-2" /> Resolve Dispute
                      </>
                    )}
                  </motion.button>
                </form>
              )}

              {resolveResult && (
                <motion.div
                  className={`mt-6 p-4 rounded border-l-4 ${
                    resolveResult.resolution ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className={`text-lg font-semibold flex items-center ${
                    resolveResult.resolution ? "text-green-700" : "text-red-700"
                  }`}>
                    {resolveResult.resolution ? (
                      <CheckCircle className="w-6 h-6 mr-2" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 mr-2" />
                    )}
                    Dispute Resolved
                  </h3>
                  <div className="space-y-2 text-gray-700 mt-2">
                    <p><strong>Produce ID:</strong> {resolveResult.produceId}</p>
                    <p><strong>Resolution:</strong> {resolveResult.resolution ? "Original Terms Upheld" : "Dispute Upheld"}</p>
                    <p><strong>Resolved At:</strong> {resolveResult.timestamp}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default ManageDisputesPage;
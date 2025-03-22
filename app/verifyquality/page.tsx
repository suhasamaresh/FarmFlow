"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as rawIdl from "../../idl.json";
import type { DecentralizedAgSupply } from "../../types/decentralized_ag_supply";
import Link from "next/link";
import { ChevronLeft, CheckCircle, AlertTriangle, Scale } from "lucide-react";
import { AnchorProvider, BN, Program, setProvider } from "@coral-xyz/anchor";
import { toast } from "react-hot-toast";

const programId = new PublicKey(rawIdl.address);

const VerifyQualityPage = () => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [produceId, setProduceId] = useState("");
  const [qualityScore, setQualityScore] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [result, setResult] = useState<{ status: string; quality: number; timestamp: string } | null>(null);

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
      setIsAuthorized(role === "wholesaler" || role === "retailer");
    } catch (err) {
      console.error("Error checking role:", err);
      setIsAuthorized(false);
    } finally {
      setIsCheckingRole(false);
    }
  };

  const handleVerifyQuality = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anchorWallet) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!isAuthorized) {
      toast.error("Only Wholesalers or Retailers can verify quality");
      return;
    }
    if (!produceId || !qualityScore) {
      toast.error("Please enter both Produce ID and Quality Score");
      return;
    }
    const quality = parseInt(qualityScore);
    if (isNaN(quality) || quality < 0 || quality > 100) {
      toast.error("Quality Score must be between 0 and 100");
      return;
    }

    setIsSubmitting(true);
    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      setProvider(provider);
      const program = new Program(rawIdl as unknown as DecentralizedAgSupply, provider);

      const produceIdNum = parseInt(produceId);
      if (isNaN(produceIdNum)) {
        throw new Error("Invalid Produce ID");
      }
      const produceIdBN = new BN(produceIdNum);
      const [producePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("produce"), produceIdBN.toArrayLike(Buffer, "le", 8)],
        programId
      );
      const [verifierPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("participant"), anchorWallet.publicKey.toBuffer()],
        programId
      );

      await program.methods
        .verifyQuality(quality)
        .accounts({
          produce: producePDA,
          verifierAccount: verifierPDA,
          verifier: anchorWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const status = quality < 50 ? "Disputed" : "QualityVerified";
      const timestamp = new Date().toLocaleString();
      setResult({ status, quality, timestamp });
      toast.success(`Quality verified! Status: ${status}`);
    } catch (err) {
      console.error("Error verifying quality:", err);
      toast.error("Failed to verify quality. Check the Produce ID and try again.");
    } finally {
      setIsSubmitting(false);
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

  if (!isAuthorized) {
    return (
      <section className="bg-gradient-to-r from-green-50 to-blue-50 min-h-screen py-20 px-4">
        <motion.div
          className="max-w-7xl mx-auto text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="text-4xl font-bold text-gray-800 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Unauthorized Access
          </motion.h1>
          <motion.p
            className="text-lg text-gray-600 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Only Wholesalers or Retailers can access this page.
          </motion.p>
          <Link href="/">
            <motion.button
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg cursor-pointer transition shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Back to Home
            </motion.button>
          </Link>
        </motion.div>
      </section>
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
                <span className="text-green-600">FarmFlow:</span> Verify Quality
              </motion.h1>
              <motion.p
                className="text-lg text-gray-600 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                Submit a quality score (0-100) for the produce. Note: Scores below 50 will mark the produce as <strong>Disputed</strong> due to substandard quality.
              </motion.p>

              <form onSubmit={handleVerifyQuality} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <label htmlFor="produceId" className="block text-sm font-medium text-gray-700">
                    Produce ID
                  </label>
                  <input
                    id="produceId"
                    type="text"
                    value={produceId}
                    onChange={(e) => setProduceId(e.target.value)}
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500"
                    required
                    disabled={isSubmitting}
                    placeholder="e.g., PROD-123"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <label htmlFor="qualityScore" className="block text-sm font-medium text-gray-700">
                    Quality Score (0-100)
                  </label>
                  <input
                    id="qualityScore"
                    type="number"
                    value={qualityScore}
                    onChange={(e) => setQualityScore(e.target.value)}
                    min="0"
                    max="100"
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500"
                    required
                    disabled={isSubmitting}
                    placeholder="Enter score"
                  />
                </motion.div>

                <motion.button
                  type="submit"
                  className={`w-full font-semibold py-3 px-6 rounded-lg transition shadow-lg flex items-center justify-center ${
                    isSubmitting
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                  disabled={isSubmitting}
                  whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                >
                  {isSubmitting ? "Verifying..." : (
                    <>
                      <Scale className="mr-2" /> Verify Quality
                    </>
                  )}
                </motion.button>
              </form>

              {result && (
                <motion.div
                  className={`mt-6 p-4 rounded border-l-4 ${result.status === "Disputed" ? "bg-red-50 border-red-500" : "bg-green-50 border-green-500"}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className={`text-lg font-semibold flex items-center ${result.status === "Disputed" ? "text-red-700" : "text-green-700"}`}>
                    {result.status === "Disputed" ? <AlertTriangle className="w-6 h-6 mr-2" /> : <CheckCircle className="w-6 h-6 mr-2" />}
                    Status: {result.status}
                  </h3>
                  <div className="space-y-2 text-gray-700 mt-2">
                    <p><strong>Quality Score:</strong> {result.quality}</p>
                    <p><strong>Updated:</strong> {result.timestamp}</p>
                    {result.status === "Disputed" && (
                      <p className="text-red-600">Quality below 50 is considered substandard and disputed.</p>
                    )}
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
                    {result ? (
                      result.status === "Disputed" ? (
                        <AlertTriangle className="w-20 h-20 text-red-500" />
                      ) : (
                        <CheckCircle className="w-20 h-20 text-green-500" />
                      )
                    ) : (
                      <Scale className="w-20 h-20 text-gray-400" />
                    )}
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

export default VerifyQualityPage;
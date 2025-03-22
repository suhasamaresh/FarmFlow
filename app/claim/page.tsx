"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, DollarSign, CheckCircle } from "lucide-react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddress, createCloseAccountInstruction, TOKEN_PROGRAM_ID, getAccount } from "@solana/spl-token";
import { toast } from "react-hot-toast";

const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112"); // WSOL mint address

const ClaimFeesPage = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [wsolBalance, setWsolBalance] = useState<number | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<{ amount: number; timestamp: string } | null>(null);

  // Fetch WSOL balance from ATA
  const fetchWsolBalance = async () => {
    if (!wallet) {
      toast.error("Please connect your wallet");
      return;
    }
    try {
      const ata = await getAssociatedTokenAddress(WSOL_MINT, wallet.publicKey);
      const account = await getAccount(connection, ata);
      const balance = Number(account.amount) / 1e9; // Convert lamports to SOL
      setWsolBalance(balance);
    } catch (err) {
      console.error("Error fetching WSOL balance:", err);
      setWsolBalance(0); // No ATA or empty
    }
  };

  // Claim WSOL by closing ATA
  const handleClaimFees = async () => {
    if (!wallet) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!wsolBalance || wsolBalance <= 0) {
      toast.error("No WSOL fees to claim");
      return;
    }

    setIsClaiming(true);
    try {
      const ata = await getAssociatedTokenAddress(WSOL_MINT, wallet.publicKey);
      const tx = new Transaction().add(
        createCloseAccountInstruction(
          ata, // ATA to close
          wallet.publicKey, // Destination for SOL
          wallet.publicKey, // Authority
          [], // No additional signers
          TOKEN_PROGRAM_ID
        )
      );

      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet.publicKey;

      const signedTx = await wallet.signTransaction(tx);
      const txId = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(txId, "confirmed");

      const timestamp = new Date().toLocaleString();
      setClaimResult({ amount: wsolBalance, timestamp });
      setWsolBalance(0); // Reset after claiming
      toast.success(`Successfully claimed ${wsolBalance} SOL!`);
    } catch (err) {
      console.error("Error claiming fees:", err);
      toast.error("Failed to claim fees. Try again.");
    } finally {
      setIsClaiming(false);
    }
  };

  // Fetch balance on wallet connect
  React.useEffect(() => {
    if (wallet) fetchWsolBalance();
  }, [wallet]);

  return (
    <section className="bg-gradient-to-r from-green-50 to-blue-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <Link href="/" className="text-gray-600 hover:text-green-600 mb-6 flex items-center font-medium">
          <ChevronLeft className="w-5 h-5 mr-2" /> Back to Home
        </Link>

        <motion.div
          className="bg-white rounded-xl shadow-xl p-6 sm:p-8 border border-gray-100"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.h1
            className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <span className="text-green-600">Claim Your</span> Fees
          </motion.h1>
          <motion.p
            className="text-base sm:text-lg text-gray-600 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Farmers and transporters can claim their Wrapped SOL (WSOL) fees here. Connect your wallet to see your balance and convert WSOL to SOL.
          </motion.p>

          {!wallet ? (
            <p className="text-gray-600">Please connect your wallet to view and claim fees.</p>
          ) : (
            <div className="space-y-6">
              <motion.div
                className="bg-gray-50 p-4 rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <p className="text-lg font-medium text-gray-800">
                  Available WSOL Fees: <span className="text-green-600">{wsolBalance !== null ? `${wsolBalance} SOL` : "Loading..."}</span>
                </p>
              </motion.div>

              <motion.button
                onClick={handleClaimFees}
                className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-white shadow-lg transition ${
                  isClaiming || !wsolBalance || wsolBalance <= 0
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
                disabled={isClaiming || !wsolBalance || wsolBalance <= 0}
                whileHover={{ scale: isClaiming || !wsolBalance ? 1 : 1.05 }}
                whileTap={{ scale: isClaiming || !wsolBalance ? 1 : 0.95 }}
              >
                {isClaiming ? "Claiming..." : "Claim Fees"}
                <DollarSign className="inline ml-2 w-5 h-5" />
              </motion.button>

              {claimResult && (
                <motion.div
                  className="mt-6 bg-green-50 border-l-4 border-green-500 p-4 rounded"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="text-lg font-semibold text-green-700 flex items-center">
                    <CheckCircle className="w-6 h-6 mr-2" /> Fees Claimed
                  </h3>
                  <div className="space-y-2 text-gray-700 mt-2">
                    <p><strong>Amount:</strong> {claimResult.amount} SOL</p>
                    <p><strong>Claimed At:</strong> {claimResult.timestamp}</p>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default ClaimFeesPage;
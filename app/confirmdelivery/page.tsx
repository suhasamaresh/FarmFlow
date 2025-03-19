"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import * as rawIdl from "../../idl.json";
import type { DecentralizedAgSupply } from "../../types/decentralized_ag_supply";
import { Package, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const programId = new PublicKey(rawIdl.address);

const RetailerDashboard = () => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [produceId, setProduceId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<null | string>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [produceStatus, setProduceStatus] = useState<{
    exists: boolean;
    status?: string;
  } | null>(null);

  useEffect(() => {
    if (anchorWallet) {
      checkUserRole();
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

      if (participantAccount.role.retailer) {
        setUserRole("Retailer");
      } else {
        setUserRole("Other");
      }
    } catch (err) {
      console.error("Error checking user role:", err);
      setUserRole("Other");
    }
    setIsCheckingRole(false);
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

  const handleConfirmDelivery = async () => {
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
        throw new Error("Invalid Produce ID");
      }

      const produceIdBN = new BN(produceIdNum);
      const [producePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("produce"), produceIdBN.toArrayLike(Buffer, "le", 8)],
        programId
      );

      const [retailerPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("participant"), anchorWallet.publicKey.toBuffer()],
        programId
      );

      const [vaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault")],
        programId
      );

      // Note: These accounts would need to be properly initialized in your system
      // For this example, we're assuming they exist and using dummy Pubkeys
      const farmerPaymentAccount = new PublicKey("11111111111111111111111111111111"); // Replace with actual farmer account
      const transporterPaymentAccount = new PublicKey("22222222222222222222222222222222"); // Replace with actual transporter account

      await program.methods
        .confirmDelivery()
        .accounts({
          produce: producePDA,
          retailerAccount: retailerPDA,
          retailer: anchorWallet.publicKey,
          paymentVault: vaultPDA,
          farmerPaymentAccount,
          transporterPaymentAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setProduceId("");
      alert("Delivery confirmed successfully!");
    } catch (err) {
      console.error("Error confirming delivery:", err);
      alert(
        `Error confirming delivery: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
    setIsLoading(false);
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

  if (userRole !== "Retailer") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-md max-w-md">
          <div className="text-red-500 text-xl mb-4">Access Denied</div>
          <p className="text-gray-700 mb-6">
            Only retailers can access this page.
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
        className="max-w-4xl mx-auto"
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
          <span className="text-green-600">FarmFlow:</span> Retailer Dashboard
        </motion.h1>

        <motion.div
          className="bg-white rounded-xl shadow-xl p-8 border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Confirm Delivery
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
                placeholder="Enter Produce ID to confirm delivery"
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
                    {produceStatus.status === "inTransit" ? (
                      <motion.button
                        onClick={handleConfirmDelivery}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition shadow-lg flex items-center justify-center"
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isLoading ? (
                          "Processing..."
                        ) : (
                          <>
                            <CheckCircle className="mr-2" /> Confirm Delivery
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <p className="text-red-600">
                        Can only confirm delivery for produce in "InTransit" status
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
                Enter a Produce ID to verify its status. You can only confirm
                delivery for produce in "InTransit" status. Upon confirmation,
                payment processing will be triggered.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default RetailerDashboard;
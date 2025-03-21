"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import * as rawIdl from "../../idl.json";
import type { DecentralizedAgSupply } from "../../types/decentralized_ag_supply";
import { Package, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  createSyncNativeInstruction,
} from "@solana/spl-token";

const programId = new PublicKey(rawIdl.address);
const MINT_ADDRESS = new PublicKey("So11111111111111111111111111111111111111112"); // Wrapped SOL mint

const RetailerDashboard = () => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [produceId, setProduceId] = useState("");
  const [transporterPubkey, setTransporterPubkey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<null | string>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [produceStatus, setProduceStatus] = useState<{
    exists: boolean;
    status?: string;
    farmer?: PublicKey;
    farmerATA?: PublicKey;
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
      const program = new Program(rawIdl as unknown as DecentralizedAgSupply, provider);

      const [participantPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("participant"), anchorWallet.publicKey.toBuffer()],
        programId
      );

      const participantAccount = await (program.account as any).participant.fetch(participantPDA);

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
      const program = new Program(rawIdl as unknown as DecentralizedAgSupply, provider);

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
        const farmer = produceAccount.farmer;

        const farmerATA = await getAssociatedTokenAddress(MINT_ADDRESS, farmer);

        setProduceStatus({
          exists: true,
          status,
          farmer,
          farmerATA,
        });
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
    if (!anchorWallet || !produceId || !transporterPubkey || !produceStatus?.farmer || !produceStatus?.farmerATA) return;

    setIsLoading(true);
    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      const program = new Program(rawIdl as unknown as DecentralizedAgSupply, provider);

      const produceIdNum = parseInt(produceId);
      if (isNaN(produceIdNum)) {
        throw new Error("Invalid Produce ID");
      }

      let transporterPubkeyObj: PublicKey;
      try {
        transporterPubkeyObj = new PublicKey(transporterPubkey);
      } catch (err) {
        throw new Error("Invalid transporter public key");
      }
      const transporterPaymentAccount = await getAssociatedTokenAddress(MINT_ADDRESS, transporterPubkeyObj);
      const farmerPaymentAccount = produceStatus.farmerATA;

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

      const [paymentVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault_token")],
        programId
      );

      const retailerTokenAccount = await getAssociatedTokenAddress(MINT_ADDRESS, anchorWallet.publicKey);

      // Check SOL balance for fees and account creation
      const solBalance = await connection.getBalance(anchorWallet.publicKey);
      console.log("Retailer SOL Balance:", solBalance / LAMPORTS_PER_SOL, "SOL");
      const minSolRequired = 0.01 * LAMPORTS_PER_SOL; // ~0.01 SOL for fees + ATA rent
      if (solBalance < minSolRequired) {
        throw new Error(
          `Insufficient SOL for fees and account creation. Required: ${minSolRequired / LAMPORTS_PER_SOL} SOL, Available: ${solBalance / LAMPORTS_PER_SOL} SOL`
        );
      }

      const transaction = new Transaction();

      // Check payment vault balance
      const paymentVaultInfo = await connection.getAccountInfo(paymentVaultPDA);
      if (!paymentVaultInfo) {
        throw new Error("Payment vault not initialized.");
      }
      const vaultBalance = await getAccount(connection, paymentVaultPDA);
      console.log("Payment Vault WSOL Balance Before:", Number(vaultBalance.amount) / LAMPORTS_PER_SOL, "WSOL");

      // Fetch produce data and calculate required amount
      const produceAccount = await (program.account as any).produce.fetch(producePDA);
      const requiredAmount = Number(produceAccount.farmerPrice) + Number(produceAccount.transporterFee);
      console.log("Farmer Price:", Number(produceAccount.farmerPrice) / LAMPORTS_PER_SOL, "WSOL");
      console.log("Transporter Fee:", Number(produceAccount.transporterFee) / LAMPORTS_PER_SOL, "WSOL");
      console.log("Required Amount for Delivery:", requiredAmount / LAMPORTS_PER_SOL, "WSOL");

      // Fund vault if necessary
      if (Number(vaultBalance.amount) < requiredAmount) {
        console.log("Vault balance insufficient, funding required.");
        let retailerTokenAccountInfo = await connection.getAccountInfo(retailerTokenAccount);
        if (!retailerTokenAccountInfo) {
          const createRetailerATAIx = createAssociatedTokenAccountInstruction(
            anchorWallet.publicKey,
            retailerTokenAccount,
            anchorWallet.publicKey,
            MINT_ADDRESS
          );
          transaction.add(createRetailerATAIx);
          console.log("Added instruction to create retailer ATA.");
        }

        const retailerWsolBalance = retailerTokenAccountInfo
          ? Number((await getAccount(connection, retailerTokenAccount)).amount)
          : 0;
        console.log("Retailer WSOL Balance Before:", retailerWsolBalance / LAMPORTS_PER_SOL, "WSOL");

        if (retailerWsolBalance < requiredAmount) {
          const requiredSolForWsol = requiredAmount - retailerWsolBalance;
          const totalRequiredSol = requiredSolForWsol + minSolRequired; // WSOL + fees
          if (solBalance < totalRequiredSol) {
            throw new Error(
              `Insufficient SOL for WSOL conversion and fees. Required: ${totalRequiredSol / LAMPORTS_PER_SOL} SOL, Available: ${solBalance / LAMPORTS_PER_SOL} SOL`
            );
          }

          // Wrap SOL into WSOL
          transaction.add(
            SystemProgram.transfer({
              fromPubkey: anchorWallet.publicKey,
              toPubkey: retailerTokenAccount,
              lamports: requiredSolForWsol,
            }),
            createSyncNativeInstruction(retailerTokenAccount)
          );
          console.log("Added SOL-to-WSOL conversion instructions for", requiredSolForWsol / LAMPORTS_PER_SOL, "SOL");
        }

        // Fund the vault
        const fundVaultIx = await program.methods
          .fundVault(new BN(requiredAmount))
          .accounts({
            produce: producePDA,
            retailer: anchorWallet.publicKey,
            retailerTokenAccount: retailerTokenAccount,
            paymentVault: paymentVaultPDA,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .instruction();
        transaction.add(fundVaultIx);
        console.log("Added fundVault instruction with amount:", requiredAmount / LAMPORTS_PER_SOL, "WSOL");
      } else {
        console.log("Vault balance sufficient, skipping funding.");
      }

      // Create farmer and transporter ATAs if needed
      const farmerATAInfo = await connection.getAccountInfo(farmerPaymentAccount);
      if (!farmerATAInfo) {
        const createFarmerATAIx = createAssociatedTokenAccountInstruction(
          anchorWallet.publicKey,
          farmerPaymentAccount,
          produceStatus.farmer,
          MINT_ADDRESS
        );
        transaction.add(createFarmerATAIx);
        console.log("Added instruction to create farmer ATA.");
      }

      const transporterATAInfo = await connection.getAccountInfo(transporterPaymentAccount);
      if (!transporterATAInfo) {
        const createTransporterATAIx = createAssociatedTokenAccountInstruction(
          anchorWallet.publicKey,
          transporterPaymentAccount,
          transporterPubkeyObj,
          MINT_ADDRESS
        );
        transaction.add(createTransporterATAIx);
        console.log("Added instruction to create transporter ATA.");
      }

      // Add confirmDelivery instruction
      const confirmDeliveryIx = await program.methods
        .confirmDelivery()
        .accounts({
          produce: producePDA,
          retailerAccount: retailerPDA,
          retailer: anchorWallet.publicKey,
          vault: vaultPDA,
          paymentVault: paymentVaultPDA,
          farmerPaymentAccount,
          transporterPaymentAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();

      transaction.add(confirmDeliveryIx);
      console.log("Added ConfirmDelivery instruction.");

      // Estimate transaction fee
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = anchorWallet.publicKey;
      const feeEstimate = await connection.getFeeForMessage(transaction.compileMessage());
      if (feeEstimate.value !== null) {
        console.log("Estimated Transaction Fee:", feeEstimate.value / LAMPORTS_PER_SOL, "SOL");
      } else {
        console.warn("Unable to estimate transaction fee as 'feeEstimate.value' is null.");
      }

      console.log("Total Instructions in Transaction:", transaction.instructions.length);
      const signedTx = await anchorWallet.signTransaction(transaction);
      const txId = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false, // Ensure simulation runs
      });

      console.log("Transaction ID:", txId);
      const confirmation = await connection.confirmTransaction({
        signature: txId,
        blockhash,
        lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        throw new Error("Transaction confirmation failed");
      }

      // Log final vault balance
      const updatedVaultBalance = await getAccount(connection, paymentVaultPDA);
      console.log("Payment Vault WSOL Balance After:", Number(updatedVaultBalance.amount) / LAMPORTS_PER_SOL, "WSOL");

      setProduceId("");
      setTransporterPubkey("");
      alert("Delivery confirmed successfully! Transaction ID: " + txId);
    } catch (err: any) {
      console.error("Error confirming delivery:", err);
      let errorMessage = err.message || String(err);
      if (err.logs) {
        console.error("Transaction logs:", err.logs);
        errorMessage += "\nLogs: " + err.logs.join("\n");
      }
      alert(`Error confirming delivery: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Rest of the component (UI rendering) remains unchanged
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
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Produce ID
                </label>
                <input
                  type="text"
                  value={produceId}
                  onChange={(e) => setProduceId(e.target.value)}
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500"
                  placeholder="Enter Produce ID"
                  disabled={isLoading}
                />
              </div>

              {produceStatus?.exists && produceStatus.farmerATA && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Farmer Payment Account (Auto-detected ATA)
                  </label>
                  <input
                    type="text"
                    value={produceStatus.farmerATA.toString()}
                    className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-gray-700"
                    disabled
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Transporter Public Key
                </label>
                <input
                  type="text"
                  value={transporterPubkey}
                  onChange={(e) => setTransporterPubkey(e.target.value)}
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500"
                  placeholder="Enter Transporter's Public Key"
                  disabled={isLoading}
                />
              </div>

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
                        disabled={isLoading || !transporterPubkey}
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
                Enter the Produce ID and transporter's public key. The farmer's and transporter's payment accounts (ATAs) will be automatically created if needed. Upon confirmation, delivery is marked and payments are processed automatically on-chain.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default RetailerDashboard;
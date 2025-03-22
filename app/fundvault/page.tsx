"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  Fingerprint,
  Lock,
  Info,
  Wallet,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Program, AnchorProvider, BN, IdlAccounts } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import * as rawIdl from "../../idl.json";
import type { DecentralizedAgSupply } from "../../types/decentralized_ag_supply";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAccount,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  createSyncNativeInstruction,
  NATIVE_MINT,
} from "@solana/spl-token";

const programId = new PublicKey(rawIdl.address);
const WSOL_MINT = NATIVE_MINT; // Wrapped SOL mint: So11111111111111111111111111111111111111112

type ParticipantAccount = IdlAccounts<DecentralizedAgSupply>["participant"];
type ProduceAccount = IdlAccounts<DecentralizedAgSupply>["produce"];

const FundVaultPage = () => {
  const { publicKey, wallet } = useWallet();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();

  const [formData, setFormData] = useState({
    produceId: "",
    amountToFund: 0, // In WSOL lamports
  });

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  const formVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const fieldVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!anchorWallet) {
        console.error("Please connect your wallet");
        return;
      }

      setIsLoading(true);
      const provider = new AnchorProvider(connection, anchorWallet, {});
      const program = new Program(
        rawIdl as unknown as DecentralizedAgSupply,
        provider
      );

      const [participantPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("participant"), anchorWallet.publicKey.toBuffer()],
        programId
      );

      try {
        const participantAccount = await (
          program.account as any
        ).participant.fetch(participantPDA);
        if (participantAccount.role.retailer !== undefined) {
          setUserRole("Retailer");
        } else {
          console.log("Not a retailer, participant data:", participantAccount);
          toast.error("You are not registered as a retailer.");
        }
      } catch (err) {
        console.error("Error fetching participant account:", err);
        toast.error("Failed to verify role. Are you registered?");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData().catch((err) => console.error("Error in fetchData:", err));
  }, [anchorWallet, connection]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const fetchProduceDetails = async () => {
    if (!anchorWallet || !formData.produceId) {
      toast.error("Please connect your wallet and enter a Produce ID");
      return;
    }

    setIsLoading(true);
    const provider = new AnchorProvider(connection, anchorWallet, {});
    const program = new Program(
      rawIdl as unknown as DecentralizedAgSupply,
      provider
    );

    try {
      const produceIdNumber = parseInt(formData.produceId);
      const [producePDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("produce"),
          new BN(produceIdNumber).toArrayLike(Buffer, "le", 8),
        ],
        programId
      );

      const produceAccount = (await (program.account as any).produce.fetch(
        producePDA
      )) as ProduceAccount;
      const totalAmount =
        Number(produceAccount.farmerPrice) +
        Number(produceAccount.transporterFee);
      setFormData((prev) => ({
        ...prev,
        amountToFund: totalAmount,
      }));
      console.log("Farmer Price:", Number(produceAccount.farmerPrice));
      console.log("Transporter Fee:", Number(produceAccount.transporterFee));
      console.log("Total Amount (lamports):", totalAmount);
      toast.success(`Required amount: ${totalAmount / LAMPORTS_PER_SOL} WSOL`);
    } catch (err) {
      console.error("Error fetching produce details:", err);
      toast.error("Failed to fetch produce details. Invalid Produce ID?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet || !publicKey || !anchorWallet) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (userRole !== "Retailer") {
      toast.error("Only retailers can fund the vault");
      return;
    }

    if (!formData.produceId) {
      toast.error("Please enter a Produce ID");
      return;
    }

    if (formData.amountToFund === 0) {
      toast.error("Please fetch the required amount first");
      return;
    }

    setIsSubmitting(true);

    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      const program = new Program(
        rawIdl as unknown as DecentralizedAgSupply,
        provider
      );

      const produceIdNumber = parseInt(formData.produceId);
      const [producePDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("produce"),
          new BN(produceIdNumber).toArrayLike(Buffer, "le", 8),
        ],
        programId
      );

      const [paymentVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault_token")],
        programId
      );

      const retailerTokenAccount = await getAssociatedTokenAddress(
        WSOL_MINT,
        anchorWallet.publicKey,
        false
      );

      console.log("Produce PDA:", producePDA.toBase58());
      console.log("Payment Vault PDA:", paymentVaultPDA.toBase58());
      console.log("Retailer Token Account:", retailerTokenAccount.toBase58());

      let transaction = new Transaction();

      // Check if payment vault is initialized
      const paymentVaultInfo = await connection.getAccountInfo(paymentVaultPDA);
      if (!paymentVaultInfo) {
        toast.error("Payment vault not initialized. Please contact support.");
        console.error("Payment vault account does not exist.");
        return;
      }
      const initialVaultBalance = await getAccount(connection, paymentVaultPDA);
      console.log(
        "Payment Vault WSOL Balance Before:",
        Number(initialVaultBalance.amount) / LAMPORTS_PER_SOL,
        "WSOL"
      );

      // Check retailer's token account
      const retailerTokenAccountInfo = await connection.getAccountInfo(
        retailerTokenAccount
      );
      if (!retailerTokenAccountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            anchorWallet.publicKey,
            retailerTokenAccount,
            anchorWallet.publicKey,
            WSOL_MINT
          )
        );
      }

      // Check WSOL balance
      let wsolBalance = 0;
      if (retailerTokenAccountInfo) {
        const tokenAccount = await getAccount(connection, retailerTokenAccount);
        wsolBalance = Number(tokenAccount.amount);
      }
      console.log("Retailer WSOL Balance Before:", wsolBalance / LAMPORTS_PER_SOL, "WSOL");

      // Wrap SOL if needed
      if (wsolBalance < formData.amountToFund) {
        const solBalance = await connection.getBalance(anchorWallet.publicKey);
        const requiredSol = formData.amountToFund + 1000000; // Extra for fees
        if (solBalance < requiredSol) {
          throw new Error(
            `Insufficient SOL. Required: ${requiredSol / LAMPORTS_PER_SOL} SOL, Available: ${solBalance / LAMPORTS_PER_SOL} SOL`
          );
        }

        transaction.add(
          SystemProgram.transfer({
            fromPubkey: anchorWallet.publicKey,
            toPubkey: retailerTokenAccount,
            lamports: formData.amountToFund,
          }),
          createSyncNativeInstruction(retailerTokenAccount)
        );
      }

      // Add fundVault instruction
      const fundVaultIx = await program.methods
        .fundVault(new BN(formData.amountToFund))
        .accounts({
          produce: producePDA,
          retailer: anchorWallet.publicKey,
          retailerTokenAccount: retailerTokenAccount,
          paymentVault: paymentVaultPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();

      transaction.add(fundVaultIx);

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = anchorWallet.publicKey;

      const signedTx = await anchorWallet.signTransaction(transaction);
      const txId = await connection.sendRawTransaction(signedTx.serialize());

      console.log("Transaction ID:", txId);
      await connection.confirmTransaction({
        signature: txId,
        blockhash,
        lastValidBlockHeight,
      });

      // Verify balances after funding
      const updatedRetailerAccount = await getAccount(connection, retailerTokenAccount);
      console.log(
        "Retailer WSOL Balance After:",
        Number(updatedRetailerAccount.amount) / LAMPORTS_PER_SOL,
        "WSOL"
      );

      const updatedVaultBalance = await getAccount(connection, paymentVaultPDA);
      console.log(
        "Payment Vault WSOL Balance After:",
        Number(updatedVaultBalance.amount) / LAMPORTS_PER_SOL,
        "WSOL"
      );

      toast.success("Vault funded successfully with WSOL!");
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (error) {
      console.error("Error funding vault:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to fund vault. Check console for details."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !userRole) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-green-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading...</p>
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
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard?source=button">
            <button className="flex items-center text-green-700 hover:text-green-800 transition-colors">
              <ArrowLeft size={18} className="mr-2" />
              Back to Dashboard
            </button>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-6">
          <div className="flex items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Fund Vault</h1>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <div className="flex">
              <Info
                size={20}
                className="text-blue-500 mr-2 flex-shrink-0 mt-1"
              />
              <div>
                <p className="text-blue-800 font-medium">
                  Secure Payment Funding
                </p>
                <p className="text-sm text-blue-700">
                  Enter a Produce ID to fund the vault with Wrapped SOL (WSOL).
                  Your SOL will be automatically wrapped if needed.
                </p>
              </div>
            </div>
          </div>

          <motion.form
            variants={formVariants}
            initial="hidden"
            animate="visible"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <motion.div variants={fieldVariants}>
              <label className="block text-gray-700 font-medium mb-2">
                <Fingerprint size={16} className="inline mr-2" />
                Produce ID
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  name="produceId"
                  value={formData.produceId}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter Produce ID"
                  required
                />
                <button
                  type="button"
                  onClick={fetchProduceDetails}
                  disabled={isLoading || !formData.produceId}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center transition-colors ${
                    isLoading || !formData.produceId
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin h-4 w-5" />
                  ) : (
                    "Fetch Amount"
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter the Produce ID to retrieve funding requirements in WSOL
              </p>
            </motion.div>

            <motion.div variants={fieldVariants}>
              <label className="block text-gray-700 font-medium mb-2">
                <Wallet size={16} className="inline mr-2" />
                Amount to Fund (WSOL)
              </label>
              <input
                type="number"
                value={formData.amountToFund / LAMPORTS_PER_SOL}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                placeholder="Fetch amount using Produce ID"
              />
              <p className="text-xs text-gray-500 mt-1">
                Total amount required: Farmer Price + Transporter Fee (in WSOL)
              </p>
            </motion.div>

            <motion.div variants={fieldVariants}>
              <button
                type="submit"
                disabled={isSubmitting || formData.amountToFund === 0}
                className={`w-full p-3 rounded-lg flex items-center justify-center transition-colors ${
                  isSubmitting || formData.amountToFund === 0
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Processing Transaction...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-5 w-5" />
                    Fund Vault with WSOL
                  </>
                )}
              </button>
            </motion.div>

            <motion.div variants={fieldVariants}>
              <p className="text-xs text-gray-500 italic">
                Note: Your SOL will be automatically wrapped to WSOL if needed.
                Ensure you have enough SOL.
              </p>
            </motion.div>
          </motion.form>
        </div>
      </div>
    </motion.div>
  );
};

export default FundVaultPage;
"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as rawIdl from "../../idl.json";
import type { DecentralizedAgSupply } from "../../types/decentralized_ag_supply";
import Link from "next/link";
import { ChevronLeft, Shield, Leaf, Truck, Store, ShoppingBag, Scale, Mail, Check } from "lucide-react";
import { AnchorProvider, Program, setProvider } from "@coral-xyz/anchor";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { toast } from "react-hot-toast";

const programId = new PublicKey(rawIdl.address);
const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

const Register = () => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const router = useRouter();

  const [role, setRole] = useState("Farmer");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredRole, setRegisteredRole] = useState<string | null>(null);
  const [ataAddress, setAtaAddress] = useState<string | null>(null);

  // OTP states
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [userOtp, setUserOtp] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const getRoleIcon = () => {
    switch (role) {
      case "Farmer": return <Leaf className="w-6 h-6 text-green-500" />;
      case "Transporter": return <Truck className="w-6 h-6 text-blue-500" />;
      case "Wholesaler": return <Store className="w-6 h-6 text-yellow-500" />;
      case "Retailer": return <ShoppingBag className="w-6 h-6 text-purple-500" />;
      case "Arbitrator": return <Scale className="w-6 h-6 text-red-500" />;
      default: return <Leaf className="w-6 h-6 text-green-500" />;
    }
  };

  useEffect(() => {
    if (anchorWallet) {
      checkRegistrationStatus();
    }
  }, [anchorWallet]);

  useEffect(() => {
    if (!isRegistered && (role === "Farmer" || role === "Transporter") && anchorWallet) {
      fetchAtaAddress();
    } else {
      setAtaAddress(null);
    }
  }, [role, isRegistered, anchorWallet]);

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(contact));
  }, [contact]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpExpiry) {
      timer = setInterval(() => {
        const now = new Date();
        const diff = otpExpiry.getTime() - now.getTime();
        if (diff <= 0) {
          setRemainingTime(0);
          setCanResend(true);
          setOtpValue(""); // Clear OTP after expiry
          clearInterval(timer);
        } else {
          setRemainingTime(Math.floor(diff / 1000));
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [otpExpiry]);

  const checkRegistrationStatus = async () => {
    if (!anchorWallet) return;

    setIsChecking(true);
    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      setProvider(provider);
      const program = new Program(rawIdl as unknown as DecentralizedAgSupply, provider);

      const [participantPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("participant"), anchorWallet.publicKey.toBuffer()],
        programId
      );

      const participantAccount = await (program.account as any).participant.fetchNullable(participantPDA);
      if (participantAccount) {
        setIsRegistered(true);
        const roleKey = Object.keys(participantAccount.role)[0];
        setRegisteredRole(roleKey.charAt(0).toUpperCase() + roleKey.slice(1));
      } else {
        setIsRegistered(false);
        setRegisteredRole(null);
      }
    } catch (err) {
      console.error("Error checking registration:", err);
      setIsRegistered(false);
      setRegisteredRole(null);
    } finally {
      setIsChecking(false);
    }
  };

  const fetchAtaAddress = async () => {
    if (!anchorWallet) return;

    try {
      const ata = await getAssociatedTokenAddress(WSOL_MINT, anchorWallet.publicKey);
      setAtaAddress(ata.toBase58());
    } catch (err) {
      console.error("Error fetching ATA:", err);
      setAtaAddress(null);
    }
  };

  const sendOtp = async () => {
    if (!isEmailValid) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setOtpValue(generatedOtp);

      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: contact, otp: generatedOtp }),
      });

      if (!response.ok) {
        throw new Error("Failed to send OTP");
      }

      toast.success("OTP sent to your email");
      setIsOtpSent(true);
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 5);
      setOtpExpiry(expiry);
      setCanResend(false);
    } catch (err) {
      console.error("Error sending OTP:", err);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = () => {
    if (!otpValue) {
      toast.error("OTP has expired. Please request a new one.");
      setIsOtpSent(false);
      setUserOtp("");
      return;
    }

    if (userOtp === otpValue) {
      setIsOtpVerified(true);
      toast.success("Email verified successfully!");
    } else {
      toast.error("Invalid OTP. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!anchorWallet) {
      toast.error("Please connect your wallet");
      return;
    }

    if (isRegistered) {
      toast.error("This wallet is already registered!");
      return;
    }

    if (!isOtpVerified) {
      toast.error("Please verify your email first");
      return;
    }

    setIsSubmitting(true);

    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      setProvider(provider);

      const program = new Program(rawIdl as unknown as DecentralizedAgSupply, provider);

      const [participantPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("participant"), anchorWallet.publicKey.toBuffer()],
        programId
      );

      let roleEnum;
      switch (role) {
        case "Farmer": roleEnum = { farmer: {} }; break;
        case "Transporter": roleEnum = { transporter: {} }; break;
        case "Wholesaler": roleEnum = { wholesaler: {} }; break;
        case "Retailer": roleEnum = { retailer: {} }; break;
        case "Arbitrator": roleEnum = { arbitrator: {} }; break;
        default: roleEnum = { farmer: {} };
      }

      await program.methods
        .registerParticipant(roleEnum, name, contact)
        .accounts({
          participant: participantPDA,
          user: anchorWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success("Registration successful!");
      router.push("/dashboard");
    } catch (err) {
      console.error("Error registering:", err);
      if (err instanceof Error) {
        toast.error("Registration failed: " + err.message);
      } else {
        toast.error("Registration failed: " + String(err));
      }
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-green-50 to-blue-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-md">
          <p className="text-gray-700">Checking registration status...</p>
        </div>
      </div>
    );
  }

  if (isRegistered) {
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
            Wallet Already Registered
          </motion.h1>
          <motion.p
            className="text-lg text-gray-600 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            This wallet is already registered as a <span className="font-semibold text-green-600">{registeredRole}</span>.
          </motion.p>
          <Link href="/dashboard?source=button">
            <motion.button
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg cursor-pointer transition shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Go to Dashboard
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
                <span className="text-green-600">FarmFlow:</span> Join Our Network
              </motion.h1>
              <motion.p
                className="text-lg text-gray-600 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                Become part of our blockchain-powered agricultural ecosystem.
              </motion.p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500"
                    disabled={isSubmitting || isOtpSent}
                  >
                    <option value="Farmer">Farmer</option>
                    <option value="Transporter">Transporter</option>
                    <option value="Wholesaler">Wholesaler</option>
                    <option value="Retailer">Retailer</option>
                    <option value="Arbitrator">Arbitrator</option>
                  </select>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500"
                    required
                    disabled={isSubmitting || isOtpSent}
                    placeholder="Enter your name"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="flex items-center mt-1 space-x-2">
                    <input
                      id="contact"
                      type="email"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className={`flex-1 bg-white border ${
                        isEmailValid ? "border-green-300" : "border-gray-300"
                      } rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500`}
                      required
                      disabled={isSubmitting || isOtpSent || isOtpVerified}
                      placeholder="Your email address"
                    />
                    {isOtpVerified ? (
                      <div className="flex items-center bg-green-100 text-green-700 px-3 py-2 rounded-lg">
                        <Check className="w-5 h-5 mr-1" /> Verified
                      </div>
                    ) : isOtpSent ? (
                      <button
                        type="button"
                        onClick={sendOtp}
                        disabled={!canResend || isSubmitting}
                        className={`whitespace-nowrap px-4 py-3 rounded-lg text-sm font-medium ${
                          canResend
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {canResend ? "Resend OTP" : `Resend in ${remainingTime}s`}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={sendOtp}
                        disabled={!isEmailValid || isSubmitting}
                        className={`whitespace-nowrap px-4 py-3 rounded-lg text-sm font-medium ${
                          isEmailValid
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        <Mail className="w-4 h-4 inline mr-1" /> Send OTP
                      </button>
                    )}
                  </div>
                  {!isEmailValid && contact && (
                    <p className="mt-1 text-red-500 text-sm">Please enter a valid email address</p>
                  )}
                </motion.div>

                {isOtpSent && !isOtpVerified && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                      Enter OTP
                    </label>
                    <div className="flex items-center mt-1 space-x-2">
                      <input
                        id="otp"
                        type="text"
                        value={userOtp}
                        onChange={(e) => setUserOtp(e.target.value)}
                        maxLength={6}
                        className="flex-1 bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500"
                        required
                        disabled={isSubmitting}
                        placeholder="6-digit OTP"
                      />
                      <button
                        type="button"
                        onClick={verifyOtp}
                        disabled={userOtp.length !== 6 || isSubmitting}
                        className={`whitespace-nowrap px-4 py-3 rounded-lg text-sm font-medium ${
                          userOtp.length === 6
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        Verify OTP
                      </button>
                    </div>
                    <p className="mt-1 text-gray-500 text-sm">
                      OTP valid for {Math.floor(remainingTime / 60)}:
                      {(remainingTime % 60).toString().padStart(2, "0")}
                    </p>
                  </motion.div>
                )}

                {(role === "Farmer" || role === "Transporter") && ataAddress && (
                  <motion.div
                    className="bg-green-50 border-l-4 border-green-500 p-4 rounded"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                  >
                    <p className="text-green-700 font-semibold">Your Payment Account (ATA):</p>
                    <p className="text-green-600 text-sm break-all">{ataAddress}</p>
                    <p className="text-green-700 mt-2">
                      <strong>Instructions:</strong> After registration, your payments will be sent as Wrapped SOL (WSOL) to this account. 
                      Use a Solana wallet like Phantom to view your WSOL balance. To convert WSOL to SOL:
                      1. Open Phantom,
                      2. Find "Wrapped SOL" in your token list,
                      3. Select "Unwrap" or "Close Account" to receive SOL and refund the account rent.
                    </p>
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  className={`w-full font-semibold py-3 px-6 rounded-lg transition shadow-lg flex items-center justify-center ${
                    isOtpVerified
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  disabled={isSubmitting || !isOtpVerified}
                  whileHover={isOtpVerified ? { scale: 1.02 } : {}}
                  whileTap={isOtpVerified ? { scale: 0.98 } : {}}
                >
                  {isSubmitting ? "Processing..." : (
                    <>
                      <Shield className="mr-2" /> Join FarmFlow Network
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>

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
                  <motion.div className="w-20 h-20">{getRoleIcon()}</motion.div>
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

export default Register;
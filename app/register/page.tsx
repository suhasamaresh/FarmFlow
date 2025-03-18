"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as rawIdl from "../../idl.json";
import type { DecentralizedAgSupply } from "../../types/decentralized_ag_supply";
import Link from "next/link";
import { ChevronLeft, Shield, Leaf, Truck, Store, ShoppingBag, Scale } from "lucide-react";
import { AnchorProvider, Program, setProvider } from "@coral-xyz/anchor";

const programId = new PublicKey(rawIdl.address);

const Register = () => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const router = useRouter();

  const [role, setRole] = useState("Farmer");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anchorWallet) {
      console.error("Please connect your wallet");
      return;
    }

    setIsSubmitting(true);

    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      setProvider(provider);

      const program = new Program(
        rawIdl as unknown as DecentralizedAgSupply,
        provider
      );
      console.log(program);

      const [participantPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("participant"), anchorWallet.publicKey.toBuffer()],
        programId
      );

      console.log(participantPDA)
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

      router.push("/dashboard");
    } catch (err) {
      console.log("Error", err);
      setIsSubmitting(false);
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
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500"
                    disabled={isSubmitting}
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
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500"
                    required
                    disabled={isSubmitting}
                    placeholder="Enter your name"
                  />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <label htmlFor="contact" className="block text-sm font-medium text-gray-700">Contact</label>
                  <input
                    id="contact"
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500"
                    required
                    disabled={isSubmitting}
                    placeholder="Email or phone number"
                  />
                </motion.div>
                
                <motion.button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition shadow-lg flex items-center justify-center"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? "Processing..." : (
                    <><Shield className="mr-2" /> Join FarmFlow Network</>
                  )}
                </motion.button>
              </form>
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
              transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: 3
              }}
            >
              <div className="h-96 bg-gradient-to-br from-green-100 to-blue-100 p-6 relative">
                {/* Central role icon */}
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
                    {getRoleIcon()}
                  </motion.div>
                </motion.div>
                
                {/* Blockchain verified badge */}
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
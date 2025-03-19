"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import * as rawIdl from "../../idl.json";
import type { DecentralizedAgSupply } from "../../types/decentralized_ag_supply";
import { CheckCircle, Search, Clock, Truck, Droplet, Thermometer } from "lucide-react";
import Link from "next/link";

const programId = new PublicKey(rawIdl.address);

const FarmerPickupConfirmation = () => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<null | string>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  interface ProduceItem {
    produceId: string;
    produceType: string;
    quantity: number;
    status: string;
    transportTemp: number;
    transportHumidity: number;
    timestamp: number;
    pickupConfirmed: boolean;
  }

  const [produceItems, setProduceItems] = useState<ProduceItem[]>([]);

  useEffect(() => {
    if (anchorWallet) {
      checkUserRole();
      fetchProduceItems();
    }
  }, [anchorWallet]);

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

      if (participantAccount.role.farmer) {
        setUserRole("Farmer");
      } else {
        setUserRole("Other");
      }
    } catch (err) {
      console.error("Error checking user role:", err);
      setUserRole("Other");
    }
    setIsCheckingRole(false);
  };

  const fetchProduceItems = async () => {
    try {
      if (!anchorWallet) {
        console.error("Please connect your wallet");
        return;
      }

      const provider = new AnchorProvider(connection, anchorWallet, {});
      const program = new Program(rawIdl as unknown as DecentralizedAgSupply, provider);

      console.log("Program ID:", programId.toBase58());

      // Fetch all Produce accounts
    const produceAccounts = await (program.account as any).produce.all();

    console.log("Produce accounts:", produceAccounts);

    if (produceAccounts.length > 0) {
      console.log("First account structure:", JSON.stringify(produceAccounts[0], null, 2));
    }

    const items = produceAccounts
      .filter(
        (account: {
        account: {
          status: { toString?: any };
          farmer: string;
        };
        publicKey: { toString: () => any };
        }) => {
        // Check if status exists and equals "PickedUp"
        const hasCorrectStatus =
          account.account.status &&
          (typeof account.account.status === "object"
            ? Object.keys(account.account.status)[0] === "pickedUp"
            : String(account.account.status) === "PickedUp");

        // Check if the farmer corresponds to the connected wallet
        const isFarmerMatch = account.account.farmer.toString() === anchorWallet.publicKey.toString();
        console.log("Man this is the thing in contract", account.account.farmer.toString());
        console.log("Man this is the connected wallet lol", anchorWallet.publicKey.toString());

        console.log(
          `Account ${account.publicKey.toString()}: Status match: ${hasCorrectStatus}, Farmer match: ${isFarmerMatch}`
        );

        return hasCorrectStatus && isFarmerMatch;
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
      // Sort by timestamp, most recent first
      items.sort((a: ProduceItem, b: ProduceItem) => b.timestamp - a.timestamp);

      console.log("Filtered produce items:", items);
      setProduceItems(items);
    } catch (err) {
      console.error("Error fetching produce items:", err);
    }
  };

  const handleConfirmPickup = async (produceId: string) => {
    if (!anchorWallet) return;

    setIsLoading(true);
    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
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
      console.log("Produce PDA: ", producePDA.toString());

      const [farmerPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("participant"), anchorWallet.publicKey.toBuffer()],
        programId
      );

      await program.methods
        .confirmPickup()
        .accounts({
          produce: producePDA,
          farmerAccount: farmerPDA,
          farmer: anchorWallet.publicKey,
        })
        .rpc();

      // Refresh after a small delay for blockchain confirmation
      setTimeout(() => {
        fetchProduceItems();
      }, 2000);

      alert("Pickup confirmed successfully!");
    } catch (err) {
      console.error("Error confirming pickup:", err);
      alert(`Error confirming pickup: ${err instanceof Error ? err.message : String(err)}`);
    }
    setIsLoading(false);
  };

  // Filter items based on search query
  const filteredItems = produceItems.filter((item) =>
    item.produceId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get items to display based on showAll toggle
  const displayedItems = showAll ? filteredItems : filteredItems.slice(0, 3);

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

  if (userRole !== "Farmer") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-md max-w-md">
          <div className="text-red-500 text-xl mb-4">Access Denied</div>
          <p className="text-gray-700 mb-6">
            Only farmers can access this page.
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
          <span className="text-green-600">FarmFlow:</span> Pickup Confirmation
        </motion.h1>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Information Panel */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100 h-full">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Confirm Pickups
              </h2>
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-4">
                <p className="text-green-700 text-sm">
                  Review the produce items listed on the right that have been picked up by transporters. Confirm the pickup to update the status on the blockchain.
                </p>
              </div>
              <p className="text-gray-600">
                Once confirmed, the `pickup_confirmed` flag will be set to true, ensuring transparency in the supply chain.
              </p>
            </div>
          </motion.div>

          {/* Produce Items Panel */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100 h-full">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Produce Awaiting Confirmation
              </h2>

              {/* Note */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4">
                <p className="text-blue-700 text-sm">
                  This panel shows your produce with status "PickedUp". Confirm the pickup to acknowledge the transporter’s action.
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
                {filteredItems.length === 0 ? (
                  <p className="text-gray-600">
                    No produce items awaiting confirmation
                  </p>
                ) : (
                  displayedItems.map((item) => (
                    <motion.div
                      key={item.produceId}
                      className="border border-gray-200 p-4 rounded-lg shadow-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">
                            Produce ID: {item.produceId}
                          </p>
                          <p className="text-sm text-gray-600">
                            Type: {item.produceType}
                          </p>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity} kg
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Thermometer className="w-4 h-4 mr-1 text-green-500" />
                            Temp: {item.transportTemp}°C
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Droplet className="w-4 h-4 mr-1 text-green-500" />
                            Humidity: {item.transportHumidity}%
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Clock className="w-4 h-4 mr-1 text-green-500" />
                            {formatTimestamp(item.timestamp)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Status: {item.status}
                          </p>
                        </div>
                        {!item.pickupConfirmed && (
                          <motion.button
                            onClick={() => handleConfirmPickup(item.produceId)}
                            className="bg-green-600 hover:bg-green-700 text-white cursor-pointer px-4 py-2 rounded-lg shadow-lg flex items-center"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={isLoading}
                          >
                            <CheckCircle className="mr-2" /> Confirm Pickup
                          </motion.button>
                        )}
                        {item.pickupConfirmed && (
                          <p className="text-green-600 text-sm flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" /> Confirmed
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Show More/Less Button */}
              {filteredItems.length > 3 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="mt-4 text-green-600 hover:underline font-medium"
                >
                  {showAll ? "Show Less" : `Show All (${filteredItems.length})`}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default FarmerPickupConfirmation;
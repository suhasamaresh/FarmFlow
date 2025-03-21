"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Tag,
  Scale,
  QrCode,
  CheckCircle,
  Info,
  Lock,
  Fingerprint,
  Thermometer,
  MapPin,
  Image,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Program, AnchorProvider, BN, IdlAccounts } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import * as rawIdl from "../../idl.json";
import type { DecentralizedAgSupply } from "../../types/decentralized_ag_supply";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAccount } from "@solana/spl-token";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: "hackprojec-77a77.firebaseapp.com",
  projectId: "hackprojec-77a77",
  storageBucket: "hackprojec-77a77.appspot.com",
  messagingSenderId: "452533063595",
  appId: "1:452533063595:web:93ddcc0c36ca5c98c50cee",
  measurementId: "G-Q8FYL07XMQ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

type ParticipantAccount = IdlAccounts<DecentralizedAgSupply>["participant"];

const programId = new PublicKey(rawIdl.address);

const LogHarvest = () => {
  const { publicKey, wallet } = useWallet();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [generatedQrCodeUrl, setGeneratedQrCodeUrl] = useState("");
  const [showQrPreview, setShowQrPreview] = useState(false);
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();

  const [formData, setFormData] = useState({
    produceId: "",
    produceType: "",
    quantity: "",
    harvestDate: new Date().toISOString().split("T")[0],
    quality: 80,
    qrCodeUri: "",
    location: { lat: 0, lng: 0 },
    imageUrls: [] as string[],
    farmerPrice: "", // Added: Farmer's expected price
    transporterFee: "", // Added: Transporter's fee
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  const formVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const fieldVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  const generateUniqueProduceId = async () => {
    if (!anchorWallet) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    const provider = new AnchorProvider(connection, anchorWallet, {});
    const program = new Program(
      rawIdl as unknown as DecentralizedAgSupply,
      provider
    );
    const min = 1;
    const max = 2147483647; // Max 32-bit signed integer
    const maxAttempts = 100; // Prevent infinite loop

    try {
      for (let attempts = 0; attempts < maxAttempts; attempts++) {
        const randomId = Math.floor(Math.random() * (max - min + 1)) + min;
        const [producePDA] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("produce"),
            new BN(randomId).toArrayLike(Buffer, "le", 8),
          ],
          programId
        );
        console.log(randomId);
        const accountInfo = await connection.getAccountInfo(producePDA);
        if (!accountInfo) {
          // Unique ID found
          setFormData((prev) => ({
            ...prev,
            produceId: randomId.toString(),
          }));
          toast.success("Unique Produce ID generated successfully");
          return;
        }
      }
      toast.error(
        "Could not generate a unique ID after maximum attempts. Please try again."
      );
    } catch (err) {
      console.error("Error generating unique produce ID:", err);
      toast.error("Failed to generate unique ID. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
      console.log(program);

      const [participantPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("participant"), anchorWallet.publicKey.toBuffer()],
        programId
      );

      const accountInfo = await connection.getAccountInfo(participantPDA);
      if (accountInfo === null) {
        console.log("Participant PDA does not exist yet.");
        setIsLoading(false);
        return;
      }

      const [vaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault")],
        programId
      );
      const vaultAccount = await connection.getAccountInfo(vaultPDA);
      console.log("Token Mint:", vaultAccount);

      try {
        const participantAccount = await (
          program.account as any
        ).participant.fetch(participantPDA);
        if (participantAccount.role.farmer !== undefined) {
          setUserRole("Farmer");
        } else {
          console.log("Not a farmer, participant data:", participantAccount);
        }
      } catch (err) {
        console.error("Error fetching participant account:", err);
        toast.error("Failed to verify role. Please try again.");
      } finally {
        setIsLoading(false);
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setFormData((prev) => ({
              ...prev,
              location: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              },
            }));
          },
          (error) => {
            console.error("Error getting location:", error);
            toast.error(
              "Failed to get location. Please enable location services."
            );
          }
        );
      }
    };
    fetchData().catch((err) => console.error("Error in fetchData:", err));
  }, [anchorWallet, connection]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedImages(Array.from(e.target.files));
    }
  };

  const uploadImagesToFirebase = async (uniqueId: string) => {
    try {
      const urls: string[] = [];
      for (const image of selectedImages) {
        const timestamp = Date.now();
        const storageRef = ref(
          storage,
          `harvests/${uniqueId}/${timestamp}_${image.name}`
        );
        await uploadBytes(storageRef, image);
        const url = await getDownloadURL(storageRef);
        urls.push(url);
      }
      return urls;
    } catch (error) {
      console.error("Error uploading to Firebase Storage:", error);
      toast.error("Failed to upload images to Firebase");
      return [];
    }
  };

  const generateQRCode = async () => {
    if (!formData.produceId || !formData.produceType) {
      toast.error("Please generate a Produce ID and select Type first");
      return;
    }

    setIsLoading(true);
    try {
      const uniqueId = `${publicKey?.toString().slice(0, 8)}-${
        formData.produceId
      }-${Date.now()}`;
      const qrCodeUri = `https://decentralagri.app/trace/${uniqueId}`;

      const qrCodeApiUrl = `/api/placeholder/200/200?text=${encodeURIComponent(
        qrCodeUri
      )}`;
      setGeneratedQrCodeUrl(qrCodeApiUrl);
      setShowQrPreview(true);

      setFormData({
        ...formData,
        qrCodeUri: qrCodeUri,
      });

      toast.success("QR Code generated successfully");
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code");
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

    if (userRole !== "Farmer") {
      toast.error("Only farmers can log harvests");
      return;
    }

    if (!formData.produceId) {
      toast.error("Please generate a unique Produce ID first");
      return;
    }

    if (!formData.qrCodeUri) {
      toast.error("Please generate a QR code first");
      return;
    }

    if (!formData.farmerPrice || !formData.transporterFee) {
      toast.error("Please enter both farmer price and transporter fee");
      return;
    }

    setIsSubmitting(true);
    try {
      const uniqueId = `${publicKey?.toString().slice(0, 8)}-${
        formData.produceId
      }-${Date.now()}`;
      const imageUrls = await uploadImagesToFirebase(uniqueId);
      setFormData((prev) => ({ ...prev, imageUrls }));

      const provider = new AnchorProvider(connection, anchorWallet, {});
      const program = new Program(
        rawIdl as unknown as DecentralizedAgSupply,
        provider
      );
      console.log(program);

      const produceIdNumber = parseInt(formData.produceId);

      const [producePDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("produce"),
          new BN(produceIdNumber).toArrayLike(Buffer, "le", 8),
        ],
        programId
      );
      console.log("produce PDA:", producePDA);

      const [participantPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("participant"), anchorWallet.publicKey.toBuffer()],
        programId
      );

      await program.methods
        .logHarvest(
          new BN(produceIdNumber),
          formData.produceType,
          new BN(formData.quantity),
          new BN(new Date(formData.harvestDate).getTime() / 1000),
          new BN(formData.quality),
          formData.qrCodeUri,
          new BN(formData.farmerPrice), // Added: Farmer price
          new BN(formData.transporterFee) // Added: Transporter fee
        )
        .accounts({
          produce: producePDA,
          farmerAccount: participantPDA,
          farmer: anchorWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success("Harvest logged successfully on the blockchain!");
      toast.success(
        "QR code, location, and images are now linked to the on-chain record",
        { duration: 5000 }
      );

      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (error) {
      console.error("Error logging harvest:", error);
      toast.error("Failed to log harvest. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !formData.produceId) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-green-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading...</p>
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

  function removeImage(index: number) {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
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
          <Link href="/dashboard">
            <button className="flex items-center text-green-700 hover:text-green-800 transition-colors">
              <ArrowLeft size={18} className="mr-2" />
              Back to Dashboard
            </button>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-6">
          <div className="flex items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">
              Log New Harvest
            </h1>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <div className="flex">
              <Info
                size={20}
                className="text-blue-500 mr-2 flex-shrink-0 mt-1"
              />
              <div>
                <p className="text-blue-800 font-medium">
                  Blockchain Traceability
                </p>
                <p className="text-sm text-blue-700">
                  This form creates an immutable record of your harvest on the
                  blockchain. The QR code generated will link directly to this
                  record, allowing consumers and other stakeholders to verify
                  the authenticity and journey of your produce.
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
            <motion.div
              variants={fieldVariants}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  <Fingerprint size={16} className="inline mr-2" />
                  Produce ID
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={formData.produceId}
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                    placeholder="Click button to generate"
                  />
                  <button
                    type="button"
                    onClick={generateUniqueProduceId}
                    disabled={isLoading}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center transition-colors ${
                      isLoading
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin h-4 w-5" />
                    ) : (
                      "Generate Unique ID"
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically generated unique ID
                </p>
                <p className="text-xs text-green-600 mt-1 font-medium">
                  Note: Please note down this ID as it will be used by
                  transporters to record pickup and delivery. This is also used by retailers, wholesalers for confirming delivery and arbitrators in cause of any disputes.
                </p>
              </div>

              <div>
                <label
                  className="block text-gray-700 font-medium mb-2"
                  htmlFor="produceType"
                >
                  <Tag size={16} className="inline mr-2" />
                  Produce Type
                </label>
                <select
                  id="produceType"
                  name="produceType"
                  value={formData.produceType}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Select produce type</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Rice">Rice</option>
                  <option value="Corn">Corn</option>
                  <option value="Potato">Potato</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Lettuce">Lettuce</option>
                  <option value="Carrot">Carrot</option>
                  <option value="Apple">Apple</option>
                  <option value="Orange">Orange</option>
                </select>
              </div>
            </motion.div>

            <motion.div
              variants={fieldVariants}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label
                  className="block text-gray-700 font-medium mb-2"
                  htmlFor="quantity"
                >
                  <Scale size={16} className="inline mr-2" />
                  Quantity (kg)
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="Enter quantity in kg"
                  min="1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-gray-700 font-medium mb-2"
                  htmlFor="harvestDate"
                >
                  <Calendar size={16} className="inline mr-2" />
                  Harvest Date
                </label>
                <input
                  type="date"
                  id="harvestDate"
                  name="harvestDate"
                  value={formData.harvestDate}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
            </motion.div>

            {/* Added: Farmer Price and Transporter Fee Inputs */}
            <motion.div
              variants={fieldVariants}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label
                  className="block text-gray-700 font-medium mb-2"
                  htmlFor="farmerPrice"
                >
                  <Scale size={16} className="inline mr-2" />
                  Farmer Price (Tokens)
                </label>
                <input
                  type="number"
                  id="farmerPrice"
                  name="farmerPrice"
                  value={formData.farmerPrice}
                  onChange={handleInputChange}
                  placeholder="Enter price in tokens"
                  min="1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The expected payment for this harvest
                </p>
              </div>

              <div>
                <label
                  className="block text-gray-700 font-medium mb-2"
                  htmlFor="transporterFee"
                >
                  <Scale size={16} className="inline mr-2" />
                  Transporter Fee (Tokens)
                </label>
                <input
                  type="number"
                  id="transporterFee"
                  name="transporterFee"
                  value={formData.transporterFee}
                  onChange={handleInputChange}
                  placeholder="Enter fee in tokens"
                  min="1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The fee for transporting this harvest
                </p>
              </div>
            </motion.div>

            <motion.div variants={fieldVariants}>
              <label className="block text-gray-700 font-medium mb-2">
                <MapPin size={16} className="inline mr-2" />
                Harvest Location
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">
                  Latitude: {formData.location.lat.toFixed(6)}, Longitude:{" "}
                  {formData.location.lng.toFixed(6)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically captured from your device
                </p>
              </div>
            </motion.div>

            <motion.div variants={fieldVariants}>
              <label className="block text-gray-700 font-medium mb-2">
                <Image size={16} className="inline mr-2" />
                Harvest Images
              </label>

              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="rounded-full bg-gray-200 p-3 mb-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-500"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    Upload Photos
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Click or drag files here
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Upload images of your harvest (stored on Firebase). Make sure
                images are legit with timestamp and location. This can be used
                for verification of quality.
              </p>

              {selectedImages.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Uploaded Images
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Harvest preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div variants={fieldVariants}>
              <label
                className="block text-gray-700 font-medium mb-2"
                htmlFor="quality"
              >
                <Thermometer size={16} className="inline mr-2" />
                Initial Quality Assessment (0-100)
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  id="quality"
                  name="quality"
                  value={formData.quality}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="1"
                  className="w-full mr-4 focus:outline-none"
                />
                <span className="text-lg font-semibold text-gray-800 min-w-[40px]">
                  {formData.quality}
                </span>
              </div>
              <div className="grid grid-cols-3 text-xs text-gray-500 mt-1">
                <div>Poor</div>
                <div className="text-center">Average</div>
                <div className="text-right">Excellent</div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This initial quality score will be verified later in the supply
                chain
              </p>
            </motion.div>

            <motion.div variants={fieldVariants}>
              <label className="block text-gray-700 font-medium mb-2">
                <QrCode size={16} className="inline mr-2" />
                QR Code Generation
              </label>
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={generateQRCode}
                  disabled={
                    isLoading || !formData.produceId || !formData.produceType
                  }
                  className={`w-full p-3 rounded-lg flex items-center justify-center transition-colors ${
                    isLoading || !formData.produceId || !formData.produceType
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-5 w-5" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-5 w-5" />
                      Generate QR Code
                    </>
                  )}
                </button>

                {showQrPreview && generatedQrCodeUrl && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700 mb-2">
                      Generated QR Code Preview:
                    </p>
                    <img
                      src={generatedQrCodeUrl}
                      alt="Generated QR Code"
                      className="mx-auto w-40 h-40"
                    />
                    <p className="text-xs text-gray-600 mt-2 break-all">
                      {formData.qrCodeUri}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div variants={fieldVariants}>
              <button
                type="submit"
                disabled={
                  isSubmitting || !formData.produceId || !formData.qrCodeUri
                }
                className={`w-full p-3 rounded-lg flex items-center justify-center transition-colors ${
                  isSubmitting || !formData.produceId || !formData.qrCodeUri
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
                    Record Harvest on Blockchain
                  </>
                )}
              </button>
            </motion.div>

            <motion.div variants={fieldVariants}>
              <p className="text-xs text-gray-500 italic">
                Note: This version includes location capture and image uploads
                with timestamps and Firebase Storage addresses for better
                verification.
              </p>
            </motion.div>
          </motion.form>
        </div>
      </div>
    </motion.div>
  );
};

export default LogHarvest;
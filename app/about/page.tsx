"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Leaf, Tractor, Users, Globe, ArrowRight, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "What is FarmFlow?",
    answer: "FarmFlow is a decentralized platform on Solana that streamlines the agricultural supply chain, connecting farmers, distributors, and consumers with transparency and efficiency.",
  },
  {
    question: "How do I get started as a farmer?",
    answer: "Connect your Solana wallet, register as a farmer on the platform, and start listing your produce batches. You’ll need some SOL for transaction fees.",
  },
  {
    question: "What’s the benefit of using blockchain?",
    answer: "Blockchain ensures every step of the supply chain is recorded immutably, providing trust, reducing fraud, and enabling fair pricing through smart contracts.",
  },
  {
    question: "Can I vote on governance proposals?",
    answer: "Yes! Anyone with a connected wallet can create and vote on proposals to shape FarmFlow’s future, with one vote per wallet per proposal.",
  },
  {
    question: "Is FarmFlow secure?",
    answer: "Built on Solana’s secure blockchain and audited smart contracts, FarmFlow prioritizes user safety and data integrity.",
  },
];

const AboutPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-gradient-to-r from-green-50 to-blue-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Back Link */}
        <Link href="/" className="text-gray-600 hover:text-green-600 mb-6 flex items-center font-medium">
          <ChevronLeft className="w-5 h-5 mr-2" /> Back to Home
        </Link>

        {/* Hero Section */}
        <motion.div
          className="relative bg-white rounded-xl shadow-xl p-6 sm:p-8 mb-8 border border-gray-100 overflow-hidden"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-green-100 opacity-50"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          />
          <div className="relative z-10">
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <span className="text-green-600">Welcome to</span> FarmFlow
            </motion.h1>
            <motion.p
              className="text-base sm:text-lg md:text-xl text-gray-600 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              FarmFlow is a decentralized agricultural supply chain platform built on Solana. We empower farmers, distributors, and consumers by providing a transparent, efficient, and trustless ecosystem. With blockchain technology, we ensure every step of the supply chain is verifiable, from farm to table.
            </motion.p>
            <motion.a
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition text-sm sm:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Explore FarmFlow <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </motion.a>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8">
          <motion.div
            className="bg-white rounded-xl shadow-xl p-6 border border-gray-100"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
          >
            <Leaf className="w-8 h-8 text-green-600 mb-4" />
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">For Farmers</h2>
            <p className="text-gray-600 text-sm sm:text-base">
              List your produce, set fair prices, and connect directly with distributors and consumers. Get paid instantly through smart contracts.
            </p>
          </motion.div>

          <motion.div
            className="bg-white rounded-xl shadow-xl p-6 border border-gray-100"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
          >
            <Tractor className="w-8 h-8 text-green-600 mb-4" />
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">For Distributors</h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Source high-quality produce directly from verified farmers. Track shipments and ensure authenticity with blockchain records.
            </p>
          </motion.div>

          <motion.div
            className="bg-white rounded-xl shadow-xl p-6 border border-gray-100"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
          >
            <Users className="w-8 h-8 text-green-600 mb-4" />
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">For Consumers</h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Know exactly where your food comes from. Verify the origin, quality, and journey of your produce with transparent supply chain data.
            </p>
          </motion.div>

          <motion.div
            className="bg-white rounded-xl shadow-xl p-6 border border-gray-100"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
          >
            <Globe className="w-8 h-8 text-green-600 mb-4" />
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">For the Planet</h2>
            <p className="text-gray-600 text-sm sm:text-base">
              By reducing intermediaries and optimizing logistics, FarmFlow promotes sustainable farming and reduces carbon footprints.
            </p>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.div
          className="bg-white rounded-xl shadow-xl p-6 sm:p-8 mb-8 border border-gray-100"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.6 }}
        >
          <motion.h1
            className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 1.8 }}
          >
            <span className="text-green-600">Frequently Asked</span> Questions
          </motion.h1>
          <motion.p
            className="text-base sm:text-lg text-gray-600 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 2.0 }}
          >
            Got questions about FarmFlow? We’ve got answers!
          </motion.p>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 2.2 + index * 0.2 }}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition text-left"
                >
                  <span className="text-base sm:text-lg font-medium text-gray-800 flex items-center">
                    <HelpCircle className="w-5 h-5 mr-2 text-green-600" />
                    {faq.question}
                  </span>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-green-600" />
                  )}
                </button>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: openIndex === index ? "auto" : 0,
                    opacity: openIndex === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="p-4 text-gray-600 text-sm sm:text-base">{faq.answer}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default AboutPage;
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const HeroSection = () => {
  const [showNotification, setShowNotification] = useState(false);

  return (
    <section className="bg-gradient-to-r from-green-50 to-blue-50 py-10 sm:py-20 px-4 relative">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center">
        <motion.div
          className="w-full md:w-1/2 mb-10 md:mb-0 pr-0 md:pr-10"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <span className="text-green-600">FarmFlow:</span> Revolutionizing
            Agriculture with Blockchain Transparency
          </motion.h1>
          <motion.p
            className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Track your produce from farm to market, automate payments, and
            ensure fair pricing through decentralization.
          </motion.p>
          <motion.div
            className="flex flex-wrap gap-3 sm:gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition duration-300 shadow-lg text-sm sm:text-base">
              Get Started
            </button>
            <button className="bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition duration-300 shadow-lg flex items-center text-sm sm:text-base">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
              Track Produce
            </button>
            <motion.button
              className="fixed bottom-4 right-4 sm:absolute sm:bottom-20 sm:right-20 md:right-80 cursor-pointer z-40 bg-green-500 text-white h-10 w-10 rounded-full flex items-center justify-center shadow-lg"
              initial={{ scale: 0.9 }}
              animate={{
                scale: [1, 1.1, 1],
                boxShadow: [
                  "0 0 0 2px rgba(239, 68, 68, 0.7), 0 4px 6px rgba(0, 0, 0, 0.1)",
                  "0 0 0 3px rgba(239, 68, 68, 1), 0 10px 15px rgba(239, 68, 68, 0.4)",
                  "0 0 0 2px rgba(239, 68, 68, 0.7), 0 4px 6px rgba(0, 0, 0, 0.1)",
                ],
              }}
              transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: 1.5,
              }}
              onClick={() => setShowNotification(true)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.span
                className="text-xl font-bold"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                !
              </motion.span>
            </motion.button>
          </motion.div>
        </motion.div>
        <motion.div
          className="w-full md:w-1/2 relative"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Main image with enhanced animation */}
          <motion.div
            className="rounded-xl overflow-hidden shadow-2xl relative"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 3,
            }}
          >
            <img
              src="/api/placeholder/600/400"
              alt="Agriculture and blockchain illustration"
              className="w-full h-full object-cover z-10"
            />

            {/* Enhanced overlay with dynamic gradient */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-green-600/30 to-blue-600/30 z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0.3, 0.5, 0] }}
              transition={{ delay: 1, duration: 8, repeat: Infinity }}
            />

            {/* Scanner effect */}
            <motion.div
              className="absolute inset-0 z-30 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <motion.div
                className="absolute top-0 left-0 w-full h-1 bg-green-400/50 blur-sm"
                initial={{ y: -10 }}
                animate={{ y: 400 }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "loop",
                  repeatDelay: 1,
                }}
              />
            </motion.div>
          </motion.div>

          {/* Enhanced blockchain nodes with better connection visualization */}
          <motion.div className="absolute bottom-8 inset-x-8 h-16 z-30">
            {/* Floating nodes with enhanced styling */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute h-8 w-8 sm:h-12 sm:w-12 rounded-lg shadow-lg flex items-center justify-center ${
                  i % 2 === 0 ? "bg-green-500" : "bg-blue-500"
                } backdrop-blur-sm border border-white/20`}
                style={{
                  left: `${i * 22}%`,
                  bottom: i % 2 === 0 ? "0px" : "20px",
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.2, duration: 0.5 }}
                whileHover={{ y: -5, scale: 1.05 }}
              >
                {/* Node content with pulse effect */}
                <motion.div
                  className="absolute inset-0 rounded-lg bg-white/30"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                />
                <svg
                  className="w-4 h-4 sm:w-6 sm:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {i === 0 && (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    ></path>
                  )}
                  {i === 1 && (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    ></path>
                  )}
                  {i === 2 && (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  )}
                  {i === 3 && (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                    ></path>
                  )}
                  {i === 4 && (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  )}
                </svg>
              </motion.div>
            ))}

            {/* Enhanced connecting lines with data flow animation */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 20"
            >
              <motion.path
                d="M10 10 L30 5 L50 10 L70 5 L90 10"
                fill="none"
                stroke="#4ADE80"
                strokeWidth="0.5"
                strokeDasharray="1 1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.8 }}
                transition={{ delay: 1.8, duration: 1.2 }}
              />
              {/* Animated data flow */}
              <motion.circle
                cx="0"
                cy="0"
                r="1.5"
                fill="#4ADE80"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  cx: [10, 30, 50, 70, 90],
                  cy: [10, 5, 10, 5, 10],
                }}
                transition={{
                  duration: 3,
                  times: [0, 0.25, 0.5, 0.75, 1],
                  repeat: Infinity,
                  repeatDelay: 0.5,
                }}
              />
              <motion.circle
                cx="0"
                cy="0"
                r="1.5"
                fill="#60A5FA"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  cx: [90, 70, 50, 30, 10],
                  cy: [10, 5, 10, 5, 10],
                }}
                transition={{
                  duration: 3,
                  times: [0, 0.25, 0.5, 0.75, 1],
                  repeat: Infinity,
                  repeatDelay: 0.5,
                  delay: 1.5,
                }}
              />
            </svg>
          </motion.div>

          {/* Enhanced FarmFlow branded element */}
          <motion.div
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 sm:px-4 py-1 sm:py-2 rounded-lg shadow-lg z-30 border-l-4 border-green-500"
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            whileHover={{ scale: 1.05, x: -3 }}
          >
            <motion.div
              className="flex items-center space-x-1 sm:space-x-2"
              whileHover={{ x: 3 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <span className="text-green-600 font-bold text-sm sm:text-base">Farm</span>
              <span className="text-blue-500 font-bold text-sm sm:text-base">Flow</span>
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                ></path>
              </svg>
            </motion.div>
          </motion.div>

          {/* Enhanced animated data metrics */}
          <motion.div
            className="absolute top-16 left-4 bg-white/80 backdrop-blur-sm p-2 sm:p-3 rounded-lg shadow-md z-30"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0, duration: 0.6 }}
          >
            <div className="flex items-center text-xs sm:text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
              <span className="text-gray-700 font-medium">
                Farm Transparency
              </span>
              <motion.span
                className="ml-2 text-green-600 font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.4, duration: 0.3 }}
              >
                +64%
              </motion.span>
            </div>
          </motion.div>

          {/* Supply chain visualization */}
          <motion.div
            className="absolute bottom-28 left-4 bg-white/80 backdrop-blur-sm p-2 sm:p-3 rounded-lg shadow-md z-30"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.2, duration: 0.6 }}
          >
            <div className="text-xs font-medium text-gray-800 mb-1 sm:mb-2">
              Supply Chain Verification
            </div>
            <div className="flex items-center space-x-1">
              {["Farm", "Process", "Ship", "Store", "Market"].map((step, i) => (
                <motion.div
                  key={i}
                  className="flex flex-col items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.4 + i * 0.2 }}
                >
                  <motion.div
                    className={`h-2 w-2 sm:h-3 sm:w-3 rounded-full ${
                      i <= 3 ? "bg-green-500" : "bg-gray-300"
                    }`}
                    animate={i <= 3 ? { scale: [1, 1.2, 1] } : {}}
                    transition={{
                      duration: 1,
                      repeat: i === 3 ? Infinity : 0,
                      repeatDelay: 0.5,
                    }}
                  />
                  <div className="text-tiny sm:text-xs mt-1 text-gray-600">{step}</div>
                  {i < 4 && (
                    <motion.div
                      className="h-px w-3 sm:w-4 bg-gray-300 mx-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.4 + i * 0.2 + 0.1 }}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Blockchain verification badge */}
          <motion.div
            className="absolute top-4 left-4 bg-green-600 text-white p-1 sm:p-2 rounded-lg shadow-lg z-30 flex items-center space-x-1 sm:space-x-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.8, duration: 0.6 }}
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span className="text-xs sm:text-sm font-medium">Blockchain Verified</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Notification panel */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            className="fixed inset-0 flex items-start justify-center pt-8 sm:pt-16 px-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-white w-full max-w-xl rounded-lg shadow-2xl overflow-hidden"
              initial={{ y: -50, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: -50, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 500 }}
            >
              <div className="bg-gradient-to-r from-green-600 to-blue-600 p-3 sm:p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-white mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    <h3 className="text-white font-bold text-base sm:text-lg">
                      FarmFlow Update
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowNotification(false)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="mb-4">
                  <div className="flex items-center mb-2 sm:mb-3">
                    <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-green-500 mr-2"></div>
                    <h4 className="font-bold text-gray-800 text-sm sm:text-base">
                      Payment Information
                    </h4>
                  </div>
                    <p className="text-gray-600 text-xs sm:text-sm">
                    In our app, all transfers are conducted using WSOL tokens, ensuring secure and efficient transactions while our governance system is being developed.
                    </p>
                </div>
                <div className="mb-4">
                  <div className="flex items-center mb-2 sm:mb-3">
                    <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-blue-500 mr-2"></div>
                    <h4 className="font-bold text-gray-800 text-sm sm:text-base">
                      App Development Status
                    </h4>
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    A fully fledged app will be ready once the governance is
                    designed and implemented. Stay tuned for updates!
                  </p>
                </div>
                <div className="flex justify-between items-center mt-4 sm:mt-6">
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    <span className="text-xxs sm:text-xs text-gray-500">
                      Posted March 19, 2025
                    </span>
                  </div>
                  <button
                    onClick={() => setShowNotification(false)}
                    className="px-3 py-1 sm:px-4 sm:py-2 bg-green-600 text-white cursor-pointer rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </motion.div>
            <div
              className="fixed inset-0 bg-black/30 -z-10"
              onClick={() => setShowNotification(false)}
            ></div>
          </motion.div>
        )}
      </AnimatePresence>
      <style jsx>{`
        .text-tiny {
          font-size: 0.65rem;
        }
        .text-xxs {
          font-size: 0.65rem;
        }
      `}</style>
    </section>
  );
};
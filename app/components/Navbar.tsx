"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  interface Variants {
    [key: string]: any;
    hidden: { opacity: number; y: number };
    visible: (i: number) => { opacity: number; y: number; transition: { delay: number; duration: number } };
  }

  const navItemVariants: Variants = {
    hidden: { opacity: 0, y: -5 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
      },
    }),
  };

  const logoVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.5 }
    },
    whileHover: {
      scale: 1.05,
      textShadow: "0px 0px 8px rgb(59, 130, 246)",
      transition: { duration: 0.2 }
    }
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", index: 1 },
    { name: "Track Produce", path: "/track", index: 2 },
    { name: "Payments & Staking", path: "/payments-staking", index: 3 },
    { name: "Disputes", path: "/disputes", index: 4 },
    { name: "Governance", path: "/governance", index: 5 },
    { name: "About & FAQs", path: "#FAQ", index: 6 },
  ];

  return (
    <motion.nav 
      className="bg-gradient-to-r from-green-50 to-blue-50 shadow-lg border-b border-gray-300 "
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo/Home section */}
          <div className="flex-shrink-0 flex items-center">
            <motion.div
              variants={logoVariants}
              initial="initial"
              animate="animate"
              whileHover="whileHover"
            >
              <Link href="/" className="font-bold text-xl">
                <span className="text-green-600">FarmFlow</span>
              </Link>
            </motion.div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-green-600 hover:bg-gray-100 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={toggleMenu}
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <motion.svg
                animate={{ rotate: isMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.3 }}
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </motion.svg>
              {/* Icon when menu is open */}
              <motion.svg
                animate={{ rotate: isMenuOpen ? 0 : -90 }}
                transition={{ duration: 0.3 }}
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </motion.svg>
            </motion.button>
          </div>

          {/* Desktop menu */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {navItems.map((item) => (
              <motion.div
                key={item.name}
                custom={item.index}
                variants={navItemVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.05 }}
              >
                <Link href={item.path} className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors">
                  {item.name}
                </Link>
              </motion.div>
            ))}
            <motion.div 
              className="ml-4"
              custom={7}
              variants={navItemVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.05 }}
            >
              {/* Custom styled wallet button to match FarmFlow green */}
              <div className="wallet-adapter-button-wrapper">
                <style jsx global>{`
                  .wallet-adapter-button {
                    background-color: rgb(22 163 74) !important; /* green-600 */
                    color: white !important;
                    font-weight: 600 !important;
                    padding: 0.75rem 1.5rem !important;
                    border-radius: 0.5rem !important;
                    transition: all 0.2s !important;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                  }
                  
                  .wallet-adapter-button:hover {
                    background-color: rgb(21 128 61) !important; /* green-700 */
                    transform: scale(1.02);
                  }
                  
                  .wallet-adapter-button:active {
                    transform: scale(0.98);
                  }
                `}</style>
                <WalletMultiButton />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <motion.div 
        className="sm:hidden"
        initial={{ height: 0, opacity: 0 }}
        animate={{ 
          height: isMenuOpen ? "auto" : 0,
          opacity: isMenuOpen ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="pt-2 pb-3 space-y-1 bg-white">
          {navItems.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ x: -20, opacity: 0 }}
              animate={{ 
                x: isMenuOpen ? 0 : -20, 
                opacity: isMenuOpen ? 1 : 0 
              }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Link 
                href={item.path} 
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 transition-colors"
              >
                {item.name}
              </Link>
            </motion.div>
          ))}
          <motion.div 
            className="px-3 py-2"
            initial={{ x: -20, opacity: 0 }}
            animate={{ 
              x: isMenuOpen ? 0 : -20, 
              opacity: isMenuOpen ? 1 : 0 
            }}
            transition={{ delay: navItems.length * 0.1, duration: 0.3 }}
          >
            <WalletMultiButton />
          </motion.div>
        </div>
      </motion.div>
    </motion.nav>
  );
}
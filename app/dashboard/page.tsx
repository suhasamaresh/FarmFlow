"use client"
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { BarChart, TrendingUp, Truck, Box, Users, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const { publicKey } = useWallet();
  const [userRole, setUserRole] = useState('Farmer');
  const [isLoading, setIsLoading] = useState(true);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const cardHoverVariants = {
    hover: {
      y: -5,
      boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
      transition: {
        duration: 0.3
      }
    }
  };

  // Mock activity data
  const activityItems = [
    { id: 1, type: 'transaction', message: 'Batch #AF2389 shipped to wholesaler', time: '2 hours ago' },
    { id: 2, type: 'payment', message: 'Received 2.5 SOL payment', time: '5 hours ago' },
    { id: 3, type: 'update', message: 'Quality verification completed', time: '1 day ago' },
    { id: 4, type: 'system', message: 'Welcome to DecentralAgri platform', time: '3 days ago' },
  ];

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const features = [
    { name: 'Track Produce', icon: <Truck size={24} />, link: '/track', color: 'from-green-500 to-green-600' },
    { name: 'Payments', icon: <TrendingUp size={24} />, link: '/payments', color: 'from-blue-500 to-blue-600' },
    { name: 'Governance', icon: <Users size={24} />, link: '/governance', color: 'from-purple-500 to-purple-600' },
    { name: 'Disputes', icon: <AlertTriangle size={24} />, link: '/disputes', color: 'from-amber-500 to-amber-600' },
  ];

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="dashboard-page min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div variants={itemVariants} className="mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  Welcome to Your Dashboard
                </h1>
                {publicKey ? (
                  <p className="text-gray-600">
                    <span className="font-medium">{userRole}</span> • {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}
                  </p>
                ) : (
                  <p className="text-red-500">Please connect your wallet to view your dashboard.</p>
                )}
              </div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 sm:mt-0"
              >
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium flex items-center">
                  <BarChart size={18} className="mr-2" />
                  Active Participant
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div 
            variants={itemVariants} 
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 h-full">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Box className="mr-2 text-green-600" size={20} />
                Quick Actions
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {features.map((feature, index) => (
                  <Link href={feature.link} key={index}>
                    <motion.div
                      variants={cardHoverVariants}
                      whileHover="hover"
                      className="bg-white border border-gray-200 rounded-xl p-4 text-center flex flex-col items-center justify-center transition-all duration-200 h-32"
                    >
                      <div className={`p-3 rounded-full bg-gradient-to-r ${feature.color} text-white mb-3`}>
                        {feature.icon}
                      </div>
                      <span className="font-medium text-gray-800">{feature.name}</span>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 h-full">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Overview</h2>
              
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-5/6 mb-4"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-between items-center p-3 bg-green-50 rounded-lg"
                  >
                    <span className="text-gray-700">Active Batches</span>
                    <span className="font-semibold">3</span>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex justify-between items-center p-3 bg-blue-50 rounded-lg"
                  >
                    <span className="text-gray-700">Total Earnings</span>
                    <span className="font-semibold">123.45 SOL</span>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex justify-between items-center p-3 bg-purple-50 rounded-lg"
                  >
                    <span className="text-gray-700">Active Proposals</span>
                    <span className="font-semibold">2</span>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
            
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {activityItems.map((item, index) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + (index * 0.1) }}
                    className="py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <p className="text-gray-800">{item.message}</p>
                        <p className="text-gray-500 text-sm">{item.time}</p>
                      </div>
                      <div className="flex items-center">
                        {item.type === 'transaction' && <Truck size={16} className="text-green-600" />}
                        {item.type === 'payment' && <TrendingUp size={16} className="text-blue-600" />}
                        {item.type === 'update' && <Box size={16} className="text-purple-600" />}
                        {item.type === 'system' && <Users size={16} className="text-gray-600" />}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-4 text-center"
            >
              <button className="text-blue-600 font-medium hover:text-blue-800 transition-colors">
                View All Activity
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
"use client"
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as web3 from '@solana/web3.js';
import { Search, MapPin, Calendar, Package, Truck, User, CheckCircle, AlertCircle } from 'lucide-react';

const Track = () => {
  const [batchId, setBatchId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Mock status history data
  const mockStatusHistory = [
    { status: 'Harvested', date: '2025-03-01', location: 'Farm A, California', owner: 'John (Farmer)' },
    { status: 'Quality Check', date: '2025-03-03', location: 'Farm A, California', owner: 'John (Farmer)' },
    { status: 'In Transit', date: '2025-03-05', location: 'Route 66, Arizona', owner: 'Mike (Transporter)' },
    { status: 'Received', date: '2025-03-07', location: 'Wholesale Market, Nevada', owner: 'Sarah (Wholesaler)' },
    { status: 'Sold', date: '2025-03-10', location: 'Retail Store, Nevada', owner: 'Lisa (Retailer)' },
  ];

  const handleSearch = async () => {
    if (!batchId.trim()) {
      setError('Please enter a batch ID');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const program = getProgram();
      // Example PDA derivation for a Produce account.
      // This would be replaced with actual blockchain call in production
      // const [producePDA] = await web3.PublicKey.findProgramAddress(
      //   [Buffer.from("produce"), Buffer.from(batchId)],
      //   program.programId
      // );
      // const produceAccount = await program.account.produce.fetch(producePDA);
      
      // For demo purposes, we'll create a mock result after a delay
      setTimeout(() => {
        if (batchId === 'BAD123') {
          setError('Batch not found');
          setResult(null);
        } else {
          setResult({
            id: batchId,
            produceType: 'Organic Tomatoes',
            quantity: '500 kg',
            status: 'Sold',
            farmLocation: 'Farm A, California',
            harvestDate: '2025-03-01',
            lastUpdated: Date.now() / 1000,
            certifications: ['Organic', 'Fair Trade'],
            temperature: '4°C',
            statusHistory: mockStatusHistory
          });
        }
        setIsLoading(false);
      }, 1500);
      
    } catch (err) {
      console.error("Tracking error:", err);
      setError('An error occurred while fetching the data');
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="track-page min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Track Produce
          </h1>
          <p className="text-gray-600">
            Enter a batch ID to track its journey through the supply chain
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row items-stretch gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter Batch ID (e.g. BTC12345)"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSearch}
                disabled={isLoading}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center whitespace-nowrap"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-l-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={18} className="mr-2" />
                    Track Batch
                  </>
                )}
              </motion.button>
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center"
              >
                <AlertCircle size={18} className="mr-2" />
                {error}
              </motion.div>
            )}
          </div>
        </motion.div>

        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Batch Details</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  result.status === 'Sold' ? 'bg-green-100 text-green-800' : 
                  result.status === 'In Transit' ? 'bg-blue-100 text-blue-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {result.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Package size={20} className="text-green-600 mr-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Produce Type</p>
                      <p className="font-medium text-gray-800">{result.produceType}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Calendar size={20} className="text-green-600 mr-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Harvest Date</p>
                      <p className="font-medium text-gray-800">{result.harvestDate}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin size={20} className="text-green-600 mr-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Farm Location</p>
                      <p className="font-medium text-gray-800">{result.farmLocation}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Truck size={20} className="text-blue-600 mr-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Quantity</p>
                      <p className="font-medium text-gray-800">{result.quantity}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle size={20} className="text-blue-600 mr-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Certifications</p>
                      <p className="font-medium text-gray-800">{result.certifications.join(', ')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <User size={20} className="text-blue-600 mr-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="font-medium text-gray-800">{new Date(result.lastUpdated * 1000).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Journey Timeline</h2>
              
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute top-0 left-[19px] bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-8">
                  {result.statusHistory.map((item: any, index: number) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-start"
                    >
                      <div className={`rounded-full w-10 h-10 flex items-center justify-center mr-4 ${
                        index === result.statusHistory.length - 1 
                          ? 'bg-green-500 text-white'
                          : 'bg-blue-100 text-blue-500'
                      }`}>
                        {index === 0 && <Package size={16} />}
                        {index === 1 && <CheckCircle size={16} />}
                        {index === 2 && <Truck size={16} />}
                        {index === 3 && <User size={16} />}
                        {index === 4 && <CheckCircle size={16} />}
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 flex-1">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2">
                          <h3 className="font-medium text-gray-800">{item.status}</h3>
                          <p className="text-sm text-gray-500">{item.date}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row text-gray-600 text-sm">
                          <div className="flex items-center sm:mr-6">
                            <MapPin size={14} className="mr-1" />
                            {item.location}
                          </div>
                          <div className="flex items-center mt-1 sm:mt-0">
                            <User size={14} className="mr-1" />
                            {item.owner}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Track;
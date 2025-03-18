import React from 'react';
import { motion } from 'framer-motion';

export const LiveStatistics = () => {
  const statistics = [
    {
      id: 1,
      label: "Total Registered Users",
      value: "12,485",
      description: "Farmers, Transporters, Retailers, Arbitrators",
      icon: (
        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
      )
    },
    {
      id: 2,
      label: "Produce Tracked",
      value: "87,239",
      description: "Total batches tracked on blockchain",
      icon: (
        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
        </svg>
      )
    },
    {
      id: 3,
      label: "Successful Deliveries",
      value: "72,846",
      description: "Produce batches delivered successfully",
      icon: (
        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
      )
    },
    {
      id: 4,
      label: "Payments Processed",
      value: "6.4M",
      description: "Total tokens paid to participants",
      icon: (
        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      )
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-r from-green-600 to-green-800 text-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Live Statistics</h2>
          <div className="w-20 h-1 bg-green-300 mx-auto mb-6"></div>
          <p className="text-green-200 max-w-2xl mx-auto">Real-time blockchain statistics showcasing our platform's impact on the agricultural supply chain.</p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {statistics.map((stat) => (
            <motion.div 
              key={stat.id}
              className="bg-green-700 bg-opacity-30 backdrop-filter backdrop-blur-lg rounded-xl p-6 border border-green-400 border-opacity-30 group shadow-lg"
              variants={itemVariants}
              whileHover={{ 
                y: -5, 
                backgroundColor: 'rgba(16, 185, 129, 0.5)', // green-500 with opacity
                borderColor: 'rgba(52, 211, 153, 1)', // green-400 full opacity
                transition: { duration: 0.2 } 
              }}
            >
              <div className="flex items-center mb-4">
                <div className="bg-green-600 bg-opacity-40 rounded-full p-2 mr-4 group-hover:bg-opacity-60 transition-all duration-200">
                  {stat.icon}
                </div>
                <h3 className="text-lg font-medium text-green-300 group-hover:text-white transition-colors duration-200">
                  {stat.label}
                </h3>
              </div>
              <p className="text-3xl font-bold text-green-300 group-hover:text-white transition-colors duration-200 mb-2">
                {stat.value}
              </p>
              <p className="text-sm text-green-300 group-hover:text-white transition-colors duration-200">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default LiveStatistics;
import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export const CTASection = () => {
  const router = useRouter();
  const handleClick = (e: any) => {
    router.push('/register');
  }
  return (
    <section className="py-16 px-4 bg-gradient-to-r from-green-600 to-green-800 text-white">
      <div className="max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Join the Decentralized Supply Chain Today!</h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Start tracking your produce, automating payments, and participating in fair agricultural trade on the blockchain.
          </p>
          <motion.div 
            className="flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <motion.button 
              className="bg-white text-green-600 font-semibold cursor-pointer py-3 px-8 rounded-lg shadow-lg hover:bg-green-50 transition duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClick}
            >
              Register Now
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
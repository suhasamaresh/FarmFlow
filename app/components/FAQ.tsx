import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const FAQSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs = [
    {
      id: 1,
      question: "What is this platform?",
      answer: "Our platform is a decentralized agricultural supply chain system built on blockchain technology. It connects farmers, transporters, wholesalers, and retailers in a transparent ecosystem where produce can be tracked from farm to market, payments are automated through smart contracts, and disputes are resolved fairly."
    },
    {
      id: 2,
      question: "How does produce tracking work?",
      answer: "Each batch of produce is assigned a unique identifier on the blockchain. As the produce moves through the supply chain, each participant updates its status, location, and condition. This information is recorded on the blockchain, creating an immutable record that can be verified by scanning a QR code or entering the batch ID."
    },
    {
      id: 3,
      question: "How are payments processed?",
      answer: "Payments are processed automatically through smart contracts. When a delivery is confirmed and quality verified, the smart contract releases payment to the appropriate parties. This eliminates payment delays and ensures fair compensation based on pre-agreed terms stored on the blockchain."
    },
    {
      id: 4,
      question: "How does dispute resolution work?",
      answer: "If a dispute arises (e.g., regarding quality, delivery times, or payment), any party can raise a dispute through the platform. Elected arbitrators review the evidence recorded on the blockchain and make a binding decision. The transparent nature of the system ensures fair and efficient resolution."
    },
    {
      id: 5,
      question: "What is governance, and how can I vote on proposals?",
      answer: "Governance refers to the decision-making process for platform upgrades and policy changes. Token holders can propose changes and vote on proposals proportional to their token holdings. This ensures the platform evolves according to the community's needs and maintains decentralization."
    }
  ];

  const toggleFAQ = (index: number) => {
      setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id='FAQ' className="py-16 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
          <div className="w-20 h-1 bg-green-500 mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-2xl mx-auto">Get answers to common questions about our decentralized agricultural supply chain platform.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-4"
        >
          {faqs.map((faq, index) => (
            <motion.div 
              key={faq.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <button
                className="w-full text-left p-4 focus:outline-none flex justify-between items-center"
                onClick={() => toggleFAQ(index)}
              >
                <span className="font-semibold text-lg text-gray-800">{faq.question}</span>
                <svg
                  className={`w-6 h-6 text-green-600 transform transition-transform duration-300 ${activeIndex === index ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 text-gray-600 border-t border-gray-100">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
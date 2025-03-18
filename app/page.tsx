"use client";

import Navbar from "./components/Navbar";
import { motion } from "framer-motion";
import { HeroSection } from "./components/Hero";
import HowItWorks from "./components/Howitworks";
import KeyFeatures from "./components/Keyfeatures";
import LiveStatistics from "./components/LiveStats";
import Testimonials from "./components/Testimonials";
import CTASection from "./components/Calltoaction";
import FAQSection from "./components/FAQ";

export default function Home() {
  return (
    <div>
      <HeroSection/>
      <HowItWorks/>
      <KeyFeatures/>
      <LiveStatistics/>
      <Testimonials/>
      <CTASection/>
      <FAQSection/>
    </div>
  );
}

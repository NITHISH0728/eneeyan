import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // Make sure to install: npm install framer-motion
import { ArrowRight, ChevronRight } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();
  const [displayText, setDisplayText] = useState("");
  const fullText = "Empowering students with cutting-edge skills. Master coding, design, and more with iQmath.";

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 50); // Typing speed
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-full bg-white overflow-hidden flex flex-col font-sans">
      
      {/* UPPER HALF (Hero Section) */}
      <div className="h-[62.5vh] flex relative">
        {/* Text Animation from Left */}
        <div className="w-1/2 flex flex-col justify-center pl-20 z-10">
          {["Learn Every Day & Any", "new skills online", "with our iQmath platform"].map((line, i) => (
            <motion.h1
              key={i}
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.5, duration: 0.8, ease: "easeOut" }}
              className="text-5xl font-extrabold text-[#1e293b] mb-4 leading-tight tracking-tight"
            >
              {line}
            </motion.h1>
          ))}
        </div>

        {/* Logo Animation from Right */}
        <motion.div 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1.5, duration: 1, ease: "easeOut" }}
          className="w-1/2 flex items-center justify-center bg-slate-50 relative"
        >
           {/* Replace with your actual logo image path if available */}
           <div className="text-center">
              <h1 className="text-8xl font-black text-[#005EB8] tracking-tighter">iQ<span className="text-[#87C232]">math</span></h1>
              <p className="text-xl text-slate-400 mt-4 tracking-widest uppercase font-bold">Technologies</p>
           </div>
        </motion.div>
      </div>

      {/* LOWER HALF */}
      <div className="flex-1 flex border-t border-slate-100">
        
        {/* Typing Script Section */}
        <div className="w-1/2 bg-[#f8fafc] p-20 flex items-center">
           <div className="text-xl text-slate-600 font-mono">
              {displayText}
              <span className="animate-pulse">|</span>
           </div>
        </div>

        {/* Floating Explore Button */}
        <div className="w-1/2 bg-white flex items-center justify-center relative">
           <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/login")} // Navigate to login page
              className="px-10 py-5 bg-[#005EB8] text-white text-xl font-bold rounded-full shadow-2xl flex items-center gap-4 hover:shadow-[#005EB8]/40 transition-all"
           >
              Explore Now <ArrowRight size={24} />
           </motion.button>
        </div>

      </div>
    </div>
  );
};

export default LandingPage;
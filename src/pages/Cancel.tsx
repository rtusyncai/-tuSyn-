import React from 'react';
import { motion } from 'motion/react';
import { XCircle, ArrowLeft, RefreshCw, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CancelPage = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-12 rounded-[60px] border border-[#D1D1C1] shadow-2xl text-center space-y-8"
      >
        <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <XCircle size={64} />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-serif font-bold text-[#5A5A40]">Rhythm Interrupted</h1>
          <p className="text-base text-[#2D3436] opacity-60 font-serif italic">
            The checkout process was cancelled. No charges were made to your biological signature.
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <Link 
            to="/marketplace"
            className="w-full bg-[#5A5A40] text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-xl transition-all"
          >
            <RefreshCw size={20} /> Try Again
          </Link>
          <Link 
            to="/"
            className="w-full bg-stone-100 text-[#5A5A40] py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-200 transition-all text-sm"
          >
            <ArrowLeft size={18} /> Return Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

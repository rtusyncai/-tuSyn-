import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight, Sparkles, ShoppingBag, Info } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export const SuccessPage = () => {
  const [searchParams] = useSearchParams();
  const isSimulated = searchParams.get('simulated') === 'true';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-12 rounded-[60px] border border-[#D1D1C1] shadow-2xl text-center space-y-8 relative overflow-hidden"
      >
        <Sparkles className="absolute -right-8 -top-8 text-emerald-100" size={160} />
        
        {isSimulated && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full border border-amber-100 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 z-20">
            <Info size={12} /> Simulation Mode
          </div>
        )}
        
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner relative z-10">
          <CheckCircle2 size={64} />
        </div>
        
        <div className="space-y-4 relative z-10">
          <h1 className="text-4xl font-serif font-bold text-[#5A5A40]">Manifestation Secured</h1>
          <p className="text-base text-[#2D3436] opacity-60 font-serif italic">
            Your transaction has been harmonized. Your new sacred artifact will be available in your vault shortly.
          </p>
        </div>

        <div className="space-y-4 relative z-10 pt-4">
          <Link 
            to="/vault"
            className="w-full bg-[#5A5A40] text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-xl transition-all"
          >
            Go to Sacred Vault <ArrowRight size={20} />
          </Link>
          <Link 
            to="/marketplace"
            className="w-full bg-stone-100 text-[#5A5A40] py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-200 transition-all text-sm"
          >
            <ShoppingBag size={18} /> Continue Shopping
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

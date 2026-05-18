import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, ChevronRight, Plus, Minus, PackageOpen, Cloud, Loader2, Sparkles, ShieldAlert } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { monetizationService } from '../services/monetizationService';
import { useToast } from '../hooks/useToast';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems, isPersisted } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setCheckoutError(null);
    try {
      const data = await monetizationService.createCheckoutSession(items);
      if (data.url || data.simulatedUrl) {
         window.location.href = data.url || data.simulatedUrl;
      }
    } catch (error: any) {
      const msg = error.message || "Failed to initiate sacred exchange.";
      setCheckoutError(msg);
      toast(msg, "error");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] bg-[#F5F5F0] dark:bg-[#1A1A15] z-[101] shadow-2xl flex flex-col border-l border-[#D1D1C1] dark:border-[#3D3D35] overflow-hidden"
          >
            <AnimatePresence>
              {isCheckingOut && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[110] bg-white/95 dark:bg-[#1A1A15]/95 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="relative mb-8">
                    <motion.div 
                      animate={{ 
                        rotate: 360,
                        scale: [1, 1.1, 1],
                      }}
                      transition={{ 
                        rotate: { duration: 15, repeat: Infinity, ease: "linear" },
                        scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                      }}
                      className="w-40 h-40 border-4 border-dashed border-[#5A5A40]/30 dark:border-[#A8D5BA]/30 rounded-full flex items-center justify-center"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="p-5 bg-[#5A5A40] dark:bg-[#A8D5BA] text-white dark:text-[#1A1A15] rounded-full shadow-2xl"
                      >
                        <Sparkles size={32} />
                      </motion.div>
                    </div>
                  </div>
                  <div className="space-y-4 max-w-xs">
                    <h3 className="text-2xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">Sacred Synapse</h3>
                    <p className="text-sm text-[#5A5A40]/60 dark:text-[#A8D5BA]/60 italic leading-relaxed">
                      Calibrating your earthly assets with the universal ledger. Please maintain neural presence...
                    </p>
                    <div className="pt-8 flex justify-center">
                       <Loader2 className="animate-spin text-amber-500" size={24} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="p-8 flex items-center justify-between border-b border-[#D1D1C1] dark:border-[#3D3D35] bg-white dark:bg-[#252520]">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#5A5A40]/10 dark:bg-[#A8D5BA]/10 text-[#5A5A40] dark:text-[#A8D5BA] rounded-2xl relative">
                  <ShoppingBag size={24} />
                  {isPersisted && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white dark:border-[#252520]"
                    >
                      <Cloud size={10} />
                    </motion.div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">Sacred Cart</h2>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-[#5A5A40]/40 dark:text-[#A8D5BA]/40 uppercase tracking-widest">{totalItems} Elements Manifested</p>
                    {isPersisted && (
                      <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-600 uppercase tracking-tighter bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                        Synced
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-[#D1D1C1]/50 dark:hover:bg-[#3D3D35] rounded-full transition-colors text-[#5A5A40] dark:text-[#A8D5BA]">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                  <PackageOpen size={64} strokeWidth={1} />
                  <div className="space-y-1">
                    <p className="text-lg font-serif italic">Your cart is currently a void.</p>
                    <p className="text-sm">Manifest your first ornament to begin your journey.</p>
                  </div>
                  <button 
                    onClick={() => { onClose(); navigate('/ayurwear'); }}
                    className="pt-4 text-sm font-bold text-[#5A5A40] dark:text-[#A8D5BA] underline underline-offset-4"
                  >
                    Return to AyurWear
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div 
                    layout
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 p-4 bg-white dark:bg-[#252520] border border-[#D1D1C1] dark:border-[#3D3D35] rounded-3xl shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-[#5A5A40] dark:text-[#A8D5BA]">{item.name}</h4>
                          <p className="text-xs text-[#2D3436] dark:text-[#E8E8E0]/70 italic line-clamp-1">{item.description}</p>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 bg-[#F5F5F0] dark:bg-[#1A1A15] p-1 rounded-xl border border-[#D1D1C1] dark:border-[#3D3D35]">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-[#5A5A40] dark:text-[#A8D5BA] hover:bg-white dark:hover:bg-black rounded-lg transition-colors shadow-sm"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 text-[#5A5A40] dark:text-[#A8D5BA] hover:bg-white dark:hover:bg-black rounded-lg transition-colors shadow-sm"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-8 border-t border-[#D1D1C1] dark:border-[#3D3D35] bg-white dark:bg-[#252520] space-y-6">
                <AnimatePresence>
                  {checkoutError && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="p-5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-[24px] space-y-3"
                    >
                      <div className="flex items-center gap-3 text-rose-600">
                        <ShieldAlert size={20} />
                        <span className="text-xs font-bold uppercase tracking-widest leading-none">Exchange Interrupted</span>
                      </div>
                      <p className="text-xs text-rose-800/70 dark:text-rose-400 italic font-serif">
                        {checkoutError}
                      </p>
                      <button 
                        onClick={() => setCheckoutError(null)}
                        className="text-[10px] font-bold text-rose-600 underline underline-offset-4 uppercase tracking-tighter"
                      >
                        Release Terminal
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm opacity-60 italic">
                    <span>Doshic Balance Tax</span>
                    <span>Included</span>
                  </div>
                  <div className="flex justify-between text-2xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">
                    <span>Manifestation Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                
                <button 
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-[#5A5A40] dark:bg-[#A8D5BA] text-white dark:text-[#1A1A15] py-5 rounded-3xl font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Synchronizing Sacred Assets...
                    </>
                  ) : (
                    <>
                      Initiate Final Alignment <ChevronRight size={20} />
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

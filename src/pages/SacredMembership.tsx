import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crown, 
  Store, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Gem, 
  Coins,
  Activity,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { monetizationService, UserWealthProfile } from '../services/monetizationService';
import { cn } from '../lib/utils';

export function SacredMembershipPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserWealthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'seeker' | 'merchant' | null>(null);

  useEffect(() => {
    async function loadAnalysis() {
      if (!user) return;
      const analysis = await monetizationService.analyzeUserPath(user.uid);
      setProfile(analysis);
      setSelectedPlan(analysis.suggestedModel === 'marketplace' ? 'merchant' : 'seeker');
      setLoading(false);
    }
    loadAnalysis();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5A5A40]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] pt-24 pb-20 px-6">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Intelligence Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[48px] p-8 md:p-12 border border-[#D1D1C1]/50 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] -mr-32 -mt-32" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 rounded-3xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-inner">
              <Zap size={40} className="animate-pulse" />
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] font-bold text-amber-600 uppercase tracking-[0.2em]">
                <Activity size={12} /> Aiveda Prosperity Engine Analysis
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#5A5A40]">The Path of Prosperity</h1>
              <p className="text-[#5A5A40]/60 font-medium italic">
                "{profile?.reasoning}"
              </p>
            </div>
          </div>
        </motion.div>

        {/* Pricing Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Seeker Path (Subscription) */}
          <motion.div
            whileHover={{ y: -5 }}
            onClick={() => setSelectedPlan('seeker')}
            className={cn(
              "p-8 rounded-[40px] border-2 transition-all cursor-pointer relative overflow-hidden",
              selectedPlan === 'seeker' 
                ? "bg-white border-[#5A5A40] shadow-2xl" 
                : "bg-white/50 border-transparent hover:bg-white/80"
            )}
          >
            {selectedPlan === 'seeker' && (
              <div className="absolute top-6 right-6 text-emerald-500">
                <CheckCircle2 size={24} />
              </div>
            )}
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Crown size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#5A5A40]">The Sacred Seeker</h3>
                <p className="text-sm text-[#5A5A40]/50 font-medium">Monthly Insight Subscription</p>
              </div>
              <div className="text-4xl font-black text-[#5A5A40]">
                $21<span className="text-lg opacity-40">/mo</span>
              </div>
              <ul className="space-y-4">
                {[
                  'Unlimited Sacred Vault capacity',
                  'Priority AI analysis (Llama-3 & Gemini Pro)',
                  'Personalized daily Dosha tracking',
                  'Ad-free Sanctuary experience',
                  'Early access to limited edition AyurWear'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-[#5A5A40]/70">
                    <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={12} />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Merchant Path (Pay-per-Listing/Rev Share) */}
          <motion.div
            whileHover={{ y: -5 }}
            onClick={() => setSelectedPlan('merchant')}
            className={cn(
              "p-8 rounded-[40px] border-2 transition-all cursor-pointer relative overflow-hidden",
              selectedPlan === 'merchant' 
                ? "bg-white border-amber-600 shadow-2xl" 
                : "bg-white/50 border-transparent hover:bg-white/80"
            )}
          >
            {selectedPlan === 'merchant' && (
              <div className="absolute top-6 right-6 text-emerald-500">
                <CheckCircle2 size={24} />
              </div>
            )}
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Store size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#5A5A40]">The Artisan Merchant</h3>
                <p className="text-sm text-[#5A5A40]/50 font-medium">Transactional & Listing Model</p>
              </div>
              <div className="text-4xl font-black text-[#5A5A40]">
                5%<span className="text-lg opacity-40"> per manifest</span>
              </div>
              <ul className="space-y-4">
                {[
                  'Unlimited marketplace listings',
                  'Sacred Seal of Authenticity',
                  'Advanced sales & neural metrics',
                  'Featured placement in nourishment hub',
                  'Integrated secure escrow manifests'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-[#5A5A40]/70">
                    <div className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={12} />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Commitment Action */}
        <div className="flex justify-center pt-8">
          <button className={cn(
            "group flex items-center gap-4 px-12 py-6 rounded-full font-bold text-lg transition-all shadow-xl hover:shadow-2xl active:scale-95",
            selectedPlan === 'seeker' ? "bg-[#5A5A40] text-white" : "bg-amber-600 text-white"
          )}>
            Manifest My Path
            <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>

        {/* Perks Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
          <div className="flex items-start gap-4 p-6 bg-white/40 rounded-3xl border border-[#D1D1C1]/30">
            <ShieldCheck className="text-emerald-500 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-[#5A5A40]">Secure Sovereignty</h4>
              <p className="text-xs text-[#5A5A40]/60">Your data remains your sacred asset, never sold or traded.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-6 bg-white/40 rounded-3xl border border-[#D1D1C1]/30">
            <Gem className="text-indigo-500 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-[#5A5A40]">Neural Benefits</h4>
              <p className="text-xs text-[#5A5A40]/60">Unlock deeper layers of the Aiveda collective intelligence.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-6 bg-white/40 rounded-3xl border border-[#D1D1C1]/30">
            <Coins className="text-amber-500 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-[#5A5A40]">Flexible Exchange</h4>
              <p className="text-xs text-[#5A5A40]/60">Upgrade or pause your path as your cosmic lifecycle shifts.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

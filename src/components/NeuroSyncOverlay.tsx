import React from 'react';
import { motion } from 'motion/react';
import { Brain, Sparkles, Activity, Shield, Zap, Waves } from 'lucide-react';
import { NeuroProfile } from '../services/neuroSyncService';
import { cn } from '../lib/utils';
import { useBiometrics } from '../hooks/useBiometrics';

interface NeuroHUDProps {
  profile: NeuroProfile;
  harmony: number;
}

export const NeuroHUD: React.FC<NeuroHUDProps> = ({ profile, harmony }) => {
  const isSimplified = profile.preference === 'simplified';
  const isHighContrast = profile.preference === 'high-contrast';
  const { data: bio, isSyncing } = useBiometrics();
  
  // Local state for derived Ayurvedic values
  const [ayurStats, setAyurStats] = React.useState({
    agni: 65,
    ojas: 78
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
        setAyurStats(prev => ({
            agni: Math.min(100, Math.max(0, prev.agni + (Math.random() - 0.5) * 5)),
            ojas: Math.min(100, Math.max(0, prev.ojas + (Math.random() - 0.5) * 2))
        }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`fixed inset-0 pointer-events-none p-10 flex flex-col justify-between transition-colors duration-1000 ${
      isHighContrast ? 'bg-black/20' : 'bg-indigo-900/10'
    }`}>
      {/* Neural Harmony Pulse */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <motion.div
           animate={{
            scale: [1, 1.1 + bio.stressLevel, 1],
            opacity: [0.1, 0.2 + bio.stressLevel / 2, 0.1]
          }}
          transition={{
            duration: 60 / (bio.heartRate || 60),
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`w-[80vw] h-[80vw] rounded-full border-[10vw] blur-3xl ${
            bio.stressLevel > 0.7 ? 'border-amber-500' : 'border-indigo-500'
          }`}
        />
      </div>

      <div className="flex justify-between items-start z-10">
        <div className="space-y-4">
          <div className={`p-6 rounded-[40px] backdrop-blur-3xl border ${
            isHighContrast ? 'bg-black border-yellow-400' : 'bg-white/10 border-white/20'
          }`}>
             <div className="flex items-center gap-3 mb-4">
                <Brain className={isHighContrast ? 'text-yellow-400' : 'text-indigo-400'} size={24} />
                <div>
                   <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Neuro-Bridge</span>
                   <h2 className={`text-2xl font-serif font-bold ${isHighContrast ? 'text-yellow-400' : 'text-white'}`}>
                      Synchronous State
                   </h2>
                </div>
             </div>
             
             {!isSimplified && (
               <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase font-bold opacity-60">
                       <span>Neural Coherence</span>
                       <span>{Math.round(harmony)}%</span>
                    </div>
                    <div className="h-1 w-48 bg-white/10 rounded-full overflow-hidden">
                       <motion.div 
                        animate={{ width: `${harmony}%` }}
                        className={`h-full ${harmony > 70 ? 'bg-emerald-400' : 'bg-indigo-400'}`} 
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-[8px] uppercase font-bold opacity-50">
                            <span>Metabolic Agni</span>
                            <span>{Math.round(ayurStats.agni)}%</span>
                        </div>
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                            <motion.div animate={{ width: `${ayurStats.agni}%` }} className="h-full bg-orange-500" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[8px] uppercase font-bold opacity-50">
                            <span>Ojas Energy</span>
                            <span>{Math.round(ayurStats.ojas)}%</span>
                        </div>
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                            <motion.div animate={{ width: `${ayurStats.ojas}%` }} className="h-full bg-emerald-400" />
                        </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-[8px] uppercase font-bold opacity-40">Pulse Sync</span>
                            <span className="text-lg font-mono text-white leading-none">{bio.heartRate} <span className="text-[8px] opacity-40 italic font-sans lowercase">spanda</span></span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-[8px] uppercase font-bold opacity-40">Stress Index</span>
                            <span className={cn(
                                "text-lg font-mono leading-none",
                                bio.stressLevel > 0.7 ? "text-rose-400" : bio.stressLevel > 0.4 ? "text-amber-400" : "text-emerald-400"
                            )}>
                                {Math.round(bio.stressLevel * 100)}%
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-[8px] uppercase font-bold opacity-40">Ambient Temp</span>
                            <span className="text-sm font-mono text-white">{bio.ambientTemperature}°C</span>
                        </div>
                        <div className="flex flex-col text-right">
                           {isSyncing ? (
                             <div className="flex items-center gap-1">
                                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[6px] uppercase font-bold text-emerald-500 tracking-tighter">Live Biometrics Linked</span>
                             </div>
                           ) : (
                            <span className="text-[6px] uppercase font-bold text-amber-500/50">Simulated Link</span>
                           )}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-[8px] uppercase font-bold tracking-tighter">
                            <span className="opacity-40">Neural Entropy</span>
                            <span className="text-rose-400">{(harmony / 10).toFixed(2)} Hz</span>
                        </div>
                        <p className="text-[8px] text-white/40 italic leading-tight">
                            {bio.stressLevel > 0.7 
                                ? "Critical stress detected. Peripheral focus attenuated."
                                : bio.stressLevel > 0.4
                                    ? "Minor neural dissonance detected. Activating vagus nerve stabilization."
                                    : "Cognitive dispersion is within safe parameters. Neural pruning active."}
                        </p>
                    </div>
                  </div>
               </div>
             )}
          </div>

          <div className={`p-4 rounded-3xl border flex items-center gap-4 ${
            isHighContrast ? 'bg-black border-yellow-400' : 'bg-indigo-500/20 border-indigo-400/30'
          }`}>
              <Waves className={isHighContrast ? 'text-yellow-400' : 'text-indigo-300'} />
              <div className="text-[10px] font-bold uppercase tracking-widest text-white">
                 Rhythmic Stabilization Active
              </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-4">
           {isHighContrast && (
             <div className="bg-yellow-400 text-black px-6 py-2 rounded-full font-black text-xs uppercase tracking-tighter">
                Accessibility High-Contrast
             </div>
           )}
           <div className={`p-6 rounded-[40px] border backdrop-blur-xl ${
              isHighContrast ? 'bg-black border-yellow-400 text-yellow-400' : 'bg-white/5 border-white/10 text-white'
           }`}>
              <Shield className="mb-2" />
              <div className="text-[8px] uppercase opacity-60">Sensory Guard</div>
              <div className="text-xl font-bold">OPTIMIZED</div>
           </div>
        </div>
      </div>

      <div className="flex justify-center items-end py-10 z-10">
         <div className={`max-w-2xl p-8 rounded-[50px] border flex items-center gap-8 shadow-2xl ${
            isHighContrast ? 'bg-black border-yellow-400' : 'bg-indigo-900/80 border-indigo-500/30'
         }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
               isHighContrast ? 'bg-yellow-400 text-black' : 'bg-indigo-500/30 text-indigo-400'
            }`}>
               <Sparkles size={32} />
            </div>
            <div className="space-y-1">
               <h4 className={`text-lg font-bold font-serif ${isHighContrast ? 'text-yellow-400' : 'text-white'}`}>
                  Neuro-Adaptive Guidance
               </h4>
               <p className={`text-sm italic leading-relaxed ${isHighContrast ? 'text-white' : 'text-white/60'}`}>
                  {harmony > 85 
                    ? '"Deep Coherence detected. Your current bio-rhythm is perfectly aligned for creative manifestation. Peripheral noise has been attenuated for your comfort."'
                    : harmony > 60
                        ? '"Cognitive load is stabilizing. Syncing pulse to 1.2Hz frequency to maximize alpha-wave production. Atmospheric harmony is optimal."'
                        : '"Minor cognitive dissonance detected. Activating neural comfort zones. High-frequency stimulus is being filtered to maintain equilibrium."'}
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

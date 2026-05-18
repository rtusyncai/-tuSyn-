import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Heart, Thermometer, Wind, Zap, RefreshCw, Smartphone, Bluetooth } from 'lucide-react';
import { useBiometrics } from '../hooks/useBiometrics';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export const BiometricHUD = () => {
    const { data: bio, isSyncing } = useBiometrics();
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);

    if (!user) return null;

    return (
        <div className="fixed bottom-28 right-6 lg:bottom-10 lg:right-10 z-[60] pointer-events-none">
            <div className="flex flex-col items-end gap-4 pointer-events-auto">
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white/80 dark:bg-[#1A1A15]/80 backdrop-blur-2xl p-6 rounded-[32px] border border-[#D1D1C1]/30 dark:border-[#3D3D35]/30 shadow-2xl w-72 space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-bold text-[#5A5A40] dark:text-[#A8D5BA] uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Activity size={14} /> Live Bio-Sync
                                </h3>
                                {isSyncing ? (
                                    <div className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">Verified Link</span>
                                    </div>
                                ) : (
                                    <Link to="/connectivity" className="text-[8px] font-bold text-amber-500 uppercase tracking-tighter hover:underline">
                                        No Hardware Bridge
                                    </Link>
                                )}
                            </div>

                            <div className="space-y-5">
                                {/* Heart Rate */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-2 text-[#5A5A40] dark:text-[#A8D5BA]/60">
                                            <Heart size={14} className={cn(bio.heartRate > 90 && "text-rose-500 animate-pulse")} />
                                            <span className="text-[10px] font-bold uppercase">Heart Spanda</span>
                                        </div>
                                        <span className="text-xl font-mono font-bold">{bio.heartRate} <span className="text-[10px] font-sans opacity-40">BPM</span></span>
                                    </div>
                                    <div className="h-1 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                        <motion.div 
                                            animate={{ width: `${(bio.heartRate / 180) * 100}%` }}
                                            className="h-full bg-rose-500" 
                                        />
                                    </div>
                                </div>

                                {/* Stress */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-2 text-[#5A5A40] dark:text-[#A8D5BA]/60">
                                            <Zap size={14} className={cn(bio.stressLevel > 0.7 && "text-amber-500")} />
                                            <span className="text-[10px] font-bold uppercase">Prana Tension</span>
                                        </div>
                                        <span className={cn(
                                            "text-xl font-mono font-bold",
                                            bio.stressLevel > 0.7 ? "text-rose-500" : bio.stressLevel > 0.4 ? "text-amber-500" : "text-emerald-500"
                                        )}>
                                            {Math.round(bio.stressLevel * 100)}%
                                        </span>
                                    </div>
                                    <div className="h-1 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                        <motion.div 
                                            animate={{ width: `${bio.stressLevel * 100}%` }}
                                            className={cn(
                                                "h-full transition-colors",
                                                bio.stressLevel > 0.7 ? "bg-rose-500" : bio.stressLevel > 0.4 ? "bg-amber-400" : "bg-emerald-500"
                                            )} 
                                        />
                                    </div>
                                </div>

                                {/* Temperature */}
                                <div className="flex justify-between items-center py-2 border-t border-black/5 dark:border-white/5">
                                    <div className="flex items-center gap-2 text-[#5A5A40] dark:text-[#A8D5BA]/60">
                                        <Thermometer size={14} />
                                        <span className="text-[10px] font-bold uppercase">Ambient Agni</span>
                                    </div>
                                    <span className="font-mono font-bold">{bio.ambientTemperature}°C</span>
                                </div>
                            </div>

                            <div className="p-3 bg-[#5A5A40]/5 dark:bg-[#A8D5BA]/5 rounded-2xl border border-[#5A5A40]/10">
                                <p className="text-[10px] italic text-[#5A5A40]/70 dark:text-[#A8D5BA]/70 leading-relaxed">
                                    {bio.stressLevel > 0.7 
                                        ? "Sympathetic peak detected. Recommended: Sitali Pranayama (Cooling Breath)."
                                        : bio.stressLevel > 0.4
                                            ? "Equilibrium fluctuating. Neural stabilization nodes active."
                                            : "Optimal harmonic resonance. Perfect state for deep ritual focus."}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-2xl relative border-2",
                        isExpanded 
                            ? "bg-[#5A5A40] text-white border-white/20 dark:bg-[#A8D5BA] dark:text-[#1A1A15]" 
                            : "bg-white/80 dark:bg-[#1A1A15]/80 text-[#5A5A40] dark:text-[#A8D5BA] border-[#D1D1C1]/30 dark:border-[#3D3D35]/30 backdrop-blur-md"
                    )}
                >
                    <AnimatePresence mode="wait">
                        {isExpanded ? (
                            <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
                                <RefreshCw size={24} className="animate-spin-slow" />
                            </motion.div>
                        ) : (
                            <motion.div key="open" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                                <div className="relative">
                                    <Activity size={24} />
                                    {isSyncing && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#1A1A15] rounded-full animate-ping" />
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </div>
    );
};

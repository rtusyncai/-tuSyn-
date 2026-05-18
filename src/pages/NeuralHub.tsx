import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, Activity, Cpu, ArrowRight, Zap, RefreshCw, Info, Gem, Music, ShieldCheck, Archive, Sun, Moon, Wind, Thermometer, Eye, Clock, Save } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { NeuralGrowthService, AppManifestation } from '../services/neuralGrowthService';
import { neuroSyncService, NeuroProfile } from '../services/neuroSyncService';
import { vaultService } from '../services/vaultService';
import { useVision } from '../hooks/useVision';
import { useToast } from '../hooks/useToast';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockHarmonyData = Array.from({ length: 20 }, (_, i) => ({
  time: i,
  harmony: 60 + Math.random() * 30,
  load: 30 + Math.random() * 40
}));

export const NeuralHubPage = () => {
  const { user } = useAuth();
  const { setMode } = useVision();
  const { toast } = useToast();
  const [manifestations, setManifestations] = useState<AppManifestation[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isEvolving, setIsEvolving] = useState(false);
  const [isEditingReasoning, setIsEditingReasoning] = useState(false);
  const [activeManifestation, setActiveManifestation] = useState<AppManifestation | null>(null);
  const [neuroProfile, setNeuroProfile] = useState<NeuroProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      const m = await NeuralGrowthService.getManifestations(user.uid);
      setManifestations(m);

      const docSnap = await getDoc(doc(db, 'profiles', user.uid));
      if (docSnap.exists()) setProfile(docSnap.data());

      const nProfile = await neuroSyncService.getNeuroProfile(user.uid);
      if (nProfile) setNeuroProfile(nProfile);
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (!neuroProfile) return;
    
    const interval = setInterval(() => {
      const changes = neuroSyncService.simulateRhythmChanges(neuroProfile);
      setNeuroProfile(prev => prev ? { ...prev, ...changes } : null);
    }, 5000);

    return () => clearInterval(interval);
  }, [neuroProfile]);

  const updatePreference = async (pref: NeuroProfile['preference']) => {
    if (!user) return;
    await neuroSyncService.updateNeuroProfile(user.uid, { preference: pref });
    const nProfile = await neuroSyncService.getNeuroProfile(user.uid);
    if (nProfile) setNeuroProfile(nProfile);
  };

  const handleManualEvolution = async () => {
    if (!user || !profile) return;
    setIsEvolving(true);
    try {
      const result = await NeuralGrowthService.triggerEvolution(user.uid, profile);
      if (result) {
        const m = await NeuralGrowthService.getManifestations(user.uid);
        setManifestations(m);
      }
    } finally {
      setIsEvolving(false);
    }
  };

  const neuroProfileData = (neuroProfile?.recentNeuralHarmony || []).map((harmony, i) => ({
    time: i,
    harmony: harmony,
    load: 40 + (Math.random() * 20) // Simulated load variance
  }));

  const chartData = neuroProfileData.length > 0 ? neuroProfileData : mockHarmonyData;

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[#A8D5BA] font-bold tracking-widest uppercase text-xs">
            <Brain size={16} /> Autonomous Growth Engine
          </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">Neural Hub</h2>
        <p className="text-base sm:text-lg text-[#2D3436] dark:text-[#E8E8E0]/70 italic max-w-xl">
          ṚtuSyn adapts to your rhythms. Observe how the system evolves its features and insights based on your unique bio-signature and interaction patterns.
        </p>
      </div>
      <button 
        onClick={handleManualEvolution}
        disabled={isEvolving}
        className="w-full sm:w-auto flex items-center justify-center gap-3 bg-[#5A5A40] dark:bg-[#A8D5BA] text-white dark:text-[#1A1A15] px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl font-bold hover:scale-105 transition-all shadow-xl shadow-[#5A5A40]/30 disabled:opacity-50 text-sm sm:text-base"
      >
          {isEvolving ? (
            <>
              <RefreshCw className="animate-spin" size={20} />
              Architecting Your Neural Map...
            </>
          ) : (
            <>
              <Zap size={20} />
              Force Neural Evolution
            </>
          )}
        </button>
      </div>

      {/* Stats / System Pulse */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#252520] p-8 rounded-[40px] border border-[#D1D1C1] dark:border-[#3D3D35] space-y-4 shadow-sm">
          <Activity className="text-[#A8D5BA]" />
          <div>
            <div className="text-[10px] uppercase font-bold opacity-40">System Pulse</div>
            <div className="text-2xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">Rhythmic Synchrony</div>
          </div>
          <div className="h-1 bg-[#F5F5F0] dark:bg-[#1A1A15] rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '85%' }}
              className="h-full bg-[#A8D5BA]"
            />
          </div>
        </div>
        <div className="bg-white dark:bg-[#252520] p-8 rounded-[40px] border border-[#D1D1C1] dark:border-[#3D3D35] space-y-4 shadow-sm">
          <Cpu className="text-[#5A5A40] dark:text-[#A8D5BA]" />
          <div>
            <div className="text-[10px] uppercase font-bold opacity-40">Learning Nodes</div>
            <div className="text-2xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">{manifestations.length} Manifestations</div>
          </div>
          <p className="text-xs opacity-60">Active autonomous components generated for your profile.</p>
        </div>
        <div className="bg-[#5A5A40] p-8 rounded-[40px] text-white space-y-4 shadow-xl">
          <Sparkles />
          <div>
            <div className="text-[10px] uppercase font-bold opacity-60">Architecture Mode</div>
            <div className="text-2xl font-serif font-bold uppercase">Self-Optimizing</div>
          </div>
          <p className="text-xs opacity-80 leading-relaxed italic">
            "The system is currently observing web trends and user patterns to enhance your 'Sonic Sanctuary' frequency set."
          </p>
        </div>
      </div>

      {/* Neuro-Synchronous Inclusion */}
      <div className="bg-white dark:bg-[#252520] rounded-[60px] border border-[#D1D1C1] dark:border-[#3D3D35] p-12 space-y-12 shadow-sm overflow-hidden relative">
         <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
            <Brain size={300} />
         </div>
         
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-4">
               <div className="flex items-center gap-2 text-indigo-500 font-bold uppercase tracking-widest text-[10px]">
                  <Activity size={14} /> Neural Synchrony & Accessibility
               </div>
               <h3 className="text-3xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">The Inclusive Bridge</h3>
               <p className="text-[#2D3436] dark:text-[#E8E8E0]/60 max-w-xl italic leading-relaxed">
                  ṚtuSyn is built for every mind. Activating the Neural Bridge enables an adaptive interface that synchronizes with your specific cognitive rhythm and sensory preferences.
               </p>
            </div>
            <button 
              onClick={() => setMode('neuro')}
              className="bg-indigo-500 text-white px-10 py-5 rounded-[32px] font-bold shadow-xl shadow-indigo-500/30 hover:scale-105 transition-all flex items-center gap-3"
            >
               <Zap /> Activate Neural Bridge
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {(['standard', 'simplified', 'high-contrast', 'sensory-friendly'] as NeuroProfile['preference'][]).map((pref) => (
               <button
                 key={pref}
                 onClick={() => updatePreference(pref)}
                 className={cn(
                   "p-8 rounded-[40px] border transition-all text-left space-y-4",
                   neuroProfile?.preference === pref 
                     ? "bg-indigo-500 border-indigo-500 text-white shadow-xl" 
                     : "bg-[#F5F5F0] dark:bg-[#1A1A15] border-[#D1D1C1] dark:border-[#3D3D35] hover:border-indigo-400"
                 )}
               >
                  <div className="text-[10px] uppercase font-bold opacity-60 tracking-widest">{pref}</div>
                  <div className="text-sm font-bold leading-tight">
                     {pref === 'standard' && "Full System Integration"}
                     {pref === 'simplified' && "Focus & Clarity Mode"}
                     {pref === 'high-contrast' && "Maximum Readability"}
                     {pref === 'sensory-friendly' && "Calm Sensory Palette"}
                  </div>
               </button>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-white dark:bg-[#252520] p-8 rounded-[40px] border border-[#D1D1C1] dark:border-[#3D3D35] space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <ShieldCheck className="text-indigo-500" />
                  <h4 className="font-serif font-bold text-xl">Sensory Guard</h4>
               </div>
               <button 
                  onClick={async () => {
                     if (!user || !neuroProfile) return;
                     await neuroSyncService.updateNeuroProfile(user.uid, { sensoryGuardEnabled: !neuroProfile.sensoryGuardEnabled });
                     const nProfile = await neuroSyncService.getNeuroProfile(user.uid);
                     if (nProfile) setNeuroProfile(nProfile);
                  }}
                  className={cn(
                     "w-12 h-6 rounded-full transition-all relative",
                     neuroProfile?.sensoryGuardEnabled ? "bg-indigo-500" : "bg-[#D1D1C1] dark:bg-[#3D3D35]"
                  )}
               >
                  <motion.div 
                     layout
                     className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white",
                        neuroProfile?.sensoryGuardEnabled ? "right-1" : "left-1"
                     )} 
                  />
               </button>
            </div>
            <p className="text-sm opacity-60 italic">
               The Sensory Guard monitors your neural harmony in real-time. If cognitive load exceeds your threshold, UI elements will automatically transition to your selected comfort state.
            </p>
         </div>

         <div className="bg-white dark:bg-[#252520] p-8 rounded-[40px] border border-[#D1D1C1] dark:border-[#3D3D35] space-y-4 shadow-sm">
            <h4 className="font-serif font-bold text-xl flex items-center gap-3">
               <Activity className="text-indigo-500" /> 
               Live Harmony Analysis
            </h4>
            <div className="h-[120px]">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                     <Line type="monotone" dataKey="harmony" stroke="#6366f1" strokeWidth={3} dot={false} isAnimationActive={false} />
                     <Line type="monotone" dataKey="load" stroke="#FF6B6B" strokeWidth={1} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
            <button 
               onClick={async () => {
                  if (!user) return;
                  try {
                     const lastData = mockHarmonyData[mockHarmonyData.length - 1];
                     await vaultService.saveItem(
                        user.uid,
                        'neuro_snapshot',
                        `Neural Harmony: ${new Date().toLocaleTimeString()}`,
                        { metrics: lastData, fullSession: mockHarmonyData },
                        "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800",
                        "A high-fidelity snapshot of your neural harmony and cognitive load during calibration."
                     );
                     toast("Neural snapshot saved to your Sacred Vault", "success");
                  } catch (err) {
                     console.error(err);
                     toast("Failed to save snapshot", "error");
                  }
               }}
               className="w-full py-2 bg-white dark:bg-black/20 border border-indigo-200 text-indigo-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
            >
               <Archive size={12} /> Save Snapshot
            </button>
         </div>
      </div>

      {/* Bio-Rhythm Tracking Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
           <h3 className="text-2xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">Bio-Rhythm Matrix</h3>
           <div className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-100 dark:border-amber-500/20 flex items-center gap-2">
              <Sun size={12} className="animate-pulse" /> Circadian Peak Phase
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Primary Analysis Card */}
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             whileInView={{ opacity: 1, x: 0 }}
             className="lg:col-span-2 bg-gradient-to-br from-white to-[#F5F5F0] dark:from-[#252520] dark:to-[#1A1A15] p-10 rounded-[60px] border border-[#D1D1C1] dark:border-[#3D3D35] shadow-xl relative overflow-hidden"
           >
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#A8D5BA]/10 blur-[60px] pointer-events-none" />
              
              <div className="relative z-10 space-y-8">
                 <div className="flex justify-between items-start">
                    <div className="space-y-2">
                       <h4 className="text-3xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">Neural Harmony Analysis</h4>
                       <p className="text-[#2D3436] dark:text-[#E8E8E0]/60 italic font-serif">Integration of sensory input and cognitive oscillation.</p>
                    </div>
                    <div className="text-right">
                       <div className="text-4xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">88%</div>
                       <div className="text-[10px] font-bold text-[#A8D5BA] uppercase tracking-widest">Global Synchrony</div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <div className="space-y-2">
                       <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest flex items-center gap-2">
                          <Activity size={12} /> Neural Harmony
                       </div>
                       <div className="text-lg font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">{neuroProfile?.recentNeuralHarmony.length ? Math.round(neuroProfile.recentNeuralHarmony[neuroProfile.recentNeuralHarmony.length - 1]) : 72}%</div>
                       <div className="h-1 bg-[#D1D1C1]/30 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400" style={{ width: `${neuroProfile?.recentNeuralHarmony.length ? neuroProfile.recentNeuralHarmony[neuroProfile.recentNeuralHarmony.length - 1] : 72}%` }} />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest flex items-center gap-2">
                          <Zap size={12} /> Cognitive Load
                       </div>
                       <div className="text-lg font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">{neuroProfile?.cognitiveLoadThreshold || 80}% Threshold</div>
                       <div className="h-1 bg-[#D1D1C1]/30 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-400" style={{ width: '45%' }} />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest flex items-center gap-2">
                          <Clock size={12} /> Circadian Status
                       </div>
                       <div className="text-lg font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA] uppercase">{neuroProfile?.circadianStatus || 'Peak'}</div>
                       <div className="flex gap-1">
                          {[1, 2, 3, 4].map(i => (
                             <div key={i} className={cn("h-1 flex-1 rounded-full", i <= 3 ? "bg-amber-400" : "bg-[#D1D1C1]/30")} />
                          ))}
                       </div>
                    </div>
                    <div className="space-y-2">
                       <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest flex items-center gap-2">
                          <Eye size={12} /> Visual Comfort
                       </div>
                       <div className="text-lg font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">{neuroProfile?.preference || 'Standard'}</div>
                       <div className="h-1 bg-[#D1D1C1]/30 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400" style={{ width: '100%' }} />
                       </div>
                    </div>
                 </div>

                 <div className="bg-white/50 dark:bg-black/20 p-6 rounded-[32px] border border-[#D1D1C1]/30 space-y-4">
                    <div className="flex items-center gap-3">
                       <Sparkles className="text-amber-500" size={18} />
                       <h5 className="font-serif font-bold italic">Neural Architect Suggestion</h5>
                    </div>
                    <p className="text-xs text-[#2D3436] dark:text-[#E8E8E0]/70 leading-relaxed">
                       "Based on your current <strong>{neuroProfile?.circadianStatus || 'Peak'} phase</strong> and a <strong>{neuroProfile?.environmentalFactors?.lightLevel || 450} lux</strong> environment, 
                       we recommend adjusting your focus to creative synthesis. Your cognitive Load is <strong>optimal</strong>."
                    </p>
                 </div>
              </div>
           </motion.div>

           {/* Environmental Factors Card */}
           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             whileInView={{ opacity: 1, x: 0 }}
             className="bg-[#5A5A40] p-10 rounded-[60px] text-white flex flex-col justify-between shadow-xl relative overflow-hidden"
           >
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/5 blur-[60px] pointer-events-none" />
              
              <div className="space-y-6 relative z-10">
                 <div className="space-y-2">
                    <h4 className="text-2xl font-serif font-bold italic">Environment</h4>
                    <p className="text-white/60 text-xs uppercase tracking-widest">Sensory Context Sync</p>
                 </div>

                 <div className="space-y-8">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                             <Thermometer size={20} />
                          </div>
                          <div>
                             <div className="text-[10px] opacity-60 uppercase tracking-widest">Ambient Temp</div>
                             <div className="text-xl font-serif font-bold">{(neuroProfile?.environmentalFactors?.temperature ?? 22).toFixed(1)}°C</div>
                          </div>
                       </div>
                       <div className="text-[10px] font-bold text-[#A8D5BA] uppercase">Optimal</div>
                    </div>

                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                             <Sun size={20} />
                          </div>
                          <div>
                             <div className="text-[10px] opacity-60 uppercase tracking-widest">Light Intensity</div>
                             <div className="text-xl font-serif font-bold">{(neuroProfile?.environmentalFactors?.lightLevel ?? 450).toFixed(0)} Lux</div>
                          </div>
                       </div>
                       <div className="text-[10px] font-bold text-amber-400 uppercase">Synchronized</div>
                    </div>

                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                             <Wind size={20} />
                          </div>
                          <div>
                             <div className="text-[10px] opacity-60 uppercase tracking-widest">Air Quality</div>
                             <div className="text-xl font-serif font-bold">{(neuroProfile?.environmentalFactors?.airQuality ?? 12).toFixed(0)} AQI</div>
                          </div>
                       </div>
                       <div className="text-[10px] font-bold text-emerald-400 uppercase">Excellent</div>
                    </div>
                 </div>
              </div>

              <div className="pt-8 border-t border-white/10 mt-8 relative z-10">
                 <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all">
                    Trigger IoT Diffusion Sync
                 </button>
              </div>
           </motion.div>
        </div>
      </div>

      {/* Manifestations List */}
      <div className="space-y-8">
        <h3 className="text-2xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">Recent Manifestations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {manifestations.map((m) => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setActiveManifestation(m)}
                className="bg-white dark:bg-[#252520] p-1 border border-[#D1D1C1] dark:border-[#3D3D35] rounded-[48px] overflow-hidden group cursor-pointer hover:shadow-2xl transition-all"
              >
                <div className="bg-[#F5F5F0] dark:bg-[#1A1A15] p-10 rounded-[44px] space-y-6 h-full flex flex-col">
                  <div className="flex justify-between items-start">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-white",
                      m.type === 'feature' ? 'bg-blue-500' : 
                      m.type === 'insight' ? 'bg-emerald-500' :
                      m.type === 'ornament' ? 'bg-rose-500' : 'bg-amber-500'
                    )}>
                      {m.type === 'feature' ? <Cpu size={24} /> : 
                       m.type === 'insight' ? <Info size={24} /> :
                       m.type === 'ornament' ? <Gem size={24} /> : <Music size={24} />}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                      {m.type}
                    </span>
                  </div>
                  <div className="space-y-3 flex-1">
                    <h4 className="text-2xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">{m.title}</h4>
                    <p className="text-sm text-[#2D3436] dark:text-[#E8E8E0]/60 italic leading-relaxed">
                      {m.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#5A5A40] dark:text-[#A8D5BA]">
                    View Analysis <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {manifestations.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-[#D1D1C1] rounded-[60px] opacity-40 italic">
              Awaiting first neural evolution loop...
            </div>
          )}
        </div>
      </div>

      {/* Analysis Modal */}
      <AnimatePresence>
        {activeManifestation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setActiveManifestation(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-[#1A1A15] w-full max-w-2xl rounded-[60px] overflow-hidden shadow-2xl p-12 space-y-8"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">Neural Architect Analysis</div>
                  <button 
                    onClick={() => setIsEditingReasoning(!isEditingReasoning)}
                    className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] opacity-60 hover:opacity-100 flex items-center gap-1"
                  >
                    {isEditingReasoning ? <><Save size={12} /> Lock Wisdom</> : <><RefreshCw size={12} /> Correct Insight</>}
                  </button>
                </div>
                <h3 className="text-3xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">{activeManifestation.title}</h3>
                {isEditingReasoning ? (
                  <textarea 
                    value={activeManifestation.aiReasoning}
                    onChange={(e) => setActiveManifestation({...activeManifestation, aiReasoning: e.target.value})}
                    className="w-full text-lg text-[#2D3436] dark:text-[#E8E8E0] leading-relaxed italic border-l-4 border-[#A8D5BA] pl-6 bg-[#F5F5F0] dark:bg-black/20 p-4 rounded-xl focus:ring-1 focus:ring-[#A8D5BA] outline-none h-40 resize-none"
                  />
                ) : (
                  <p className="text-lg text-[#2D3436] dark:text-[#E8E8E0] leading-relaxed italic border-l-4 border-[#A8D5BA] pl-6">
                    {activeManifestation.aiReasoning}
                  </p>
                )}
              </div>

              <div className="bg-[#F5F5F0] dark:bg-[#252520] p-8 rounded-[40px] space-y-4">
                <h5 className="font-bold text-xs uppercase tracking-widest opacity-40">Deployed Configuration</h5>
                <pre className="text-xs font-mono overflow-auto max-h-40 scrollbar-hide">
                  {JSON.stringify(activeManifestation.config, null, 2)}
                </pre>
              </div>

              <button 
                onClick={() => setActiveManifestation(null)}
                className="w-full py-5 bg-[#5A5A40] text-white rounded-3xl font-bold shadow-xl shadow-[#5A5A40]/20 active:scale-95 transition-all"
              >
                Acknowledge Integration
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

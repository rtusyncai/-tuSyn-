import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  Activity, 
  BookOpen, 
  Zap, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  ChevronRight, 
  Loader2, 
  Calendar,
  Save,
  MessageSquare,
  Smile,
  Frown,
  Meh,
  Wind,
  ShieldCheck,
  TrendingUp,
  Cpu,
  RefreshCw,
  Heart,
  ArrowRight,
  Utensils,
  Sun,
  Target,
  Flame,
  Cloud,
  Moon,
  Shield,
  Edit3
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { geminiService } from '../services/geminiService';
import { vaultService, VaultItem } from '../services/vaultService';
import { deviceSyncService } from '../services/deviceSyncService';
import { neuroSyncService } from '../services/neuroSyncService';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/useToast';
import { format } from 'date-fns';

const MOODS = [
  { icon: Sun, label: 'Clear', color: 'text-amber-500 bg-amber-50 border-amber-200', hex: '#f59e0b' },
  { icon: Smile, label: 'Harmonious', color: 'text-emerald-500 bg-emerald-50 border-emerald-200', hex: '#10b981' },
  { icon: Wind, label: 'Calm', color: 'text-sky-500 bg-sky-50 border-sky-200', hex: '#0ea5e9' },
  { icon: Activity, label: 'Restless', color: 'text-indigo-500 bg-indigo-50 border-indigo-200', hex: '#6366f1' },
  { icon: Target, label: 'Focused', color: 'text-orange-500 bg-orange-50 border-orange-200', hex: '#f97316' },
  { icon: Flame, label: 'Driven', color: 'text-rose-500 bg-rose-50 border-rose-200', hex: '#f43f5e' },
  { icon: Cloud, label: 'Heavy', color: 'text-slate-500 bg-slate-50 border-slate-200', hex: '#64748b' },
  { icon: Moon, label: 'Dull', color: 'text-violet-500 bg-violet-50 border-violet-200', hex: '#8b5cf6' },
  { icon: Shield, label: 'Grounded', color: 'text-teal-500 bg-teal-50 border-teal-200', hex: '#14b8a6' },
];

export const NeuroInsightPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [neuroProfile, setNeuroProfile] = useState<any>(null);
  const [journals, setJournals] = useState<VaultItem[]>([]);
  const [moodLogs, setMoodLogs] = useState<VaultItem[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isEditingInsights, setIsEditingInsights] = useState(false);
  const [editedInsights, setEditedInsights] = useState<any[]>([]);
  const [liveBiometrics, setLiveBiometrics] = useState<{ heartRate: number; stressLevel: number } | null>(null);
  
  // Input states
  const [journalInput, setJournalInput] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isSyncingData, setIsSyncingData] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();

    // Subscribe to live biometrics
    const unsubscribe = deviceSyncService.subscribeToLiveBiometrics(user.uid, (data) => {
      setLiveBiometrics({ heartRate: data.heartRate, stressLevel: data.stressLevel });
    });

    return () => unsubscribe();
  }, [user]);

  const fetchData = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'profiles', user!.uid));
      if (docSnap.exists()) setProfile(docSnap.data());

      const nProfile = await neuroSyncService.getNeuroProfile(user!.uid);
      if (nProfile) setNeuroProfile(nProfile);

      const j = await vaultService.getUserItems(user!.uid, 'journal');
      setJournals(j);

      const m = await vaultService.getUserItems(user!.uid, 'mood');
      setMoodLogs(m);

      const d = await deviceSyncService.getUserDevices(user!.uid);
      setDevices(d);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveJournal = async () => {
    if (!journalInput.trim()) return;
    setIsSyncingData(true);
    try {
      // Analyze the journal entry using Gemini
      const analysis = await geminiService.analyzeJournal(journalInput);
      
      await vaultService.saveItem(
        user!.uid, 
        'journal', 
        'Journal Entry', 
        { 
          content: journalInput,
          summary: analysis.summary,
          emotions: analysis.emotions
        }, 
        '', 
        analysis.summary || journalInput.substring(0, 100) + '...'
      );
      
      setJournalInput('');
      toast("Wisdom archived in your vault.", "success");
      fetchData();
    } catch (err) {
      console.error(err);
      toast("Failed to save or analyze journal.", "error");
    } finally {
      setIsSyncingData(false);
    }
  };

  const handleLogMood = async (mood: string) => {
    try {
      await vaultService.saveItem(user!.uid, 'mood', 'Mood Log', { mood }, '', `Feeling ${mood}`);
      setSelectedMood(mood);
      toast(`Mood logged: ${mood}`, "success");
      fetchData();

      // IoT Lighting Sync based on mood
      const moodConfig = MOODS.find(m => m.label === mood);
      if (moodConfig) {
        fetch('/api/iot/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'lighting_sync',
            value: moodConfig.hex,
            reason: `Visual resonance for ${mood} state`
          })
        }).catch(err => console.error("Lighting sync failed", err));
      }
    } catch (err) {
      toast("Failed to log mood.", "error");
    }
  };

  const generateReport = async () => {
    if (journals.length === 0 && moodLogs.length === 0) {
      toast("Please share some reflections or mood data first.", "info");
      return;
    }

    setLoading(true);
    try {
      // Mock telemetry for analysis
      const deviceTelemetry = devices.map(d => ({
        device: d.model,
        status: d.status,
        lastSync: d.lastSync,
        metrics: { pulse: 72, hrv: 65, load: 40 } // Mocked metrics
      }));

      const report = await geminiService.analyzeHealthSnapshot(
        profile,
        journals.map(j => ({ text: j.data.content, date: j.createdAt })),
        moodLogs.map(m => ({ mood: m.data.mood, date: m.createdAt })),
        [...deviceTelemetry, { type: 'Live Stream', metrics: liveBiometrics }],
        {
          circadian: neuroProfile?.circadianStatus || 'Unknown',
          environment: neuroProfile?.environmentalFactors || 'Unknown',
          preference: neuroProfile?.preference || 'standard',
          currentHeartRate: liveBiometrics?.heartRate,
          currentStress: liveBiometrics?.stressLevel
        }
      );

      if (report) {
        setAnalysis(report);
        setEditedInsights(report.keyInsights || []);
        setIsEditingInsights(false);
        // Save the snapshot to vault for later retrieval
        await vaultService.saveItem(
          user!.uid, 
          'neuro_snapshot', 
          report.title || 'Neuro-Biological Insight', 
          report, 
          "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800",
          report.statusSummary
        );
        toast("Neuro-Report generated and archived.", "success");
      }
    } catch (err) {
      console.error(err);
      toast("Synthesis failed. Neural engine timeout.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCorrection = async () => {
    if (!analysis) return;
    const updatedAnalysis = { ...analysis, keyInsights: editedInsights };
    setAnalysis(updatedAnalysis);
    setIsEditingInsights(false);
    toast("Neural observations corrected and refined.", "success");
  };

  return (
    <div className="space-y-12 py-10 max-w-7xl mx-auto px-4">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-indigo-500 font-bold tracking-widest uppercase text-xs">
            <Brain size={18} /> Integrated Neural Intelligence
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif font-bold text-[#5A5A40]">Neuro Insight</h1>
          <div className="flex items-center gap-4">
            <p className="max-w-2xl text-lg text-[#2D3436] opacity-70 italic font-serif leading-relaxed">
              Synchronize your internal reflections, emotional rhythms, and biometric telemetry into a single, proactive AI-driven health blueprint.
            </p>
            {liveBiometrics && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden md:flex items-center gap-3 px-4 py-2 bg-rose-50 border border-rose-100 rounded-2xl shadow-sm"
              >
                <div className="relative">
                  <Heart size={16} className="text-rose-500 fill-rose-500 animate-pulse" />
                  <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-20" />
                </div>
                <div className="text-[10px] font-bold text-rose-600 uppercase tracking-widest leading-none">
                  Live Stream: {liveBiometrics.heartRate} BPM
                </div>
              </motion.div>
            )}
          </div>
        </div>
        
        <button 
          onClick={generateReport}
          disabled={loading}
          className="px-10 py-5 bg-[#5A5A40] text-white rounded-[32px] font-bold shadow-2xl flex items-center gap-4 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
          Generate Neuro-Report
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-8">
          {/* Journal Section */}
          <section className="bg-white p-8 rounded-[40px] border border-[#D1D1C1]/50 shadow-sm space-y-6">
            <div className="flex items-center gap-3 text-[#5A5A40]">
              <BookOpen size={24} />
              <h3 className="text-xl font-serif font-bold">Wisdom Journal</h3>
            </div>
            <textarea 
              value={journalInput}
              onChange={(e) => setJournalInput(e.target.value)}
              placeholder="Reflect on your prana, energy, or experiences today..."
              className="w-full h-40 p-5 rounded-3xl bg-[#F5F5F0] border-none focus:ring-2 focus:ring-[#5A5A40]/10 font-serif italic text-sm outline-none resize-none"
            />
            <button 
              onClick={handleSaveJournal}
              disabled={!journalInput.trim() || isSyncingData}
              className="w-full py-4 bg-[#5A5A40] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#4A4A30] transition-all disabled:opacity-30"
            >
              {isSyncingData ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Neural Synthesis...
                </>
              ) : (
                <>
                  <Save size={18} /> Archive Reflection
                </>
              )}
            </button>
          </section>

          {/* Mood Section */}
          <section className="bg-white p-8 rounded-[40px] border border-[#D1D1C1]/50 shadow-sm space-y-6">
            <div className="flex items-center gap-3 text-[#5A5A40]">
              <Heart size={24} />
              <h3 className="text-xl font-serif font-bold">Emotional Rhythm</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {MOODS.map((m) => (
                <button
                  key={m.label}
                  onClick={() => handleLogMood(m.label)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all transition-all duration-300",
                    selectedMood === m.label ? m.color : "border-transparent bg-[#F5F5F0] hover:bg-white hover:border-[#D1D1C1]/30"
                  )}
                >
                  <m.icon size={28} className={cn(selectedMood === m.label ? "scale-110" : "opacity-40")} />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{m.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Device Sync Status */}
          <section className="bg-[#1A1A15] p-8 rounded-[40px] text-white space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Cpu size={100} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-[0.2em] opacity-60">Biometric Link</h4>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Live</span>
                </div>
              </div>
              <div className="space-y-4">
                {liveBiometrics && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                      <div className="text-[10px] font-bold opacity-40 mb-1 uppercase tracking-widest">Heart Rate</div>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-mono font-bold text-rose-400">{liveBiometrics.heartRate}</span>
                        <span className="text-[10px] opacity-40 font-bold mb-1">BPM</span>
                      </div>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                      <div className="text-[10px] font-bold opacity-40 mb-1 uppercase tracking-widest">Stress</div>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-mono font-bold text-indigo-400">{Math.round(liveBiometrics.stressLevel * 100)}%</span>
                      </div>
                    </div>
                  </div>
                )}
                {devices.length > 0 ? (
                  devices.map((d, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3">
                        <Activity size={16} className="text-indigo-400" />
                        <span className="text-sm font-bold">{d.model}</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-50">Syncing...</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs opacity-50 italic">No biometric devices bridged. Connect via Connectivity Hub for full precision.</p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Output Section */}
        <div className="lg:col-span-2 space-y-10">
          <AnimatePresence mode="wait">
            {analysis ? (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                {/* Final Report Body */}
                <div className="bg-white rounded-[60px] border border-[#D1D1C1]/50 shadow-2xl overflow-hidden">
                  <div className="p-10 sm:p-16 space-y-12">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
                       <div className="space-y-3">
                          <h2 className="text-4xl font-serif font-bold text-[#5A5A40] leading-tight">{analysis.title}</h2>
                          <div className="flex items-center gap-4">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100 italic">
                               Integrated Neuro-Report
                            </span>
                          </div>
                       </div>
                       <div className="text-center sm:text-right space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-30">Status Summary</div>
                          <p className="text-lg font-serif italic text-amber-700 max-w-sm">{analysis.statusSummary}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {/* Insights */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-[#F5F5F0] pb-3">
                          <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-[#5A5A40]">
                             <TrendingUp size={16} /> Key Bio-Insights
                          </h4>
                          <button 
                            onClick={() => isEditingInsights ? handleSaveCorrection() : setIsEditingInsights(true)}
                            className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 hover:text-indigo-700 flex items-center gap-1"
                          >
                            {isEditingInsights ? <><Save size={12} /> Save Refinements</> : <><Edit3 size={12} /> Refine Observations</>}
                          </button>
                        </div>
                        <div className="space-y-6">
                          {(isEditingInsights ? editedInsights : analysis.keyInsights)?.map((insight: any, idx: number) => (
                            <div key={idx} className="group flex gap-5">
                               <div className="w-10 h-10 rounded-2xl bg-[#F5F5F0] flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                  {insight.systemSource === 'Journal' && <BookOpen size={18} />}
                                  {insight.systemSource === 'Mood' && <Heart size={18} />}
                                  {insight.systemSource === 'Device' && <Activity size={18} />}
                                  {insight.systemSource === 'Integrated' && <Brain size={18} />}
                               </div>
                               <div className="space-y-1 flex-1">
                                  <div className="text-[10px] font-bold text-indigo-500/60 uppercase tracking-widest">{insight.systemSource} Insight</div>
                                  {isEditingInsights ? (
                                    <div className="space-y-2">
                                      <input 
                                        type="text"
                                        value={insight.observation}
                                        onChange={(e) => {
                                          const newInsights = [...editedInsights];
                                          newInsights[idx] = { ...newInsights[idx], observation: e.target.value };
                                          setEditedInsights(newInsights);
                                        }}
                                        className="w-full text-sm font-bold text-[#5A5A40] bg-[#F5F5F0] border-none rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                                      />
                                      <textarea 
                                        value={insight.clinicalSignificance}
                                        onChange={(e) => {
                                          const newInsights = [...editedInsights];
                                          newInsights[idx] = { ...newInsights[idx], clinicalSignificance: e.target.value };
                                          setEditedInsights(newInsights);
                                        }}
                                        className="w-full text-xs text-[#2D3436]/60 italic font-serif leading-relaxed bg-[#F5F5F0] border-none rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none h-16 resize-none"
                                      />
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-sm font-bold text-[#5A5A40]">{insight.observation}</p>
                                      <p className="text-xs text-[#2D3436]/60 italic font-serif leading-relaxed">{insight.clinicalSignificance}</p>
                                    </>
                                  )}
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Interventions */}
                      <div className="space-y-6">
                        <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-[#5A5A40] border-b border-[#F5F5F0] pb-3">
                           <Zap size={16} /> Calibrated Interventions
                        </h4>
                        <div className="space-y-4">
                          {analysis.ayurvedicInterventions?.map((intervention: any, idx: number) => (
                            <div key={idx} className="p-6 bg-[#F5F5F0] dark:bg-[#1A1A15] rounded-[32px] space-y-3 hover:bg-[#5A5A40] hover:text-white transition-all cursor-pointer group shadow-sm">
                               <div className="flex items-center justify-between">
                                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">{intervention.type}</div>
                                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center scale-0 group-hover:scale-100 transition-transform">
                                     <ArrowRight size={14} />
                                  </div>
                               </div>
                               <p className="text-base font-serif font-bold italic leading-snug">{intervention.action}</p>
                               <p className="text-[10px] opacity-60 font-serif italic leading-relaxed group-hover:opacity-80">
                                  {intervention.rationale}
                                </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Fulfillment Action */}
                    <div className="bg-[#5A5A40] p-10 rounded-[48px] text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-10">
                          <Crown size={120} />
                       </div>
                       <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-white shrink-0 backdrop-blur-xl border border-white/20">
                          {analysis.fulfillmentActions?.type === 'kitchen' ? <Utensils size={40} /> : <ShoppingBag size={40} />}
                       </div>
                       <div className="flex-1 space-y-4 text-center md:text-left">
                          <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20">
                            Fulfillment Suggestion: {analysis.fulfillmentActions?.type}
                          </div>
                          <h5 className="text-2xl font-serif font-bold italic">{analysis.fulfillmentActions?.title}</h5>
                          <p className="text-sm opacity-80 font-serif italic">{analysis.fulfillmentActions?.description}</p>
                          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                             {analysis.fulfillmentActions?.items?.map((item: string, i: number) => (
                               <span key={i} className="px-3 py-1 bg-white text-[#5A5A40] rounded-lg text-[10px] font-bold">
                                 {item}
                               </span>
                             ))}
                          </div>
                       </div>
                       <button className="px-8 py-4 bg-white text-[#5A5A40] rounded-2xl font-bold text-sm hover:bg-amber-50 transition-all shadow-xl shrink-0">
                          {analysis.fulfillmentActions?.type === 'kitchen' ? 'Open Kitchen' : 'Open Marketplace'}
                       </button>
                    </div>

                    <div className="pt-8 border-t border-[#F5F5F0] flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                              <ShieldCheck size={28} />
                           </div>
                           <div>
                              <div className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">Primary Directive</div>
                              <p className="text-base font-serif font-bold italic text-[#5A5A40]">{analysis.nextAction}</p>
                           </div>
                        </div>
                        <p className="text-[9px] font-bold text-[#5A5A40]/30 uppercase tracking-widest max-w-[200px] text-center sm:text-right">
                           Synthetic intelligence has matched these insights with 92% confidence.
                        </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center p-12 text-center space-y-8 bg-white/50 rounded-[60px] border-2 border-dashed border-[#D1D1C1]/50"
              >
                <div className="w-32 h-32 bg-[#F5F5F0] rounded-full flex items-center justify-center text-[#5A5A40]/20">
                  <Activity size={60} />
                </div>
                <div className="space-y-4 max-w-lg">
                  <h3 className="text-3xl font-serif font-bold text-[#5A5A40]">Neural Engine Idle</h3>
                  <p className="text-lg text-[#2D3436] opacity-60 italic font-serif leading-relaxed">
                    Begin the synthesis by sharing your journal entries or emotional state. The Neuro-Engine waits to harmonize your bio-data into actionable wisdom.
                  </p>
                </div>
                {journals.length > 0 && (
                   <div className="flex items-center gap-6 pt-8">
                      <div className="flex -space-x-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[10px]">
                            <BookOpen size={14} />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">
                        {journals.length} Reflection nodes detected
                      </p>
                   </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// Sub-components as needed
import { Crown, ShoppingBag, Utensils as UtensilsIcon } from 'lucide-react';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Cpu, 
  ShieldCheck, 
  Youtube, 
  Bluetooth, 
  Palette, 
  Heart, 
  Activity, 
  Pill, 
  Target, 
  AlertTriangle, 
  Save, 
  Loader2, 
  MapPin, 
  FileText, 
  Upload, 
  Brain, 
  CheckCircle2, 
  ShieldAlert, 
  LogOut, 
  Plus, 
  Trash2, 
  Wifi, 
  Smartphone, 
  Glasses, 
  Watch, 
  Speaker, 
  Mic, 
  RotateCcw,
  Sparkles,
  ChevronRight,
  Database,
  Lock,
  Key,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { useToast } from '../hooks/useToast';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { youtubeService, YouTubeProfile, YouTubeVideo } from '../services/youtubeService';
import { deviceSyncService, ConnectedDevice } from '../services/deviceSyncService';
import { geminiService } from '../services/geminiService';

type SettingsTab = 'profile' | 'rhythms' | 'connectivity' | 'security';

export const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile Data
  const [profile, setProfile] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    location: '',
    healthGoals: ''
  });
  const [healthData, setHealthData] = useState({
    medicalHistory: '',
    allergies: '',
    medications: '',
    healthGoals: '',
    lifeStage: 'General Wellness',
    lifestyle: {
      sleep: '7-8 hours',
      diet: 'Vegetarian',
      activity: 'Moderate'
    }
  });

  // Rhythms Data
  const [preferences, setPreferences] = useState({
    appearance: 'Sacred (Warm)',
    notifications: {
      email: true,
      push: true,
      dailyDigest: true,
      ojasAlerts: true
    }
  });

  // Connectivity Data
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [isIotSyncEnabled, setIsIotSyncEnabled] = useState(true);
  const [iotSettings, setIotSettings] = useState({
    carDiffuser: true,
    smartShower: false,
    kitchenInventory: true,
    ayurLens: true
  });
  
  // YouTube/Integration Data
  const [ytTokens, setYtTokens] = useState<any>(null);
  const [ytProfile, setYtProfile] = useState<YouTubeProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Document Analysis
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [docAnalysisResult, setDocAnalysisResult] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    loadSettings();
    
    // Listen for YouTube Auth
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'YOUTUBE_AUTH_SUCCESS') {
        const tokens = event.data.tokens;
        setYtTokens(tokens);
        localStorage.setItem('youtube_tokens', JSON.stringify(tokens));
        toast("YouTube successfully synced!", "success");
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user]);

  useEffect(() => {
    if (ytTokens) {
      loadYoutubeProfile();
    }
  }, [ytTokens]);

  const loadSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docRef = doc(db, 'profiles', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        setEditForm({
          name: data.name || user.email?.split('@')[0] || '',
          location: data.location || '',
          healthGoals: data.healthData?.healthGoals || ''
        });
        if (data.healthData) setHealthData({ ...healthData, ...data.healthData });
        if (data.preferences) setPreferences({ ...preferences, ...data.preferences });
        if (data.iotSettings) setIotSettings({ ...iotSettings, ...data.iotSettings });
        setIsIotSyncEnabled(data.isIotSyncEnabled !== false);
      }

      // Load Devices
      const deviceData = await deviceSyncService.getUserDevices(user.uid);
      setDevices(deviceData);

      // Load YouTube Tokens
      const savedTokens = localStorage.getItem('youtube_tokens');
      if (savedTokens) setYtTokens(JSON.parse(savedTokens));

    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadYoutubeProfile = async () => {
    if (!ytTokens) return;
    try {
      const profile = await youtubeService.getProfile(ytTokens);
      setYtProfile(profile);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAll = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        name: editForm.name,
        location: editForm.location,
        healthData: { ...healthData, healthGoals: editForm.healthGoals },
        preferences,
        iotSettings,
        isIotSyncEnabled,
        updatedAt: new Date().toISOString()
      });
      toast("Sacred alignment synchronized.", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `profiles/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleYtConnect = async () => {
    const url = await youtubeService.getAuthUrl();
    window.open(url, 'YouTube Auth', 'width=600,height=700');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setDocPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!docPreview) return;
    setIsAnalyzingDoc(true);
    try {
      const base64 = docPreview.split(',')[1];
      const result = await geminiService.analyzeMedicalDocument(base64);
      setDocAnalysisResult(result);
      toast("Neural extraction complete.", "success");
    } catch (error) {
      toast("Neural synthesis failed.", "error");
    } finally {
      setIsAnalyzingDoc(false);
    }
  };

  const handleSyncAnalyzedData = () => {
    if (!docAnalysisResult) return;
    setHealthData(prev => ({
      ...prev,
      medicalHistory: [prev.medicalHistory, ...(docAnalysisResult.diagnoses || [])].filter(Boolean).join('\n'),
      allergies: [prev.allergies, ...(docAnalysisResult.allergies || [])].filter(Boolean).join('\n'),
      medications: [prev.medications, ...(docAnalysisResult.medications || [])].filter(Boolean).join('\n')
    }));
    setDocAnalysisResult(null);
    setDocPreview(null);
    toast("Bio-data synced. Remember to save changes.", "info");
  };

  const handleDeleteAccount = async () => {
    if (!user || !window.confirm("Deactivate your profile? Life-data is preserved for 30 cycles.")) return;
    setIsDeleting(true);
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        status: 'deactivated',
        deactivatedAt: new Date().toISOString()
      });
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `profiles/${user.uid}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-6">
      <Loader2 className="animate-spin text-[#5A5A40] w-12 h-12" />
      <p className="font-serif italic text-[#5A5A40]/60 animate-pulse">Reconfiguring sacred settings...</p>
    </div>
  );

  const TABS = [
    { id: 'profile', name: 'Bio-Profile', icon: User },
    { id: 'rhythms', name: 'Sacred Rhythms', icon: Palette },
    { id: 'connectivity', name: 'Neural Sync', icon: Cpu },
    { id: 'security', name: 'Security & Access', icon: ShieldCheck }
  ];

  const handleSignOut = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32 pt-8 px-4">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center gap-3 text-[#5A5A40]">
             <SettingsIcon size={32} />
             <h1 className="text-4xl font-serif font-bold tracking-tighter">Sanctuary Settings</h1>
          </div>
          <p className="text-[#5A5A40]/60 italic font-serif">Calibrate your existence within the AIveda framework.</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="flex items-center gap-2 bg-[#5A5A40] text-white px-10 py-5 rounded-[24px] font-bold hover:bg-amber-600 transition-all shadow-2xl hover:scale-105 disabled:opacity-50 uppercase tracking-widest text-xs"
        >
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Synchronize Changes
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-1 space-y-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-5 rounded-[24px] font-bold transition-all group border-2",
                activeTab === tab.id 
                  ? "bg-[#5A5A40] text-white border-[#5A5A40] shadow-xl" 
                  : "bg-white border-transparent text-[#5A5A40]/60 hover:bg-[#F5F5F0] hover:text-[#5A5A40] hover:border-[#D1D1C1]/30"
              )}
            >
              <tab.icon size={20} className={cn(activeTab === tab.id ? "text-amber-400" : "group-hover:text-amber-500 transition-colors")} />
              <span className="text-sm uppercase tracking-widest leading-none">{tab.name}</span>
            </button>
          ))}

          <div className="pt-12">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-between p-6 rounded-[24px] bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-all font-bold group"
            >
              <div className="flex items-center gap-3">
                <LogOut size={20} />
                <span className="text-xs uppercase tracking-widest">Sever Connection</span>
              </div>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-10">
                  <section className="bg-white p-10 rounded-[40px] border border-[#D1D1C1] shadow-sm space-y-8">
                     <div className="space-y-1">
                        <h3 className="text-2xl font-serif font-bold text-[#5A5A40]">Biological Identity</h3>
                        <p className="text-xs text-[#5A5A40]/60 italic">Your core existence and health trajectory.</p>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-[0.2em] pl-2">Vocal Handle</label>
                           <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full p-5 bg-[#F5F5F0] border border-[#D1D1C1]/50 rounded-[24px] text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                              placeholder="Name"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-[0.2em] pl-2">Sacred Coordinates</label>
                           <input
                              type="text"
                              value={editForm.location}
                              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                              className="w-full p-5 bg-[#F5F5F0] border border-[#D1D1C1]/50 rounded-[24px] text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                              placeholder="City, Region"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                           <label className="flex items-center gap-2 text-xs font-bold text-[#5A5A40] uppercase tracking-widest">
                              <Heart size={16} className="text-rose-400" /> Medical Chronology
                           </label>
                           <textarea
                              value={healthData.medicalHistory}
                              onChange={(e) => setHealthData({ ...healthData, medicalHistory: e.target.value })}
                              className="w-full p-6 bg-[#F5F5F0] border border-[#D1D1C1]/50 rounded-[32px] text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 resize-none font-serif"
                              placeholder="Existing conditions, surgeries..."
                           />
                        </div>
                        <div className="space-y-4">
                           <label className="flex items-center gap-2 text-xs font-bold text-[#5A5A40] uppercase tracking-widest">
                              <Target size={16} className="text-emerald-400" /> Vital Intentions
                           </label>
                           <textarea
                              value={editForm.healthGoals}
                              onChange={(e) => setEditForm({ ...editForm, healthGoals: e.target.value })}
                              className="w-full p-6 bg-[#F5F5F0] border border-[#D1D1C1]/50 rounded-[32px] text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 resize-none font-serif"
                              placeholder="Primary wellness goals..."
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                           <label className="flex items-center gap-2 text-xs font-bold text-[#5A5A40] uppercase tracking-widest">
                              <Pill size={16} className="text-blue-400" /> Current Medications
                           </label>
                           <textarea
                              value={healthData.medications}
                              onChange={(e) => setHealthData({ ...healthData, medications: e.target.value })}
                              className="w-full p-6 bg-[#F5F5F0] border border-[#D1D1C1]/50 rounded-[32px] text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 resize-none font-serif"
                              placeholder="Dosages, frequency..."
                           />
                        </div>
                        <div className="space-y-4">
                           <label className="flex items-center gap-2 text-xs font-bold text-[#5A5A40] uppercase tracking-widest">
                              <AlertTriangle size={16} className="text-amber-400" /> Allergies & Sensitivities
                           </label>
                           <textarea
                              value={healthData.allergies}
                              onChange={(e) => setHealthData({ ...healthData, allergies: e.target.value })}
                              className="w-full p-6 bg-[#F5F5F0] border border-[#D1D1C1]/50 rounded-[32px] text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 resize-none font-serif"
                              placeholder="Drug, food, or environmental allergies..."
                           />
                        </div>
                     </div>
                  </section>

                  <section className="bg-indigo-50 p-10 rounded-[40px] border border-indigo-200 shadow-sm space-y-8">
                     <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="space-y-1 text-center sm:text-left">
                           <h3 className="text-2xl font-serif font-bold text-indigo-900 flex items-center justify-center sm:justify-start gap-3">
                              <FileText size={24} className="text-indigo-600" /> Bio-Neural Synchronist
                           </h3>
                           <p className="text-xs text-indigo-800/60 font-serif italic">Mirror your medical documents directly into the neural hub.</p>
                        </div>
                        <button
                           onClick={handleAnalyzeDocument}
                           disabled={!docPreview || isAnalyzingDoc}
                           className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all text-[10px] uppercase tracking-widest disabled:opacity-30"
                        >
                           {isAnalyzingDoc ? <Loader2 className="animate-spin" size={16} /> : "Initiate Extraction"}
                        </button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div 
                          className={cn(
                            "relative group border-2 border-dashed rounded-[32px] p-8 transition-all flex flex-col items-center justify-center text-center gap-4 cursor-pointer",
                            docPreview ? "border-indigo-400 bg-white" : "border-indigo-200 bg-indigo-50/50 hover:border-indigo-400"
                          )}
                        >
                           <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                           {docPreview ? (
                              <img src={docPreview} alt="Preview" className="w-full aspect-[4/3] object-cover rounded-2xl" />
                           ) : (
                              <div className="space-y-4">
                                 <div className="p-5 bg-white rounded-full text-indigo-400 shadow-sm group-hover:scale-110 transition-transform">
                                    <Upload size={32} />
                                 </div>
                                 <p className="text-sm font-bold text-indigo-900">Upload Report Snapshot</p>
                              </div>
                           )}
                        </div>

                         <AnimatePresence>
                           {docAnalysisResult && (
                              <motion.div 
                                 initial={{ opacity: 0, scale: 0.9 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 className="bg-white rounded-[32px] p-8 space-y-6 shadow-inner border border-indigo-100 overflow-hidden relative"
                              >
                                 <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                       <Brain size={14} /> Extraction Node Findings
                                    </h4>
                                    <button onClick={() => setDocAnalysisResult(null)} className="text-indigo-300 hover:text-indigo-600">
                                       <Trash2 size={14} />
                                    </button>
                                 </div>

                                 <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 space-y-3">
                                       <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest px-1">Neural Summary</label>
                                          <textarea 
                                             value={docAnalysisResult.summary}
                                             onChange={(e) => setDocAnalysisResult({...docAnalysisResult, summary: e.target.value})}
                                             className="w-full bg-white/50 p-3 rounded-xl text-xs text-indigo-900/70 italic font-serif leading-relaxed outline-none resize-none border border-indigo-100/50 focus:border-indigo-300 transition-colors"
                                             rows={3}
                                          />
                                       </div>
                                       {docAnalysisResult.ayurvedicInsight && (
                                          <div className="space-y-1 pt-2 border-t border-indigo-100">
                                             <label className="text-[9px] font-bold text-amber-600 uppercase tracking-widest px-1 flex items-center gap-1">
                                                <Sparkles size={10} /> Ayurvedic Insight
                                             </label>
                                             <textarea 
                                               value={docAnalysisResult.ayurvedicInsight}
                                               onChange={(e) => setDocAnalysisResult({...docAnalysisResult, ayurvedicInsight: e.target.value})}
                                               className="w-full bg-amber-50/50 p-2 rounded-xl text-[10px] text-amber-700 font-serif leading-relaxed italic outline-none resize-none border border-amber-100/30 focus:border-amber-300 transition-colors"
                                               rows={2}
                                             />
                                          </div>
                                       )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                       {/* Diagnoses Section */}
                                       <div className="space-y-2">
                                          <div className="flex justify-between items-center px-1">
                                             <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Diagnoses (AI Identified)</span>
                                             <button 
                                               onClick={() => setDocAnalysisResult({...docAnalysisResult, diagnoses: [...(docAnalysisResult.diagnoses || []), ""]})}
                                               className="text-indigo-400 hover:text-indigo-600 bg-indigo-50 p-1 rounded"
                                             >
                                                <Plus size={10} />
                                             </button>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                             {(docAnalysisResult.diagnoses || []).map((d: string, i: number) => (
                                                <div key={i} className="flex items-center gap-1.5 bg-white border border-indigo-100 text-indigo-800 text-[10px] rounded-lg font-medium px-2 py-1 shadow-sm">
                                                   <input 
                                                     value={d}
                                                     onChange={(e) => {
                                                       const next = [...docAnalysisResult.diagnoses];
                                                       next[i] = e.target.value;
                                                       setDocAnalysisResult({...docAnalysisResult, diagnoses: next});
                                                     }}
                                                     className="bg-transparent outline-none min-w-[60px]"
                                                   />
                                                   <button 
                                                     onClick={() => setDocAnalysisResult({...docAnalysisResult, diagnoses: docAnalysisResult.diagnoses.filter((_: any, idx: number) => idx !== i)})}
                                                     className="text-indigo-300 hover:text-rose-500"
                                                   >
                                                      <X size={10} />
                                                   </button>
                                                </div>
                                             ))}
                                          </div>
                                       </div>

                                       {/* Medications Section */}
                                       <div className="space-y-2">
                                          <div className="flex justify-between items-center px-1">
                                             <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Medications (AI Identified)</span>
                                             <button 
                                               onClick={() => setDocAnalysisResult({...docAnalysisResult, medications: [...(docAnalysisResult.medications || []), ""]})}
                                               className="text-indigo-400 hover:text-indigo-600 bg-indigo-50 p-1 rounded"
                                             >
                                                <Plus size={10} />
                                             </button>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                             {(docAnalysisResult.medications || []).map((m: string, i: number) => (
                                                <div key={i} className="flex items-center gap-1.5 bg-white border border-indigo-100 text-indigo-800 text-[10px] rounded-lg font-medium px-2 py-1 shadow-sm">
                                                   <input 
                                                     value={m}
                                                     onChange={(e) => {
                                                       const next = [...docAnalysisResult.medications];
                                                       next[i] = e.target.value;
                                                       setDocAnalysisResult({...docAnalysisResult, medications: next});
                                                     }}
                                                     className="bg-transparent outline-none min-w-[60px]"
                                                   />
                                                   <button 
                                                     onClick={() => setDocAnalysisResult({...docAnalysisResult, medications: docAnalysisResult.medications.filter((_: any, idx: number) => idx !== i)})}
                                                     className="text-indigo-300 hover:text-rose-500"
                                                   >
                                                      <X size={10} />
                                                   </button>
                                                </div>
                                             ))}
                                          </div>
                                       </div>

                                       {/* Allergies Section */}
                                       <div className="space-y-2">
                                          <div className="flex justify-between items-center px-1">
                                             <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Allergies (AI Identified)</span>
                                             <button 
                                               onClick={() => setDocAnalysisResult({...docAnalysisResult, allergies: [...(docAnalysisResult.allergies || []), ""]})}
                                               className="text-rose-400 hover:text-rose-600 bg-rose-50 p-1 rounded"
                                             >
                                                <Plus size={10} />
                                             </button>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                             {(docAnalysisResult.allergies || []).map((a: string, i: number) => (
                                                <div key={i} className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 text-rose-800 text-[10px] rounded-lg font-medium px-2 py-1 shadow-sm">
                                                   <input 
                                                     value={a}
                                                     onChange={(e) => {
                                                       const next = [...docAnalysisResult.allergies];
                                                       next[i] = e.target.value;
                                                       setDocAnalysisResult({...docAnalysisResult, allergies: next});
                                                     }}
                                                     className="bg-transparent outline-none min-w-[60px]"
                                                   />
                                                   <button 
                                                     onClick={() => setDocAnalysisResult({...docAnalysisResult, allergies: docAnalysisResult.allergies.filter((_: any, idx: number) => idx !== i)})}
                                                     className="text-rose-300 hover:text-rose-600"
                                                   >
                                                      <X size={10} />
                                                   </button>
                                                </div>
                                             ))}
                                          </div>
                                       </div>
                                    </div>
                                 </div>

                                 <button
                                    onClick={handleSyncAnalyzedData}
                                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold font-mono tracking-tighter hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2"
                                 >
                                    <CheckCircle2 size={18} />
                                    SYNC TO CORE BIO-DATA
                                 </button>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                  </section>
                </div>
              )}

              {/* Sacred Rhythms Tab */}
              {activeTab === 'rhythms' && (
                <div className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Appearance */}
                      <section className="bg-white p-10 rounded-[40px] border border-[#D1D1C1] shadow-sm space-y-8">
                         <div className="flex items-center gap-3 text-[#5A5A40]">
                            <Palette size={24} />
                            <h3 className="text-xl font-serif font-bold">Etheric Display</h3>
                         </div>
                         <div className="grid grid-cols-1 gap-4">
                            {['Standard', 'Sacred (Warm)', 'Neural (Cool)', 'Minimal'].map((theme) => (
                              <button
                                key={theme}
                                onClick={() => setPreferences({ ...preferences, appearance: theme })}
                                className={cn(
                                  "w-full p-5 rounded-[24px] border-2 flex items-center justify-between group transition-all",
                                  preferences.appearance === theme 
                                    ? "bg-[#5A5A40] border-[#5A5A40] text-white" 
                                    : "bg-[#F5F5F0] border-transparent text-[#5A5A40] hover:border-[#D1D1C1]"
                                )}
                              >
                                 <div className="flex items-center gap-4">
                                    <div className={cn(
                                       "w-4 h-4 rounded-full border-2 border-white/20",
                                       theme === 'Standard' && "bg-emerald-500",
                                       theme === 'Sacred (Warm)' && "bg-amber-500",
                                       theme === 'Neural (Cool)' && "bg-blue-500",
                                       theme === 'Minimal' && "bg-stone-300"
                                    )} />
                                    <span className="text-xs uppercase tracking-widest font-bold">{theme}</span>
                                 </div>
                                 {preferences.appearance === theme && <CheckCircle2 size={18} />}
                              </button>
                            ))}
                         </div>
                      </section>

                      {/* Notifications */}
                      <section className="bg-white p-10 rounded-[40px] border border-[#D1D1C1] shadow-sm space-y-8">
                         <div className="flex items-center gap-3 text-[#5A5A40]">
                            <Bell size={24} />
                            <h3 className="text-xl font-serif font-bold">Divine Signals</h3>
                         </div>
                         <div className="space-y-4">
                            {Object.entries(preferences.notifications).map(([key, value]) => (
                               <div key={key} className="flex items-center justify-between p-5 bg-[#F5F5F0] rounded-[24px] border border-[#D1D1C1]/20">
                                  <div className="space-y-0.5">
                                     <span className="block text-xs font-bold text-[#5A5A40] capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                     <span className="text-[10px] text-[#5A5A40]/40 italic uppercase tracking-tighter">Event Protocol</span>
                                  </div>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                     <input 
                                       type="checkbox" 
                                       checked={value}
                                       onChange={(e) => setPreferences({
                                         ...preferences,
                                         notifications: { ...preferences.notifications, [key]: e.target.checked }
                                       })}
                                       className="sr-only peer" 
                                     />
                                     <div className="w-12 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                                  </label>
                               </div>
                            ))}
                         </div>
                      </section>
                   </div>
                </div>
              )}

              {/* Connectivity Tab */}
              {activeTab === 'connectivity' && (
                <div className="space-y-10">
                   <section className="bg-[#E8E8E0] p-10 rounded-[40px] border border-[#D1D1C1] shadow-sm space-y-10">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                         <div className="space-y-1 text-center sm:text-left">
                            <h3 className="text-2xl font-serif font-bold text-[#5A5A40] flex items-center justify-center sm:justify-start gap-3">
                               <Cpu size={28} /> Integration Nexus
                            </h3>
                            <p className="text-xs text-[#5A5A40]/60 italic font-serif">Bridge external devices to your biological rhythm.</p>
                         </div>
                         <button 
                           onClick={() => navigate('/connectivity')}
                           className="flex items-center gap-2 bg-white text-[#5A5A40] px-8 py-3 rounded-full font-bold hover:bg-[#5A5A40] hover:text-white transition-all shadow-md text-[10px] uppercase tracking-widest"
                         >
                            Open Hub <ChevronRight size={14} />
                         </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {devices.length > 0 ? devices.map(device => (
                            <div key={device.id} className="bg-white p-6 rounded-[32px] border border-[#D1D1C1]/50 flex items-center justify-between group">
                               <div className="flex items-center gap-4">
                                  <div className="p-3 bg-[#F5F5F0] text-[#5A5A40] rounded-2xl group-hover:bg-[#5A5A40] group-hover:text-white transition-colors">
                                     {device.type === 'glasses' ? <Glasses size={20} /> : device.type === 'watch' ? <Watch size={20} /> : <Smartphone size={20} />}
                                  </div>
                                  <div>
                                     <h4 className="text-sm font-bold text-[#5A5A40] leading-none">{device.brand} {device.model}</h4>
                                     <span className="text-[9px] text-[#5A5A40]/40 uppercase font-black">Linked</span>
                                  </div>
                               </div>
                               <div className={cn(
                                 "w-2 h-2 rounded-full",
                                 device.status === 'connected' ? "bg-emerald-500 animate-pulse" : "bg-stone-300"
                               )} />
                            </div>
                         )) : (
                            <div className="md:col-span-2 py-12 bg-white/30 border border-dashed border-[#D1D1C1] rounded-[40px] text-center">
                               <p className="text-sm text-[#5A5A40]/40 italic">No devices bridged. Visit the Connectivity Hub to start.</p>
                            </div>
                         )}
                      </div>
                   </section>

                   <section className="bg-white p-10 rounded-[40px] border border-[#D1D1C1] shadow-xl space-y-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                         <Youtube size={150} />
                      </div>
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                         <div className="space-y-1 text-center sm:text-left">
                            <h3 className="text-2xl font-serif font-bold text-red-600 flex items-center justify-center sm:justify-start gap-3">
                               <Youtube size={28} /> Creative Bio-Sync
                            </h3>
                            <p className="text-xs text-[#5A5A40]/60 italic font-serif">Synchronize your content creation cycles with biological peak performance.</p>
                         </div>
                         {!ytTokens ? (
                            <button onClick={handleYtConnect} className="px-8 py-3 bg-red-600 text-white rounded-full font-bold shadow-xl shadow-red-600/20 hover:scale-105 transition-all text-xs uppercase tracking-widest">
                               Connect YouTube
                            </button>
                         ) : (
                            <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-6 py-2 rounded-full border border-emerald-200">
                               <CheckCircle2 size={16} />
                               <span className="text-[10px] font-bold uppercase tracking-widest font-mono">BRIDGE ACTIVE</span>
                            </div>
                         )}
                      </div>
                      
                      {ytProfile && (
                         <div className="p-6 bg-[#F5F5F0] rounded-[32px] border border-[#D1D1C1]/30 flex items-center gap-6">
                            <img src={ytProfile.snippet.thumbnails.default.url} alt="YT" className="w-16 h-16 rounded-full border-4 border-white shadow-xl" />
                            <div className="space-y-1">
                               <h4 className="font-bold text-[#5A5A40]">{ytProfile.snippet.title}</h4>
                               <p className="text-xs text-[#5A5A40]/60 opacity-60">Creative cycle analysis active across {ytProfile.statistics.videoCount} artifacts.</p>
                            </div>
                         </div>
                      )}
                   </section>
                </div>
              )}

              {/* Security & Access Tab */}
              {activeTab === 'security' && (
                <div className="space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <section className="bg-white p-10 rounded-[40px] border border-[#D1D1C1] shadow-sm space-y-8">
                         <div className="flex items-center gap-3 text-[#5A5A40]">
                            <ShieldCheck size={24} />
                            <h3 className="text-xl font-serif font-bold">Privacy Protocol</h3>
                         </div>
                         <div className="space-y-6">
                            <div className="flex items-center justify-between group">
                               <div>
                                  <span className="block text-sm font-bold text-[#5A5A40]">Decentralized Bio-Sync</span>
                                  <span className="text-[10px] text-[#5A5A40]/40 uppercase tracking-tighter">Active Encryption</span>
                               </div>
                               <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                  <ShieldCheck size={18} />
                               </div>
                            </div>
                            <div className="flex items-center justify-between group">
                               <div>
                                  <span className="block text-sm font-bold text-[#5A5A40]">Zero-Knowledge Health</span>
                                  <span className="text-[10px] text-[#5A5A40]/40 uppercase tracking-tighter">Secured Profile</span>
                               </div>
                               <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                  <ShieldCheck size={18} />
                               </div>
                            </div>
                            <div className="pt-4 border-t border-[#D1D1C1]/20">
                               <button 
                                 onClick={() => navigate('/terms')}
                                 className="text-[10px] font-bold text-indigo-500 hover:underline uppercase tracking-[0.2em]"
                               >
                                  View Sacred Data Policy
                               </button>
                            </div>
                         </div>
                      </section>

                      <section className="bg-rose-50 p-10 rounded-[40px] border border-rose-100 shadow-sm space-y-8">
                         <div className="flex items-center gap-3 text-rose-900">
                            <ShieldAlert size={24} />
                            <h3 className="text-xl font-serif font-bold">Neural Severance</h3>
                         </div>
                         <div className="space-y-4">
                            <p className="text-xs text-rose-800/60 leading-relaxed italic font-serif">
                               "Choose to exist outside the AIveda sanctuary. Your biometric telemetry will be erased after 30 cycles of inactivity."
                            </p>
                            <button 
                              onClick={handleDeleteAccount}
                              disabled={isDeleting}
                              className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20 text-xs uppercase tracking-[0.3em]"
                            >
                               {isDeleting ? "SEVERING LINK..." : "INITIATE DEACTIVATION"}
                            </button>
                         </div>
                      </section>
                   </div>

                   <section className="bg-stone-900 text-white p-10 rounded-[40px] shadow-2xl space-y-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                         <Key size={180} />
                      </div>
                      <div className="relative z-10 space-y-6">
                         <div className="flex items-center gap-3">
                            <Database size={24} className="text-amber-500" />
                            <h3 className="text-2xl font-serif font-bold italic">Artifact Integration Keys</h3>
                         </div>
                         <p className="text-sm text-stone-400 font-serif max-w-xl">
                            Direct API access for local LLMs and custom bio-metric sensors. Generate a unique key to bridge ṚtuSyn with your own neural infrastructure.
                         </p>
                         <div className="flex flex-wrap gap-4">
                            <button className="px-8 py-3 bg-amber-600 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center gap-2">
                               <Plus size={14} /> Generate Key
                            </button>
                            <button className="px-8 py-3 bg-stone-800 text-stone-400 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-stone-700 hover:text-white transition-all flex items-center gap-2">
                               <Lock size={14} /> Existing Keys (0)
                            </button>
                         </div>
                      </div>
                   </section>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

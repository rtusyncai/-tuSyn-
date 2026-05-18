import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, deleteDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { User, Mail, Calendar, Trash2, LogOut, AlertTriangle, Loader2, ShieldCheck, Stethoscope, Heart, Activity, Pill, Target, Save, Cpu, Car, Bath, Refrigerator, ShoppingCart, Sparkles, ShieldAlert, Utensils, Wind, Gem, Sprout, TrendingUp, Home, ExternalLink, Brain, Archive, ShoppingBag, ChevronRight, ArrowRight, Coins, Palette, Bell, Edit2, MapPin, X, FileText, Upload, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { neuroSyncService } from '../services/neuroSyncService';
import { monetizationService, UserWealthProfile } from '../services/monetizationService';
import { geminiService } from '../services/geminiService';
import { Crown, Store as StoreIcon } from 'lucide-react';

const COLORS = ['#A8D5BA', '#F3A683', '#778BEB'];

export const ProfilePage = () => {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [wealthProfile, setWealthProfile] = useState<UserWealthProfile | null>(null);
  const [ojasPoints, setOjasPoints] = useState(750); // Initial simulated points
  const [movementData, setMovementData] = useState({ steps: 8432, exercise: 45 });
  const [isIotSyncEnabled, setIsIotSyncEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);
  const [docAnalysisResult, setDocAnalysisResult] = useState<any>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
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
    lifeStage: 'General Wellness', // New field
    lifestyle: {
      sleep: '7-8 hours',
      diet: 'Vegetarian',
      activity: 'Moderate'
    }
  });
  const [iotSettings, setIotSettings] = useState({
    carDiffuser: true,
    smartShower: false,
    kitchenInventory: true,
    ayurLens: true
  });
  const [preferences, setPreferences] = useState({
    appearance: 'Sacred (Warm)',
    notifications: {
      email: true,
      push: true,
      dailyDigest: true,
      ojasAlerts: true
    }
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const docRef = doc(db, 'profiles', user.uid);
      const docSnap = await getDoc(docRef);
      const nProfile = await neuroSyncService.getNeuroProfile(user.uid);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const wProfile = await monetizationService.analyzeUserPath(user.uid);
        setWealthProfile(wProfile);
        setProfile({ ...data, neuroProfile: nProfile, wealth: wProfile });
        setIsIotSyncEnabled(data.isIotSyncEnabled !== false);
        setEditForm({
          name: data.name || user.email?.split('@')[0] || '',
          location: data.location || '',
          healthGoals: data.healthData?.healthGoals || ''
        });
        if (data.healthData) {
          setHealthData(prev => ({
            ...prev,
            ...data.healthData,
            lifestyle: {
              ...prev.lifestyle,
              ...(data.healthData.lifestyle || {})
            }
          }));
        }
        if (data.iotSettings) {
          setIotSettings(data.iotSettings);
        }
        if (data.preferences) {
          setPreferences(prev => ({
            ...prev,
            ...data.preferences,
            notifications: {
              ...prev.notifications,
              ...(data.preferences.notifications || {})
            }
          }));
        }
      } else {
        setProfile({ neuroProfile: nProfile });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSaveProfileSettings = async () => {
    if (!user) return;
    setIsSaving(true);
    const path = `profiles/${user.uid}`;
    try {
      const updatedHealthData = {
        ...healthData,
        healthGoals: editForm.healthGoals
      };
      
      await updateDoc(doc(db, 'profiles', user.uid), {
        name: editForm.name,
        location: editForm.location,
        healthData: updatedHealthData,
        iotSettings,
        preferences,
        isIotSyncEnabled,
        updatedAt: serverTimestamp()
      });
      
      setProfile((prev: any) => ({
        ...prev,
        name: editForm.name,
        location: editForm.location,
        healthData: updatedHealthData
      }));
      setHealthData(updatedHealthData);
      setIsEditingProfile(false);
      alert('Your sacred profile has been refreshed.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocPreview(reader.result as string);
        setDocAnalysisResult(null);
      };
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
    } catch (error) {
      console.error(error);
      alert("Neural synthesis failed. The document may be unreadable.");
    } finally {
      setIsAnalyzingDoc(false);
    }
  };

  const handleSyncAnalyzedData = () => {
    if (!docAnalysisResult) return;
    
    setHealthData(prev => ({
      ...prev,
      medicalHistory: prev.medicalHistory + (prev.medicalHistory ? '\n' : '') + docAnalysisResult.medicalHistory.join(', '),
      allergies: prev.allergies + (prev.allergies ? '\n' : '') + docAnalysisResult.allergies.join(', '),
      medications: prev.medications + (prev.medications ? '\n' : '') + docAnalysisResult.medications.join(', '),
      healthGoals: prev.healthGoals + (prev.healthGoals ? '\n' : '') + (docAnalysisResult.extractedHealthGoals?.join(', ') || '')
    }));
    
    setDocAnalysisResult(null);
    setDocPreview(null);
    alert("Data synchronized with your sacred profile. Remember to save changes.");
  };

  const toggleRole = async () => {
    if (!user) return;
    setUpdatingRole(true);
    const newRole = profile?.role === 'doctor' ? 'user' : 'doctor';
    const path = `profiles/${user.uid}`;
    try {
      // Use setDoc with merge: true to create the document if it doesn't exist
      await setDoc(doc(db, 'profiles', user.uid), { 
        role: newRole,
        uid: user.uid,
        email: user.email,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setProfile({ ...profile, role: newRole });
      window.location.reload(); // Reload to update auth context
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !window.confirm("Are you sure you want to deactivate your account? Your data will be preserved for 30 days according to our retrieval policy, allowing you to restore it if you change your mind.")) return;
    setIsDeleting(true);
    const path = `profiles/${user.uid}`;
    try {
      // Soft Delete from Firestore
      await updateDoc(doc(db, 'profiles', user.uid), {
        status: 'deactivated',
        deactivatedAt: serverTimestamp()
      });
      // Sign out
      await auth.signOut();
      navigate('/login');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[#5A5A40]" /></div>;

  const data = profile?.doshaPercentages ? [
    { name: 'Vata', value: profile.doshaPercentages.vata },
    { name: 'Pitta', value: profile.doshaPercentages.pitta },
    { name: 'Kapha', value: profile.doshaPercentages.kapha },
  ] : [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 pb-20 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12 text-center sm:text-left bg-white/50 p-8 sm:p-12 rounded-[60px] border border-white shadow-xl backdrop-blur-sm relative group/header">
        <div className="absolute top-8 right-8">
           <button 
            onClick={() => {
              setEditForm({
                name: profile?.name || user?.email?.split('@')[0] || '',
                location: profile?.location || '',
                healthGoals: healthData.healthGoals || ''
              });
              setIsEditingProfile(true);
            }}
            className="p-3 bg-[#5A5A40] text-white rounded-2xl shadow-lg hover:scale-105 hover:bg-amber-600 transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
           >
              <Edit2 size={14} /> Edit Profile
           </button>
        </div>
        <motion.div 
          whileHover={{ scale: 1.05, rotate: 5 }}
          className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-[#5A5A40] text-white flex items-center justify-center text-4xl sm:text-5xl font-serif font-bold shadow-[0_20px_50px_rgba(90,90,64,0.3)] border-8 border-white shrink-0 relative"
        >
          {user?.email?.[0].toUpperCase()}
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
             <Sparkles size={20} className="text-white" />
          </div>
        </motion.div>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-[#5A5A40] leading-none">
              {profile?.name || user?.email?.split('@')[0]}
            </h2>
            {profile?.role === 'doctor' && (
              <div className="px-5 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 border border-emerald-200">
                <ShieldCheck size={14} /> Verified Practitioner
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-[#2D3436] opacity-60 text-sm sm:text-base font-medium">
            <div className="flex items-center gap-2.5"><Mail size={18} className="text-[#5A5A40]" /> {user?.email}</div>
            {profile?.location && (
              <div className="flex items-center gap-2.5"><MapPin size={18} className="text-[#5A5A40]" /> {profile.location}</div>
            )}
            <div className="flex items-center gap-2.5"><Calendar size={18} className="text-[#5A5A40]" /> Journey Initiated {new Date(user?.metadata.creationTime || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* Ojas Point Ledger - Sacred Rewards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[40px] p-10 border border-[#D1D1C1]/50 shadow-sm relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-10 transition-opacity">
          <Coins size={200} />
        </div>
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="relative shrink-0">
            <div className="w-32 h-32 rounded-[32px] bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-inner">
              <Coins size={56} className="animate-bounce" />
            </div>
            <div className="absolute -bottom-3 -right-3 bg-emerald-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full border-4 border-white shadow-lg uppercase tracking-tighter">
              +15% SYNC
            </div>
          </div>
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-1">
              <h3 className="text-3xl font-serif font-bold text-[#5A5A40]">Ojas Ledger</h3>
              <p className="text-sm text-[#5A5A40]/60 italic font-serif">Your metabolic vitality transformed into sacred exchange value.</p>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="bg-[#F5F5F0] px-6 py-4 rounded-[24px] border border-[#D1D1C1]/30 flex flex-col items-center md:items-start group/metric hover:bg-white transition-colors">
                <div className="text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-[0.2em] mb-1">Available Points</div>
                <div className="text-3xl font-serif font-black text-amber-600 leading-none">{ojasPoints.toLocaleString()} <span className="text-lg opacity-40">✧</span></div>
              </div>
              <div className="bg-[#F5F5F0] px-6 py-4 rounded-[24px] border border-[#D1D1C1]/30 flex flex-col items-center md:items-start group/metric hover:bg-white transition-colors">
                <div className="text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-[0.2em] mb-1">Today's Steps</div>
                <div className="text-3xl font-serif font-black text-[#5A5A40] leading-none">{movementData.steps.toLocaleString()}</div>
              </div>
              <div className="bg-[#F5F5F0] px-6 py-4 rounded-[24px] border border-[#D1D1C1]/30 flex flex-col items-center md:items-start group/metric hover:bg-white transition-colors">
                <div className="text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-[0.2em] mb-1">Sacred Effort</div>
                <div className="text-3xl font-serif font-black text-[#5A5A40] leading-none">{movementData.exercise}m</div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-4">
               <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                     {[1, 2, 3, 4, 5].map((day) => (
                        <div key={day} className={cn("w-2.5 h-2.5 rounded-full", day <= 3 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-[#D1D1C1]")} />
                     ))}
                  </div>
                  <span className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-[0.1em]">3 Day Sacred Streak</span>
               </div>
               <div className="px-3 py-1.5 bg-amber-50 rounded-full text-[9px] font-bold text-amber-700 uppercase tracking-[0.1em] border border-amber-200/50 italic flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  +50 Ojas Manifestation Pending
               </div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/marketplace')}
            className="w-full md:w-auto px-10 py-5 bg-[#5A5A40] text-white rounded-[24px] font-bold shadow-xl shadow-[#5A5A40]/20 hover:bg-amber-600 hover:shadow-amber-600/20 transition-all flex items-center justify-center gap-3 group uppercase tracking-widest text-xs"
          >
            Redeem Artifacts <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="bg-[#5A5A40] rounded-[40px] p-10 text-white relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:opacity-10 transition-opacity">
          <Heart size={200} />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
           <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 text-amber-300 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-white/20">
                 <Heart size={14} className="fill-current" /> Altruism Quotient
              </div>
              <div className="space-y-2">
                <h3 className="text-4xl font-serif font-bold italic">Sacred Generosity</h3>
                <p className="text-white/70 text-lg font-serif">Your Ojas manifestations flow back into the earth, supporting local medicinal orchards and artisanal nodes.</p>
              </div>
              <div className="flex justify-center lg:justify-start gap-10">
                 <div className="space-y-1">
                    <div className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em]">Total Karma Shared</div>
                    <div className="text-3xl font-serif font-black text-amber-400 leading-none">1,240 <span className="text-sm opacity-50">✧</span></div>
                 </div>
                 <div className="w-px h-12 bg-white/10" />
                 <div className="space-y-1">
                    <div className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em]">Local Multiplier</div>
                    <div className="text-3xl font-serif font-black text-emerald-400 leading-none">4.8x</div>
                 </div>
              </div>
           </div>
           
           <div className="w-full lg:w-auto flex flex-col gap-4 shrink-0">
              <button className="px-10 py-5 bg-white text-[#5A5A40] rounded-[24px] font-bold hover:bg-amber-50 transition-all flex items-center justify-center gap-3 group shadow-2xl hover:scale-105 uppercase tracking-widest text-xs">
                 Donate Available Ojas <Sprout size={18} className="group-hover:rotate-12 transition-transform" />
              </button>
              <p className="text-[10px] text-center text-white/40 font-bold uppercase tracking-[0.3em]">100 OJAS = $1.00 USD FOR THE EARTH</p>
           </div>
        </div>
      </motion.div>

      {/* Prosperity Path Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-white to-[#F5F5F0] p-10 sm:p-14 rounded-[50px] border border-[#D1D1C1]/50 shadow-2xl space-y-10 relative overflow-hidden group"
      >
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#5A5A40]/5 blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
          <div className="space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-3 text-[#5A5A40]/60 text-[10px] font-black uppercase tracking-[0.3em]">
              <Crown size={16} className="text-[#5A5A40]" /> Individualized Prosperity Matrix
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-serif font-bold text-[#5A5A40]">The Path of Abundance</h3>
              <p className="text-lg text-[#2D3436] opacity-70 italic font-serif max-w-2xl leading-relaxed">
                "{wealthProfile?.reasoning}"
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/membership')}
            className="flex items-center gap-4 px-10 py-6 bg-[#5A5A40] text-white rounded-[32px] font-bold hover:bg-amber-600 transition-all shadow-2xl hover:shadow-amber-600/30 group shrink-0 uppercase tracking-widest text-xs"
          >
            {wealthProfile?.suggestedModel === 'marketplace' ? <StoreIcon size={24} /> : <Crown size={24} />}
            Explore {wealthProfile?.suggestedModel === 'marketplace' ? 'Merchant' : 'Seeker'} Path
            <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
          {[
            { icon: Archive, label: 'Vault Artifacts', value: wealthProfile?.activityMetrics.vaultCount || 0 },
            { icon: ShoppingBag, label: 'Exchange Listings', value: wealthProfile?.activityMetrics.marketplaceListings || 0 },
            { icon: Gem, label: 'Sacred Designs', value: wealthProfile?.activityMetrics.designsCreated || 0 },
          ].map((stat, i) => (stat &&
            <div key={i} className="p-8 bg-white/80 backdrop-blur-sm rounded-[32px] border border-[#D1D1C1]/20 flex flex-col items-center lg:items-start gap-4 hover:shadow-xl transition-shadow">
              <div className="p-4 bg-[#F5F5F0] text-[#5A5A40] rounded-2xl border border-[#D1D1C1]/30">
                <stat.icon size={24} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#5A5A40]/30 uppercase tracking-[0.2em] mb-1">{stat.label}</div>
                <div className="text-3xl font-serif font-black text-[#5A5A40] leading-none">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Dosha Quiz Results Section */}
      {data.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 sm:p-10 rounded-[40px] border border-[#D1D1C1] shadow-xl space-y-8 sm:space-y-10 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <Sparkles size={300} />
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12">
            <div className="w-full lg:w-1/2 h-[280px] sm:h-[320px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">Nature</span>
                <span className="text-2xl sm:text-4xl font-serif font-bold text-[#5A5A40]">{profile?.dosha}</span>
              </div>
            </div>

            <div className="w-full lg:w-1/2 space-y-6 sm:space-y-8 text-center lg:text-left">
              <div className="space-y-4">
                <div className="inline-flex px-4 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Assessment Complete
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#5A5A40]">Your Biological Rhythm</h3>
                <p className="text-sm sm:text-base text-[#2D3436] opacity-70 leading-relaxed italic">
                  Your constitution is primarily governed by <span className="font-bold text-[#5A5A40] underline decoration-emerald-200">{profile?.dosha}</span>.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {data.map((item, idx) => (
                  <div key={item.name} className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#F5F5F0] dark:bg-[#1A1A15] border border-[#D1D1C1]/50 dark:border-[#3D3D35]/50 space-y-1 text-center">
                    <div className="w-2 h-2 rounded-full mx-auto" style={{ backgroundColor: COLORS[idx] }} />
                    <div className="text-[8px] sm:text-[10px] font-bold text-[#5A5A40]/40 dark:text-[#A8D5BA]/40 uppercase tracking-widest">{item.name}</div>
                    <div className="text-lg sm:text-2xl font-bold text-[#5A5A40] dark:text-[#A8D5BA]">{item.value}%</div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => navigate('/quiz')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#5A5A40] text-white rounded-2xl font-bold hover:bg-[#4A4A30] transition-all shadow-lg text-sm sm:text-base"
              >
                <Sparkles size={18} />
                Retake Quiz
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Engagement Tracking Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 sm:p-10 rounded-[40px] border border-[#D1D1C1] shadow-xl space-y-6 sm:space-y-8"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#5A5A40]">Engagement Highlights</h3>
            <p className="text-xs sm:text-sm text-[#2D3436] opacity-60 italic">Your journey towards conscious living.</p>
          </div>
          <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-6">
          {[
            { id: 'nourish', label: 'Nourish', icon: Utensils, color: 'bg-orange-50 text-orange-600', metric: 'Analyses' },
            { id: 'sanctuary', label: 'Sanctuary', icon: Wind, color: 'bg-blue-50 text-blue-600', metric: 'Sessions' },
            { id: 'habitat', label: 'Habitat', icon: Home, color: 'bg-stone-50 text-stone-600', metric: 'Plans' },
            { id: 'ayurwear', label: 'AyurWear', icon: Gem, color: 'bg-purple-50 text-purple-600', metric: 'Designs' },
            { id: 'prithvi', label: 'Prithvi', icon: Sprout, color: 'bg-green-50 text-green-600', metric: 'Gardens' },
          ].map((item) => (
            <div 
              key={item.id}
              className="p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] bg-[#F5F5F0] border border-[#D1D1C1]/50 flex flex-col items-center text-center gap-2 sm:gap-4 group hover:bg-white transition-all"
            >
              <div className={cn("p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-transform group-hover:scale-110", item.color)}>
                <item.icon size={20} className="sm:w-6" />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <div className="text-[8px] sm:text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">{item.label}</div>
                <div className="text-2xl sm:text-3xl font-bold text-[#5A5A40]">
                  {profile?.engagement?.[item.id] || 0}
                </div>
                <div className="text-[8px] sm:text-[10px] text-[#2D3436] opacity-40 italic">{item.metric}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Placeholder Dosha Card (shown only if no results) */}
        {data.length === 0 && (
          <div className="bg-white p-10 rounded-[40px] border border-[#D1D1C1] shadow-sm space-y-8">
            <h3 className="text-xl font-bold text-[#5A5A40]">Dosha Profile</h3>
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-[#F5F5F0] rounded-full flex items-center justify-center mx-auto text-[#5A5A40] opacity-40">
                <Sparkles size={32} />
              </div>
              <p className="text-sm text-[#2D3436] opacity-40 italic">You haven't completed your Dosha assessment yet.</p>
              <button 
                onClick={() => navigate('/quiz')}
                className="bg-[#5A5A40] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#4A4A30] transition-all flex items-center gap-2 mx-auto"
              >
                Start Quiz
              </button>
            </div>
          </div>
        )}

        {/* Settings Card */}
        <div className={cn(
          "bg-white p-10 rounded-[40px] border border-[#D1D1C1] shadow-sm space-y-8",
          data.length > 0 ? "md:col-span-2" : ""
        )}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#5A5A40]">Account Settings</h3>
            {data.length > 0 && (
              <span className="text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">
                UID: {user?.uid.slice(0, 8)}...
              </span>
            )}
          </div>
          <div className={cn(
            "space-y-4",
            data.length > 0 ? "grid grid-cols-1 md:grid-cols-3 gap-4 space-y-0" : ""
          )}>
            <button 
              onClick={() => navigate('/onboarding')}
              className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-[#F5F5F0] transition-all group border border-transparent hover:border-[#D1D1C1]"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-[#5A5A40] text-sm leading-tight">Guided Walkthrough</span>
                  <span className="text-[10px] text-[#2D3436] opacity-40 uppercase tracking-tighter">Revisit Onboarding</span>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-all">→</div>
            </button>

            <button 
              onClick={() => navigate('/onboarding')}
              className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-[#F5F5F0] transition-all group border border-transparent hover:border-[#D1D1C1]"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-[#5A5A40] text-sm leading-tight">Guided Walkthrough</span>
                  <span className="text-[10px] text-[#2D3436] opacity-40 uppercase tracking-tighter">Revisit Onboarding</span>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-all">→</div>
            </button>

            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-[#F5F5F0] transition-all group border border-transparent hover:border-[#D1D1C1]"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                  <LogOut size={20} />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-[#5A5A40] text-sm leading-tight">Authentication</span>
                  <span className="text-[10px] text-[#2D3436] opacity-40 uppercase tracking-tighter">Sign Out</span>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-all">→</div>
            </button>

            <button 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-red-50 transition-all group border border-transparent hover:border-red-100"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  {isDeleting ? <Loader2 className="animate-spin" /> : <ShieldAlert size={20} />}
                </div>
                <div className="text-left">
                  <span className="block font-bold text-red-600 text-sm leading-tight">Privacy Center</span>
                  <span className="text-[10px] text-red-400 opacity-40 uppercase tracking-tighter">Deactivate</span>
                </div>
              </div>
              <AlertTriangle size={20} className="text-red-300 opacity-0 group-hover:opacity-100 transition-all" />
            </button>
          </div>
        </div>
      </div>

      {/* Personalization & Notifications Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white p-10 rounded-[40px] border border-[#D1D1C1] shadow-xl space-y-10"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-[#5A5A40] flex items-center gap-3">
              <Palette size={28} className="text-[#5A5A40]" /> Personalization & Rhythms
            </h3>
            <p className="text-sm text-[#2D3436] opacity-60 italic">Customize how ṚtuSyn manifests in your world.</p>
          </div>
          <button
            onClick={handleSaveProfileSettings}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#5A5A40] text-white px-8 py-3 rounded-full font-bold hover:bg-amber-600 transition-all disabled:opacity-50 shadow-lg shadow-[#5A5A40]/20"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Synchronize
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Appearance Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-[#5A5A40]">
              <div className="p-2 bg-amber-50 rounded-xl">
                <Palette size={20} />
              </div>
              <h4 className="font-bold uppercase tracking-widest text-xs">App Appearance</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {['Standard', 'Sacred (Warm)', 'Neural (Cool)', 'Minimal'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => setPreferences({ ...preferences, appearance: theme })}
                  className={cn(
                    "p-4 rounded-2xl border transition-all text-left space-y-2 group",
                    preferences.appearance === theme 
                      ? "bg-[#5A5A40] border-[#5A5A40] text-white shadow-xl" 
                      : "bg-[#F5F5F0] border-[#D1D1C1]/50 text-[#5A5A40] hover:border-[#5A5A40]/30"
                  )}
                >
                   <div className={cn(
                     "w-8 h-8 rounded-full border-2 border-white/20",
                     theme === 'Standard' && "bg-emerald-500",
                     theme === 'Sacred (Warm)' && "bg-amber-500",
                     theme === 'Neural (Cool)' && "bg-blue-500",
                     theme === 'Minimal' && "bg-stone-300"
                   )} />
                   <span className="block text-xs font-bold uppercase tracking-tight">{theme}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notifications Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-[#5A5A40]">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Bell size={20} />
              </div>
              <h4 className="font-bold uppercase tracking-widest text-xs">Sacred Notifications</h4>
            </div>

            <div className="space-y-4">
              {Object.entries(preferences.notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 bg-[#F5F5F0] rounded-2xl border border-[#D1D1C1]/30">
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-[#5A5A40] capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-[10px] text-[#2D3436] opacity-40 italic">Receive divine {key} updates</span>
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
                    <div className="w-10 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Medical Document Neural Sync */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-indigo-50 p-10 rounded-[40px] border border-indigo-200 shadow-xl space-y-8"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-indigo-900 flex items-center gap-3">
              <FileText size={28} className="text-indigo-600" /> Medical Document Neural Sync
            </h3>
            <p className="text-sm text-indigo-800/60 italic">Upload health reports for Gemini to analyze and sync with your profile.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div 
              className={cn(
                "relative group border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center text-center gap-4",
                docPreview ? "border-indigo-400 bg-white" : "border-indigo-300 hover:border-indigo-500 bg-indigo-50/50"
              )}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              {docPreview ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-inner">
                  <img src={docPreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-bold uppercase tracking-widest">Change Document</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-white rounded-2xl text-indigo-500 shadow-sm">
                    <Upload size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-indigo-900">Upload Report Image</p>
                    <p className="text-[10px] text-indigo-800/60 uppercase tracking-widest">JPG, PNG supported</p>
                  </div>
                </>
              )}
            </div>
            
            <button
              onClick={handleAnalyzeDocument}
              disabled={!docPreview || isAnalyzingDoc}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
            >
              {isAnalyzingDoc ? <Loader2 size={18} className="animate-spin" /> : <Brain size={18} />}
              Initiate Neural Extraction
            </button>
          </div>

          <div className="bg-white/80 rounded-3xl border border-indigo-200 p-8 space-y-6">
            <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles size={14} /> Extraction Node Status
            </h4>
            
            {!docAnalysisResult ? (
              <div className="py-8 text-center space-y-4">
                <FileText size={48} className="mx-auto text-indigo-100" />
                <p className="text-xs text-indigo-800/40 italic leading-relaxed">
                  Await neural synthesis. Gemini will process your document to identify conditions, medications, and allergies.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <p className="text-xs text-indigo-900 font-serif italic leading-relaxed">
                    "{docAnalysisResult.documentSummary}"
                  </p>
                </div>
                
                <div className="space-y-4">
                   {docAnalysisResult.medicalHistory.length > 0 && (
                     <div className="space-y-1">
                        <div className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">Identified Conditions</div>
                        <div className="flex flex-wrap gap-2">
                           {docAnalysisResult.medicalHistory.map((item: string, i: number) => (
                             <span key={i} className="px-2 py-1 bg-white border border-indigo-100 rounded-lg text-[10px] text-indigo-700 font-medium">{item}</span>
                           ))}
                        </div>
                     </div>
                   )}
                   {docAnalysisResult.allergies.length > 0 && (
                     <div className="space-y-1">
                        <div className="text-[8px] font-bold text-rose-400 uppercase tracking-widest">Sensitivities Found</div>
                        <div className="flex flex-wrap gap-2">
                           {docAnalysisResult.allergies.map((item: string, i: number) => (
                             <span key={i} className="px-2 py-1 bg-rose-50 border border-rose-100 rounded-lg text-[10px] text-rose-700 font-medium">{item}</span>
                           ))}
                        </div>
                     </div>
                   )}
                </div>

                <button
                  onClick={handleSyncAnalyzedData}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                >
                  <CheckCircle2 size={18} /> Commit to Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Health Profile Section */}
      <div className="bg-white p-10 rounded-[40px] border border-[#D1D1C1] shadow-sm space-y-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-[#5A5A40]">Health & Medical Profile</h3>
            <p className="text-sm text-[#2D3436] opacity-60 italic">This data helps AIveda personalize your wellness journey.</p>
          </div>
          <button
            onClick={handleSaveProfileSettings}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#5A5A40] text-white px-6 py-3 rounded-full font-bold hover:bg-[#4A4A30] transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-[#5A5A40]">
                <Heart size={16} className="text-rose-400" /> Medical History
              </label>
              <textarea
                value={healthData.medicalHistory}
                onChange={(e) => setHealthData({ ...healthData, medicalHistory: e.target.value })}
                placeholder="List any chronic conditions, past surgeries, or significant health events..."
                className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 min-h-[120px] text-sm"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-[#5A5A40]">
                <AlertTriangle size={16} className="text-amber-400" /> Allergies & Sensitivities
              </label>
              <textarea
                value={healthData.allergies}
                onChange={(e) => setHealthData({ ...healthData, allergies: e.target.value })}
                placeholder="Food allergies, environmental sensitivities, or drug reactions..."
                className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 min-h-[100px] text-sm"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-[#5A5A40]">
                <Pill size={16} className="text-indigo-400" /> Current Medications
              </label>
              <textarea
                value={healthData.medications}
                onChange={(e) => setHealthData({ ...healthData, medications: e.target.value })}
                placeholder="List any medications or supplements you are currently taking..."
                className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 min-h-[120px] text-sm"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-[#5A5A40]">
                <Target size={16} className="text-emerald-400" /> Health Goals
              </label>
              <textarea
                value={healthData.healthGoals}
                onChange={(e) => setHealthData({ ...healthData, healthGoals: e.target.value })}
                placeholder="What are you hoping to achieve? (e.g., better sleep, weight loss, stress reduction)..."
                className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 min-h-[100px] text-sm"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#D1D1C1] space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-[#5A5A40] flex items-center gap-2">
                <Activity size={20} /> Lifestyle Habits
              </h4>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#2D3436] opacity-40 uppercase tracking-widest">Sleep Pattern</label>
                  <select
                    value={healthData.lifestyle?.sleep || '7-8 hours'}
                    onChange={(e) => setHealthData({ 
                      ...healthData, 
                      lifestyle: { ...(healthData.lifestyle || {}), sleep: e.target.value } as any
                    })}
                    className="w-full p-3 rounded-xl border border-[#D1D1C1] text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
                  >
                    <option>Less than 6 hours</option>
                    <option>6-7 hours</option>
                    <option>7-8 hours</option>
                    <option>8+ hours</option>
                    <option>Irregular</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#2D3436] opacity-40 uppercase tracking-widest">Primary Diet</label>
                  <select
                    value={healthData.lifestyle?.diet || 'Vegetarian'}
                    onChange={(e) => setHealthData({ 
                      ...healthData, 
                      lifestyle: { ...(healthData.lifestyle || {}), diet: e.target.value } as any
                    })}
                    className="w-full p-3 rounded-xl border border-[#D1D1C1] text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
                  >
                    <option>Vegetarian</option>
                    <option>Vegan</option>
                    <option>Non-Vegetarian</option>
                    <option>Pescatarian</option>
                    <option>Keto/Paleo</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#2D3436] opacity-40 uppercase tracking-widest">Activity Level</label>
                  <select
                    value={healthData.lifestyle?.activity || 'Moderate'}
                    onChange={(e) => setHealthData({ 
                      ...healthData, 
                      lifestyle: { ...(healthData.lifestyle || {}), activity: e.target.value } as any
                    })}
                    className="w-full p-3 rounded-xl border border-[#D1D1C1] text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
                  >
                    <option>Sedentary</option>
                    <option>Lightly Active</option>
                    <option>Moderate</option>
                    <option>Very Active</option>
                    <option>Athletic</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-bold text-[#5A5A40] flex items-center gap-2">
                <Sparkles size={20} className="text-amber-500" /> Specialized Focus
              </h4>
              <div className="p-6 bg-[#F5F5F0] rounded-3xl border border-[#D1D1C1] space-y-4">
                <label className="text-xs font-bold text-[#2D3436] opacity-40 uppercase tracking-widest">Life Stage / Care Phase</label>
                <select
                  value={healthData.lifeStage}
                  onChange={(e) => setHealthData({ ...healthData, lifeStage: e.target.value })}
                  className="w-full p-4 rounded-2xl border border-[#D1D1C1] bg-white text-sm font-bold text-[#5A5A40] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
                >
                  <option>General Wellness</option>
                  <option>Pregnancy & Prenatal Care</option>
                  <option>Postnatal Care</option>
                  <option>Child Growth (0-12)</option>
                  <option>Adolescence</option>
                  <option>Active Aging</option>
                  <option>Chronic Recovery</option>
                </select>
                <div className="p-4 bg-white/50 rounded-2xl border border-[#D1D1C1]/50 flex gap-3 text-xs italic text-[#2D3436] opacity-70">
                  <ShieldAlert size={16} className="text-amber-500 shrink-0" />
                  Selecting a specialized focus intelligently reconfigures AIveda's analysis across entire platform (Nourish, Habitat, wearable tracking).
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Integrations & IoT Section */}
      <div className="bg-[#E8E8E0] p-10 rounded-[40px] border border-[#D1D1C1] shadow-sm space-y-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-[#5A5A40] flex items-center gap-3">
              <Cpu size={28} /> Smart Integrations & IoT
            </h3>
            <p className="text-sm text-[#2D3436] opacity-60 italic">Connect your environment to your biological rhythm.</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-white/50 px-4 py-2 rounded-2xl border border-white">
               <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest">Neural Biometrics Sync</span>
                 <span className="text-[8px] text-[#5A5A40]/60 italic">Live Activity Ticker & Bio-Feedback</span>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isIotSyncEnabled}
                    onChange={(e) => setIsIotSyncEnabled(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
               </label>
            </div>
            <Link to="/connectivity" className="px-6 py-2 bg-[#5A5A40] text-white rounded-xl text-xs font-bold hover:bg-[#4A4A30] transition-all flex items-center gap-2">
               Connectivity Hub <ExternalLink size={14} />
            </Link>
            <div className="px-4 py-1 bg-white/50 rounded-full text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest hidden sm:block">
              Future Ready
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Neural Identity Card */}
          <div className="bg-white p-6 rounded-3xl border border-indigo-200 space-y-4 relative overflow-hidden group col-span-1 md:col-span-3">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Brain size={120} />
            </div>
            <div className="flex justify-between items-start">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                     <Brain size={24} />
                  </div>
                  <div>
                     <h4 className="font-bold text-[#5A5A40]">Neural Identity</h4>
                     <p className="text-[10px] text-[#2D3436] opacity-60 uppercase tracking-widest">Bridged & Synchronized</p>
                  </div>
               </div>
               <Link to="/neural-hub" className="text-[10px] font-bold text-indigo-500 hover:underline">
                  Calibrate Bridge →
               </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
               <div className="space-y-1">
                  <span className="text-[8px] font-bold opacity-30 uppercase tracking-tighter">Preference</span>
                  <div className="text-sm font-bold text-[#5A5A40] capitalize">{profile?.neuroProfile?.preference || 'Standard'}</div>
               </div>
               <div className="space-y-1">
                  <span className="text-[8px] font-bold opacity-30 uppercase tracking-tighter">Sensory Guard</span>
                  <div className={cn(
                     "text-sm font-bold",
                     profile?.neuroProfile?.sensoryGuardEnabled ? "text-emerald-500" : "text-amber-500"
                  )}>
                     {profile?.neuroProfile?.sensoryGuardEnabled ? 'ACTIVE' : 'INACTIVE'}
                  </div>
               </div>
               <div className="space-y-1">
                  <span className="text-[8px] font-bold opacity-30 uppercase tracking-tighter">Cognitive Threshold</span>
                  <div className="text-sm font-bold text-[#5A5A40]">{profile?.neuroProfile?.cognitiveLoadThreshold || 80}%</div>
               </div>
            </div>
          </div>

          {/* Car Diffuser */}
          <div className="bg-white p-6 rounded-3xl border border-[#D1D1C1] space-y-4 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Car size={80} />
            </div>
            <div className="flex justify-between items-start">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Car size={24} />
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={iotSettings.carDiffuser}
                  onChange={(e) => setIotSettings({...iotSettings, carDiffuser: e.target.checked})}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5A5A40]"></div>
              </label>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-[#5A5A40]">Car Diffuser Sync</h4>
              <p className="text-xs text-[#2D3436] opacity-60">Auto-tunes scent based on your current Dosha imbalance during commutes.</p>
            </div>
          </div>

          {/* Smart Shower */}
          <div className="bg-white p-6 rounded-3xl border border-[#D1D1C1] space-y-4 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Bath size={80} />
            </div>
            <div className="flex justify-between items-start">
              <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl">
                <Bath size={24} />
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={iotSettings.smartShower}
                  onChange={(e) => setIotSettings({...iotSettings, smartShower: e.target.checked})}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5A5A40]"></div>
              </label>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-[#5A5A40]">Smart Shower Temp</h4>
              <p className="text-xs text-[#2D3436] opacity-60">Adjusts water temperature and herbal infusions to balance your morning energy.</p>
            </div>
          </div>

          {/* Kitchen Inventory */}
          <div className="bg-white p-6 rounded-3xl border border-[#D1D1C1] space-y-4 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Refrigerator size={80} />
            </div>
            <div className="flex justify-between items-start">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <Refrigerator size={24} />
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={iotSettings.kitchenInventory}
                  onChange={(e) => setIotSettings({...iotSettings, kitchenInventory: e.target.checked})}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5A5A40]"></div>
              </label>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-[#5A5A40]">Kitchen Auto-Order</h4>
              <p className="text-xs text-[#2D3436] opacity-60">Automatically orders Ayurvedic pantry staples when stock is low.</p>
            </div>
          </div>

          {/* AyurLens AI Glasses */}
          <div className="bg-white p-6 rounded-3xl border border-[#D1D1C1] space-y-4 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Sparkles size={80} />
            </div>
            <div className="flex justify-between items-start">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Sparkles size={24} />
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={(iotSettings as any).ayurLens}
                  onChange={(e) => setIotSettings({...iotSettings, ayurLens: e.target.checked} as any)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5A5A40]"></div>
              </label>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-[#5A5A40]">AyurLens Neural Sync</h4>
              <p className="text-xs text-[#2D3436] opacity-60">Connects your vision to internal bio-metrics for real-time Etheric HUD overlays.</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white/30 rounded-3xl border border-white/50 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
            <ShoppingCart size={24} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-[#5A5A40] text-sm">Inventory Status: Low on Ashwagandha & Ghee</h4>
            <p className="text-xs text-[#2D3436] opacity-60 italic">Auto-order scheduled for tomorrow morning.</p>
          </div>
          <button className="px-4 py-2 bg-[#5A5A40] text-white rounded-xl text-xs font-bold hover:bg-[#4A4A30] transition-all">
            Manage Order
          </button>
        </div>
      </div>
      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingProfile(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl p-10 space-y-8"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-2xl font-serif font-bold text-[#5A5A40]">Refine Your Identity</h3>
                  <p className="text-xs text-[#5A5A40]/60 italic">Update your presence within the AIveda sanctuary.</p>
                </div>
                <button 
                  onClick={() => setIsEditingProfile(false)}
                  className="p-3 hover:bg-[#F5F5F0] rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest pl-2">Professional Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40]/40" size={18} />
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="How should the sanctuary address you?"
                      className="w-full pl-12 pr-4 py-4 bg-[#F5F5F0] border border-[#D1D1C1]/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest pl-2">Sacred Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40]/40" size={18} />
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="Where do your roots currently rest?"
                      className="w-full pl-12 pr-4 py-4 bg-[#F5F5F0] border border-[#D1D1C1]/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest pl-2">Core Health Intentions</label>
                  <div className="relative">
                    <Target className="absolute left-4 top-4 text-[#5A5A40]/40" size={18} />
                    <textarea
                      value={editForm.healthGoals}
                      onChange={(e) => setEditForm({ ...editForm, healthGoals: e.target.value })}
                      placeholder="What vital transformations are you seeking?"
                      className="w-full pl-12 pr-4 py-4 bg-[#F5F5F0] border border-[#D1D1C1]/50 rounded-2xl text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-4 bg-[#F5F5F0] text-[#5A5A40] rounded-2xl font-bold hover:bg-[#D1D1C1]/20 transition-all uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfileSettings}
                  disabled={isSaving}
                  className="flex-1 py-4 bg-[#5A5A40] text-white rounded-2xl font-bold shadow-xl shadow-[#5A5A40]/20 hover:bg-amber-600 hover:shadow-amber-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Synchronize
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

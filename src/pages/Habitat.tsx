import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Home, Sparkles, Loader2, Camera, Info, Wind, X, Eye, Layers, Compass, Save, Check, Activity, RefreshCw, ShoppingBag } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { db, trackEngagement } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { vaultService } from '../services/vaultService';
import { iotDiffuserService } from '../services/iotDiffuserService';
import { useToast } from '../hooks/useToast';
import { SmartFulfillmentCard } from '../components/SmartFulfillmentCard';

export const HabitatPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [room, setRoom] = useState('');
  const [intention, setIntention] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refinementInput, setRefinementInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [visionImage, setVisionImage] = useState<string | null>(null);
  const [visionAnalysis, setVisionAnalysis] = useState<any>(null);
  const [visionLoading, setVisionLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Yoga Flow state
  const [activeTab, setActiveTab] = useState<'habitat' | 'yoga'>('habitat');
  const [yogaMood, setYogaMood] = useState<'Energizing' | 'Restorative' | 'Focus'>('Restorative');
  const [yogaFlow, setYogaFlow] = useState<any>(null);
  const [yogaLoading, setYogaLoading] = useState(false);
  const [lastMood, setLastMood] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const docRef = doc(db, 'profiles', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
    };

    const fetchLastMood = async () => {
      try {
        const items = await vaultService.getUserItems(user.uid, 'mood');
        if (items.length > 0) {
          // Sort by creation date to get the absolute latest
          const sorted = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setLastMood(sorted[0].data.mood);
        }
      } catch (e) {
        console.error("Failed to fetch mood for suggestions", e);
      }
    };

    fetchProfile();
    fetchLastMood();
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!room || !intention) return;
    setLoading(true);
    setVisionAnalysis(null);
    setVisionImage(null);
    setHasSaved(false);
    try {
      let location = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          location = `${position.coords.latitude}, ${position.coords.longitude}`;
        } catch (e) {
          console.warn("Geolocation failed or timed out", e);
        }
      }
      const result = await geminiService.generateHabitatPlan(room, intention, profile?.healthData, location);
      setPlan(result);
      trackEngagement('habitat');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!plan || !refinementInput.trim()) return;
    setIsRefining(true);
    setHasSaved(false);
    try {
      let location = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          location = `${position.coords.latitude}, ${position.coords.longitude}`;
        } catch (e) {
          console.warn("Geolocation failed or timed out", e);
        }
      }
      const result = await geminiService.refineHabitatPlan(plan, refinementInput, profile?.healthData, location);
      setPlan(result);
      setRefinementInput('');
      toast("Habitat plan refined with your new goals!", "success");
      trackEngagement('habitat_refine');
    } catch (error) {
      console.error(error);
      toast("Failed to refine plan.", "error");
    } finally {
      setIsRefining(false);
    }
  };

  const handleSaveToVault = async () => {
    if (!user || !plan) return;
    setIsSaving(true);
    try {
      const dataToSave = {
        plan,
        visionAnalysis,
        room,
        intention,
        referenceImage: image,
        visionImage: visionImage
      };
      await vaultService.saveItem(
        user.uid, 
        'habitat', 
        plan.title, 
        dataToSave, 
        visionImage || image || `https://picsum.photos/seed/${plan.title}/800/600`,
        `Wellness plan for ${room} with intention: ${intention}`
      );
      setHasSaved(true);
      toast("Habitat plan saved to your Sacred Vault!", "success");
    } catch (error) {
      console.error(error);
      toast("Failed to save to vault.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVisualizeChanges = async () => {
    if (!visionImage || !plan) return;
    setVisionLoading(true);
    try {
      let location = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch (e) {
          console.warn("Geolocation failed or timed out", e);
        }
      }

      const base64 = visionImage.split(',')[1];
      const result = await geminiService.visualizeHabitatChanges(base64, plan, profile?.healthData, location);
      setVisionAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setVisionLoading(false);
    }
  };

  const handleVisionImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setVisionImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateYogaFlow = async () => {
    setYogaLoading(true);
    try {
      const result = await geminiService.generateYogaFlow(profile?.dosha || 'Vata', yogaMood, profile?.healthData);
      setYogaFlow(result);
      trackEngagement('habitat');

      // IoT Sync for Yoga Flow
      const moodAromas: Record<string, string> = {
        'Energizing': 'Peppermint',
        'Restorative': 'Lavender',
        'Focus': 'Sandalwood'
      };
      const moodColors: Record<string, string> = {
        'Energizing': '#f59e0b', // Amber
        'Restorative': '#10b981', // Emerald
        'Focus': '#6366f1'  // Indigo
      };

      const targetAroma = moodAromas[yogaMood] || 'Lavender';
      const targetColor = moodColors[yogaMood] || '#10b981';

      iotDiffuserService.triggerAroma(targetAroma, `${yogaMood} yoga flow activation`);
      
      fetch('/api/iot/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'lighting_sync',
          value: targetColor,
          reason: `Yoga flow atmospheric shift: ${yogaMood}`
        })
      }).catch(err => console.error("Yoga lighting sync failed", err));

    } catch (error) {
      console.error(error);
      toast("Failed to generate yoga flow.", "error");
    } finally {
      setYogaLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-12">
      <div className="text-center space-y-2 sm:space-y-4 px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#5A5A40]">Wellness Habitat</h2>
        <p className="text-base sm:text-xl text-[#2D3436] opacity-70 italic">Harmonize your living space and movement with nature.</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center px-4">
        <div className="bg-[#D1D1C1]/20 p-1 rounded-2xl flex gap-2 w-full max-w-md">
          <button
            onClick={() => setActiveTab('habitat')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all",
              activeTab === 'habitat' ? "bg-white text-[#5A5A40] shadow-sm" : "text-[#5A5A40]/60 hover:text-[#5A5A40]"
            )}
          >
            <Home size={16} /> Habitat Plan
          </button>
          <button
            onClick={() => setActiveTab('yoga')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all",
              activeTab === 'yoga' ? "bg-white text-[#5A5A40] shadow-sm" : "text-[#5A5A40]/60 hover:text-[#5A5A40]"
            )}
          >
            <Activity size={16} /> Yoga Sequence
          </button>
        </div>
      </div>

      {activeTab === 'habitat' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 px-4 sm:px-0">
          {/* Input Form */}
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#D1D1C1] shadow-xl space-y-6 sm:space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-bold text-[#5A5A40] uppercase tracking-widest">The Space</label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g., Bedroom, Studio"
                  className="w-full p-3 sm:p-4 rounded-xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-bold text-[#5A5A40] uppercase tracking-widest">Your Intention</label>
                <textarea
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                  placeholder="What energy do you want to cultivate?"
                  className="w-full p-3 sm:p-4 rounded-xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 h-24 sm:h-32 resize-none text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-bold text-[#5A5A40] uppercase tracking-widest">Reference Photo</label>
                <div className="aspect-video bg-[#F5F5F0] rounded-xl border-2 border-dashed border-[#D1D1C1] flex flex-col items-center justify-center overflow-hidden relative group">
                  {image ? (
                    <>
                      <img src={image} alt="Reference" className="w-full h-full object-cover" loading="lazy" />
                      <button onClick={() => setImage(null)} className="absolute top-2 right-2 p-2 bg-white/80 rounded-full text-red-500">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                      <Camera size={24} className="text-[#D1D1C1]" />
                      <span className="text-[10px] text-[#5A5A40] font-medium uppercase">Upload photo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!room || !intention || loading}
              className="w-full bg-[#5A5A40] text-white py-4 sm:py-5 rounded-2xl font-bold hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
              Generate Plan
            </button>
          </div>

          {/* Habitat Results */}
          <div className="space-y-8">
            {plan ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="p-8 bg-[#5A5A40] text-white rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{plan.title}</h3>
                    <p className="opacity-80 italic text-sm">A Vaastu-inspired plan for your sanctuary.</p>
                  </div>
                  <button
                    onClick={handleSaveToVault}
                    disabled={isSaving || hasSaved}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                      hasSaved 
                        ? "bg-emerald-500 text-white" 
                        : "bg-white text-[#5A5A40] hover:bg-[#F5F5F0]"
                    )}
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : hasSaved ? <Check size={16} /> : <Save size={16} />}
                    {hasSaved ? 'Saved to Vault' : 'Save to Vault'}
                  </button>
                </div>

                {!visionAnalysis && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-gradient-to-r from-amber-50 to-emerald-50 rounded-3xl border border-amber-100 shadow-sm flex flex-col sm:flex-row items-center gap-6"
                  >
                    <div className="p-4 bg-white rounded-full shadow-inner text-amber-600">
                      <Eye size={32} />
                    </div>
                    <div className="space-y-2 flex-1 text-center sm:text-left">
                      <h4 className="font-bold text-[#5A5A40] uppercase tracking-widest text-xs">Recommended Next Step: Sacred Vision</h4>
                      <p className="text-sm text-[#2D3436] opacity-70 italic leading-relaxed">
                        To truly manifest this plan, analyze it in the context of your actual room. 
                        Upload a photo below for <strong>Placement Strategies</strong> and to see the <strong>Expected Atmospheric Shift</strong>.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        const visionEl = document.getElementById('vision-section');
                        visionEl?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-6 py-3 bg-[#5A5A40] text-white rounded-xl text-xs font-bold hover:bg-[#4A4A30] transition-all whitespace-nowrap"
                    >
                      View Visualization Tool
                    </button>
                  </motion.div>
                )}

                {/* Refinement UI */}
                <div className="bg-[#F5F5F0] p-6 sm:p-8 rounded-[40px] border border-[#D1D1C1]/50 space-y-6 shadow-sm">
                  <div className="flex items-center gap-3 text-[#5A5A40]">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <RefreshCw className={cn(isRefining && "animate-spin")} size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold uppercase tracking-widest text-xs">Refine Manifesting Plan</h4>
                      <p className="text-[10px] opacity-60">Provide adjustments or specific wellness goals</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <textarea
                      value={refinementInput}
                      onChange={(e) => setRefinementInput(e.target.value)}
                      placeholder="e.g., Make it more minimalist, add more plants, or optimize for better sleep focus..."
                      className="w-full p-4 rounded-2xl border border-[#D1D1C1] bg-white focus:outline-none focus:ring-4 focus:ring-[#5A5A40]/10 text-sm min-h-[100px] resize-none transition-all"
                    />
                    <button
                      onClick={handleRefine}
                      disabled={isRefining || !refinementInput.trim()}
                      className="w-full bg-[#5A5A40] text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      {isRefining ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      Refine Habitat Plan
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PlanSection 
                    title="Color Palette" 
                    items={plan.colors} 
                    icon={Sparkles} 
                    color="bg-rose-50" 
                    onChange={(newItems: string[]) => setPlan({ ...plan, colors: newItems })}
                  />
                  <PlanSection 
                    title="Decor Elements" 
                    items={plan.decor} 
                    icon={Home} 
                    color="bg-emerald-50" 
                    onChange={(newItems: string[]) => setPlan({ ...plan, decor: newItems })}
                  />
                  <PlanSection 
                    title="Sensory Experience" 
                    items={plan.sensory} 
                    icon={Wind} 
                    color="bg-sky-50" 
                    onChange={(newItems: string[]) => setPlan({ ...plan, sensory: newItems })}
                  />
                  {plan.plants && (
                    <PlanSection 
                      title="Sacred Flora" 
                      items={plan.plants} 
                      icon={Sparkles} 
                      color="bg-emerald-50" 
                      onChange={(newItems: string[]) => setPlan({ ...plan, plants: newItems })}
                    />
                  )}
                  <div className="p-6 rounded-2xl bg-amber-50 border border-[#D1D1C1] space-y-4">
                    <div className="flex items-center gap-3 text-[#5A5A40]">
                      <Compass size={20} />
                      <h4 className="font-bold uppercase tracking-widest text-xs">Integrated Environment Wisdom</h4>
                    </div>
                    <textarea 
                      value={plan.integratedWisdom || plan.vaastu}
                      onChange={(e) => setPlan({ ...plan, integratedWisdom: e.target.value, vaastu: e.target.value })}
                      className="w-full text-sm italic leading-relaxed text-[#2D3436] bg-transparent border-none focus:ring-1 focus:ring-[#5A5A40]/10 rounded p-1 resize-none h-24"
                    />
                  </div>
                </div>

                {plan.fulfillmentActions && (
                  <div className="space-y-4">
                    <SmartFulfillmentCard actions={plan.fulfillmentActions} />
                    <div className="flex justify-center">
                      <Link 
                        to="/marketplace" 
                        className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] opacity-60 hover:opacity-100 flex items-center gap-2 px-6 py-3 bg-white rounded-full border border-[#D1D1C1]/30 transition-all shadow-sm"
                      >
                        <ShoppingBag size={14} /> Shop Sustainable Habitat Essentials
                      </Link>
                    </div>
                  </div>
                )}

                {/* AI Vision Overlay */}
                <div id="vision-section" className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D1D1C1] shadow-lg space-y-6">
                  <div className="flex items-center gap-3 text-[#5A5A40]">
                    <Eye size={24} />
                    <h4 className="font-bold uppercase tracking-widest text-sm">Visualize in Your Space</h4>
                  </div>

                  {!visionAnalysis ? (
                    <div className="space-y-6">
                      <p className="text-sm text-[#2D3436] opacity-70 italic">
                        Upload a photo of your current room to see how to apply this plan specifically to your space.
                      </p>
                      
                      <div className="aspect-video bg-[#F5F5F0] rounded-2xl border-2 border-dashed border-[#D1D1C1] flex flex-col items-center justify-center overflow-hidden relative group">
                        {visionImage ? (
                          <>
                            <img src={visionImage} alt="Your Space" className="w-full h-full object-cover" loading="lazy" />
                            <button onClick={() => setVisionImage(null)} className="absolute top-2 right-2 p-2 bg-white/80 rounded-full text-red-500">
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center gap-2">
                            <Camera size={32} className="text-[#D1D1C1]" />
                            <span className="text-[10px] text-[#5A5A40] font-bold uppercase tracking-widest">Select Room Photo</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleVisionImageUpload} />
                          </label>
                        )}
                      </div>

                      {visionImage && (
                        <button
                          onClick={handleVisualizeChanges}
                          disabled={visionLoading}
                          className="w-full bg-[#5A5A40] text-white py-4 rounded-xl font-bold hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-2"
                        >
                          {visionLoading ? <Loader2 className="animate-spin" /> : <Layers size={18} />}
                          Visualize Changes
                        </button>
                      )}
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#D1D1C1]">
                        <img src={visionImage!} alt="Original Space" className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                          <div className="text-white text-center p-6">
                            <Sparkles size={32} className="mx-auto mb-2 text-amber-300" />
                            <p className="text-sm font-bold uppercase tracking-widest">AI Vision Analysis Active</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="p-4 bg-[#F5F5F0] rounded-xl border-l-4 border-[#5A5A40] space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">Visual Overlay Analysis</h5>
                          </div>
                          <textarea 
                            value={visionAnalysis.overlayAnalysis}
                            onChange={(e) => {
                              setVisionAnalysis({ ...visionAnalysis, overlayAnalysis: e.target.value });
                            }}
                            className="w-full text-sm italic text-[#2D3436] leading-relaxed bg-transparent border-none focus:ring-1 focus:ring-[#5A5A40]/20 rounded p-1 resize-none min-h-[80px]"
                          />
                        </div>

                        {visionAnalysis.vaastuZones && (
                          <div className="space-y-4">
                            <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] flex items-center gap-2">
                              <Compass size={14} /> Vaastu Zone Mapping
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {visionAnalysis.vaastuZones.map((z: any, i: number) => (
                                <div key={i} className="p-3 bg-white rounded-xl border border-[#D1D1C1]/50 shadow-sm space-y-1">
                                  <div className="text-[9px] font-bold text-[#5A5A40] uppercase tracking-tighter">{z.zone}</div>
                                  <textarea 
                                    value={z.description}
                                    onChange={(e) => {
                                      const newZones = [...visionAnalysis.vaastuZones];
                                      newZones[i] = { ...newZones[i], description: e.target.value };
                                      setVisionAnalysis({ ...visionAnalysis, vaastuZones: newZones });
                                    }}
                                    className="w-full text-[10px] text-[#2D3436] opacity-70 italic bg-transparent border-none focus:ring-1 focus:ring-[#5A5A40]/10 rounded p-0.5 resize-none h-12"
                                  />
                                  <div className="text-[8px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md inline-block">
                                    {z.significance}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">Placement Strategies</h5>
                            <ul className="space-y-2">
                              {visionAnalysis.placementStrategies.map((item: string, i: number) => (
                                <li key={i} className="text-xs flex gap-2 text-[#2D3436] opacity-80 italic">
                                  <span>•</span> {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-3">
                            <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">Implementation Steps</h5>
                            <ul className="space-y-2">
                              {visionAnalysis.steps.map((item: string, i: number) => (
                                <li key={i} className="text-xs flex gap-2 text-[#2D3436] opacity-80 italic">
                                  <span className="text-[#5A5A40] font-bold">{i + 1}.</span> {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-[#D1D1C1]/30">
                          <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] mb-2">Expected Atmospheric Shift</h5>
                          <p className="text-xs text-[#2D3436] opacity-70 italic">{visionAnalysis.atmosphericShift}</p>
                        </div>

                        <button 
                          onClick={() => { setVisionAnalysis(null); setVisionImage(null); }}
                          className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest hover:underline"
                        >
                          Reset Vision Analysis
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {image && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-[#5A5A40]">Visual Re-imagination</h4>
                    <div className="aspect-video rounded-3xl overflow-hidden border border-[#D1D1C1] shadow-lg">
                      <img 
                        src={`https://picsum.photos/seed/${plan.title}/1200/800`} 
                        alt="Re-imagined Space" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-[#D1D1C1] rounded-3xl bg-white/50 italic opacity-60">
                <Info size={48} className="mb-4" />
                <p>Describe your space and intention to receive a personalized Ayurvedic habitat plan.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 px-4 sm:px-0">
          {/* Yoga Controls */}
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#D1D1C1] shadow-xl space-y-8 h-fit">
            <div className="space-y-6">
              <div className="p-6 bg-[#F5F5F0] rounded-2xl border border-[#D1D1C1]/30">
                <div className="flex items-center gap-3 text-[#5A5A40] mb-2">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Sparkles size={18} />
                  </div>
                  <h4 className="font-bold text-sm uppercase tracking-widest">Personalized Alignment</h4>
                </div>
                <p className="text-xs text-[#2D3436] opacity-70 italic leading-relaxed">
                  Generating a flow for your dominant dosha: <span className="font-bold text-[#5A5A40]">{profile?.dosha || 'Vata'}</span>
                </p>
              </div>

              <div className="space-y-4">
                <label className="text-xs sm:text-sm font-bold text-[#5A5A40] uppercase tracking-widest">Intended Mood</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Energizing', 'Restorative', 'Focus'] as const).map((mood) => (
                    <button
                      key={mood}
                      onClick={() => setYogaMood(mood)}
                      className={cn(
                        "py-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all border",
                        yogaMood === mood 
                          ? "bg-[#5A5A40] text-white border-[#5A5A40] shadow-md" 
                          : "bg-white text-[#5A5A40] border-[#D1D1C1]/50 hover:bg-[#F5F5F0]"
                      )}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateYogaFlow}
                disabled={yogaLoading}
                className="w-full bg-[#5A5A40] text-white py-4 sm:py-5 rounded-2xl font-bold hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {yogaLoading ? <Loader2 className="animate-spin" /> : <Activity size={18} />}
                Generate Sacred Flow
              </button>
            </div>
          </div>

          {/* Yoga Results */}
          <div className="min-h-[400px]">
            {!yogaFlow && (profile?.dosha === 'Pitta' && (lastMood === 'Harmonious' || lastMood === 'Balanced' || lastMood === 'Calm')) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-[40px] text-white shadow-2xl relative overflow-hidden mb-8 group"
              >
                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
                  <Sparkles size={120} />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-white/30 backdrop-blur-md">
                    Sacred Suggestion
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-serif font-bold italic">Stabilizing Pitta Flow</h3>
                    <p className="text-sm opacity-90 font-serif leading-relaxed italic max-w-md">
                      "Since you're feeling <span className="font-bold underline decoration-indigo-300">{lastMood}</span>, we recommend a Pitta-Pacifying flow to maintain your internal equilibrium. This sequence focuses on cooling the core and stabilizing your metabolic fire."
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        setYogaMood('Restorative');
                        handleGenerateYogaFlow();
                      }}
                      className="px-6 py-3 bg-white text-indigo-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                    >
                      Instant Blueprint
                    </button>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                      Based on current {profile.dosha} state
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {yogaFlow ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 pb-12">
                <div className="p-8 bg-[#5A5A40] text-white rounded-3xl shadow-xl">
                  <h3 className="text-2xl font-bold mb-1">{yogaFlow.title}</h3>
                  <p className="opacity-80 italic text-sm">{yogaFlow.description}</p>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-gradient-to-r from-emerald-50 to-indigo-50 rounded-3xl border border-emerald-100 shadow-sm flex flex-col sm:flex-row items-center gap-6"
                >
                  <div className="p-4 bg-white rounded-full shadow-inner text-emerald-600">
                    <RefreshCw size={24} className="animate-pulse" />
                  </div>
                  <div className="space-y-2 flex-1 text-center sm:text-left">
                    <h4 className="font-bold text-[#5A5A40] uppercase tracking-widest text-xs">Refine Your Practice</h4>
                    <p className="text-sm text-[#2D3436] opacity-70 italic leading-relaxed">
                      Deepen your journey. Try generating a variation for <strong>{yogaMood === 'Energizing' ? 'Restorative' : 'Energizing'}</strong> mood or ask for <strong>{profile?.dosha || 'Vata'}-specific</strong> therapeutic asanas.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      const controlsEl = document.querySelector('label[class*="uppercase"]');
                      controlsEl?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-6 py-3 bg-white text-[#5A5A40] border border-[#D1D1C1] rounded-xl text-xs font-bold hover:bg-[#F5F5F0] transition-all whitespace-nowrap"
                  >
                    Adjust Settings
                  </button>
                </motion.div>

                <div className="space-y-6">
                  {yogaFlow.asanas.map((asana: any, i: number) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-[#D1D1C1] shadow-sm flex flex-col sm:flex-row gap-6 items-start">
                      <div className="w-12 h-12 bg-[#F5F5F0] text-[#5A5A40] rounded-xl flex items-center justify-center font-bold text-xl shrink-0">
                        {i + 1}
                      </div>
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-lg font-bold text-[#5A5A40]">{asana.name}</h4>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md uppercase tracking-widest border border-emerald-100">
                            {asana.benefit}
                          </span>
                        </div>
                        <p className="text-sm italic text-[#2D3436] opacity-70">
                          <span className="font-bold text-[#5A5A40] not-italic">Breath:</span> {asana.breathing}
                        </p>
                        {asana.spiritualFocus && (
                          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                             <div className="flex items-center gap-1.5 text-indigo-700 text-[9px] font-bold uppercase tracking-widest mb-1">
                               <Sparkles size={10} /> Spiritual Sync
                             </div>
                             <p className="text-xs text-indigo-900/60 italic leading-snug">{asana.spiritualFocus}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200/50 space-y-3">
                  <div className="flex items-center gap-3 text-amber-700">
                    <Compass size={20} />
                    <h4 className="font-bold uppercase tracking-widest text-xs">Integrated Wisdom</h4>
                  </div>
                  <p className="text-sm italic leading-relaxed text-amber-900/70">{yogaFlow.integratedWisdom}</p>
                  <div className="pt-3 border-t border-amber-200/50">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-amber-800/60 mb-1">Sub-Dosha Impact</div>
                    <p className="text-xs italic text-amber-900/60">{yogaFlow.subDoshaImpact}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-[#D1D1C1] rounded-3xl bg-white/50 italic opacity-60">
                <Activity size={48} className="mb-4" />
                <p>Select a mood and generate a sacred yoga flow aligned with your unique energy.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PlanSection = ({ title, items, icon: Icon, color, onChange }: any) => (
  <div className={cn("p-6 rounded-2xl border border-[#D1D1C1] space-y-4", color)}>
    <div className="flex items-center gap-3 text-[#5A5A40]">
      <Icon size={20} />
      <h4 className="font-bold uppercase tracking-widest text-xs">{title}</h4>
    </div>
    <ul className="space-y-3">
      {items.map((item: string, i: number) => (
        <li key={i} className="text-sm flex gap-2 text-[#2D3436]">
          <span className="text-[#5A5A40] mt-1">•</span> 
          {onChange ? (
            <input 
              type="text"
              value={item}
              onChange={(e) => {
                const newItems = [...items];
                newItems[i] = e.target.value;
                onChange(newItems);
              }}
              className="w-full bg-transparent border-none focus:ring-1 focus:ring-[#5A5A40]/10 rounded p-1 text-sm italic"
            />
          ) : (
            item
          )}
        </li>
      ))}
    </ul>
  </div>
);

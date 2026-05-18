import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sprout, 
  Droplets, 
  Sun, 
  Wind, 
  Loader2, 
  Info, 
  Plus, 
  ShoppingBag, 
  MapPin, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Heart,
  Store,
  Camera,
  X,
  Globe,
  History,
  Clock,
  Activity,
  Boxes,
  Hexagon,
  Book,
  Trash2
} from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { db, handleFirestoreError, OperationType, trackEngagement } from '../lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, deleteDoc } from 'firebase/firestore';
import { useToast } from '../hooks/useToast';
import { vaultService } from '../services/vaultService';
import { CameraModal } from '../components/CameraModal';
import { Save, Check } from 'lucide-react';

import { sanitizeString, prepareForStorage } from '../lib/security';

export const PrithviPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [plantingPlan, setPlantingPlan] = useState<any>(null);
  const [locationContext, setLocationContext] = useState<any>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [listingProduce, setListingProduce] = useState(false);
  const [myProduce, setMyProduce] = useState<any[]>([]);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [idRefinementText, setIdRefinementText] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isRefiningID, setIsRefiningID] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [isSavingID, setIsSavingID] = useState(false);
  const [hasSavedID, setHasSavedID] = useState(false);
  const [isEditingPlant, setIsEditingPlant] = useState(false);
  
  const [identifyingPlant, setIdentifyingPlant] = useState(false);
  const [identifiedPlant, setIdentifiedPlant] = useState<any>(null);
  const [showIdentifiedModal, setShowIdentifiedModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    unit: 'kg',
    category: 'Vegetable',
    organic: true,
    location: ''
  });
  const [producePhoto, setProducePhoto] = useState<string | null>(null);
  const [showProduceCamera, setShowProduceCamera] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const docRef = doc(db, 'profiles', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
    };
    fetchProfile();

    const producePath = 'marketplace_produce';
    const q = query(collection(db, producePath), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyProduce(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, producePath);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await res.json();
          setLocationContext(`${data.city || data.locality}, ${data.countryName}`);
        } catch (error) {
          console.error(error);
          setLocationContext("Unknown Location");
        }
      });
    }
  }, []);

  const handleGeneratePlan = async (isRefiningPlan = false) => {
    if (!profile?.dosha) return;
    if (isRefiningPlan) {
      setIsRefining(true);
    } else {
      setLoading(true);
    }

    try {
      const plan = await geminiService.getPlantingRecommendations(
        profile.dosha, 
        locationContext || "Global", 
        profile.healthData,
        isRefiningPlan ? refinementPrompt : undefined
      );
      setPlantingPlan(plan);
      setHasSaved(false);
      trackEngagement('prithvi');
      if (isRefiningPlan) {
        toast("Garden plan refined successfully!", "success");
        setRefinementPrompt('');
      }
    } catch (error) {
      console.error(error);
      toast("Failed to update garden plan.", "error");
    } finally {
      setLoading(false);
      setIsRefining(false);
    }
  };

  const handleSavePlanToVault = async () => {
    if (!user || !plantingPlan) return;
    setIsSaving(true);
    try {
      await vaultService.saveItem(
        user.uid,
        'prithvi',
        plantingPlan.title,
        plantingPlan,
        `https://picsum.photos/seed/${plantingPlan.title}/800/600`,
        `Botanical sanctuary plan for ${locationContext || 'your location'}`
      );
      setHasSaved(true);
      toast("Garden plan saved to your Sacred Vault!", "success");
    } catch (error) {
      console.error(error);
      toast("Failed to save to vault.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePlantToVault = async () => {
    if (!user || !identifiedPlant) return;
    setIsSavingID(true);
    try {
      await vaultService.saveItem(
        user.uid,
        'prithvi',
        identifiedPlant.commonName,
        identifiedPlant,
        `https://picsum.photos/seed/${identifiedPlant.commonName}/800/600`,
        `Identified ${identifiedPlant.commonName} (${identifiedPlant.botanicalName})`
      );
      setHasSavedID(true);
      toast("Plant wisdom saved to your Sacred Vault!", "success");
    } catch (error) {
      console.error(error);
      toast("Failed to save to vault.", "error");
    } finally {
      setIsSavingID(false);
    }
  };

  const handleListProduce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setListingProduce(true);
    const producePath = 'marketplace_produce';
    try {
      const sanitizedData = {
        ...formData,
        name: prepareForStorage(sanitizeString(formData.name), 100),
        description: prepareForStorage(sanitizeString(formData.description), 1000),
        location: prepareForStorage(sanitizeString(formData.location || locationContext || "Unknown"), 200),
        price: Math.max(0, Number(formData.price))
      };

      await addDoc(collection(db, producePath), {
        ...sanitizedData,
        userId: user.uid,
        userName: profile?.name || user.email?.split('@')[0],
        createdAt: serverTimestamp(),
        image: producePhoto
      });
      setShowListModal(false);
      setFormData({ name: '', description: '', price: '', unit: 'kg', category: 'Vegetable', organic: true, location: '' });
      setProducePhoto(null);
      toast("Produce listed on Marketplace!", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, producePath);
    } finally {
      setListingProduce(false);
    }
  };

  const handlePlantIdentification = async (e: React.ChangeEvent<HTMLInputElement> | string) => {
    let base64 = '';
    if (typeof e === 'string') {
      base64 = e;
    } else {
      const file = e.target.files?.[0];
      if (!file) return;
      base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
    }

    setIdentifyingPlant(true);
    setShowCamera(false);
    try {
      const result = await geminiService.identifyPlant(base64, profile?.healthData, locationContext);
      if (result) {
        setIdentifiedPlant(result);
        setShowIdentifiedModal(true);
        trackEngagement('prithvi');
        toast("Plant identified successfully!", "success");
      } else {
        toast("Failed to identify plant. Please try again.", "error");
      }
    } catch (error) {
      console.error(error);
      toast("Error processing image.", "error");
    } finally {
      setIdentifyingPlant(false);
    }
  };

  const handleRefineIdentification = async () => {
    if (!idRefinementText.trim() || !identifiedPlant) return;
    setIsRefiningID(true);
    try {
      const result = await geminiService.refinePlantIdentification(
        identifiedPlant,
        idRefinementText,
        profile?.healthData
      );
      if (result) {
        setIdentifiedPlant(result);
        setIdRefinementText('');
        setHasSavedID(false);
        toast("Identification refined with your wisdom.", "success");
      }
    } catch (error) {
      console.error(error);
      toast("Neural refinement failed.", "error");
    } finally {
      setIsRefiningID(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-12 pb-20 px-4 sm:px-0">
      {/* Hero Section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto py-6 sm:py-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#5A5A40]">Prithvi: The Garden</h1>
        <p className="text-sm sm:text-lg md:text-xl text-[#2D3436] opacity-70 italic font-serif px-2">
          Cultivate harmony with the earth. Grow what heals you.
        </p>

        {/* Sacred Discovery Suggestion */}
        {!identifiedPlant && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto mt-6 bg-white/40 backdrop-blur-sm border border-emerald-100 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center gap-4 sm:gap-6 border-dashed"
          >
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
              <Camera size={24} />
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h4 className="text-sm font-bold text-[#5A5A40] flex items-center justify-center sm:justify-start gap-2">
                <Sparkles size={14} className="text-amber-500" /> Sacred Discovery
              </h4>
              <p className="text-xs text-[#2D3436]/60 italic font-serif leading-relaxed">
                "The earth speaks in the language of flora. Carry your device into your garden and scan a leaf to unlock its Ayurvedic molecular signature and ancient wisdom."
              </p>
            </div>
          </motion.div>
        )}

        {!plantingPlan && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
            <button
              onClick={() => handleGeneratePlan(false)}
              disabled={loading || !profile?.dosha}
              className="w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-4 bg-[#5A5A40] text-white rounded-full font-bold shadow-xl hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Cultivating Earth Wisdom...
                </>
              ) : (
                <>
                  <Sprout size={20} />
                  Generate Plan
                </>
              )}
            </button>
            <button
              onClick={() => setShowCamera(true)}
              disabled={identifyingPlant}
              className="w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-4 bg-white text-[#5A5A40] border-2 border-[#5A5A40] rounded-full font-bold shadow-lg hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
            >
              <Camera size={20} />
              Scan Live
            </button>
            <label className="w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-4 bg-[#F5F5F0] text-[#5A5A40] border border-[#D1D1C1]/30 rounded-full font-bold shadow-md hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm sm:text-base">
              <ShoppingBag size={20} />
              Upload Photo
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePlantIdentification}
                disabled={identifyingPlant}
              />
            </label>
          </div>
        )}
      </section>

      <AnimatePresence>
        {showCamera && (
          <CameraModal 
            title="Scan Botanical Specimen"
            onCapture={handlePlantIdentification}
            onClose={() => setShowCamera(false)}
          />
        )}
      </AnimatePresence>

      {plantingPlan && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 sm:space-y-12">
          {/* Motivator */}
          <div className="bg-white p-6 sm:p-10 md:p-12 rounded-[30px] sm:rounded-[40px] border border-[#D1D1C1] shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none hidden lg:block">
              <Sprout size={200} />
            </div>
            <div className="max-w-2xl space-y-4 sm:space-y-6">
              <div className="flex justify-between items-start">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                  <Sparkles size={12} /> Seasonal Wisdom
                </div>
                <button
                  onClick={handleSavePlanToVault}
                  disabled={isSaving || hasSaved}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-md",
                    hasSaved 
                      ? "bg-emerald-500 text-white" 
                      : "bg-[#5A5A40] text-white hover:bg-[#4A4A30]"
                  )}
                >
                  {isSaving ? <Loader2 className="animate-spin" size={12} /> : hasSaved ? <Check size={12} /> : <Save size={12} />}
                  {hasSaved ? 'Saved to Vault' : 'Save Plan'}
                </button>
              </div>
              <h2 className="text-xl sm:text-3xl font-serif font-bold text-[#5A5A40]">{plantingPlan.title}</h2>
              <p className="text-sm sm:text-lg italic text-[#2D3436] opacity-80 leading-relaxed font-serif">
                "{plantingPlan.motivatorText}"
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-12 pt-2 sm:pt-4">
                <div className="space-y-1">
                  <div className="text-[9px] sm:text-[10px] uppercase font-bold opacity-40 text-[#5A5A40]">Cycle</div>
                  <div className="text-xs sm:text-sm font-bold text-[#5A5A40]">{plantingPlan.regionalCycle}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[9px] sm:text-[10px] uppercase font-bold opacity-40 text-[#5A5A40]">Advice</div>
                  <div className="text-xs sm:text-sm font-bold text-[#5A5A40]">{plantingPlan.farmingWisdom}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Refinement Section */}
          <div className="bg-white p-5 sm:p-8 rounded-[30px] sm:rounded-[40px] border border-[#D1D1C1] shadow-sm">
            <div className="flex flex-col lg:flex-row items-center gap-4 sm:gap-6">
              <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sparkles size={20} className="sm:w-6" />
              </div>
              <div className="flex-1 space-y-1 text-center lg:text-left">
                <h3 className="font-bold text-sm sm:text-base text-[#5A5A40]">Refine Your Plan</h3>
                <p className="text-[10px] sm:text-sm text-[#2D3436]/60 italic">Customize for specific health goals or dosha benefits.</p>
              </div>
              <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={refinementPrompt}
                  onChange={(e) => setRefinementPrompt(e.target.value)}
                  placeholder="e.g., focus more on digestion"
                  className="w-full sm:w-80 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#D1D1C1] focus:ring-2 focus:ring-[#5A5A40]/20 outline-none text-xs sm:text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && refinementPrompt.trim()) {
                      handleGeneratePlan(true);
                    }
                  }}
                />
                <button
                  onClick={() => handleGeneratePlan(true)}
                  disabled={isRefining || !refinementPrompt.trim()}
                  className="w-full sm:w-auto px-8 py-3 sm:py-4 bg-[#5A5A40] text-white rounded-xl sm:rounded-2xl font-bold shadow-lg hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs sm:text-base"
                >
                  {isRefining ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Refining Sanctuary...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Refine
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Plant Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plantingPlan.plants.map((plant: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-3xl border border-[#D1D1C1] space-y-4 hover:shadow-xl transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sprout size={24} />
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{plant.type}</div>
                  <h3 className="text-lg font-bold text-[#5A5A40]">{plant.name}</h3>
                </div>
                <div className="space-y-3 pt-2">
                  <p className="text-xs italic text-[#2D3436] opacity-70">
                    <span className="font-bold text-rose-500 uppercase not-italic text-[9px] block">Dosha Benefit</span>
                    {plant.doshaBenefit}
                  </p>
                  <p className="text-xs italic text-[#2D3436] opacity-70">
                    <span className="font-bold text-indigo-500 uppercase not-italic text-[9px] block">Modern Clinical Value</span>
                    {plant.modernClinicalValue}
                  </p>
                  <div className="pt-2 border-t border-[#F5F5F0]">
                    <div className="text-[9px] font-bold uppercase text-emerald-600 mb-1 flex items-center gap-1">
                      <TrendingUp size={10} /> Marketplace Value
                    </div>
                    <p className="text-[10px] text-[#2D3436]/60 leading-tight italic">{plant.marketplaceValue}</p>
                  </div>
                  {plant.plantingTip && (
                    <div className="pt-2 border-t border-[#F5F5F0]">
                      <div className="text-[9px] font-bold uppercase text-amber-600 mb-1 flex items-center gap-1">
                        <Sparkles size={10} /> Planting Tip
                      </div>
                      <p className="text-[10px] text-[#2D3436]/70 leading-relaxed font-serif italic">"{plant.plantingTip}"</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          {/* Additional Wellness Plants Section */}
          <section className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-2xl font-serif font-bold text-[#5A5A40]">Sacred Flora: Community Favorites</h3>
                <p className="text-sm text-[#2D3436] opacity-60 italic">Timeless healing plants for every conscious garden.</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-[#D1D1C1] text-xs font-bold text-[#5A5A40]">
                <Info size={14} className="text-emerald-500" />
                Trusted by 5,000+ Growers
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  name: "Tulsi (Holy Basil)",
                  category: "Herb",
                  benefit: "Boosts immunity, relieves stress, and balances Kapha and Vata.",
                  modernValue: "Clinically proven to reduce cortisol levels and act as an adaptogen for metabolic stress.",
                  image: "https://picsum.photos/seed/basil/800/600"
                },
                {
                  name: "Ashwagandha",
                  category: "Herb",
                  benefit: "Enhances vitality, improves sleep, and balances Vata.",
                  modernValue: "Validated for its neuroprotective effects and ability to modulate the HPA axis.",
                  image: "https://picsum.photos/seed/root/800/600"
                },
                {
                  name: "Brahmi",
                  category: "Herb",
                  benefit: "Improves memory, concentration, and balances all three Doshas.",
                  modernValue: "Contains bacosides which promote synaptic communication for cognitive health.",
                  image: "https://picsum.photos/seed/greenery/800/600"
                },
                {
                  name: "Aloe Vera (Kumari)",
                  category: "Succulent",
                  benefit: "Soothes skin, improves digestion, and balances Pitta.",
                  modernValue: "Rich in acemannan which stimulates collagen production and improves wound healing.",
                  image: "https://picsum.photos/seed/succulent/800/600"
                },
                {
                  name: "Turmeric (Haridra)",
                  category: "Root",
                  benefit: "Anti-inflammatory, blood purifier, and balances all Doshas.",
                  modernValue: "Curcuminoids inhibit systemic inflammatory pathways like NF-kB and COX-2.",
                  image: "https://picsum.photos/seed/turmeric/800/600"
                },
                {
                  name: "Neem",
                  category: "Tree",
                  benefit: "Detoxifies blood, treats skin issues, and balances Pitta-Kapha.",
                  modernValue: "Abundant in azadirachtin, displaying broad-spectrum antimicrobial activity.",
                  image: "https://picsum.photos/seed/neem/800/600"
                }
              ].map((plant, idx) => (
                <motion.div
                  key={plant.name}
                  whileHover={{ y: -10 }}
                  className="bg-white rounded-[40px] border border-[#D1D1C1] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col group h-full"
                >
                  <div className="h-48 sm:h-56 overflow-hidden relative">
                    <img 
                      src={plant.image} 
                      alt={plant.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[#5A5A40] text-[10px] font-bold rounded-full uppercase tracking-tighter">
                        {plant.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 sm:p-8 space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg sm:text-xl font-bold text-[#5A5A40]">{plant.name}</h4>
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Heart size={14} className="fill-emerald-600" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm text-[#2D3436]/70 leading-relaxed font-serif italic">
                        <span className="text-[10px] font-bold text-rose-500 block uppercase tracking-widest not-italic mb-1">Ayurvedic Benefit</span>
                        {plant.benefit}
                      </p>
                      <p className="text-sm text-[#2D3436]/70 leading-relaxed font-serif italic">
                        <span className="text-[10px] font-bold text-indigo-500 block uppercase tracking-widest not-italic mb-1">Modern Clinical Value</span>
                        {plant.modernValue}
                      </p>
                    </div>
                    <div className="pt-4 mt-auto border-t border-[#F5F5F0] flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Wellness Favorite</span>
                      <button className="text-xs font-bold text-[#5A5A40] flex items-center gap-1 group/btn">
                        Grow Tips <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </motion.div>
      )}

      {/* My Garden & Sales Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-[#5A5A40] flex items-center gap-2">
              <Sprout className="text-emerald-500" /> My Garden Produce
            </h3>
            <button 
              onClick={() => setShowListModal(true)}
              className="px-6 py-2 bg-emerald-600 text-white rounded-full text-sm font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2"
            >
              <Plus size={18} /> List for Sale
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myProduce.length > 0 ? myProduce.map((p) => (
              <div key={p.id} className="bg-white p-6 rounded-3xl border border-[#D1D1C1] shadow-sm flex items-center gap-4 group relative">
                <div className="w-16 h-16 bg-[#F5F5F0] rounded-2xl flex items-center justify-center text-[#5A5A40]">
                  <ShoppingBag size={32} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-[#5A5A40] truncate pr-8">{p.name}</h4>
                    <span className="text-sm font-bold text-emerald-600">${p.price}/{p.unit}</span>
                  </div>
                  <p className="text-xs opacity-60 italic line-clamp-1">{p.description}</p>
                  {p.organic && (
                    <span className="text-[9px] mt-1 inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold uppercase tracking-widest">
                      100% Organic
                    </span>
                  )}
                </div>
                <button 
                  onClick={async () => {
                    if (!window.confirm("Remove this listing?")) return;
                    try {
                      await deleteDoc(doc(db, 'marketplace_produce', p.id));
                      toast("Produce removed from market.", "success");
                    } catch (error) {
                      console.error(error);
                      toast("Failed to remove listing.", "error");
                    }
                  }}
                  className="absolute top-4 right-4 p-2 text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-50 rounded-xl transition-all"
                  title="Remove listing"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )) : (
              <div className="col-span-2 text-center py-20 bg-white rounded-[40px] border border-dashed border-[#D1D1C1] opacity-50 italic">
                <Info size={48} className="mx-auto mb-4" />
                <p>You haven't listed any garden produce yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#5A5A40] text-white p-8 rounded-[40px] shadow-2xl space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp /> Marketplace Potential
            </h3>
            <p className="text-sm text-white/70 italic leading-relaxed">
              Your garden is not just a source of food; it's a micro-business. Organic, dosha-aligned produce fetching 3x higher prices in the AIveda marketplace.
            </p>
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Store size={18} /></div>
                <div className="text-xs">Active Buyers: <span className="font-bold font-mono">1,248</span></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Heart size={18} /></div>
                <div className="text-xs">Community Rating: <span className="font-bold font-mono">Top 5%</span></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-[40px] border border-[#D1D1C1] space-y-4">
            <div className="flex items-center gap-2 text-[#5A5A40]">
              <MapPin size={20} className="text-emerald-500" />
              <h4 className="font-bold">Local Network</h4>
            </div>
            <p className="text-xs text-[#2D3436]/60 italic">Your location ({locationContext || "Detecting..."}) is perfect for growing {profile?.dosha === 'Pitta' ? 'Aloe Vera and Mint' : profile?.dosha === 'Vata' ? 'Root vegetables' : 'Ginger and Mustard'}.</p>
          </div>
        </div>
      </section>

      {/* Plant Result Modal */}
      <AnimatePresence>
        {showIdentifiedModal && identifiedPlant && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-[#F5F5F0] bg-[#F5F5F0] flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Sprout size={24} />
                  </div>
                  <div className="flex-1">
                    {isEditingPlant ? (
                      <div className="space-y-1">
                        <input 
                          type="text"
                          value={identifiedPlant.commonName}
                          onChange={(e) => setIdentifiedPlant({...identifiedPlant, commonName: e.target.value})}
                          className="w-full text-xl font-bold text-[#5A5A40] uppercase tracking-wider bg-white px-2 py-1 rounded"
                        />
                        <input 
                          type="text"
                          value={identifiedPlant.botanicalName}
                          onChange={(e) => setIdentifiedPlant({...identifiedPlant, botanicalName: e.target.value})}
                          className="w-full text-xs italic text-[#2D3436]/60 font-serif bg-white px-2 py-1 rounded"
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="text-xl font-bold text-[#5A5A40] uppercase tracking-wider">{identifiedPlant.commonName}</h3>
                        <p className="text-xs italic text-[#2D3436]/60 font-serif">{identifiedPlant.botanicalName}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsEditingPlant(!isEditingPlant)}
                    className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] opacity-60 hover:opacity-100 flex items-center gap-1 bg-white/50 px-3 py-2 rounded-xl transition-all"
                  >
                    {isEditingPlant ? <><Save size={14} /> Lock Wisdom</> : <><Sparkles size={14} /> Correct AI</>}
                  </button>
                  <button 
                    onClick={() => setShowIdentifiedModal(false)}
                    className="p-2 hover:bg-[#D1D1C1] rounded-full transition-all text-[#5A5A40]"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Ayurvedic Section */}
                  <div className="space-y-4 bg-emerald-50/30 p-6 rounded-3xl border border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold uppercase tracking-widest text-xs">
                      <Sparkles size={14} /> Ayurvedic Profile
                    </div>
                    <div className="space-y-3 text-sm">
                      <p><span className="font-bold text-emerald-800">Dosha:</span> {identifiedPlant.ayurvedicData.doshaImpact}</p>
                      <p><span className="font-bold text-emerald-800">Properties:</span> {identifiedPlant.ayurvedicData.rasa}, {identifiedPlant.ayurvedicData.guna}</p>
                      <p><span className="font-bold text-emerald-800">Potency:</span> {identifiedPlant.ayurvedicData.virya} / {identifiedPlant.ayurvedicData.vipaka}</p>
                      <div className="pt-2 border-t border-emerald-200">
                        {isEditingPlant ? (
                          <textarea 
                            value={identifiedPlant.ayurvedicData.benefits}
                            onChange={(e) => setIdentifiedPlant({
                              ...identifiedPlant,
                              ayurvedicData: { ...identifiedPlant.ayurvedicData, benefits: e.target.value }
                            })}
                            className="w-full text-sm italic font-serif text-[#5A5A40] leading-relaxed bg-white border border-emerald-100 rounded-xl p-3 h-24 outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        ) : (
                          <p className="italic font-serif text-[#5A5A40] leading-relaxed">
                            "{identifiedPlant.ayurvedicData.benefits}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Modern Science Section */}
                  <div className="space-y-4 bg-indigo-50/30 p-6 rounded-3xl border border-indigo-100">
                    <div className="flex items-center gap-2 text-indigo-700 font-bold uppercase tracking-widest text-xs">
                      <TrendingUp size={14} /> Modern Science
                    </div>
                    <div className="space-y-3 text-sm text-[#2D3436]/80">
                      <p className="font-bold text-indigo-900 leading-tight">{identifiedPlant.modernMedicinalProperties.clinicalValue}</p>
                      <div className="flex flex-wrap gap-2">
                        {identifiedPlant.modernMedicinalProperties.bioactiveCompounds.map((c: string) => (
                          <span key={c} className="px-2 py-1 bg-white border border-indigo-100 rounded-lg text-[10px] uppercase font-bold text-indigo-600">
                            {c}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs italic leading-relaxed">
                        {identifiedPlant.modernMedicinalProperties.modernBenefits}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Panchendriya & Ethereal Insights Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-[#5A5A40] font-bold uppercase tracking-widest text-xs border-b border-[#D1D1C1] pb-2">
                    <Sparkles size={14} className="text-amber-500" /> Panchendriya & Ethereal Insights
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100 space-y-2">
                      <div className="flex items-center gap-2 text-amber-700 font-bold text-[10px] uppercase tracking-wider">
                        <Boxes size={14} /> Sacred Geometry
                      </div>
                      <p className="text-xs text-[#2D3436]/80 italic">{identifiedPlant.panchendriyaInsights.geometry}</p>
                    </div>

                    <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-[10px] uppercase tracking-wider">
                        <Globe size={14} /> Bioregional Geography
                      </div>
                      <p className="text-xs text-[#2D3436]/80 italic">{identifiedPlant.panchendriyaInsights.geographyAndHistory}</p>
                    </div>

                    <div className="p-4 bg-rose-50/30 rounded-2xl border border-rose-100 space-y-2">
                      <div className="flex items-center gap-2 text-rose-700 font-bold text-[10px] uppercase tracking-wider">
                        <Clock size={14} /> Temporal Signature
                      </div>
                      <p className="text-xs text-[#2D3436]/80 italic">{identifiedPlant.panchendriyaInsights.temporalSignature}</p>
                    </div>

                    <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-700 font-bold text-[10px] uppercase tracking-wider">
                        <Activity size={14} /> Bio-Electrical Resonance
                      </div>
                      <p className="text-xs text-[#2D3436]/80 italic">{identifiedPlant.panchendriyaInsights.bioElectricalCommunication}</p>
                    </div>

                    {/* Phytochemical Abstract Section */}
                    {identifiedPlant.panchendriyaInsights.phytochemicalAbstract && (
                      <div className="p-4 bg-purple-50/30 rounded-2xl border border-purple-100 space-y-2 md:col-span-2 overflow-hidden relative group">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-120 transition-transform duration-1000">
                          <Activity size={100} className="text-purple-600 rotate-45" />
                        </div>
                        <div className="flex items-center gap-2 text-purple-700 font-bold text-[10px] uppercase tracking-wider">
                          <Hexagon size={14} /> Phytochemical Abstract (Molecular Art)
                        </div>
                        <p className="text-xs text-[#2D3436]/80 italic relative z-10 leading-relaxed">
                          {identifiedPlant.panchendriyaInsights.phytochemicalAbstract}
                        </p>
                        <div className="flex gap-1 pt-2">
                          {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="h-1 flex-1 bg-purple-200/50 rounded-full overflow-hidden">
                              <motion.div 
                                animate={{ x: ['-100%', '100%'] }} 
                                transition={{ duration: 2 + i, repeat: Infinity, ease: "linear" }}
                                className="w-full h-full bg-purple-400"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Textual References Section */}
                {identifiedPlant.textReferences && identifiedPlant.textReferences.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#5A5A40] font-bold uppercase tracking-widest text-xs border-b border-[#D1D1C1] pb-2">
                       <Book className="text-[#5A5A40]/40" size={14} /> Textual References & Clinical Lineage
                    </div>
                    <div className="space-y-3">
                      {identifiedPlant.textReferences.map((ref: any, idx: number) => (
                        <div key={idx} className="p-4 bg-[#F5F5F0] rounded-2xl border border-[#D1D1C1]/30 space-y-1">
                          <h5 className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-wider">{ref.title}</h5>
                          <p className="text-xs text-[#2D3436]/70 italic leading-relaxed font-serif">"{ref.description}"</p>
                          <div className="pt-1 flex items-center justify-end">
                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">— {ref.source}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Identification Refinement Section */}
                <div className="p-6 bg-amber-50/50 rounded-3xl border border-amber-100/50 space-y-4">
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-widest">
                    <Sparkles size={14} /> Refine Identification
                  </div>
                  <p className="text-[10px] text-amber-900/60 italic leading-relaxed">
                    If this identification is incorrect, provide your wisdom (e.g., "This is actually Holy Basil") and the neural hub will recalibrate.
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={idRefinementText}
                      onChange={(e) => setIdRefinementText(e.target.value)}
                      placeholder="Enter correction..."
                      className="flex-1 px-4 py-2 bg-white border border-amber-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                    <button
                      onClick={handleRefineIdentification}
                      disabled={isRefiningID || !idRefinementText.trim()}
                      className="px-4 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isRefiningID ? <Loader2 className="animate-spin" size={12} /> : null}
                      Correct
                    </button>
                  </div>
                </div>

                <div className="bg-[#5A5A40] text-white p-6 rounded-3xl space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-70">
                    <Info size={14} /> Planting Wisdom
                  </div>
                  {isEditingPlant ? (
                    <textarea 
                      value={identifiedPlant.plantingWisdom}
                      onChange={(e) => setIdentifiedPlant({...identifiedPlant, plantingWisdom: e.target.value})}
                      className="w-full text-sm font-serif italic text-white bg-white/10 border-none rounded-xl p-3 h-24 outline-none focus:ring-1 focus:ring-white/30"
                    />
                  ) : (
                    <p className="text-sm font-serif italic italic text-white/90">
                      {identifiedPlant.plantingWisdom}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowIdentifiedModal(false)}
                    className="flex-1 py-4 bg-[#F5F5F0] text-[#5A5A40] rounded-2xl font-bold shadow-md hover:bg-[#D1D1C1] transition-all"
                  >
                    Acknowledge Wisdom
                  </button>
                  <button 
                    onClick={handleSavePlantToVault}
                    disabled={isSavingID || hasSavedID}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-2",
                      hasSavedID ? "bg-emerald-500 text-white" : "bg-emerald-600 text-white hover:bg-emerald-700"
                    )}
                  >
                    {isSavingID ? <Loader2 className="animate-spin" size={18} /> : hasSavedID ? <Check size={18} /> : <Save size={18} />}
                    {hasSavedID ? 'Saved' : 'Save to Vault'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* List Modal */}
      <AnimatePresence>
        {showProduceCamera && (
          <CameraModal 
            title="Capture Produce"
            onCapture={(base64) => {
              setProducePhoto(`data:image/jpeg;base64,${base64}`);
              setShowProduceCamera(false);
            }}
            onClose={() => setShowProduceCamera(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showListModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-[#F5F5F0] bg-[#F5F5F0] flex justify-between items-center">
                <h3 className="text-xl font-bold text-[#5A5A40]">List Garden Produce</h3>
                <button onClick={() => setShowListModal(false)} className="p-2 hover:bg-[#D1D1C1] rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleListProduce} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* Photo Upload */}
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">Produce Photo</label>
                  {producePhoto ? (
                    <div className="relative aspect-video rounded-3xl overflow-hidden group">
                      <img src={producePhoto} className="w-full h-full object-cover" alt="Produce" />
                      <button 
                        type="button"
                        onClick={() => setProducePhoto(null)}
                        className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setShowProduceCamera(true)}
                        className="flex-1 p-6 border-2 border-dashed border-[#D1D1C1] rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-[#5A5A40] transition-colors"
                      >
                        <Camera className="text-[#5A5A40]/40" />
                        <span className="text-[10px] font-bold uppercase opacity-50">Capture</span>
                      </button>
                      <label className="flex-1 p-6 border-2 border-dashed border-[#D1D1C1] rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-[#5A5A40] transition-colors cursor-pointer">
                        <Plus className="text-[#5A5A40]/40" />
                        <span className="text-[10px] font-bold uppercase opacity-50">Upload</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onloadend = () => setProducePhoto(reader.result as string);
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">Item Name</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Sacred Himalayan Turmeric"
                    className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    >
                      <option>Vegetable</option>
                      <option>Fruit</option>
                      <option>Herb</option>
                      <option>Grain</option>
                      <option>Spice</option>
                      <option>Root</option>
                      <option>Tea</option>
                      <option>Seeds</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">Organic Status</label>
                    <div className="flex items-center gap-4 p-4 border border-[#D1D1C1] rounded-2xl">
                      <input 
                        type="checkbox" 
                        checked={formData.organic}
                        onChange={(e) => setFormData({...formData, organic: e.target.checked})}
                        className="w-5 h-5 rounded border-emerald-500 text-emerald-600"
                      />
                      <span className="text-xs font-bold text-[#5A5A40]">100% Organic</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">Price ($)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="5.00"
                      className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">Unit</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    >
                      <option>kg</option>
                      <option>gram</option>
                      <option>bunch</option>
                      <option>piece</option>
                      <option>box</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">Location (Neighborhood/City)</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                    <input
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder={locationContext || "Detecting..."}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-[#D1D1C1] focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">Sacred Description</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Tell buyers about the soil, the energy, and the benefits..."
                    className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:ring-2 focus:ring-emerald-500/20 outline-none min-h-[80px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={listingProduce}
                  className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-bold shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  {listingProduce ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                  Manifest in Marketplace
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

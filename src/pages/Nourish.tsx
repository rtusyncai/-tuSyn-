import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Search, Utensils, Loader2, Info, Sparkles, MapPin, Activity, Home, Briefcase, Train, Compass, ArrowRight, Calendar, Clock, Plus, ExternalLink } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { mealService, DayOfWeek, MealType } from '../services/mealService';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { db, trackEngagement } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import Markdown from 'react-markdown';
import { SmartFulfillmentCard } from '../components/SmartFulfillmentCard';
import { CameraModal } from '../components/CameraModal';

export const NourishPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'analyze' | 'recipes' | 'dineout'>('analyze');
  const [showCamera, setShowCamera] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [selectedDosha, setSelectedDosha] = useState('Vata');
  const [recipeSearchType, setRecipeSearchType] = useState<'dosha' | 'harvest'>('dosha');
  const [harvestLocation, setHarvestLocation] = useState('');
  const [harvestRecipes, setHarvestRecipes] = useState<any[]>([]);
  
  // Quick season helper
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Autumn';
    return 'Winter';
  };
  
  // Meal Plan state
  const [showMealPlanModal, setShowMealPlanModal] = useState(false);
  const [selectedRecipeForPlan, setSelectedRecipeForPlan] = useState<any>(null);
  const [planDay, setPlanDay] = useState<DayOfWeek>('Monday');
  const [planType, setPlanType] = useState<MealType>('Lunch');
  const [savingPlan, setSavingPlan] = useState(false);
  
  // Dine Out state
  const [location, setLocation] = useState('');
  const [context, setContext] = useState<'home' | 'office' | 'travel'>('home');
  const [restaurantData, setRestaurantData] = useState<{ text: string, groundingChunks: any[] } | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationContext, setLocationContext] = useState<any>(null);
  const [isEditingAnalysis, setIsEditingAnalysis] = useState(false);
  const [editedAnalysis, setEditedAnalysis] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const docRef = doc(db, 'profiles', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        if (data.dosha) setSelectedDosha(data.dosha);
      }
    };
    fetchProfile();
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (base64Override?: string) => {
    const base64 = base64Override || image?.split(',')[1];
    if (!base64) return;
    setLoading(true);
    setShowCamera(false);
    setIsEditingAnalysis(false);
    try {
      const result = await geminiService.analyzeMeal(base64, profile?.healthData, locationContext);
      setAnalysis(result);
      setEditedAnalysis(result);
      trackEngagement('nourish');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveCorrection = () => {
    setAnalysis(editedAnalysis);
    setIsEditingAnalysis(false);
    toast("Recommendation corrected successfully", "success");
  };

  const handleFindRecipes = async () => {
    setLoading(true);
    try {
      // Pass profile context for personalized recipes (e.g. diet, allergies)
      const result = await geminiService.findRecipes(selectedDosha, profile?.healthData, locationContext);
      setRecipes(result);
      trackEngagement('nourish');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFindHarvestRecipes = async () => {
    if (!harvestLocation) {
      toast("Please specify a location or detect your current one.", "error");
      return;
    }
    setLoading(true);
    try {
      const season = getCurrentSeason();
      const result = await geminiService.findNearbyHarvestRecipes(harvestLocation, selectedDosha, season, profile?.healthData);
      setHarvestRecipes(result);
      trackEngagement('nourish');
    } catch (error) {
      console.error(error);
      toast("Failed to find harvest recipes.", "error");
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = (target: 'dineout' | 'harvest') => {
    setDetectingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setLocationContext({ lat: latitude, lng: longitude, accuracy: position.coords.accuracy });
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await res.json();
          if (data.city || data.locality || data.principalSubdivision) {
            const locString = `${data.city || data.locality || data.principalSubdivision}, ${data.countryName}`;
            if (target === 'dineout') setLocation(locString);
            else setHarvestLocation(locString);
          } else {
            const locString = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
            if (target === 'dineout') setLocation(locString);
            else setHarvestLocation(locString);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setDetectingLocation(false);
        }
      }, (error) => {
        console.error(error);
        setDetectingLocation(false);
        alert("Could not detect location. Please enter it manually.");
      });
    } else {
      setDetectingLocation(false);
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleFindRestaurants = async () => {
    if (!location) return;
    setLoading(true);
    try {
      const latLng = locationContext ? { latitude: locationContext.lat, longitude: locationContext.lng } : undefined;
      const result = await geminiService.getRestaurantRecommendations(location, context, profile?.healthData, latLng);
      setRestaurantData(result);
      trackEngagement('nourish');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToMealPlan = async () => {
    if (!user || !selectedRecipeForPlan) return;
    setSavingPlan(true);
    try {
      await mealService.saveMealPlan(user.uid, planDay, planType, selectedRecipeForPlan.title, selectedRecipeForPlan);
      toast("Recipe added to your weekly meal plan!", "success");
      setShowMealPlanModal(false);
    } catch (error) {
      console.error(error);
      toast("Failed to add to meal plan.", "error");
    } finally {
      setSavingPlan(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      <div className="flex justify-center overflow-x-auto no-scrollbar py-2 shrink-0">
        <div className="bg-[#E8E8E0] p-1 rounded-2xl flex whitespace-nowrap">
          <button
            onClick={() => setActiveTab('analyze')}
            className={cn(
              "px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold transition-all flex items-center gap-2 text-xs sm:text-sm",
              activeTab === 'analyze' ? "bg-[#5A5A40] text-white shadow-lg" : "text-[#5A5A40]"
            )}
          >
            <Camera size={16} className="sm:w-5" /> Analyze
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={cn(
              "px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold transition-all flex items-center gap-2 text-xs sm:text-sm",
              activeTab === 'recipes' ? "bg-[#5A5A40] text-white shadow-lg" : "text-[#5A5A40]"
            )}
          >
            <Search size={16} className="sm:w-5" /> Recipes
          </button>
          <button
            onClick={() => setActiveTab('dineout')}
            className={cn(
              "px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold transition-all flex items-center gap-2 text-xs sm:text-sm",
              activeTab === 'dineout' ? "bg-[#5A5A40] text-white shadow-lg" : "text-[#5A5A40]"
            )}
          >
            <MapPin size={16} className="sm:w-5" /> Dine Out
          </button>
        </div>
      </div>

      {activeTab === 'analyze' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 px-4 sm:px-0">
          <div className="space-y-6">
            <div className="aspect-square bg-white rounded-3xl border-2 border-dashed border-[#D1D1C1] flex flex-col items-center justify-center overflow-hidden relative group">
              {image ? (
                <>
                  <img src={image} alt="Meal" className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-white text-[#5A5A40] px-4 sm:px-6 py-2 rounded-full font-bold text-sm">Change Photo</label>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </div>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-4 p-6 text-center">
                  <Camera size={40} className="sm:w-12 text-[#D1D1C1]" />
                  <span className="text-sm sm:text-base text-[#5A5A40] font-medium">Upload a photo of your meal</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowCamera(true)}
                disabled={loading}
                className="flex-1 bg-white text-[#5A5A40] border-2 border-[#5A5A40] py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base px-4"
              >
                <Camera size={18} />
                Scan Live
              </button>
              <button
                onClick={() => handleAnalyze()}
                disabled={!image || loading}
                className="flex-1 bg-[#5A5A40] text-white py-4 rounded-2xl font-bold disabled:opacity-50 hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-2 text-sm sm:text-base px-4 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Forging Blueprint...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Analyze Meal
                  </>
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showCamera && (
              <CameraModal 
                title="Sacred Meal Scanner"
                onCapture={(base64) => handleAnalyze(base64)}
                onClose={() => setShowCamera(false)}
              />
            )}
          </AnimatePresence>

          <div className="space-y-6">
            {analysis ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="p-8 bg-white rounded-3xl border border-[#D1D1C1] shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    {isEditingAnalysis ? (
                      <input 
                        type="text"
                        value={editedAnalysis.foodName}
                        onChange={(e) => setEditedAnalysis({...editedAnalysis, foodName: e.target.value})}
                        className="text-2xl font-bold text-[#5A5A40] bg-[#F5F5F0] px-3 py-1 rounded-lg border border-[#D1D1C1] outline-none w-full mr-4"
                      />
                    ) : (
                      <h3 className="text-2xl font-bold text-[#5A5A40]">{analysis.foodName}</h3>
                    )}
                    <button 
                      onClick={() => isEditingAnalysis ? saveCorrection() : setIsEditingAnalysis(true)}
                      className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]/40 hover:text-[#5A5A40] transition-colors flex items-center gap-2"
                    >
                      {isEditingAnalysis ? (
                        <>Save</>
                      ) : (
                        <>Correct Finding</>
                      )}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isEditingAnalysis ? (
                      <input 
                        type="text"
                        value={editedAnalysis.properties.join(', ')}
                        onChange={(e) => setEditedAnalysis({...editedAnalysis, properties: e.target.value.split(',').map(s => s.trim())})}
                        className="text-xs bg-[#F5F5F0] px-3 py-1 rounded-lg border border-[#D1D1C1] outline-none w-full"
                        placeholder="Comma separated attributes..."
                      />
                    ) : (
                      analysis.properties.map((prop: string) => (
                        <span key={prop} className="px-3 py-1 bg-[#F5F5F0] text-[#5A5A40] rounded-full text-xs font-bold uppercase tracking-wider">{prop}</span>
                      ))
                    )}
                  </div>
                </div>

                {isEditingAnalysis && (
                  <div className="space-y-4 p-6 bg-[#F5F5F0] rounded-3xl border border-[#D1D1C1]">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">Correct AI Insights</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase block mb-1">Vata Advice</label>
                        <textarea 
                          value={editedAnalysis.vataAdvice}
                          onChange={(e) => setEditedAnalysis({...editedAnalysis, vataAdvice: e.target.value})}
                          className="w-full text-xs p-3 rounded-xl border border-[#D1D1C1]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase block mb-1">Pitta Advice</label>
                        <textarea 
                          value={editedAnalysis.pittaAdvice}
                          onChange={(e) => setEditedAnalysis({...editedAnalysis, pittaAdvice: e.target.value})}
                          className="w-full text-xs p-3 rounded-xl border border-[#D1D1C1]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase block mb-1">Kapha Advice</label>
                        <textarea 
                          value={editedAnalysis.kaphaAdvice}
                          onChange={(e) => setEditedAnalysis({...editedAnalysis, kaphaAdvice: e.target.value})}
                          className="w-full text-xs p-3 rounded-xl border border-[#D1D1C1]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {analysis.fulfillmentActions && (
                  <SmartFulfillmentCard actions={analysis.fulfillmentActions} />
                )}

                <div className="grid grid-cols-1 gap-4">
                  <AdviceCard dosha="Vata" advice={analysis.vataAdvice} color="bg-sky-50" />
                  <AdviceCard dosha="Pitta" advice={analysis.pittaAdvice} color="bg-amber-50" />
                  <AdviceCard dosha="Kapha" advice={analysis.kaphaAdvice} color="bg-emerald-50" />
                </div>

                <div className="space-y-4">
                  {analysis.modernNutritionalInsight && (
                    <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 space-y-2">
                      <h4 className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-widest">
                        <Activity size={16} /> Modern Medical Insight
                      </h4>
                      <p className="text-sm text-indigo-900/70 italic leading-relaxed">{analysis.modernNutritionalInsight}</p>
                    </div>
                  )}
                  {analysis.regionalRecommendation && (
                    <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 space-y-2">
                      <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-widest">
                        <MapPin size={16} /> Regional Knowledge
                      </h4>
                      <p className="text-sm text-emerald-900/70 italic leading-relaxed">{analysis.regionalRecommendation}</p>
                    </div>
                  )}
                  {analysis.suggestedRecipes && analysis.suggestedRecipes.length > 0 && (
                    <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 space-y-4">
                      <h4 className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-widest">
                        <Utensils size={16} /> Recommended Recipes
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        {analysis.suggestedRecipes.map((r: any, i: number) => (
                          <div key={i} className="bg-white p-4 rounded-2xl border border-amber-200/50 space-y-3">
                            <div>
                              <div className="text-sm font-bold text-amber-900">{r.title}</div>
                              <div className="text-xs text-amber-800/60 italic leading-tight">{r.reason}</div>
                            </div>
                            {r.nutritionalInfo && (
                              <div className="flex gap-4 pt-2 border-t border-amber-50">
                                <div className="text-[9px] font-bold text-amber-700/60">
                                  PROTEIN: <span className="text-amber-900">{r.nutritionalInfo.macros?.protein || 'N/A'}</span>
                                </div>
                                <div className="text-[9px] font-bold text-amber-700/60">
                                  CALORIES: <span className="text-amber-900">{r.nutritionalInfo.macros?.calories || 'N/A'}</span>
                                </div>
                                {r.nutritionalInfo.micros?.[0] && (
                                  <div className="text-[9px] font-bold text-amber-700/60 uppercase">
                                    KEY: <span className="text-amber-900">{r.nutritionalInfo.micros[0]}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-[#D1D1C1] rounded-3xl bg-white/50 italic opacity-60">
                <Info size={48} className="mb-4" />
                <p>Upload and analyze a meal to see its Ayurvedic properties and balancing suggestions.</p>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'recipes' ? (
        <div className="space-y-12">
          {/* Sub-tabs for Recipes */}
          <div className="flex justify-center">
            <div className="bg-[#D1D1C1]/20 p-1 rounded-xl flex gap-2">
              <button
                onClick={() => setRecipeSearchType('dosha')}
                className={cn(
                  "px-6 py-2 rounded-lg text-xs font-bold transition-all",
                  recipeSearchType === 'dosha' ? "bg-white text-[#5A5A40] shadow-sm" : "text-[#5A5A40]/60"
                )}
              >
                Dosha Standards
              </button>
              <button
                onClick={() => setRecipeSearchType('harvest')}
                className={cn(
                  "px-6 py-2 rounded-lg text-xs font-bold transition-all",
                  recipeSearchType === 'harvest' ? "bg-white text-[#5A5A40] shadow-sm" : "text-[#5A5A40]/60"
                )}
              >
                Nearby Harvest
              </button>
            </div>
          </div>

          {recipeSearchType === 'dosha' ? (
            <div className="flex flex-col items-center gap-6">
              <div className="flex bg-[#E8E8E0] p-1 rounded-full">
                {['Vata', 'Pitta', 'Kapha'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDosha(d)}
                    className={cn(
                      "px-8 py-2 rounded-full text-sm font-bold transition-all",
                      selectedDosha === d ? "bg-[#5A5A40] text-white shadow-md" : "text-[#5A5A40]"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <button
                onClick={handleFindRecipes}
                disabled={loading}
                className="bg-[#5A5A40] text-white px-12 py-4 rounded-full font-bold hover:bg-[#4A4A30] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Curating Your Culinary Path...
                  </>
                ) : (
                  <>
                    <Utensils size={20} />
                    Find {selectedDosha} Recipes
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h4 className="text-xl font-bold text-[#5A5A40]">Seasonal Locavorism</h4>
                <p className="text-xs text-[#2D3436] opacity-60 italic">Find recipes based on local availability in your region.</p>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40] opacity-40" size={18} />
                  <input
                    type="text"
                    value={harvestLocation}
                    onChange={(e) => setHarvestLocation(e.target.value)}
                    placeholder="Enter region or detect..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 bg-white"
                  />
                </div>
                <button
                  onClick={() => detectLocation('harvest')}
                  disabled={detectingLocation}
                  className="p-4 bg-[#F5F5F0] text-[#5A5A40] rounded-2xl hover:bg-[#E8E8E0] transition-all border border-[#D1D1C1]/30"
                >
                  {detectingLocation ? <Loader2 className="animate-spin" size={20} /> : <Compass size={20} />}
                </button>
              </div>
              <div className="flex justify-center gap-4">
                 <div className="flex bg-[#E8E8E0] p-1 rounded-full">
                  {['Vata', 'Pitta', 'Kapha'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setSelectedDosha(d)}
                      className={cn(
                        "px-6 py-1.5 rounded-full text-[10px] font-bold transition-all",
                        selectedDosha === d ? "bg-[#5A5A40] text-white" : "text-[#5A5A40]"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} /> {getCurrentSeason()} Season
                </span>
              </div>
              <button
                onClick={handleFindHarvestRecipes}
                disabled={loading || !harvestLocation}
                className="w-full bg-[#5A5A40] text-white py-4 rounded-2xl font-bold disabled:opacity-50 hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Distilling Regional Harvest...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Find Local Seasonal Recipes
                  </>
                )}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recipeSearchType === 'dosha' ? recipes.map((recipe, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl border border-[#D1D1C1] overflow-hidden shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={`https://picsum.photos/seed/${recipe.title}/800/600`} 
                    alt={recipe.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">
                    {selectedDosha}
                  </div>
                </div>
                <div className="p-8 space-y-4">
                  <h4 className="text-xl font-bold text-[#5A5A40]">{recipe.title}</h4>
                  <p className="text-sm text-[#2D3436] opacity-70 line-clamp-2 italic">{recipe.description}</p>
                  <div className="pt-4 border-t border-[#F5F5F0] space-y-4">
                    {recipe.seasonalReason && (
                      <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                        <div className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1 mb-1">
                          <Calendar size={10} /> Seasonal Context
                        </div>
                        <p className="text-[10px] text-emerald-900/60 italic leading-snug">{recipe.seasonalReason}</p>
                      </div>
                    )}
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-2">Ingredients</h5>
                      <ul className="text-xs space-y-1 opacity-80">
                        {recipe.ingredients.slice(0, 3).map((ing: string, i: number) => (
                          <li key={i}>• {ing}</li>
                        ))}
                        {recipe.ingredients.length > 3 && <li>+ {recipe.ingredients.length - 3} more</li>}
                      </ul>
                    </div>
                    {recipe.nutritionalInfo && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-gray-50 rounded-xl text-center">
                          <div className="text-[10px] uppercase opacity-50 font-bold">Protein</div>
                          <div className="text-xs font-bold text-[#5A5A40]">{recipe.nutritionalInfo.macros.protein}</div>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-xl text-center">
                          <div className="text-[10px] uppercase opacity-50 font-bold">Calories</div>
                          <div className="text-xs font-bold text-[#5A5A40]">{recipe.nutritionalInfo.macros.calories}</div>
                        </div>
                      </div>
                    )}
                    {recipe.integratedBenefits && (
                      <div className="p-3 bg-amber-50 rounded-2xl">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1 flex items-center gap-1">
                          <Sparkles size={10} /> Integrated Benefit
                        </h5>
                        <p className="text-[10px] text-amber-900/60 italic leading-snug">{recipe.integratedBenefits}</p>
                      </div>
                    )}
                    
                    {recipe.fulfillmentActions && (
                      <div className="pt-2">
                        <SmartFulfillmentCard actions={recipe.fulfillmentActions} />
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setSelectedRecipeForPlan(recipe);
                        setShowMealPlanModal(true);
                      }}
                      className="w-full py-2 bg-[#5A5A40]/5 text-[#5A5A40] border border-[#5A5A40]/10 rounded-xl text-xs font-bold hover:bg-[#5A5A40] hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={14} /> Add to Meal Plan
                    </button>
                  </div>
                </div>
              </motion.div>
            )) : harvestRecipes.map((recipe, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl border border-emerald-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={`https://picsum.photos/seed/${recipe.title}/800/600`} 
                    alt={recipe.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                    LOCAL HARVEST
                  </div>
                </div>
                <div className="p-8 space-y-4">
                  <h4 className="text-xl font-bold text-[#5A5A40]">{recipe.title}</h4>
                  <p className="text-sm text-[#2D3436] opacity-70 line-clamp-2 italic">{recipe.description}</p>
                  
                  <div className="p-3 bg-emerald-50 rounded-2xl">
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-2 flex items-center gap-1">
                      <MapPin size={10} /> Nearby Ingredients
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {recipe.nearbyIngredients.map((ing: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-white text-emerald-600 rounded-md text-[9px] font-bold border border-emerald-100">{ing}</span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#F5F5F0] space-y-4">
                    <div className="p-3 bg-indigo-50 rounded-2xl">
                      <h5 className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 mb-1 flex items-center gap-1">
                        <Calendar size={10} /> Seasonal Significance
                      </h5>
                      <p className="text-[10px] text-indigo-900/60 italic leading-snug">{recipe.seasonalSignificance}</p>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-2xl">
                      <h5 className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1 flex items-center gap-1">
                        <Sparkles size={10} /> Integrated Wisdom
                      </h5>
                      <p className="text-[10px] text-amber-900/60 italic leading-snug">{recipe.integratedBenefit}</p>
                    </div>

                    {recipe.fulfillmentActions && (
                      <div className="pt-2">
                        <SmartFulfillmentCard actions={recipe.fulfillmentActions} />
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setSelectedRecipeForPlan({
                          ...recipe,
                          ingredients: recipe.nearbyIngredients // Map for meal plan compatibility
                        });
                        setShowMealPlanModal(true);
                      }}
                      className="w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <Plus size={14} /> Add to Meal Plan
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="max-w-2xl mx-auto bg-white p-10 rounded-[40px] border border-[#D1D1C1] shadow-xl space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-[#5A5A40]">Ayurvedic Dining Out</h3>
              <p className="text-sm text-[#2D3436] opacity-60 italic">Find the best menu choices based on your location and context.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A5A40] dark:text-[#A8D5BA] uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14} /> Your Location
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter city, neighborhood, or 'Current Location'..."
                    className="flex-1 p-4 rounded-2xl border border-[#D1D1C1] dark:border-[#3D3D35] bg-white dark:bg-[#252520] text-[#2D3436] dark:text-[#E8E8E0] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
                  />
                  <button
                    onClick={() => detectLocation('dineout')}
                    disabled={detectingLocation}
                    className="p-4 bg-[#F5F5F0] dark:bg-[#1A1A15] text-[#5A5A40] dark:text-[#A8D5BA] rounded-2xl hover:bg-[#E8E8E0] dark:hover:bg-[#252520] transition-all border border-[#D1D1C1]/30 dark:border-[#3D3D35]/30"
                    title="Detect Location"
                  >
                    {detectingLocation ? <Loader2 className="animate-spin" size={20} /> : <Compass size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A5A40] dark:text-[#A8D5BA] uppercase tracking-widest flex items-center gap-2">
                  <Activity size={14} /> Current Context
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'home', icon: Home, label: 'Home' },
                    { id: 'office', icon: Briefcase, label: 'Office' },
                    { id: 'travel', icon: Train, label: 'Travel' }
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setContext(c.id as any)}
                      className={cn(
                        "py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border flex flex-col items-center gap-2 justify-center",
                        context === c.id 
                          ? "bg-[#5A5A40] text-white border-[#5A5A40] shadow-md dark:bg-[#A8D5BA] dark:text-[#1A1A15] dark:border-[#A8D5BA]" 
                          : "bg-white dark:bg-[#252520] text-[#5A5A40] dark:text-[#A8D5BA]/60 border-[#D1D1C1] dark:border-[#3D3D35] hover:bg-[#F5F5F0] dark:hover:bg-[#1A1A15]"
                      )}
                    >
                      <c.icon size={18} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleFindRestaurants}
                disabled={!location || loading}
                className="w-full bg-[#5A5A40] text-white py-5 rounded-2xl font-bold hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Exploring Sacred Dining...
                  </>
                ) : (
                  <>
                    <Utensils size={20} />
                    Get Recommendations
                  </>
                )}
              </button>
            </div>
          </div>

          {restaurantData && (
            <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-0 pb-12">
              <div className="bg-white dark:bg-[#1A1A15] p-8 sm:p-12 rounded-[40px] border border-[#D1D1C1]/30 dark:border-[#3D3D35] shadow-2xl">
                <div className="prose prose-stone dark:prose-invert max-w-none 
                  prose-p:text-[#2D3436]/80 dark:prose-p:text-[#E8E8E0]/80 prose-p:italic prose-p:leading-relaxed
                  prose-headings:text-[#5A5A40] dark:prose-headings:text-[#A8D5BA] prose-headings:font-bold
                  prose-strong:text-[#5A5A40] dark:prose-strong:text-[#A8D5BA]
                  prose-li:text-[#2D3436]/70 dark:prose-li:text-[#E8E8E0]/70
                  prose-hr:border-[#D1D1C1]/20 dark:prose-hr:border-[#3D3D35]">
                  <Markdown>{restaurantData.text}</Markdown>
                </div>
                
                {restaurantData.groundingChunks.length > 0 && (
                  <div className="mt-12 pt-12 border-t border-[#F5F5F0] dark:border-[#3D3D35] space-y-6">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-[#5A5A40] dark:text-[#A8D5BA] uppercase tracking-widest flex items-center gap-2">
                        <ExternalLink size={14} /> Sacred Source Grounding
                      </h5>
                      <span className="text-[10px] text-[#2D3436]/40 dark:text-[#E8E8E0]/40 font-medium">VERIFIED BY GOOGLE MAPS</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {restaurantData.groundingChunks.filter((c: any) => c.maps).map((chunk: any, i: number) => (
                        <motion.a 
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          href={chunk.maps.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-5 bg-[#F5F5F0] dark:bg-[#252520] rounded-3xl border border-[#D1D1C1]/20 dark:border-[#3D3D35]/50 hover:bg-[#E8E8E0] dark:hover:bg-[#1A1A15] hover:scale-[1.02] transition-all group shadow-sm"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-white dark:bg-[#1A1A15] rounded-2xl shadow-sm text-[#5A5A40] dark:text-[#A8D5BA]">
                              <MapPin size={18} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-[#5A5A40] dark:text-[#A8D5BA] line-clamp-1">{chunk.maps.title}</span>
                              <span className="text-[10px] text-[#2D3436]/40 dark:text-[#E8E8E0]/40 italic">View Sacred Space</span>
                            </div>
                          </div>
                          <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 text-[#5A5A40] dark:text-[#A8D5BA] transition-all -translate-x-2 group-hover:translate-x-0" />
                        </motion.a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-[32px] border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-4">
                 <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-emerald-600 shrink-0">
                    <Sparkles size={20} />
                 </div>
                 <div className="space-y-1">
                    <h5 className="text-sm font-bold text-emerald-900 dark:text-emerald-400">Integrated Locavorism</h5>
                    <p className="text-xs text-emerald-800/60 dark:text-emerald-200/60 italic leading-relaxed">
                      "By selecting dining venues grounded in local terrain, we honor the biological rhythms of the region while maintaining your unique doshic alignment."
                    </p>
                 </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Meal Plan Modal */}
      <AnimatePresence>
        {showMealPlanModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden p-8 space-y-6"
            >
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-[#5A5A40]">Add to Weekly Plan</h3>
                <p className="text-xs text-[#2D3436] opacity-60">Select when you want to enjoy this recipe.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 flex items-center gap-2">
                    <Calendar size={14} /> Day of Week
                  </label>
                  <select
                    value={planDay}
                    onChange={(e) => setPlanDay(e.target.value as DayOfWeek)}
                    className="w-full p-3 bg-[#F5F5F0] rounded-xl border border-[#D1D1C1]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 flex items-center gap-2">
                    <Clock size={14} /> Meal Time
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setPlanType(t as MealType)}
                        className={cn(
                          "py-3 rounded-xl text-xs font-bold border transition-all",
                          planType === t 
                            ? "bg-[#5A5A40] text-white border-[#5A5A40]" 
                            : "bg-white text-[#5A5A40] border-[#D1D1C1]/30 hover:bg-[#F5F5F0]"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowMealPlanModal(false)}
                  className="flex-1 py-3 border border-[#D1D1C1] text-[#2D3436] rounded-xl font-bold text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddToMealPlan}
                  disabled={savingPlan}
                  className="flex-1 py-3 bg-[#5A5A40] text-white rounded-xl font-bold text-sm shadow-lg hover:bg-[#4A4A30] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingPlan ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Add to Plan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdviceCard = ({ dosha, advice, color }: any) => (
  <div className={cn("p-6 rounded-2xl border border-[#D1D1C1] flex gap-4", color)}>
    <div className="font-bold text-[#5A5A40] min-w-[60px] uppercase text-xs tracking-widest pt-1">{dosha}</div>
    <p className="text-sm italic text-[#2D3436] opacity-80">{advice}</p>
  </div>
);

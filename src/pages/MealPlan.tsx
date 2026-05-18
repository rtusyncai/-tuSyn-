import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Trash2, 
  Loader2, 
  Clock, 
  Utensils, 
  ChevronRight,
  Info,
  X,
  Plus
} from 'lucide-react';
import { mealService, MealPlanEntry, DayOfWeek, MealType } from '../services/mealService';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/useToast';
import { Link } from 'react-router-dom';
import { geminiService } from '../services/geminiService';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ShoppingBag, Heart, Navigation, Sparkles } from 'lucide-react';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export const MealPlanPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [mealPlan, setMealPlan] = useState<MealPlanEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [selectedMeal, setSelectedMeal] = useState<MealPlanEntry | null>(null);
  const [marketMeals, setMarketMeals] = useState<any[]>([]);
  const [fetchingMarket, setFetchingMarket] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchMealPlan();
  }, [user]);

  const fetchMarketplaceSuggestions = async () => {
    if (!user) return;
    setFetchingMarket(true);
    try {
      // 1. Get all meals from marketplace
      const mealsSnap = await getDocs(query(collection(db, 'marketplace_meals')));
      const allMeals = mealsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // 2. Fetch profile to get health context
      const profileSnap = await getDoc(doc(db, 'profiles', user.uid));
      const profileData = profileSnap.data();

      // 3. Get AI recommendations
      const recs = await geminiService.recommendMarketplaceMeals(allMeals, profileData?.healthData || {});
      
      // 4. Map recommendations to actual meal data
      const curatedMeals = recs.map((rec: any) => ({
        ...allMeals.find(m => m.id === rec.mealId),
        aiReason: rec.reason,
        priority: rec.clinicalPriority
      })).filter((m: any) => m.id);

      setMarketMeals(curatedMeals);
      toast("Fresh marketplace sync completed", "success");
    } catch (error) {
      console.error(error);
      toast("Sync failed. Are you connected?", "error");
    } finally {
      setFetchingMarket(false);
    }
  };

  const fetchMealPlan = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await mealService.getMealPlan(user.uid);
      setMealPlan(data);
    } catch (error) {
      console.error(error);
      toast("Failed to load your meal plan.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!user) return;
    try {
      await mealService.deleteMealPlanEntry(user.uid, entryId);
      setMealPlan(prev => prev.filter(item => item.id !== entryId));
      if (selectedMeal?.id === entryId) setSelectedMeal(null);
      toast("Meal removed from plan.", "success");
    } catch (error) {
      console.error(error);
      toast("Failed to remove meal.", "error");
    }
  };

  const getMealsForDay = (day: DayOfWeek) => {
    return mealPlan.filter(item => item.day === day);
  };

  const getMealByType = (day: DayOfWeek, type: MealType) => {
    return mealPlan.find(item => item.day === day && item.mealType === type);
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#5A5A40]" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-serif font-bold text-[#5A5A40]">Integrated Weekly Plan</h2>
        <p className="text-[#2D3436]/60 italic max-w-xl mx-auto">
          Synchronize your diet with your Dosha and daily rhythms. Your personal Ayurvedic culinary map.
        </p>
      </div>

      <div className="flex justify-center overflow-x-auto no-scrollbar py-2 px-4 sm:px-0">
        <div className="bg-[#E8E8E0] p-1.5 rounded-[2rem] flex whitespace-nowrap shadow-inner">
          {DAYS.map((day) => {
            const dayMeals = getMealsForDay(day);
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "px-6 py-3 rounded-[1.5rem] font-bold transition-all flex items-center gap-2 text-sm relative",
                  selectedDay === day ? "bg-[#5A5A40] text-white shadow-lg" : "text-[#5A5A40] hover:bg-white/50"
                )}
              >
                {day}
                {dayMeals.length > 0 && (
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    selectedDay === day ? "bg-white" : "bg-emerald-500"
                  )} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Marketplace/Exchange Section */}
        <section className="mb-12 bg-indigo-50/50 rounded-[3rem] p-8 border border-indigo-100/50">
           <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-indigo-600 text-white rounded-[2rem] shadow-xl">
                    <ShoppingBag size={24} />
                 </div>
                 <div>
                    <h3 className="text-2xl font-serif font-bold text-indigo-900">Nourishment Exchange</h3>
                    <p className="text-xs text-indigo-800/60 font-medium">Hyper-local ready-made meals from Cloud Kitchens.</p>
                 </div>
              </div>
              <button 
                onClick={fetchMarketplaceSuggestions}
                disabled={fetchingMarket}
                className="px-6 py-3 bg-white text-indigo-600 border border-indigo-200 rounded-2xl font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {fetchingMarket ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Syncing Marketplace Wisdom...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Sync Market Suggestions
                  </>
                )}
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                 {marketMeals.map((meal) => (
                    <motion.div 
                      key={meal.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-6 rounded-[2.5rem] border border-indigo-100 shadow-sm hover:shadow-xl transition-all group"
                    >
                       <div className="space-y-4">
                          <div className="flex justify-between items-start">
                             <div className="space-y-1">
                                <h4 className="font-bold text-indigo-900 group-hover:text-indigo-600 transition-colors">{meal.name}</h4>
                                <div className="flex items-center gap-3">
                                   <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{meal.ayurvedicProfile?.dosha}</span>
                                   <span className="text-[10px] text-gray-400">•</span>
                                   <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">${meal.price}</span>
                                </div>
                             </div>
                             <div className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">Priority {meal.priority}</div>
                          </div>
                          
                          <p className="text-[11px] text-gray-500 italic leading-relaxed">
                             <Sparkles size={10} className="inline mr-1 text-indigo-400" />
                             "{meal.aiReason}"
                          </p>

                          <div className="flex gap-2">
                             <button
                               onClick={() => {
                                  toast(`Ordering ${meal.name} from cloud kitchen...`, "success");
                               }}
                               className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center gap-2"
                             >
                                <Navigation size={14} /> Quick Order
                             </button>
                             <button
                               onClick={async () => {
                                  if (!user) return;
                                  try {
                                     await mealService.saveMealPlan(user.uid, selectedDay, 'Lunch', meal.name, {
                                        ...meal,
                                        isMarketplace: true,
                                        source: meal.userName || 'Cloud Kitchen'
                                     });
                                     toast("Ready-made meal added to weekly plan", "success");
                                     fetchMealPlan();
                                  } catch (err) {
                                     console.error(err);
                                  }
                               }}
                               className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100"
                               title="Schedule for Weekly Plan"
                             >
                                <Plus size={18} />
                             </button>
                          </div>
                       </div>
                    </motion.div>
                 ))}
                 {marketMeals.length === 0 && !fetchingMarket && (
                    <div className="col-span-1 md:col-span-2 py-12 flex flex-col items-center justify-center text-center opacity-40">
                       <ShoppingBag size={48} className="mb-4 text-indigo-900" />
                       <p className="text-sm font-serif italic text-indigo-900">Sync with the Nourishment Exchange to find hyper-local <br/>ready-made meals matching your bio-profile.</p>
                    </div>
                 )}
              </AnimatePresence>
           </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-xl font-serif font-bold text-[#5A5A40] border-b border-[#D1D1C1]/30 pb-4">
              {selectedDay}'s Menu
            </h3>
            <div className="space-y-4">
              {MEAL_TYPES.map((type) => {
                const meal = getMealByType(selectedDay, type);
                return (
                  <motion.div
                    key={type}
                    layoutId={meal?.id || type}
                    className={cn(
                      "p-6 rounded-[2.5rem] border transition-all cursor-pointer group relative overflow-hidden",
                      meal 
                        ? "bg-white border-[#D1D1C1]/50 hover:shadow-xl hover:-translate-y-1" 
                        : "bg-[#F5F5F0]/50 border-dashed border-[#D1D1C1] opacity-60 hover:opacity-100"
                    )}
                    onClick={() => meal && setSelectedMeal(meal)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                          meal ? "bg-[#5A5A40] text-white" : "bg-[#D1D1C1]/30 text-[#5A5A40]/40"
                        )}>
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">{type}</p>
                          <h4 className="text-sm font-bold text-[#5A5A40]">
                            {meal ? meal.recipeTitle : 'Nothing planned yet'}
                          </h4>
                        </div>
                      </div>
                      {meal ? (
                        <ChevronRight size={20} className="text-[#D1D1C1] group-hover:text-[#5A5A40] transition-colors" />
                      ) : (
                        <Link to="/nourish" className="p-2 hover:bg-white rounded-full transition-all text-[#5A5A40]/40 hover:text-[#5A5A40]">
                          <Plus size={20} />
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="hidden md:block">
            <AnimatePresence mode="wait">
              {selectedMeal ? (
                <motion.div
                  key={selectedMeal.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-[#5A5A40] text-white p-10 rounded-[3rem] shadow-2xl h-fit sticky top-24"
                >
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{selectedMeal.mealType} • {selectedMeal.day}</span>
                        <button 
                          onClick={() => handleDelete(selectedMeal.id!)}
                          className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-rose-400 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <h4 className="text-3xl font-serif font-bold">{selectedMeal.recipeTitle}</h4>
                    </div>

                    <div className="aspect-video rounded-2xl overflow-hidden shadow-inner">
                       <img 
                        src={`https://picsum.photos/seed/${selectedMeal.recipeTitle}/800/600`} 
                        alt={selectedMeal.recipeTitle} 
                        className="w-full h-full object-cover opacity-80"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 italic text-sm text-white/70 leading-relaxed">
                        "{selectedMeal.recipeData.description}"
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                         <div className="p-4 bg-white/10 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1">Calories</p>
                            <p className="text-sm font-bold">{selectedMeal.recipeData.nutritionalInfo?.macros?.calories || 'N/A'}</p>
                         </div>
                         <div className="p-4 bg-white/10 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1">Protein</p>
                            <p className="text-sm font-bold">{selectedMeal.recipeData.nutritionalInfo?.macros?.protein || 'N/A'}</p>
                         </div>
                      </div>

                      {selectedMeal.recipeData.isMarketplace && (
                         <div className="p-6 bg-white/10 rounded-3xl border-2 border-dashed border-white/20 space-y-4">
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                  <Sparkles size={16} className="text-amber-400" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">Marketplace Item</span>
                               </div>
                               <span className="text-[10px] px-2 py-1 bg-white/20 rounded-lg">Source: {selectedMeal.recipeData.source}</span>
                            </div>
                            <button
                              onClick={() => {
                                 toast(`Auto-ordering ${selectedMeal.recipeTitle} for ${selectedDay}...`, "success");
                              }}
                              className="w-full py-4 bg-white text-[#5A5A40] rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all shadow-lg"
                            >
                               <Navigation size={18} /> Auto-Order for Schedule
                            </button>
                         </div>
                      )}
                    </div>

                    <Link 
                      to="/nourish"
                      className="w-full py-4 bg-white text-[#5A5A40] rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 transition-all shadow-lg"
                    >
                      <Utensils size={18} /> Regenerate Options
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-[#D1D1C1]/50 rounded-[3rem] opacity-30 italic">
                  <Utensils size={64} className="mb-6" />
                  <p className="text-lg font-serif">Select a planned meal to view its holistic details</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Meal Detail Overlay */}
      <AnimatePresence>
        {selectedMeal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end sm:hidden">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full rounded-t-[3rem] p-8 max-h-[85vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">{selectedMeal.mealType} • {selectedDay}</p>
                  <h4 className="text-2xl font-serif font-bold text-[#5A5A40]">{selectedMeal.recipeTitle}</h4>
                </div>
                <button onClick={() => setSelectedMeal(null)} className="p-2 hover:bg-[#F5F5F0] rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8">
                <img 
                  src={`https://picsum.photos/seed/${selectedMeal.recipeTitle}/800/600`} 
                  alt={selectedMeal.recipeTitle} 
                  className="w-full aspect-video object-cover rounded-3xl"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />

                <div className="space-y-4">
                  <div className="p-6 bg-[#F5F5F0] rounded-3xl border border-[#D1D1C1]/30 italic text-sm text-[#5A5A40]/70">
                    {selectedMeal.recipeData.description}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white border border-[#D1D1C1]/50 rounded-2xl">
                      <p className="text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest mb-1">Benefit</p>
                      <p className="text-[10px] leading-relaxed italic">{selectedMeal.recipeData.integratedBenefits}</p>
                    </div>
                    <div className="p-4 bg-white border border-[#D1D1C1]/50 rounded-2xl flex flex-col justify-center">
                      <p className="text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest mb-1">Calories</p>
                      <p className="text-sm font-bold text-[#5A5A40]">{selectedMeal.recipeData.nutritionalInfo?.macros.calories || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleDelete(selectedMeal.id!)}
                    className="p-4 border border-rose-100 text-rose-500 rounded-2xl hover:bg-rose-50 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button className="flex-1 py-4 bg-[#5A5A40] text-white rounded-2xl font-bold">
                    View Full Recipe
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

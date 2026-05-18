import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Wind, Utensils, MapPin, BookOpen, ClipboardList, MessageSquare, Sun, Moon, Coffee, Heart, Activity, Brain, Archive, Calendar, Flower, ShoppingBag, Waves, Loader2, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { geminiService } from '../services/geminiService';

import { DinacharyaRituals } from '../components/DinacharyaRituals';
import { LiveActivityTicker } from '../components/LiveActivityTicker';

const features = [
  { name: 'Dosha Quiz', description: 'Discover your unique mind-body constitution.', icon: ClipboardList, path: '/quiz', color: 'bg-[#A8D5BA]/10 border-[#A8D5BA]/20' },
  { name: 'Nourish Hub', description: 'Ayurvedic meal analysis and recipe finder.', icon: Utensils, path: '/nourish', color: 'bg-[#F3A683]/10 border-[#F3A683]/20' },
  { name: 'Sonic Sanctuary', description: 'Guided breathing and meditation sessions.', icon: Wind, path: '/sanctuary', color: 'bg-[#778BEB]/10 border-[#778BEB]/20' },
  { name: 'Wellness Habitat', description: 'Harmonize your living space with Vaastu.', icon: MapPin, path: '/habitat', color: 'bg-[#5A5A40]/10 border-[#5A5A40]/20' },
  { name: 'AyurWear', description: 'Personalized ornaments for your dosha.', icon: Sparkles, path: '/ayurwear', color: 'bg-[#E15F41]/10 border-[#E15F41]/20' },
  { name: 'AIveda Chat', description: 'Ayurvedic AI for deep personal health predictions.', icon: MessageSquare, path: '/ayur-chat', color: 'bg-[#574B90]/10 border-[#574B90]/20' },
  { name: 'Weekly Plan', description: 'Synchronize your diet with your daily Ayurvedic rhythms.', icon: Calendar, path: '/meal-plan', color: 'bg-[#3DC1D3]/10 border-[#3DC1D3]/20' },
  { name: 'Sacred Vault', description: 'Your persistent collection of saved manifestations.', icon: Archive, path: '/vault', color: 'bg-[#5A5A40]/20 border-[#5A5A40]/30' },
];

export const HomePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [locationPoem, setLocationPoem] = useState<string>('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const docRef = doc(db, 'profiles', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          setProfile(profileData);
          
          // Fetch personalized recommendations
          setIsLoadingRecs(true);
          try {
            const recs = await geminiService.getPersonalizedRecommendations(profileData);
            setRecommendations(recs);
          } catch (error) {
            console.error("Error fetching recommendations:", error);
          } finally {
            setIsLoadingRecs(false);
          }
        }
      }
    };
    fetchProfile();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        setLocationPoem("Where the earth meets the sky, a sanctuary of peace awaits your presence.");
      });
    }
  }, [user]);

  const dosha = profile?.dosha || 'Default';

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[500px] sm:min-h-[600px] rounded-[60px] overflow-hidden shadow-2xl group flex flex-col justify-center">
        <img 
          src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1920&h=1080" 
          alt="Ayurvedic Serenity" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#1A1A15]/90 via-[#1A1A15]/40 to-transparent flex flex-col justify-center px-8 sm:px-16 md:px-24 text-white py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6 md:space-y-8 max-w-xl lg:max-w-2xl"
          >
            <div className="flex items-center flex-wrap gap-4">
              <span className="inline-block px-5 py-2 bg-white/10 backdrop-blur-xl rounded-full text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] border border-white/20">
                The Sacred Exchange
              </span>
              <Link to="/neural-hub" className="flex items-center gap-2 px-5 py-2 bg-[#A8D5BA]/20 backdrop-blur-xl rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#A8D5BA] hover:bg-[#A8D5BA]/30 border border-[#A8D5BA]/30 transition-all">
                <Brain size={14} className="animate-pulse" /> Neural Sync Active
              </Link>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold leading-[1.1] tracking-tight">
              Harmonize with the <span className="italic text-amber-200">Eternal</span> Cycles
            </h2>
            <p className="text-base sm:text-lg md:text-xl font-serif italic text-white/80 leading-relaxed max-w-xl">
              Discover your unique constitution and embark on a personalized journey of sensory alignment.
            </p>
            <div className="pt-6">
              <Link 
                to="/quiz" 
                className="inline-flex items-center gap-4 bg-white text-[#5A5A40] px-10 py-5 rounded-[24px] text-base font-black uppercase tracking-widest hover:bg-amber-50 hover:scale-105 active:scale-95 transition-all shadow-2xl group/btn"
              >
                Reveal Dosha <ArrowRight className="group-hover/btn:translate-x-2 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <DinacharyaRituals dosha={dosha} />

      {/* Neural Recommendations Section */}
      <section className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
          <div className="space-y-2">
             <div className="flex items-center gap-2 text-indigo-600">
                <Zap size={20} className="animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em]">AIveda Synthesis</span>
             </div>
             <h3 className="text-4xl font-serif font-bold text-[#5A5A40]">Neural Alignments</h3>
             <p className="text-lg text-[#5A5A40]/60 italic font-serif">Tailored pathways discovered by the cognitive engine.</p>
          </div>
          {isLoadingRecs && (
            <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
              <Loader2 size={14} className="animate-spin" /> Recalibrating Wisdom
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recommendations.length > 0 ? (
            recommendations.map((rec, index) => (
              <motion.div
                key={rec.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-amber-500/5 rounded-[48px] blur-2xl group-hover:blur-3xl transition-all" />
                <div className="relative bg-white/70 backdrop-blur-xl border border-indigo-100 rounded-[48px] p-10 h-full flex flex-col shadow-sm group-hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start mb-8">
                    <div className={cn(
                      "p-4 rounded-2xl shadow-inner",
                      rec.type === 'Product' ? "bg-amber-50 text-amber-600" :
                      rec.type === 'Recipe' ? "bg-emerald-50 text-emerald-600" :
                      "bg-indigo-50 text-indigo-600"
                    )}>
                      {rec.type === 'Product' ? <ShoppingBag size={24} /> :
                       rec.type === 'Recipe' ? <Utensils size={24} /> :
                       <Waves size={24} />}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 px-3 py-1 bg-black/5 rounded-full">
                      {rec.type}
                    </span>
                  </div>

                  <div className="flex-1 space-y-4">
                    <h4 className="text-2xl font-serif font-bold text-[#5A5A40] group-hover:text-indigo-600 transition-colors leading-tight">
                      {rec.title}
                    </h4>
                    <p className="text-sm text-[#5A5A40]/70 font-serif italic leading-relaxed">
                      {rec.description}
                    </p>
                    <div className="pt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                      <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Sparkles size={10} /> Clinical Benefit
                      </div>
                      <p className="text-[11px] text-indigo-900/60 font-medium leading-relaxed">
                        {rec.benefit}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-indigo-50">
                    <Link 
                      to={rec.targetPath}
                      className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-widest text-[#5A5A40] group/link"
                    >
                      <span className="group-hover/link:translate-x-2 transition-transform duration-500">{rec.actionLabel}</span>
                      <ArrowRight size={16} className="text-indigo-400" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))
          ) : !isLoadingRecs && (
            <div className="col-span-full py-20 text-center space-y-4">
               <Brain size={48} className="mx-auto text-indigo-100" />
               <p className="text-sm text-[#5A5A40]/40 italic">
                 Update your profile with a Dosha Quiz to receive personalized neural alignments.
               </p>
               <Link to="/quiz" className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-500 underline decoration-indigo-200 underline-offset-4">
                 Take Dosha Quiz
               </Link>
            </div>
          )}
        </div>
      </section>

      {/* Philosophy Interlude */}
      <section className="py-12 border-y border-[#D1D1C1]/30 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="text-amber-600">
            <Flower size={32} className="mx-auto" />
          </div>
          <h3 className="text-4xl sm:text-5xl font-serif font-bold text-[#5A5A40] italic">"Balance is not something you find, it's something you create."</h3>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#5A5A40]/40">— Ancient Ayurvedic Wisdom</p>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-2">
              <h3 className="text-4xl sm:text-5xl font-serif font-bold text-[#5A5A40]">Curated Sanctuary</h3>
              <p className="text-lg text-[#5A5A40]/60 italic font-serif">Explore the dimensions of your holistic wellbeing.</p>
            </div>
            <Link to="/marketplace" className="text-sm font-bold uppercase tracking-widest text-amber-600 hover:text-amber-700 flex items-center gap-2 group underline decoration-amber-200 underline-offset-8">
              Access Marketplace <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link 
                  to={feature.path}
                  className={cn(
                    "block p-8 rounded-[40px] border transition-all h-full group hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden",
                    feature.color
                  )}
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-150 transition-transform duration-700">
                    <feature.icon size={80} />
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-[#5A5A40] mb-8 shadow-sm group-hover:rotate-12 transition-transform">
                    <feature.icon size={28} />
                  </div>
                  <h4 className="text-2xl font-serif font-bold text-[#5A5A40] mb-3 leading-tight">{feature.name}</h4>
                  <p className="text-sm text-[#5A5A40]/70 leading-relaxed font-serif italic">{feature.description}</p>
                  <div className="mt-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#5A5A40] transition-colors group-hover:text-amber-600">
                    Enter Node <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
           <div className="space-y-4">
              <h3 className="text-2xl font-serif font-bold text-[#5A5A40]">Pulse</h3>
              <p className="text-sm text-[#5A5A40]/60 italic">Real-time collective synchrony.</p>
           </div>
           
           <div className="p-8 rounded-[40px] bg-indigo-500 text-white space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                 <Brain size={120} />
              </div>
              <div className="relative z-10 space-y-4">
                 <h4 className="text-xl font-serif font-bold">Neural Engine</h4>
                 <p className="text-xs opacity-80 leading-relaxed">System is currently manifestating new insights based on collective bio-rhythms.</p>
                 <Link to="/neural-hub" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-white/20 px-4 py-2 rounded-full hover:bg-white/30 transition-all">
                    Observe Evolution <ArrowRight size={12} />
                 </Link>
              </div>
           </div>
        </div>
      </section>

      {/* Local Discovery Card */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-[#5A5A40] p-10 sm:p-16 rounded-[60px] shadow-2xl flex flex-col md:flex-row items-center gap-12 text-white overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/10 rounded-full -mr-48 -mt-48 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mb-48 blur-[80px]" />
        
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[32px] bg-white/10 flex items-center justify-center text-white shrink-0 backdrop-blur-xl border border-white/20 rotate-3 hover:rotate-0 transition-transform duration-500">
          <MapPin size={40} className="sm:w-16 sm:h-16" />
        </div>
        <div className="space-y-6 relative z-10 w-full text-center md:text-left">
          <div className="inline-block px-4 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20">
             Environment Awareness
          </div>
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold leading-tight italic">
            "{locationPoem || "The whisper of the cosmos is seeking your coordinate..."}"
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs sm:text-sm uppercase tracking-[0.2em] font-bold opacity-60">
             <div className="flex items-center gap-2">
                <Sun size={14} className="text-amber-300" /> Vata-Season
             </div>
             <div className="hidden sm:block w-1.5 h-1.5 bg-white/30 rounded-full" />
             <div className="flex items-center gap-2">
                <Wind size={14} className="text-sky-300" /> High Prana
             </div>
          </div>
        </div>
      </motion.div>
      <LiveActivityTicker />
    </div>
  );
};

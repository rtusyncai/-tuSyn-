import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Compass, Leaf, Sun, Moon, Wind, Gem, Hammer, FileText, Sparkles, Book, FlaskConical, Activity, X, Loader2, Quote, GraduationCap, Microscope } from 'lucide-react';
import { cn } from '../lib/utils';
import { geminiService } from '../services/geminiService';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Markdown from 'react-markdown';

const ICON_MAP: Record<string, any> = {
  Leaf, Sun, Moon, Wind, Book, Flask: FlaskConical, Activity, BookOpen, GraduationCap, Microscope
};

export const ResourcesPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [dynamicArticles, setDynamicArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  useEffect(() => {
    const fetchContextAndResources = async () => {
      if (!user) return;
      try {
        const profileSnap = await getDoc(doc(db, 'profiles', user.uid));
        const profileData = profileSnap.exists() ? profileSnap.data() : null;
        setProfile(profileData);

        const resources = await geminiService.getLibraryResources(profileData?.healthData);
        setDynamicArticles(resources);
      } catch (error) {
        console.error("Failed to load resources:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContextAndResources();
  }, [user]);

  const getIcon = (name: string) => {
    return ICON_MAP[name] || BookOpen;
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Header section remains similar but updated for dynamic context */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#5A5A40]/5 rounded-full text-[#5A5A40] text-xs font-bold uppercase tracking-widest"
        >
          <Sparkles size={14} /> Personalized Library
        </motion.div>
        <h2 className="text-5xl font-serif font-bold text-[#5A5A40] leading-tight">
          Curated Wisdom for your {profile?.healthData?.dosha || 'Prakriti'}
        </h2>
        <p className="text-xl text-[#2D3436] opacity-70 italic leading-relaxed">
          Sacred wisdom harmonized with clinical evidence, precisely calibrated for your biological manifestation.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-[#5A5A40]" size={48} />
          <p className="text-[#5A5A40]/60 font-medium animate-pulse">Syncing with ancient archives...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {dynamicArticles.map((article, index) => {
            const Icon = getIcon(article.iconName);
            return (
              <motion.div
                key={article.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => setSelectedArticle(article)}
              >
                <div className={cn(
                  "p-10 rounded-[40px] border border-[#D1D1C1]/50 h-full transition-all hover:shadow-2xl hover:-translate-y-2 flex flex-col relative overflow-hidden group",
                  article.color || "bg-white"
                )}>
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                    <Icon size={120} />
                  </div>
                  
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center text-[#5A5A40] shadow-md">
                      <Icon size={32} />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A40] opacity-40">
                        {article.category}
                      </span>
                      <span className="text-[9px] font-medium text-[#5A5A40]/60 mt-1">
                        Source: {article.source?.split(':')[0] || 'Original Source'}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#5A5A40] mb-4 group-hover:text-[#5A5A40]/80 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-[#2D3436] opacity-70 leading-relaxed italic mb-8 flex-1 line-clamp-3">
                    {article.subtitle}
                  </p>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#5A5A40] uppercase tracking-widest pt-4 border-t border-[#5A5A40]/10">
                    Enter Reading Mode <BookOpen size={16} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Article Reader Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-[#5A5A40]/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#FCFCF8] w-full max-w-5xl max-h-full rounded-[60px] shadow-3xl overflow-hidden flex flex-col border border-[#D1D1C1]"
            >
              <div className="p-8 sm:p-12 border-b border-[#D1D1C1]/30 bg-[#F5F5F0] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-[#5A5A40] shadow-sm">
                    {React.createElement(getIcon(selectedArticle.iconName), { size: 28 })}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-[#5A5A40]/10 text-[#5A5A40] rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {selectedArticle.category}
                      </span>
                      <span className="text-xs font-medium text-[#5A5A40]/50 tracking-tight italic">
                        {selectedArticle.source}
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#5A5A40] mt-2">
                      {selectedArticle.title}
                    </h2>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedArticle(null)}
                  className="p-3 hover:bg-white rounded-2xl text-[#5A5A40] transition-all"
                >
                  <X />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 sm:p-16 scrollbar-hide">
                <div className="max-w-3xl mx-auto space-y-12">
                  <div className="text-center space-y-6 pb-12 border-b border-[#D1D1C1]/30">
                    <Quote className="mx-auto text-[#5A5A40]/20" size={48} />
                    <p className="text-2xl font-serif italic text-[#2D3436] leading-relaxed">
                      {selectedArticle.subtitle}
                    </p>
                  </div>

                  <div className="markdown-body prose prose-lg prose-stone prose-headings:font-serif prose-headings:text-[#5A5A40] prose-p:text-[#2D3436] prose-p:leading-relaxed prose-strong:text-[#5A5A40] prose-blockquote:border-l-[#5A5A40]/20 prose-blockquote:italic">
                    <Markdown>{selectedArticle.content}</Markdown>
                  </div>

                  <div className="pt-12 border-t border-[#D1D1C1]/30">
                    <div className="p-8 bg-[#5A5A40]/5 rounded-[40px] flex gap-6 items-start">
                      <div className="p-3 bg-white rounded-xl text-[#5A5A40]">
                        <Book size={24} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-[#5A5A40] uppercase tracking-widest text-xs">Researcher Note</h4>
                        <p className="text-sm text-[#2D3436]/70 leading-relaxed italic">
                          This article is dynamically curated by the AIveda engine using cross-functional analysis between the {selectedArticle.source} and your current health profile. It is intended for educational purposes only.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Philosophical Section */}
      <section className="space-y-12 pt-12 border-t border-[#D1D1C1]/50">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-[#5A5A40]">Ornaments of Balance</h2>
          <p className="text-xl text-[#2D3436] opacity-70 italic">Philosophical foundations of Ayurwear.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <h3 className="text-3xl font-serif font-bold text-[#5A5A40]">The Philosophy</h3>
              <p className="text-[#2D3436] opacity-80 leading-relaxed text-lg">
                Ayurwear ornaments are not merely decorative; they are biological resonance tools. Each piece is designed to harmonize your inner Prakriti with the external environment. We believe that what sits against the skin affects the subtle energy channels (Nadis).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-3xl border border-[#D1D1C1] space-y-4 shadow-sm">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center">
                  <Leaf size={24} />
                </div>
                <h4 className="font-bold text-[#5A5A40]">Sacred Herbs</h4>
                <p className="text-sm text-[#2D3436] opacity-60">Infused through ancient distillation and resin preservation to maintain vibrational integrity.</p>
              </div>
              <div className="p-6 bg-white rounded-3xl border border-[#D1D1C1] space-y-4 shadow-sm">
                <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center">
                  <Gem size={24} />
                </div>
                <h4 className="font-bold text-[#5A5A40]">Celestial Metals</h4>
                <p className="text-sm text-[#2D3436] opacity-60">Gold for Pitta cooling, Silver for Kapha stabilizing, and Copper for cellular detoxification.</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <img 
              src="https://picsum.photos/seed/ornament-ayurveda/800/800" 
              alt="Ayurwear Ornament" 
              className="rounded-[60px] shadow-2xl w-full aspect-square object-cover"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            <div className="absolute -bottom-6 -right-6 bg-[#5A5A40] text-white p-8 rounded-[40px] shadow-xl max-w-xs hidden sm:block">
              <Sparkles className="mb-4 opacity-50" size={32} />
              <p className="text-sm font-medium italic">"Artisanal souls meet algorithmic precision to forge balance."</p>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
          <div className="space-y-4">
            <div className="w-14 h-14 bg-[#5A5A40]/10 text-[#5A5A40] rounded-2xl flex items-center justify-center">
              <Hammer size={28} />
            </div>
            <h4 className="text-xl font-bold text-[#5A5A40]">Artisanal Collaboration</h4>
            <p className="text-[#2D3436] opacity-70 text-sm leading-relaxed">
              We partner with traditional Indian goldsmiths and tribal weavers, blending their centuries-old techniques with modern biocompatible design.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-14 h-14 bg-[#5A5A40]/10 text-[#5A5A40] rounded-2xl flex items-center justify-center">
              <Compass size={28} />
            </div>
            <h4 className="text-xl font-bold text-[#5A5A40]">Ayurvedic Principles</h4>
            <p className="text-[#2D3436] opacity-70 text-sm leading-relaxed">
              Every design is cross-referenced with your Dosha profile to ensure the density, transparency, and weight reflect your biological needs.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-14 h-14 bg-[#5A5A40]/10 text-[#5A5A40] rounded-2xl flex items-center justify-center">
              <FileText size={28} />
            </div>
            <h4 className="text-xl font-bold text-[#5A5A40]">Ritual Card Concept</h4>
            <p className="text-[#2D3436] opacity-70 text-sm leading-relaxed">
              Each ornament arrives with a personalized <strong>Ritual Card</strong>—a sacred blueprint detailing the garment's composition and instructions for energetic cleansing.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Quote */}
      <div className="bg-[#5A5A40] text-white p-16 rounded-[60px] text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <img src="https://picsum.photos/seed/wisdom/1200/800" className="w-full h-full object-cover" alt="bg" loading="lazy" />
        </div>
        <div className="relative z-10 space-y-6">
          <p className="text-3xl font-serif italic leading-relaxed max-w-3xl mx-auto">
            "Health is the state of equilibrium of the three doshas, the seven tissues, and the three wastes, with a pleasant state of mind, soul, and senses."
          </p>
          <div className="text-sm font-bold uppercase tracking-[0.3em] opacity-60">
            — Sushruta Samhita
          </div>
        </div>
      </div>
    </div>
  );
};

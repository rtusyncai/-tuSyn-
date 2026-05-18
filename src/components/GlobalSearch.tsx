import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Command, ArrowRight, ShoppingBag, Wind, Sprout, Sparkles, MessageSquare, BookOpen, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: 'Product' | 'Service' | 'Resource' | 'Page';
  path: string;
  icon: any;
  metadata?: {
    doshaCompatibility?: string[];
    energeticProperties?: string[];
    modernBenefits?: string[];
    regionalAvailability?: string;
    cookingMethod?: string;
  };
  score?: number;
  matchedGoals?: string[];
}

const searchIndex: SearchResult[] = [
  // Pages
  { id: 'p1', title: 'Dosha Quiz', description: 'Discover your unique mind-body constitution.', category: 'Page', path: '/quiz', icon: BookOpen },
  { id: 'p2', title: 'AIveda Chat', description: 'Consult with our advanced Ayurvedic AI.', category: 'Page', path: '/ayur-chat', icon: MessageSquare },
  { id: 'p3', title: 'Marketplace', description: 'Shop for curated Ayurvedic products.', category: 'Page', path: '/marketplace', icon: ShoppingBag },
  { id: 'p4', title: 'Prithvi Garden', description: 'Personalized herbal garden and plant identification.', category: 'Page', path: '/prithvi', icon: Sprout },
  
  // Products (Nourish/Marketplace/AyurWear)
  { 
    id: 'pr1', title: 'Organic Kitchari Mix', description: 'A balancing meal for all doshas.', category: 'Product', path: '/nourish', icon: ShoppingBag,
    metadata: { doshaCompatibility: ['Vata', 'Pitta', 'Kapha'], cookingMethod: 'One-pot cooking', regionalAvailability: 'Global' }
  },
  { 
    id: 'pr2', title: 'Ojas-Boosting Moon Milk', description: 'Evening ritual for restful sleep.', category: 'Product', path: '/nourish', icon: ShoppingBag,
    metadata: { doshaCompatibility: ['Vata', 'Pitta'], modernBenefits: ['Cortisol regulation', 'Melatonin support', 'sleep', 'stress'], energeticProperties: ['Grounding', 'Nourishing'] }
  },
  { 
    id: 'pr3', title: 'Copper Tongue Scraper', description: 'Essential oral hygiene tool.', category: 'Product', path: '/marketplace', icon: ShoppingBag,
    metadata: { energeticProperties: ['Detoxifying', 'Stimulating'], modernBenefits: ['Oral microbiome health', 'hygiene'] }
  },
  { 
    id: 'pr4', title: 'Kanjeevaram Design', description: 'Traditional silk weaving patterns generated for you.', category: 'Product', path: '/ayurwear', icon: Sparkles,
    metadata: { doshaCompatibility: ['Kapha', 'Vata'], energeticProperties: ['Warmth', 'Richness'], modernBenefits: ['Sustainable textiles'] }
  },
  {
    id: 'pr5', title: 'Saffron-Infused Sacred Ornament', description: 'Gold-plated focal point for mental clarity.', category: 'Product', path: '/ayurwear', icon: Sparkles,
    metadata: { doshaCompatibility: ['Pitta'], energeticProperties: ['Cooling', 'Solar'], modernBenefits: ['Color therapy benefits', 'focus', 'clarity'] }
  },
  
  // Services (Sanctuary)
  { id: 's1', title: 'Abhyanga Massage', description: 'Warm oil lymphatic drainage therapy.', category: 'Service', path: '/sanctuary', icon: Wind,
    metadata: { doshaCompatibility: ['Vata'], energeticProperties: ['Grounding'], modernBenefits: ['stress', 'stiffness'] }
  },
  { id: 's2', title: 'Shirodhara Ritual', description: 'Focus and clarity through oil streaming.', category: 'Service', path: '/sanctuary', icon: Wind,
    metadata: { doshaCompatibility: ['Pitta', 'Vata'], energeticProperties: ['Calming'], modernBenefits: ['insomnia', 'headaches', 'focus'] }
  },
  { id: 's3', title: 'Marma Point Therapy', description: 'Energy point activation for healing.', category: 'Service', path: '/sanctuary', icon: Wind,
    metadata: { doshaCompatibility: ['Vata', 'Pitta', 'Kapha'], energeticProperties: ['Vitalizing'], modernBenefits: ['energy', 'recovery'] }
  },
  
  // Resources (Habitat/Prithvi/AyurWear/Doshas)
  { id: 'r1', title: 'Vata Balancing Routine', description: 'Tips for staying grounded in autumn.', category: 'Resource', path: '/habitat', icon: Sprout,
    metadata: { doshaCompatibility: ['Vata'] }
  },
  { id: 'r2', title: 'Pitta Cooling Tips', description: 'Stay cool and calm during summer.', category: 'Resource', path: '/habitat', icon: Sprout,
    metadata: { doshaCompatibility: ['Pitta'] }
  },
  { id: 'r3', title: 'Kapha Stimulating Routine', description: 'Energize your body and mind in spring.', category: 'Resource', path: '/habitat', icon: Sprout,
    metadata: { doshaCompatibility: ['Kapha'] }
  },
  { id: 'r4', title: 'Tulsi (Holy Basil)', description: 'Explore the health benefits of Sacred Tulsi.', category: 'Resource', path: '/prithvi', icon: Sprout,
    metadata: { modernBenefits: ['immunity', 'respiratory', 'stress'], energeticProperties: ['Purifying'] }
  },
  { id: 'r5', title: 'Ashwagandha Guide', description: 'The power of the King of Herbs.', category: 'Resource', path: '/prithvi', icon: Sprout,
    metadata: { modernBenefits: ['stress', 'strength', 'stamina', 'anxiety'], energeticProperties: ['Adaptogenic'] }
  },
  { id: 'r6', title: 'Sacred Textile Guide', description: 'Understanding Ayurvedic dyeing (Ayurvastra).', category: 'Resource', path: '/ayurwear', icon: Sparkles },
];

export const GlobalSearch: React.FC = () => {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Extract health goal keywords for prioritized matching
  const goalKeywords = useMemo(() => {
    if (!profile?.healthData?.healthGoals) return [];
    return profile.healthData.healthGoals
      .toLowerCase()
      .split(/[\s,.]+/)
      .filter((word: string) => word.length > 3);
  }, [profile?.healthData?.healthGoals]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const queryLower = query.toLowerCase();
    
    // Filter and score results
    const scoredResults = searchIndex
      .map(item => {
        let score = 0;
        const matchedGoals: string[] = [];
        
        // 1. Basic Content Match (Requirement to even show)
        const inTitle = item.title.toLowerCase().includes(queryLower);
        const inDesc = item.description.toLowerCase().includes(queryLower);
        const inCat = item.category.toLowerCase().includes(queryLower);
        
        const inMetadata = item.metadata ? (
          item.metadata.doshaCompatibility?.some(d => d.toLowerCase().includes(queryLower)) ||
          item.metadata.energeticProperties?.some(e => e.toLowerCase().includes(queryLower)) ||
          item.metadata.modernBenefits?.some(m => m.toLowerCase().includes(queryLower)) ||
          item.metadata.regionalAvailability?.toLowerCase().includes(queryLower) ||
          item.metadata.cookingMethod?.toLowerCase().includes(queryLower)
        ) : false;

        if (!inTitle && !inDesc && !inCat && !inMetadata) {
          return { ...item, score: -1 };
        }

        // --- Enhanced Scoring Logic ---
        
        // Match Accuracy Boost (Primary)
        if (inTitle) score += 100;
        if (item.title.toLowerCase() === queryLower) score += 250; // Exact match
        if (inDesc) score += 50;

        // 1. Enhanced Dosha Alignment Boost
        if (profile?.dosha && item.metadata?.doshaCompatibility?.includes(profile.dosha)) {
          // If it's a resource specifically for their dosha, give it a significant relevance boost
          if (item.category === 'Resource') {
            score += 250;
          } else {
            score += 150;
          }
        }

        // 2. Enhanced Health Goals Boost
        if (goalKeywords.length > 0) {
          const titleLower = item.title.toLowerCase();
          const descLower = item.description.toLowerCase();
          const benefits = item.metadata?.modernBenefits?.map(b => b.toLowerCase()) || [];
          
          goalKeywords.forEach(goal => {
            let matched = false;
            // Priority 1: Exact match in modern benefits (Strong clinical correlation)
            if (benefits.includes(goal)) {
              score += 120;
              matched = true;
            } else if (benefits.some(b => b.includes(goal))) {
               score += 60;
               matched = true;
            }
            
            // Priority 2: Match in title (High visibility)
            if (titleLower.includes(goal)) {
              score += 80;
              matched = true;
            }
            
            // Priority 3: Match in description (General context)
            if (descLower.includes(goal)) {
              score += 40;
              matched = true;
            }

            if (matched && !matchedGoals.includes(goal)) {
              matchedGoals.push(goal);
            }
          });
        }

        // Energetic Property relevance to query
        if (item.metadata?.energeticProperties?.some(p => p.toLowerCase().includes(queryLower))) {
          score += 60;
        }

        return { ...item, score, matchedGoals };
      })
      .filter(item => item.score >= 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 8);

    setResults(scoredResults);
    setSelectedIndex(0);
  }, [query, profile, goalKeywords]);

  const handleSelect = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results.length > 0) {
      handleSelect(results[selectedIndex].path);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 p-2.5 sm:px-4 sm:py-2.5 bg-[#E8E8E0] dark:bg-[#252520] border border-[#D1D1C1]/50 dark:border-[#3D3D35]/50 rounded-2xl text-[#5A5A40]/60 dark:text-[#A8D5BA]/60 hover:border-[#5A5A40] dark:hover:border-[#A8D5BA] transition-all group w-fit sm:w-full max-w-[300px]"
      >
        <Search size={18} className="group-hover:scale-110 transition-transform" />
        <span className="text-sm font-medium flex-1 text-left hidden sm:block">Search anything...</span>
        <div className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F5F5F0] dark:bg-[#1A1A15] border border-[#D1D1C1] dark:border-[#3D3D35]">
          <Command size={10} />
          <span className="text-[10px] font-bold">K</span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 md:px-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#1A1A15] rounded-[2.5rem] shadow-2xl border border-[#D1D1C1]/50 dark:border-[#3D3D35]/50 overflow-hidden"
            >
              <div className="p-6 border-b border-[#D1D1C1]/30 dark:border-[#3D3D35]/30">
                <div className="flex items-center gap-4">
                  <Search size={24} className="text-[#5A5A40] dark:text-[#A8D5BA]" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Search products, rituals, herbs, or insights..."
                    className="flex-1 bg-transparent border-none outline-none text-xl font-serif text-[#5A5A40] dark:text-[#A8D5BA] placeholder:text-[#5A5A40]/30"
                  />
                  <X
                    size={24}
                    className="text-[#5A5A40]/40 cursor-pointer hover:text-[#5A5A40] transition-colors"
                    onClick={() => setIsOpen(false)}
                  />
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto scrollbar-hide py-4">
                {query.trim() === '' ? (
                  <div className="px-8 py-12 text-center">
                    <div className="w-16 h-16 bg-[#F5F5F0] dark:bg-[#252520] rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Search size={32} className="text-[#5A5A40]/30" />
                    </div>
                    <h3 className="text-xl font-serif text-[#5A5A40] dark:text-[#A8D5BA] mb-2">Begin your exploration</h3>
                    <p className="text-sm text-[#5A5A40]/60 dark:text-[#A8D5BA]/60">Search for herbs like 'Ashwagandha', rituals like 'Abhyanga', or your Dosha results.</p>
                  </div>
                ) : results.length > 0 ? (
                  <div className="px-3 space-y-1">
                    {results.map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.path)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 group text-left",
                          index === selectedIndex 
                            ? "bg-[#5A5A40] text-white dark:bg-[#A8D5BA] dark:text-[#1A1A15] shadow-xl" 
                            : "hover:bg-[#F5F5F0] dark:hover:bg-[#252520] text-[#5A5A40] dark:text-[#A8D5BA]"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                          index === selectedIndex ? "bg-white/20" : "bg-[#F5F5F0] dark:bg-[#252520]"
                        )}>
                          <item.icon size={22} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-bold">{item.title}</h4>
                            <span className={cn(
                              "text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border",
                              index === selectedIndex 
                                ? "border-white/20 bg-white/10" 
                                : "border-[#D1D1C1] dark:border-[#3D3D35] bg-[#F5F5F0]/50 dark:bg-[#252520]/50 text-[#5A5A40]/40 dark:text-[#A8D5BA]/40"
                            )}>
                              {item.category}
                            </span>
                            {profile?.dosha && item.metadata?.doshaCompatibility?.includes(profile.dosha) && (
                              <span className={cn(
                                "text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1",
                                index === selectedIndex ? "bg-emerald-400/20 text-emerald-200" : "bg-emerald-50 text-emerald-600"
                              )}>
                                <Activity size={10} /> Dosha Match
                              </span>
                            )}
                            {item.matchedGoals && item.matchedGoals.length > 0 && (
                              <span className={cn(
                                "text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1",
                                index === selectedIndex ? "bg-indigo-400/20 text-indigo-200" : "bg-indigo-50 text-indigo-600"
                              )}>
                                <Sparkles size={10} /> Goal Match
                              </span>
                            )}
                          </div>
                          <p className={cn(
                            "text-xs line-clamp-1 mb-2",
                            index === selectedIndex ? "text-white/70" : "text-[#5A5A40]/60 dark:text-[#A8D5BA]/60"
                          )}>
                            {item.description}
                          </p>
                          {(item.metadata || (item.matchedGoals && item.matchedGoals.length > 0)) && (
                            <div className="flex flex-wrap gap-1.5 overflow-hidden">
                              {item.matchedGoals?.map(goal => (
                                <span key={goal} className={cn(
                                  "text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                                  index === selectedIndex ? "border-white/20 bg-white/20 text-white" : "border-indigo-100 bg-indigo-50 text-indigo-600"
                                )}>
                                  {goal}
                                </span>
                              ))}
                              {item.metadata?.doshaCompatibility?.map(d => (
                                <span key={d} className={cn(
                                  "text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                                  index === selectedIndex ? "bg-white/20 text-white" : "bg-[#F5F5F0] text-[#5A5A40]/40"
                                )}>
                                  {d}
                                </span>
                              ))}
                              {item.metadata.energeticProperties?.slice(0, 2).map(e => (
                                <span key={e} className={cn(
                                  "text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                                  index === selectedIndex ? "bg-amber-400/20 text-amber-200" : "bg-amber-50 text-amber-600/60"
                                )}>
                                  {e}
                                </span>
                              ))}
                              {item.metadata.cookingMethod && (
                                <span className={cn(
                                  "text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                                  index === selectedIndex ? "border-white/20 bg-white/10 text-white" : "border-[#D1D1C1] bg-white text-[#5A5A40]/40"
                                )}>
                                  {item.metadata.cookingMethod}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <ArrowRight 
                          size={18} 
                          className={cn(
                            "transition-transform",
                            index === selectedIndex ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
                          )} 
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-8 py-12 text-center">
                    <p className="text-[#5A5A40]/40 dark:text-[#A8D5BA]/40 mb-2 italic">Nothing matches your exploration</p>
                    <p className="text-sm text-[#5A5A40]/60 dark:text-[#A8D5BA]/60">Try searching for broader terms or related practices.</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-[#F5F5F0] dark:bg-[#252520] border-t border-[#D1D1C1]/30 dark:border-[#3D3D35]/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#5A5A40]/40 dark:text-[#A8D5BA]/40">
                    <span className="px-1.5 py-0.5 rounded border border-[#D1D1C1] dark:border-[#3D3D35] bg-white dark:bg-[#1A1A15]">ENTER</span>
                    <span>to select</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#5A5A40]/40 dark:text-[#A8D5BA]/40">
                    <span className="px-1.5 py-0.5 rounded border border-[#D1D1C1] dark:border-[#3D3D35] bg-white dark:bg-[#1A1A15]">↑↓</span>
                    <span>to navigate</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#5A5A40]/40 dark:text-[#A8D5BA]/40">
                  <span className="px-1.5 py-0.5 rounded border border-[#D1D1C1] dark:border-[#3D3D35] bg-white dark:bg-[#1A1A15]">ESC</span>
                  <span>to close</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

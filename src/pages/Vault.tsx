import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Archive, 
  Trash2, 
  Eye, 
  Loader2, 
  Search, 
  Filter, 
  ExternalLink,
  Home,
  Sprout,
  Music,
  Wind,
  Gem,
  Info,
  ChevronRight,
  Clock,
  LayoutGrid,
  List as ListIcon,
  X,
  ClipboardList,
  Shirt,
  Sparkles,
  Camera,
  Activity,
  Utensils,
  Glasses,
  Brain,
  BookOpen,
  Heart
} from 'lucide-react';
import { vaultService, VaultItem, VaultItemType } from '../services/vaultService';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/useToast';
import { useVision } from '../hooks/useVision';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';

const TYPE_CONFIG: Record<VaultItemType, { icon: any, label: string, color: string }> = {
  habitat: { icon: Home, label: 'Habitat', color: 'text-amber-600 bg-amber-50' },
  prithvi: { icon: Sprout, label: 'Garden', color: 'text-emerald-600 bg-emerald-50' },
  sonic_meditation: { icon: Wind, label: 'Meditation', color: 'text-blue-600 bg-blue-50' },
  sonic_composition: { icon: Music, label: 'Composition', color: 'text-indigo-600 bg-indigo-50' },
  ayurwear: { icon: Gem, label: 'Ornament', color: 'text-rose-600 bg-rose-50' },
  ayurwear_clothing: { icon: Shirt, label: 'Clothing', color: 'text-sky-600 bg-sky-50' },
  prescription: { icon: ClipboardList, label: 'Prescription', color: 'text-emerald-700 bg-emerald-50' },
  neuro_snapshot: { icon: Brain, label: 'Neural Snapshot', color: 'text-indigo-700 bg-indigo-50' },
  journal: { icon: BookOpen, label: 'Journal', color: 'text-[#5A5A40] bg-[#F5F5F0]' },
  mood: { icon: Heart, label: 'Emotion', color: 'text-rose-600 bg-rose-50' }
};

export const VaultPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { setMode, setPayload } = useVision();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<VaultItemType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    loadItems();
  }, [user]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await vaultService.getUserItems(user!.uid);
      setItems(data);
    } catch (error) {
      console.error(error);
      toast("Failed to load your vault.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this from your vault?")) return;
    try {
      await vaultService.deleteItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
      toast("Item removed from vault.", "success");
    } catch (error) {
      console.error(error);
      toast("Failed to delete item.", "error");
    }
  };

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 py-6 sm:py-10 max-w-7xl mx-auto px-4">
      {/* Prosperity Nudge */}
      {!loading && items.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#5A5A40] to-[#4A4A30] p-6 rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Crown size={120} />
          </div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
              <Crown size={32} className="text-amber-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold font-serif">Deepen Your Archive</h3>
              <p className="text-sm text-white/70 italic">
                You've archived {items.length} manifestations. Join the Seeker Path for unlimited vault capacity and neural memory.
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/membership')}
            className="px-8 py-3 bg-white text-[#5A5A40] rounded-xl font-bold hover:bg-amber-50 transition-all flex items-center gap-2 relative z-10 shrink-0"
          >
            Enhance Vault <ChevronRight size={18} />
          </button>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-[#5A5A40]">
            <Archive size={32} />
            <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight">The Sacred Vault</h1>
          </div>
          <p className="text-[#2D3436] opacity-60 italic font-serif text-lg">Your curated collection of bio-rhythmic manifestations.</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-[#D1D1C1]/50 shadow-sm">
          <button 
            onClick={() => setViewMode('grid')}
            className={cn("p-2 rounded-xl transition-all", viewMode === 'grid' ? "bg-[#5A5A40] text-white" : "text-[#5A5A40] opacity-40 hover:opacity-100")}
          >
            <LayoutGrid size={20} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={cn("p-2 rounded-xl transition-all", viewMode === 'list' ? "bg-[#5A5A40] text-white" : "text-[#5A5A40] opacity-40 hover:opacity-100")}
          >
            <ListIcon size={20} />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40] opacity-40" size={18} />
            <input 
              type="text"
              placeholder="Search your vault..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-[#D1D1C1] focus:ring-2 focus:ring-[#5A5A40]/20 outline-none text-sm"
            />
          </div>
          <div className="flex bg-white p-1 rounded-2xl border border-[#D1D1C1] overflow-x-auto no-scrollbar">
            {(['all', 'habitat', 'prithvi', 'sonic_meditation', 'sonic_composition', 'ayurwear', 'ayurwear_clothing', 'prescription', 'neuro_snapshot'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap capitalize",
                  filter === t ? "bg-[#5A5A40] text-white shadow-lg" : "text-[#5A5A40] opacity-60 hover:opacity-100"
                )}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-[40px] border border-dashed border-[#D1D1C1]">
          <Loader2 className="animate-spin text-[#5A5A40] mb-4" size={40} />
          <p className="text-[#5A5A40] font-serif italic">Unlocking your vault...</p>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className={cn(
          "grid gap-6",
          viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <VaultCard 
                key={item.id} 
                item={item} 
                viewMode={viewMode}
                onDelete={(e) => handleDelete(item.id!, e)}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-white/50 rounded-[40px] border border-dashed border-[#D1D1C1] text-center px-6">
          <div className="w-20 h-20 bg-[#F5F5F0] rounded-full flex items-center justify-center text-[#5A5A40] mb-6">
            <Archive size={40} />
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#5A5A40] mb-2">Vault Empty</h3>
          <p className="max-w-md text-[#2D3436] opacity-60 italic font-serif">
            You haven't stored any bio-rhythmic creations yet. Begin by generating and saving designs in any sanctuary section.
          </p>
        </div>
      )}

      {/* Detailed View Modal */}
      <Modal 
        isOpen={!!selectedItem} 
        onClose={() => setSelectedItem(null)} 
        item={selectedItem} 
        onDelete={(e) => selectedItem && handleDelete(selectedItem.id!, e)}
      />
    </div>
  );
};

const VaultCard = ({ item, viewMode, onDelete, onClick }: { item: VaultItem, viewMode: 'grid' | 'list', onDelete: (e: React.MouseEvent) => void, onClick: () => void }) => {
  const config = TYPE_CONFIG[item.type];
  const Icon = config.icon;

  if (viewMode === 'list') {
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={onClick}
        className="group bg-white p-4 rounded-3xl border border-[#D1D1C1] shadow-sm hover:shadow-xl transition-all flex items-center gap-6 cursor-pointer"
      >
        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shrink-0", config.color)}>
          <Icon size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h4 className="font-bold text-[#5A5A40] truncate">{item.title}</h4>
            <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest", config.color)}>
              {config.label}
            </span>
          </div>
          <p className="text-xs text-[#2D3436]/60 italic font-serif truncate">{item.description}</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-serif italic text-[#2D3436]/40">
          <Clock size={14} />
          {item.createdAt && format(item.createdAt.toDate(), 'MMM d, yyyy')}
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-[#5A5A40] opacity-40 group-hover:opacity-100 hover:bg-[#F5F5F0] rounded-xl transition-all">
            <Eye size={18} />
          </button>
          <button 
            onClick={onDelete} 
            className="p-2 text-rose-500 opacity-40 group-hover:opacity-100 hover:bg-rose-50 rounded-xl transition-all"
            title="Remove from vault"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onClick}
      className="group bg-white rounded-[40px] border border-[#D1D1C1] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer flex flex-col"
    >
      <div className="h-48 relative overflow-hidden">
        <img 
          src={item.image || `https://picsum.photos/seed/${item.id}/800/600`} 
          alt={item.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute top-4 left-4 z-10">
          <div className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg backdrop-blur-md", config.color)}>
            <div className="flex items-center gap-1.5">
              <Icon size={12} />
              {config.label}
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button 
            onClick={onDelete}
            className="p-2 bg-white/90 backdrop-blur-sm text-rose-600 rounded-xl shadow-lg opacity-40 group-hover:opacity-100 transition-all hover:bg-rose-50"
            title="Remove from vault"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="space-y-1">
          <h4 className="text-xl font-serif font-bold text-[#5A5A40] group-hover:text-emerald-700 transition-colors">{item.title}</h4>
          <p className="text-xs text-[#2D3436]/60 italic font-serif line-clamp-2">{item.description}</p>
        </div>
        <div className="pt-4 border-t border-[#F5F5F0] mt-auto flex justify-between items-center text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">
          <div className="flex items-center gap-1.5 font-serif italic font-normal normal-case">
            <Clock size={12} />
            {item.createdAt && format(item.createdAt.toDate(), 'MMM d, yyyy')}
          </div>
          <span className="flex items-center gap-1 hover:text-[#5A5A40]">
            Review Details <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const Modal = ({ isOpen, onClose, item, onDelete }: { isOpen: boolean, onClose: () => void, item: VaultItem | null, onDelete: (e: React.MouseEvent) => void }) => {
  const { setMode, setPayload } = useVision();
  if (!isOpen || !item) return null;

  const handleImmerse = (mode: 'ar' | 'vr') => {
    setPayload(item);
    setMode(mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-8 border-b border-[#F5F5F0] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", TYPE_CONFIG[item.type].color)}>
              {React.createElement(TYPE_CONFIG[item.type].icon, { size: 24 })}
            </div>
            <div>
              <h3 className="text-2xl font-serif font-bold text-[#5A5A40]">{item.title}</h3>
              <p className="text-xs italic text-[#2D3436]/40">Saved on {item.createdAt && format(item.createdAt.toDate(), 'MMMM d, yyyy')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onDelete}
              className="p-3 bg-rose-50 text-rose-500 rounded-full hover:bg-rose-100 transition-all opacity-60 hover:opacity-100"
              title="Remove from vault"
            >
              <Trash2 size={20} />
            </button>
            <button onClick={onClose} className="p-3 bg-[#F5F5F0] rounded-full hover:bg-[#D1D1C1] transition-all"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="aspect-video rounded-3xl overflow-hidden border border-[#D1D1C1] shadow-lg">
                <img src={item.image || `https://picsum.photos/seed/${item.id}/800/600`} className="w-full h-full object-cover" alt="Artifact" loading="lazy" />
              </div>
              <div className="bg-[#F5F5F0] p-6 rounded-3xl border border-[#D1D1C1]/50 italic text-[#2D3436]/70 leading-relaxed font-serif">
                <div className="flex items-center gap-2 mb-2 text-[#5A5A40] not-italic font-sans font-bold uppercase tracking-widest text-[10px]">
                  <Info size={14} /> Description
                </div>
                {item.description}
              </div>
              
              <div className="flex gap-4">
                 <button 
                   onClick={() => handleImmerse('ar')}
                   className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-xl"
                 >
                   <Camera size={18} /> Etheric AR
                 </button>
                 <button 
                   onClick={() => handleImmerse('vr')}
                   className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl"
                 >
                   <Glasses size={18} /> Sanctuary VR
                 </button>
              </div>

              <button 
                onClick={() => {
                   window.location.href = `/${item.type.includes('sonic') ? 'sonic-sanctuary' : item.type}`;
                }}
                className="w-full py-4 bg-[#5A5A40] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#4A4A30] transition-all shadow-xl"
              >
                Go to {TYPE_CONFIG[item.type].label} Sanctuary <ExternalLink size={18} />
              </button>
            </div>

            <div className="space-y-8">
               <div className="space-y-4">
                 <h4 className="text-sm font-bold uppercase tracking-widest text-[#5A5A40] border-b border-[#F5F5F0] pb-2">Artifact Analytics</h4>
                 <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar space-y-6">
                    {item.type === 'habitat' && item.data.plan ? (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-6 bg-amber-50/50 rounded-3xl border border-amber-100 flex flex-col gap-4">
                          <div className="flex items-center gap-2 text-amber-800 font-bold uppercase tracking-widest text-[10px]">
                            <Sparkles size={14} /> Color Palette
                          </div>
                          <div className="flex gap-4">
                            {item.data.plan.colors?.map((c: string, idx: number) => (
                              <div key={idx} className="flex flex-col items-center gap-2">
                                <div 
                                  className="w-12 h-12 rounded-2xl shadow-inner border border-white" 
                                  style={{ backgroundColor: c }}
                                />
                                <span className="text-[9px] font-mono opacity-60 uppercase">{c}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                            <h5 className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Home size={14} /> Sacred Decor
                            </h5>
                            <ul className="space-y-2">
                              {item.data.plan.decor?.map((d: string, idx: number) => (
                                <li key={idx} className="text-xs text-[#2D3436] flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                  {d}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-6 bg-sky-50/50 rounded-3xl border border-sky-100">
                            <h5 className="text-[10px] font-bold text-sky-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Wind size={14} /> Sensory Sync
                            </h5>
                            <ul className="space-y-2">
                              {item.data.plan.sensory?.map((s: string, idx: number) => (
                                <li key={idx} className="text-xs text-[#2D3436] flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-sky-400 rounded-full" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="p-6 bg-white rounded-3xl border border-[#D1D1C1]/50 shadow-sm border-l-4 border-l-[#5A5A40]">
                          <h5 className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest mb-2">Integrated Environment Wisdom</h5>
                          <p className="text-sm italic font-serif text-[#2D3436] leading-relaxed">
                            {item.data.plan.integratedWisdom}
                          </p>
                        </div>

                        {item.data.visionAnalysis && (
                          <div className="p-6 bg-[#F5F5F0] rounded-3xl border border-[#D1D1C1] space-y-4">
                            <h5 className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest flex items-center gap-2">
                              <Eye size={14} /> Sacred Vision Overlay
                            </h5>
                            <p className="text-xs text-[#2D3436] opacity-70 italic leading-relaxed">
                              {item.data.visionAnalysis.overlayAnalysis}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : item.type === 'prescription' ? (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                          <div className="flex items-center gap-2 text-indigo-700 font-bold uppercase tracking-widest text-[10px] mb-4">
                            <Activity size={14} /> {item.data.dosha} Balance Summary
                          </div>
                          <p className="text-indigo-900/70 italic text-sm leading-relaxed">
                            {item.data.recommendations?.summary}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                           <div className="p-6 bg-sky-50 rounded-3xl border border-sky-100">
                             <h5 className="text-[10px] font-bold text-sky-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                               <Wind size={14} /> Lifestyle
                             </h5>
                             <ul className="space-y-2">
                               {item.data.recommendations?.lifestyle?.map((l: string, idx: number) => (
                                 <li key={idx} className="text-xs text-sky-900/60 flex items-start gap-2">
                                   <span className="shrink-0 text-sky-400">•</span> {l}
                                 </li>
                               ))}
                             </ul>
                           </div>

                           <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                             <h5 className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                               <Utensils size={14} /> Nourishment
                             </h5>
                             <ul className="space-y-2">
                               {item.data.recommendations?.dietary?.map((d: string, idx: number) => (
                                 <li key={idx} className="text-xs text-amber-900/60 flex items-start gap-2">
                                   <span className="shrink-0 text-amber-400">•</span> {d}
                                 </li>
                               ))}
                             </ul>
                           </div>

                           <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
                             <h5 className="text-[10px] font-bold text-rose-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                               <Sparkles size={14} /> Rasayana
                             </h5>
                             <ul className="space-y-2">
                               {item.data.recommendations?.rasayana?.map((r: string, idx: number) => (
                                 <li key={idx} className="text-xs text-rose-900/60 flex items-start gap-2">
                                   <span className="shrink-0 text-rose-400">•</span> {r}
                                 </li>
                               ))}
                             </ul>
                           </div>
                        </div>

                        <div className="p-6 bg-white rounded-3xl border border-[#D1D1C1]/50 shadow-sm border-l-4 border-l-[#5A5A40]">
                          <h5 className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest mb-2">Modern Perspective</h5>
                          <p className="text-sm italic font-serif text-[#2D3436] leading-relaxed">
                            {item.data.recommendations?.modernPerspective}
                          </p>
                        </div>
                      </div>
                    ) : item.type === 'journal' ? (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-6 bg-white rounded-3xl border border-[#D1D1C1]/50 shadow-sm border-l-4 border-l-[#5A5A40]">
                          <h5 className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest mb-2 flex items-center gap-2">
                             <Sparkles size={14} className="text-amber-500" /> Neural Summary
                          </h5>
                          <p className="text-sm italic font-serif text-[#2D3436] leading-relaxed">
                            {item.data.summary || "This reflection was archived before the Neural Engine was integrated. Future reflections will include deep analysis."}
                          </p>
                        </div>

                        {item.data.emotions && item.data.emotions.length > 0 && (
                          <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100">
                            <h5 className="text-[10px] font-bold text-rose-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <Heart size={14} /> Identified Rhythms
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {item.data.emotions.map((emotion: string, idx: number) => (
                                <span key={idx} className="px-3 py-1 bg-white border border-rose-100 rounded-lg text-[10px] uppercase font-bold text-rose-600">
                                  {emotion}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="p-6 bg-[#F5F5F0] rounded-3xl border border-[#D1D1C1] space-y-4">
                           <h5 className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest flex items-center gap-2">
                              <BookOpen size={14} /> Full Reflection
                           </h5>
                           <p className="text-sm text-[#2D3436] opacity-70 italic leading-relaxed font-serif whitespace-pre-wrap">
                             {item.data.content}
                           </p>
                        </div>
                      </div>
                    ) : (
                      <pre className="p-6 bg-gray-50 rounded-2xl text-[10px] sm:text-xs font-mono text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-100 italic">
                        {JSON.stringify(item.data, null, 2)}
                      </pre>
                    )}
                 </div>
               </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

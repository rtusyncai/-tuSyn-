import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, Info, Gem, Hammer, ScrollText, Share2, Save, Trash2, Check, Copy, ShieldCheck, Activity, Shirt, Sprout, ShoppingBag, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { geminiService } from '../services/geminiService';
import { db, auth, handleFirestoreError, OperationType, trackEngagement } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { vaultService } from '../services/vaultService';
import { useToast } from '../hooks/useToast';

export const AyurWearPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [dosha, setDosha] = useState('Vata');
  const [category, setCategory] = useState<'ornament' | 'clothing'>('ornament');
  const [intention, setIntention] = useState('');
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [design, setDesign] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState<any[]>([]);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDosha, setFilterDosha] = useState('All');
  const [customSymbolism, setCustomSymbolism] = useState('');
  const [customModernPerspective, setCustomModernPerspective] = useState('');
  const [creationDate, setCreationDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!user) return;

    const path = `profiles/${user.uid}/ayurwear`;
    const q = query(
      collection(db, path)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const designs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedDesigns(designs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    const fetchProfile = async () => {
      const docRef = doc(db, 'profiles', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        if (data.dosha) setDosha(data.dosha);
      }
    };
    fetchProfile();

    return () => unsubscribe();
  }, [user]);

  const handleGenerate = async () => {
    if (!intention) return;
    setLoading(true);
    setDesign(null);
    setSaveStatus('idle');
    try {
      let finalBase64 = fileBase64;
      
      // If URL is provided but no file uploaded, try to fetch it
      if (!finalBase64 && imageUrl) {
        try {
          const res = await fetch(imageUrl);
          const blob = await res.blob();
          finalBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.error("Failed to fetch image from URL:", e);
        }
      }

      const result = await geminiService.generateAyurWearDesign(category, dosha, intention, profile?.healthData, finalBase64 || undefined, refinementPrompt);
      const designData = {
        ...result,
        dosha,
        intention,
        refinementPrompt,
        category,
        imageSeed: `${dosha}-${intention}-${category}-${refinementPrompt.length}`,
        contextImage: finalBase64
      };
      setDesign(designData);
      setCustomSymbolism(result.symbolism || '');
      setCustomModernPerspective(result.modernPerspective || '');
      trackEngagement('ayurwear');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileBase64((reader.result as string).split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser || !design) return;
    setSaving(true);
    try {
      const designPayload = {
        ...design,
        symbolism: customSymbolism,
        modernPerspective: customModernPerspective,
        creationDate,
        uid: auth.currentUser.uid,
        createdAt: serverTimestamp()
      };

      // 1. Save to unified Sacred Vault first to get the ID
      const vaultId = await vaultService.saveItem(
        auth.currentUser.uid,
        design.category === 'clothing' ? 'ayurwear_clothing' : 'ayurwear',
        design.name,
        designPayload,
        `https://picsum.photos/seed/${design.imageSeed}/800/800`,
        `Sacred ${design.dosha} ${design.category} for ${design.intention}`
      );

      // 2. Save to local subcollection including the vaultId
      const docRef = await addDoc(collection(db, `profiles/${auth.currentUser.uid}/ayurwear`), {
        ...designPayload,
        vaultId
      });
      
      setDesign({ 
        ...design, 
        id: docRef.id, 
        uid: auth.currentUser.uid,
        symbolism: customSymbolism,
        modernPerspective: customModernPerspective
      });
      setSaveStatus('saved');
      toast("Sacred Ornament stored in your Vault!", "success");
    } catch (error) {
      console.error("Error saving design:", error);
      toast("Failed to save design.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, vaultId?: string) => {
    if (!auth.currentUser) return;
    try {
      // 1. Delete from local subcollection
      await deleteDoc(doc(db, `profiles/${auth.currentUser.uid}/ayurwear`, id));
      
      // 2. Delete from vault if linked
      if (vaultId) {
        await vaultService.deleteItem(vaultId);
      }
      toast("Design removed from your collection and vault.", "success");
    } catch (error) {
      console.error("Error deleting design:", error);
      toast("Failed to completely remove design.", "error");
    }
  };

  const handleShare = () => {
    if (!design) return;
    
    const isSaved = !!design.id;
    const shareText = `Check out my sacred Ayurvedic ornament design for ${design.dosha} energy: ${design.name}! Created on ṚtuSyn.`;
    const shareUrl = isSaved 
      ? `${window.location.origin}/ayurwear/share/${design.uid}/${design.id}`
      : window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: 'My AyurWear Design',
        text: shareText,
        url: shareUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-12 pb-20">
      <div className="text-center space-y-2 sm:space-y-4 px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#5A5A40]">AyurWear manifestations</h2>
        <p className="text-base sm:text-xl text-[#2D3436] opacity-70 italic">Bio-harmonized apparel and ornaments, crafted for your unique resonance.</p>
      </div>

      {/* Signature Collection Section */}
      <section className="px-4 sm:px-0">
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-[#5A5A40]">Signature manifestations</h3>
            <p className="text-xs sm:text-sm text-[#2D3436] opacity-60 italic">Artisan-forged masterpieces of Vedic engineering.</p>
          </div>
          <Link to="/marketplace" className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest hover:underline flex items-center gap-2">
            View Marketplace <ShoppingBag size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              id: 'tridosha-band',
              name: 'Tridosha Band',
              image: 'https://images.unsplash.com/photo-1515562141207-7a18b5ce3377?q=80&w=1000',
              description: 'Triple-metal bioregulator for total doshic equilibrium.',
              icon: <Activity size={18} />,
              color: 'bg-sky-50'
            },
            {
              id: 'calm-chain',
              name: 'Calm Chain',
              image: 'https://images.unsplash.com/photo-1596944209590-456070a9a564?q=80&w=1000',
              description: 'Lunar pearl frequency for Pitta digital respite.',
              icon: <Sparkles size={18} />,
              color: 'bg-rose-50'
            },
            {
              id: 'ritual-ring',
              name: 'Ritual Ring',
              image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1000',
              description: 'Hematite earth-anchor for focus and willpower.',
              icon: <Hammer size={18} />,
              color: 'bg-amber-50'
            }
          ].map((product) => (
            <Link 
              key={product.id}
              to={`/ayurwear/product/${product.id}`}
              className="group bg-white rounded-[40px] overflow-hidden border border-[#D1D1C1]/30 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col"
            >
              <div className="aspect-square relative overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all duration-500" />
                <div className="absolute top-6 left-6 p-3 bg-white/80 backdrop-blur-md rounded-2xl text-[#5A5A40] shadow-lg">
                  {product.icon}
                </div>
              </div>
              <div className="p-8 sm:p-10 space-y-4 flex-1 flex flex-col">
                <div className="space-y-1">
                  <h4 className="text-2xl font-serif font-bold text-[#5A5A40]">{product.name}</h4>
                  <p className="text-sm text-[#2D3436] opacity-60 italic leading-relaxed">{product.description}</p>
                </div>
                <div className="pt-4 mt-auto">
                  <div className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest border-b border-[#5A5A40]/20 pb-2 inline-block group-hover:border-[#5A5A40] transition-all">
                    Explore Manifestation
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Manifestation Generator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 px-4 sm:px-0">
        {/* Input Form */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#D1D1C1] shadow-xl space-y-6 sm:space-y-8 h-fit">
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-xs sm:text-sm font-bold text-[#5A5A40] uppercase tracking-widest">Select Category</label>
              <div className="flex bg-[#F5F5F0] p-1 rounded-2xl">
                <button
                  onClick={() => setCategory('ornament')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all",
                    category === 'ornament' ? "bg-white text-[#5A5A40] shadow-md" : "text-[#5A5A40]/40 hover:text-[#5A5A40]"
                  )}
                >
                  <Gem size={16} /> Ornaments
                </button>
                <button
                  onClick={() => setCategory('clothing')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all",
                    category === 'clothing' ? "bg-white text-[#5A5A40] shadow-md" : "text-[#5A5A40]/40 hover:text-[#5A5A40]"
                  )}
                >
                  <Shirt size={16} /> Clothing
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs sm:text-sm font-bold text-[#5A5A40] uppercase tracking-widest">Select Your Dominant Dosha</label>
              <div className="flex bg-[#E8E8E0] p-1 rounded-2xl overflow-x-auto sm:overflow-visible no-scrollbar">
                {['Vata', 'Pitta', 'Kapha'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDosha(d)}
                    className={cn(
                      "flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                      dosha === d ? "bg-[#5A5A40] text-white shadow-lg" : "text-[#5A5A40] hover:bg-[#F5F5F0]"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-[10px] sm:text-xs text-[#5A5A40] opacity-60 italic">
                {dosha === 'Vata' && "Vata ornaments focus on grounding, warmth, and stability."}
                {dosha === 'Pitta' && "Pitta ornaments focus on cooling, calming, and focus."}
                {dosha === 'Kapha' && "Kapha ornaments focus on stimulation, warmth, and movement."}
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-bold text-[#5A5A40] uppercase tracking-widest">Inspiration Image</label>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="URL..."
                    className="w-full p-3 sm:p-4 rounded-xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 text-xs sm:text-sm"
                  />
                  <div className="flex items-center gap-2 sm:gap-4">
                    <label className="flex-1 cursor-pointer group">
                      <div className="w-full p-3 sm:p-4 rounded-xl border-2 border-dashed border-[#D1D1C1] group-hover:border-[#5A5A40] transition-colors flex items-center justify-center gap-2 text-[#5A5A40]/60 group-hover:text-[#5A5A40]">
                        <Share2 size={16} />
                        <span className="text-xs sm:text-sm font-medium">{fileBase64 ? 'Uploaded' : 'Upload'}</span>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                    {(fileBase64 || imageUrl) && (
                      <button 
                        onClick={() => { setFileBase64(null); setImageUrl(''); }}
                        className="p-3 sm:p-4 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-[#5A5A40] uppercase tracking-widest">Creation Date</label>
                  <div className="relative">
                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40] opacity-40" size={18} />
                    <input
                      type="date"
                      value={creationDate}
                      onChange={(e) => setCreationDate(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-[#5A5A40] uppercase tracking-widest">Your Intention</label>
                  <input
                    type="text"
                    value={intention}
                    onChange={(e) => setIntention(e.target.value)}
                    placeholder="e.g., Inner Peace, Focus"
                    className="w-full p-3 sm:p-4 rounded-xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs sm:text-sm font-bold text-[#5A5A40] uppercase tracking-widest">Refinement Details</label>
                    <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Optional</span>
                  </div>
                  <textarea
                    value={refinementPrompt}
                    onChange={(e) => setRefinementPrompt(e.target.value)}
                    placeholder="e.g., 'Minimalist aesthetic', 'Include silver accents', 'Focus on wrist pressure points'..."
                    className="w-full p-3 sm:p-4 rounded-xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 text-sm h-24 resize-none italic"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!intention || loading}
            className="w-full bg-[#5A5A40] text-white py-4 sm:py-5 rounded-2xl font-bold hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Weaving Your Sacred Attire...
              </>
            ) : (
              <>
                {category === 'clothing' ? <Shirt size={18} /> : <Hammer size={18} />}
                Design {category === 'clothing' ? 'Apparel' : 'Ornament'}
              </>
            )}
          </button>

          {profile?.healthData && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <ShieldCheck size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Health-Aware Design Active</p>
                <p className="text-[9px] text-emerald-600 opacity-80">Integrating your allergies and health goals for a safe, personalized design.</p>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-8">
          {design ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              <div className="aspect-square rounded-3xl overflow-hidden border border-[#D1D1C1] shadow-2xl relative group">
                <img 
                  src={`https://picsum.photos/seed/${design.imageSeed}/1000/1000`} 
                  alt="Ornament Design" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
                  <div className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg backdrop-blur-md",
                    design.dosha === 'Vata' ? "bg-sky-100/80 text-sky-900" :
                    design.dosha === 'Pitta' ? "bg-amber-100/80 text-amber-900" :
                    "bg-emerald-100/80 text-emerald-900"
                  )}>
                    {design.dosha} Energy
                  </div>
                  {design.contextImage && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-lg">
                      <img src={`data:image/jpeg;base64,${design.contextImage}`} alt="Context" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-8 text-white space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-bold">{design.name}</h3>
                    <p className="text-sm opacity-80 italic">{design.description}</p>
                  </div>
                  {design.modernPerspective && (
                    <div className="pt-4 border-t border-white/20">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#A8D5BA]">
                        <Activity size={14} /> Modern Scientific Perspective
                      </h4>
                      <p className="text-[11px] opacity-70 italic leading-relaxed">{customModernPerspective || design.modernPerspective}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Editable Sacred Details */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D1D1C1] shadow-lg space-y-6">
                <div className="flex items-center gap-3 text-[#5A5A40]">
                  <ScrollText size={20} />
                  <h4 className="font-bold uppercase tracking-widest text-xs">Personalize Sacred Details</h4>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#5A5A40]/60 uppercase tracking-widest">Specific Symbolism & Wisdom</label>
                    <textarea
                      value={customSymbolism}
                      onChange={(e) => setCustomSymbolism(e.target.value)}
                      placeholder="Add specific symbolism or spiritual meaning..."
                      className="w-full h-32 p-4 bg-[#F5F5F0] border border-[#D1D1C1]/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 text-sm italic resize-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#5A5A40]/60 uppercase tracking-widest">Modern Functional Perspective</label>
                    <textarea
                      value={customModernPerspective}
                      onChange={(e) => setCustomModernPerspective(e.target.value)}
                      placeholder="Add modern functional or physiological perspectives..."
                      className="w-full h-24 p-4 bg-[#F5F5F0] border border-[#D1D1C1]/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 text-sm italic resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={!auth.currentUser || saving || saveStatus === 'saved'}
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-[#5A5A40] border border-[#D1D1C1] py-4 rounded-2xl font-bold hover:bg-[#F5F5F0] transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : saveStatus === 'saved' ? <Check size={20} /> : <Save size={20} />}
                  {saveStatus === 'saved' ? 'Saved' : 'Save Design'}
                </button>
                <div className="flex-1 relative group">
                  <button
                    onClick={handleShare}
                    className="w-full flex items-center justify-center gap-2 bg-[#5A5A40] text-white py-4 rounded-2xl font-bold hover:bg-[#4A4A30] transition-all"
                  >
                    {shareStatus === 'copied' ? <Copy size={20} /> : <Share2 size={20} />}
                    {shareStatus === 'copied' ? 'Link Copied' : 'Share Design'}
                  </button>
                  {!design.id && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      Save first to get a unique shareable link
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="p-8 bg-white rounded-3xl border border-[#D1D1C1] space-y-6">
                  <div className="flex items-center gap-3 text-[#5A5A40]">
                    <Gem size={24} />
                    <h4 className="font-bold uppercase tracking-widest text-sm">Sacred Artifact Details</h4>
                  </div>
                  <div className="space-y-4">
                    {design.materials.map((mat: any, i: number) => (
                      <div key={i} className="p-6 rounded-2xl bg-[#F5F5F0] border border-[#D1D1C1] space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">{mat.type}</div>
                            <div className="font-bold text-[#5A5A40] text-lg">{mat.name}</div>
                          </div>
                          <div className="text-[10px] font-bold px-2 py-1 bg-[#5A5A40]/10 text-[#5A5A40] rounded-md uppercase tracking-widest">
                            {mat.property}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-sm italic opacity-70 leading-relaxed border-t border-[#D1D1C1] pt-3">
                            {mat.energeticDetail || mat.modernBenefit}
                          </p>
                          {mat.botanyTag && (
                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                              <h5 className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 uppercase tracking-widest mb-1">
                                <Sprout size={10} /> Botany & curious features
                              </h5>
                              <p className="text-[10px] text-emerald-900/60 leading-tight italic">{mat.botanyTag}</p>
                            </div>
                          )}
                          {!mat.botanyTag && mat.modernBenefit && mat.energeticDetail && (
                            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                              <h5 className="flex items-center gap-1 text-[9px] font-bold text-indigo-700 uppercase tracking-widest mb-1">
                                <Activity size={10} /> Clinical Benefit
                              </h5>
                              <p className="text-[10px] text-indigo-900/60 leading-tight italic">{mat.modernBenefit}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 bg-[#E8E8E0] rounded-3xl border border-[#D1D1C1] space-y-4">
                  <div className="flex items-center gap-3 text-[#5A5A40]">
                    <ScrollText size={24} />
                    <h4 className="font-bold uppercase tracking-widest text-sm">Symbolism & Wisdom</h4>
                  </div>
                  <p className="text-sm italic leading-relaxed text-[#2D3436] opacity-80">{customSymbolism || design.symbolism}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-[#D1D1C1] rounded-3xl bg-white/50 italic opacity-60">
              <Info size={48} className="mb-4" />
              <p>Select your dosha and state an intention to receive a personalized Ayurvedic ornament design.</p>
              {!auth.currentUser && (
                <p className="mt-4 text-xs font-bold text-rose-600 uppercase tracking-widest">Sign in to save your designs</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Saved Designs Section */}
      {savedDesigns.length > 0 && (
        <section className="space-y-8 pt-12 border-t border-[#D1D1C1]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-[#5A5A40]">Your Sacred Collection</h3>
              <p className="text-xs text-[#5A5A40]/40 font-medium uppercase tracking-widest">{savedDesigns.length} Artifacts Discovered</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40]/40" size={16} />
                <input 
                  type="text"
                  placeholder="Search materials, benefits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#D1D1C1] rounded-2xl text-sm focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-2 bg-[#F5F5F0] p-1.5 rounded-2xl border border-[#D1D1C1] w-full sm:w-auto overflow-x-auto">
                {['All', 'Vata', 'Pitta', 'Kapha'].map(d => (
                  <button
                    key={d}
                    onClick={() => setFilterDosha(d)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                      filterDosha === d ? "bg-[#5A5A40] text-white shadow-md" : "text-[#5A5A40]/50 hover:bg-[#D1D1C1]/20"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {savedDesigns
                .filter(d => {
                  const matchesDosha = filterDosha === 'All' || d.dosha === filterDosha;
                  const matchesSearch = !searchQuery || 
                    d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    d.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    d.materials?.some((m: any) => 
                      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      m.energeticDetail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      m.modernBenefit?.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                  return matchesDosha && matchesSearch;
                })
                .map((saved) => (
                <motion.div
                  key={saved.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-3xl border border-[#D1D1C1] overflow-hidden shadow-sm hover:shadow-xl transition-all group"
                >
                  <div className="h-48 overflow-hidden relative">
                    <img 
                      src={`https://picsum.photos/seed/${saved.imageSeed}/800/600`} 
                      alt={saved.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md backdrop-blur-sm",
                        saved.dosha === 'Vata' ? "bg-sky-100/80 text-sky-900" :
                        saved.dosha === 'Pitta' ? "bg-amber-100/80 text-amber-900" :
                        "bg-emerald-100/80 text-emerald-900"
                      )}>
                        {saved.dosha}
                      </div>
                      <button 
                        onClick={() => handleDelete(saved.id, saved.vaultId)}
                        className="p-2 bg-white/80 hover:bg-rose-50 text-rose-600 rounded-full shadow-md transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-[#5A5A40]">{saved.name}</h4>
                      {saved.creationDate && (
                        <span className="text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">{saved.creationDate}</span>
                      )}
                    </div>
                    <p className="text-xs text-[#2D3436] opacity-60 italic line-clamp-2">{saved.description}</p>
                    <button 
                      onClick={() => {
                        setDesign(saved);
                        setCustomSymbolism(saved.symbolism || '');
                        setCustomModernPerspective(saved.modernPerspective || '');
                        if (saved.creationDate) setCreationDate(saved.creationDate);
                        setSaveStatus('saved');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest pt-4 hover:underline"
                    >
                      View Details
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}
    </div>
  );
};

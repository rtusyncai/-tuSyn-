import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { Gem, ScrollText, ArrowLeft, Loader2, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export const ShareDesignPage = () => {
  const { uid, designId } = useParams<{ uid: string; designId: string }>();
  const [design, setDesign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDesign = async () => {
      if (!uid || !designId) return;
      try {
        const docRef = doc(db, `profiles/${uid}/ayurwear`, designId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDesign(docSnap.data());
        } else {
          setError("Design not found.");
        }
      } catch (err) {
        console.error("Error fetching design:", err);
        setError("Unable to load design. It may be private or deleted.");
      } finally {
        setLoading(false);
      }
    };

    fetchDesign();
  }, [uid, designId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="animate-spin text-[#5A5A40]" size={48} />
        <p className="text-[#5A5A40] font-medium italic">Unveiling the sacred design...</p>
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center px-4">
        <Info size={64} className="text-[#D1D1C1]" />
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[#5A5A40]">Sacred Design Unavailable</h2>
          <p className="text-[#2D3436] opacity-70 italic max-w-md">{error || "This design could not be found."}</p>
        </div>
        <Link to="/ayurwear" className="text-[#5A5A40] font-bold uppercase tracking-widest hover:underline flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Designer
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="flex items-center justify-between">
        <Link to="/ayurwear" className="text-[#5A5A40] font-bold uppercase tracking-widest hover:underline flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Designer
        </Link>
        <div className="text-xs font-bold uppercase tracking-widest opacity-40">Shared via ṚtuSyn</div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-12"
      >
        <div className="aspect-square rounded-3xl overflow-hidden border border-[#D1D1C1] shadow-2xl relative group">
          <img 
            src={`https://picsum.photos/seed/${design.imageSeed}/1000/1000`} 
            alt={design.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <div className="absolute top-6 left-6 z-10">
            <div className={cn(
              "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg backdrop-blur-md",
              design.dosha === 'Vata' ? "bg-sky-100/80 text-sky-900" :
              design.dosha === 'Pitta' ? "bg-amber-100/80 text-amber-900" :
              "bg-emerald-100/80 text-emerald-900"
            )}>
              {design.dosha} Energy
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8 text-white">
            <h3 className="text-3xl font-bold mb-2">{design.name}</h3>
            <p className="text-sm opacity-80 italic">{design.description}</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="p-8 bg-white rounded-3xl border border-[#D1D1C1] space-y-6 shadow-sm">
            <div className="flex items-center gap-3 text-[#5A5A40]">
              <Gem size={24} />
              <h4 className="font-bold uppercase tracking-widest text-sm">Sacred Materials</h4>
            </div>
            <div className="space-y-4">
              {design.materials.map((mat: any, i: number) => (
                <div key={i} className="p-4 rounded-2xl bg-[#F5F5F0] border border-[#D1D1C1] space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">{mat.type}</div>
                      <div className="font-bold text-[#5A5A40] text-base">{mat.name}</div>
                    </div>
                    <div className="text-[10px] font-bold px-2 py-1 bg-[#5A5A40]/10 text-[#5A5A40] rounded-md uppercase tracking-widest">
                      {mat.property}
                    </div>
                  </div>
                  <p className="text-xs italic opacity-70 leading-relaxed">
                    {mat.energeticDetail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 bg-[#E8E8E0] rounded-3xl border border-[#D1D1C1] space-y-4 shadow-sm">
            <div className="flex items-center gap-3 text-[#5A5A40]">
              <ScrollText size={24} />
              <h4 className="font-bold uppercase tracking-widest text-sm">Symbolism & Wisdom</h4>
            </div>
            <p className="text-sm italic leading-relaxed text-[#2D3436] opacity-80">{design.symbolism}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

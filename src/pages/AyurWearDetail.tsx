import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Gem, 
  Hammer, 
  ScrollText, 
  ShoppingBag, 
  Heart, 
  ArrowLeft, 
  CheckCircle2, 
  Zap, 
  ShieldCheck,
  Package,
  Clock,
  MapPin
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/useToast';
import { useCart } from '../hooks/useCart';
import { trackEngagement } from '../lib/firebase';

interface Material {
  name: string;
  type: string;
  description: string;
}

interface ProductData {
  id: string;
  name: string;
  description: string;
  ayurvedicProperties: string;
  symbolism: string;
  materials: Material[];
  artisanStory: {
    name: string;
    location: string;
    story: string;
  };
  image: string;
  price: number;
}

const PRODUCTS: Record<string, ProductData> = {
  'tridosha-band': {
    id: 'tridosha-band',
    name: 'Tridosha Band',
    description: 'A circular harmony manifest, the Tridosha Band is designed to stabilize the subtle fluctuations of Vata, Pitta, and Kapha simultaneously. Its interwoven lattice structure reflects the complex dance of the five elements within your physical vessel.',
    ayurvedicProperties: 'This ornament acts as a bioregulator, balancing the electrical frequency of the nervous system. It primarily targets the sub-doshas of Vata (Prana) and Pitta (Sadhaka), fostering mental clarity and structural integrity.',
    symbolism: 'The Triple Infinity — representing the eternal equilibrium of existence and the non-dual nature of the three Doshas.',
    materials: [
      { name: '24k Gold Sheet', type: 'Solar', description: 'Used to stabilize Pitta and enhance the Tejas (inner radiance).' },
      { name: 'Pure Silver', type: 'Lunar', description: 'Provides cooling properties and balances Kapha fluidity.' },
      { name: 'High-Conductivity Copper', type: 'Vitality', description: 'Supports Vata grounding and improves circulation.' }
    ],
    artisanStory: {
      name: 'Master Aryan',
      location: 'Varanasi, India',
      story: 'Crafted by the Vedic smiths of Varanasi for seven generations. Master Aryan forges each band under rare planetary alignments, using a hand-hammering process to align the crystalline structure of the metals with Vedic resonance.'
    },
    image: 'https://images.unsplash.com/photo-1515562141207-7a18b5ce3377?q=80&w=1000',
    price: 249
  },
  'calm-chain': {
    id: 'calm-chain',
    name: 'Calm Chain',
    description: 'Designed for the modern traveler seeking respite from the "fire" of digital burnout. The Calm Chain rests against the heart and throat chakras, projecting a cooling frequency that pacifies Pitta and grounds the lightness of Vata.',
    ayurvedicProperties: 'Specifically formulated for Pitta and Vata reduction. Reduces systemic inflammation indicators and helps regulate the HPA axis response to stress.',
    symbolism: 'The Flowing River — symbolizing the effortless passage of Prana (life force) through the body\'s subtle channels.',
    materials: [
      { name: 'Freshwater Pearls', type: 'Soma', description: 'Lustrous AA-Grade pearls that resonate with the Moon\'s cooling energy.' },
      { name: 'Blue Moonstone', type: 'Balance', description: 'Enhances intuitive awareness and emotional regulation.' },
      { name: 'Sandalwood Spacers', type: 'Grounding', description: 'Hand-polished wood that provides a calming, steadying scent during meditation.' }
    ],
    artisanStory: {
      name: 'Savitri',
      location: 'Rishikesh, India',
      story: 'Savitri, a master weaver in the foothills of the Himalayas, knots each chain using organic silk thread. She recites the Shanti Mantra over every bead, infusing the piece with a tangible sense of stillness.'
    },
    image: 'https://images.unsplash.com/photo-1596944209590-456070a9a564?q=80&w=1000',
    price: 189
  },
  'ritual-ring': {
    id: 'ritual-ring',
    name: 'Ritual Ring',
    description: 'A heavy, grounded manifestation of the Earth element. The Ritual Ring is intended for the index or thumb to enhance focus and willpower. Its surface is engraved with fractal patterns found in the root of the Ashwagandha plant.',
    ayurvedicProperties: 'Focus and grounding. Enhances the connection with the Earth element (Prithvi), providing stability to those with high Vata or scattered mental energy.',
    symbolism: 'The Sacred Mandala — representing the return to center and the crystallization of conscious intention.',
    materials: [
      { name: 'Forged Recycled Brass', type: 'Earth', description: 'Provides weight and solidity to ground the physical presence.' },
      { name: 'Raw Black Hematite', type: 'Earthing', description: 'A protective stone used for deep connection with the planet\'s magnetic field.' },
      { name: 'Organic Beeswax', type: 'Protection', description: 'Used to seal the ring, preserving the energetic frequency of the metals.' }
    ],
    artisanStory: {
      name: 'Tenzin',
      location: 'High Altars, Himalayas',
      story: 'Bhutanese metalworker Tenzin forges these rings in high-altitude altars. The metal is tempered in ritualistically purified mountain spring water to seal the grounding properties and ensure longevity.'
    },
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1000',
    price: 159
  }
};

export const AyurWearDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const product = id ? PRODUCTS[id] : null;
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (product) {
      trackEngagement('ayurwear');
    }
    window.scrollTo(0, 0);
  }, [product]);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold text-[#5A5A40]">Manifestation Not Found</h2>
        <Link to="/ayurwear" className="text-[#5A5A40] underline font-bold">Return to Sacred Collection</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      description: product.description
    });
    toast(`${product.name} added to your Sacred Cart!`, "success");
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast(isWishlisted ? "Removed from Rituals" : "Added to Rituals", isWishlisted ? "info" : "success");
  };

  return (
    <div className="space-y-12 pb-20">
      <Link to="/ayurwear" className="inline-flex items-center gap-2 text-[#5A5A40] hover:translate-x-[-4px] transition-transform font-bold text-sm uppercase tracking-widest">
        <ArrowLeft size={16} /> Back to manifestations
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        {/* Gallery */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl border border-[#D1D1C1]/30 relative group">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            <div className="absolute top-6 right-6">
              <button 
                onClick={toggleWishlist}
                className={cn(
                  "p-4 rounded-full backdrop-blur-md transition-all shadow-lg",
                  isWishlisted ? "bg-rose-500 text-white" : "bg-white/20 text-white border border-white/40 hover:bg-white/40"
                )}
              >
                <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Narrative */}
        <div className="space-y-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[#A8D5BA] font-bold tracking-widest uppercase text-xs">
              <Sparkles size={16} /> Signature Collection
            </div>
            <h1 className="text-5xl lg:text-6xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA] leading-tight">
              {product.name}
            </h1>
            <div className="text-3xl font-serif text-[#5A5A40] dark:text-[#A8D5BA] opacity-60">
              ${product.price}
            </div>
          </div>

          <div className="prose prose-stone dark:prose-invert">
            <p className="text-xl text-[#2D3436] dark:text-[#E8E8E0]/70 italic leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 bg-white dark:bg-[#252520] border border-[#D1D1C1] dark:border-[#3D3D35] rounded-3xl space-y-2">
              <div className="flex items-center gap-2 text-[#5A5A40] dark:text-[#A8D5BA]">
                <ShieldCheck size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Biological Resonance</span>
              </div>
              <p className="text-sm font-serif italic opacity-70">Customized for Rhythmic Harmony</p>
            </div>
            <div className="p-6 bg-white dark:bg-[#252520] border border-[#D1D1C1] dark:border-[#3D3D35] rounded-3xl space-y-2">
              <div className="flex items-center gap-2 text-[#5A5A40] dark:text-[#A8D5BA]">
                <Hammer size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Artisan Forged</span>
              </div>
              <p className="text-sm font-serif italic opacity-70">Hand-finished Ritual Quality</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button 
              onClick={handleAddToCart}
              className="flex-1 bg-[#5A5A40] dark:bg-[#A8D5BA] text-white dark:text-[#1A1A15] py-5 rounded-2xl font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              <ShoppingBag size={20} /> Add to Cart
            </button>
            <button 
              onClick={toggleWishlist}
              className="px-10 py-5 rounded-2xl border-2 border-[#5A5A40] dark:border-[#A8D5BA] text-[#5A5A40] dark:text-[#A8D5BA] font-bold hover:bg-[#5A5A40]/10 transition-all"
            >
              Add to Rituals
            </button>
          </div>

          <div className="pt-10 space-y-8 border-t border-[#D1D1C1]/30">
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#5A5A40] dark:text-[#A8D5BA]">
                <Package size={18} /> Manifestation Details
              </h3>
              <ul className="grid grid-cols-1 gap-3">
                <li className="flex items-center gap-3 text-sm text-[#2D3436] dark:text-[#E8E8E0]/70">
                  <CheckCircle2 size={14} className="text-emerald-500" /> Complimentary Vedic purification ritual included
                </li>
                <li className="flex items-center gap-3 text-sm text-[#2D3436] dark:text-[#E8E8E0]/70">
                  <CheckCircle2 size={14} className="text-emerald-500" /> Sustainably sourced ritual packaging
                </li>
                <li className="flex items-center gap-3 text-sm text-[#2D3436] dark:text-[#E8E8E0]/70">
                  <CheckCircle2 size={14} className="text-emerald-500" /> 108-day structural guarantee
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Deep Dive Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20">
        {/* Ayurvedic Properties */}
        <div className="bg-[#F5F5F0] dark:bg-[#1A1A15] p-10 rounded-[40px] border border-[#D1D1C1]/30 space-y-6">
          <div className="p-4 bg-white dark:bg-[#252520] rounded-2xl w-fit shadow-sm">
            <Zap size={24} className="text-[#5A5A40] dark:text-[#A8D5BA]" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">Ayurvedic Properties</h3>
          <p className="text-lg text-[#2D3436] dark:text-[#E8E8E0]/70 font-serif italic leading-relaxed">
            {product.ayurvedicProperties}
          </p>
        </div>

        {/* Symbolism */}
        <div className="bg-[#F5F5F0] dark:bg-[#1A1A15] p-10 rounded-[40px] border border-[#D1D1C1]/30 space-y-6">
          <div className="p-4 bg-white dark:bg-[#252520] rounded-2xl w-fit shadow-sm">
            <ScrollText size={24} className="text-[#5A5A40] dark:text-[#A8D5BA]" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">Sacred Symbolism</h3>
          <p className="text-lg text-[#2D3436] dark:text-[#E8E8E0]/70 font-serif italic leading-relaxed">
            {product.symbolism}
          </p>
        </div>

        {/* Materials */}
        <div className="bg-[#5A5A40] dark:bg-[#252520] p-10 rounded-[40px] text-white space-y-8">
          <div className="space-y-2">
            <h3 className="text-2xl font-serif font-bold">Sacred Materials</h3>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">Manifesting with elemental precision</p>
          </div>
          <div className="space-y-6">
            {product.materials.map((mat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold">{mat.name}</span>
                  <span className="text-[10px] uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded">{mat.type}</span>
                </div>
                <p className="text-xs opacity-70 italic leading-relaxed">{mat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Artisan Story */}
      <section className="bg-white dark:bg-[#252520] rounded-[60px] overflow-hidden border border-[#D1D1C1]/30 mt-20 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch">
          <div className="p-12 sm:p-20 space-y-8 flex flex-col justify-center">
            <div className="inline-block px-4 py-1.5 bg-[#5A5A40]/10 dark:bg-[#A8D5BA]/10 text-[#5A5A40] dark:text-[#A8D5BA] rounded-full text-[10px] font-bold uppercase tracking-widest w-fit">
              Crafting Heritage
            </div>
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA]">The {product.artisanStory.name} Narrative</h2>
            <div className="space-y-6">
              <p className="text-xl text-[#2D3436] dark:text-[#E8E8E0]/70 font-serif italic leading-relaxed">
                {product.artisanStory.story}
              </p>
              <div className="flex items-center gap-3 text-[#5A5A40] dark:text-[#A8D5BA]">
                <MapPin size={20} />
                <span className="font-bold tracking-widest uppercase text-xs">Forged in {product.artisanStory.location}</span>
              </div>
            </div>
          </div>
          <div className="h-[400px] lg:h-auto relative">
            <img 
              src="https://picsum.photos/seed/artisan-forge/1200/1000" 
              alt="Artisan Story" 
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-[#5A5A40]/20" />
          </div>
        </div>
      </section>

      {/* Shipping / Trust */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
        <div className="flex items-center gap-4 p-8 bg-[#F5F5F0] dark:bg-[#1A1A15] rounded-3xl">
          <div className="p-3 bg-white dark:bg-[#252520] rounded-xl text-[#5A5A40] dark:text-[#A8D5BA]">
            <Clock size={20} />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest text-[#5A5A40] dark:text-[#A8D5BA]">Crafting Time</h4>
            <p className="text-sm italic opacity-60">14-21 days manifestation</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-8 bg-[#F5F5F0] dark:bg-[#1A1A15] rounded-3xl">
          <div className="p-3 bg-white dark:bg-[#252520] rounded-xl text-[#5A5A40] dark:text-[#A8D5BA]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest text-[#5A5A40] dark:text-[#A8D5BA]">Authenticity</h4>
            <p className="text-sm italic opacity-60">Vedic Certificate Included</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-8 bg-[#F5F5F0] dark:bg-[#1A1A15] rounded-3xl">
          <div className="p-3 bg-white dark:bg-[#252520] rounded-xl text-[#5A5A40] dark:text-[#A8D5BA]">
            <Zap size={20} />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest text-[#5A5A40] dark:text-[#A8D5BA]">Sync Technology</h4>
            <p className="text-sm italic opacity-60">QR Link to Sacred Vault</p>
          </div>
        </div>
      </div>
    </div>
  );
};

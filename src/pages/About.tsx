import React from 'react';
import { motion } from 'motion/react';
import { Sprout, Heart, ShieldCheck, Zap, ArrowRight, Sun, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutPage = () => {
  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden rounded-[60px] mx-4 shadow-2xl">
        <img 
          src="https://picsum.photos/seed/ayurveda-about/1920/1080?blur=1" 
          alt="Ayurveda Heritage" 
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[#5A5A40]/40 backdrop-blur-[2px]" />
        <div className="relative z-10 text-center text-white px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight">The ṚtuSyn Vision</h1>
            <p className="text-xl md:text-2xl font-serif italic opacity-90 max-w-2xl mx-auto">
              Synchronizing ancient wisdom with modern precision to awaken your unique biological rhythm.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="max-w-4xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-4">
          <span className="inline-block px-4 py-1.5 bg-[#5A5A40]/10 text-[#5A5A40] rounded-full text-xs font-bold uppercase tracking-[0.2em]">Our Heritage</span>
          <h2 className="text-4xl font-serif font-bold text-[#5A5A40]">Ancient Roots, Neural Wings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-lg text-[#2D3436] opacity-80 leading-relaxed font-serif">
            <p>
              ṚtuSyn was born from the belief that wellness isn't a destination, but a frequency. By blending the profound 5,000-year-old principles of Ayurveda with cutting-edge Neural Synchrony, we've created a platform that listens to your body in real-time.
            </p>
            <p>
              Our MISSION is to empower every individual to live in effortless alignment with the changing seasons (Ṛtu) and their inherent nature (Prakriti).
            </p>
          </div>
          <div className="aspect-[4/5] rounded-[60px] overflow-hidden shadow-xl border-8 border-white">
            <img 
              src="https://picsum.photos/seed/organic-life/800/1000" 
              alt="Organic Wisdom" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="bg-[#F5F5F0] py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center">
            <h3 className="text-3xl font-serif font-bold text-[#5A5A40]">The Three Pillars of ṚtuSyn</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Leaf className="text-emerald-600" />, title: 'Authenticity', desc: 'Sourcing clinical recommendations directly from classical Ayurvedic texts and verified biological data.' },
              { icon: <Zap className="text-amber-600" />, title: 'Intelligence', desc: 'Leveraging AIveda—our proprietary neural hub—to provide future health predictions and real-time rhythmic guidance.' },
              { icon: <Heart className="text-rose-600" />, title: 'Harmony', desc: 'Focusing on the seamless integration of mind, body, and environment through ritual and conscious manifestation.' }
            ].map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="bg-white p-10 rounded-[40px] shadow-sm border border-[#D1D1C1]/30 space-y-6 text-center"
              >
                <div className="w-16 h-16 bg-[#F5F5F0] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  {pillar.icon}
                </div>
                <h4 className="text-xl font-serif font-bold text-[#5A5A40]">{pillar.title}</h4>
                <p className="text-sm text-[#2D3436] opacity-60 leading-relaxed font-serif italic">{pillar.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="max-w-4xl mx-auto px-6 text-center space-y-8 py-10">
        <div className="w-20 h-20 bg-[#5A5A40] text-white rounded-full flex items-center justify-center mx-auto shadow-2xl mb-4">
          <Sun size={32} />
        </div>
        <h3 className="text-3xl font-serif font-bold text-[#5A5A40]">Join the Conscious Movement</h3>
        <p className="text-lg text-[#2D3436] opacity-60 italic font-serif">
          Experience the synchrony of life designed just for you.
        </p>
        <div className="pt-4">
          <Link 
            to="/quiz" 
            className="inline-flex items-center gap-3 bg-[#5A5A40] text-white px-10 py-5 rounded-full font-bold hover:shadow-2xl transition-all"
          >
            Discover Your Dosha <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
};

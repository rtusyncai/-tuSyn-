import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Youtube, Instagram, Twitter, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-[#D1D1C1]/30 py-16 px-6 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 sm:gap-16">
        <div className="space-y-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-[#5A5A40] rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg">
              <Leaf className="text-white" size={24} />
            </div>
            <span className="text-2xl font-serif font-bold tracking-tight text-[#5A5A40]">ṚtuSyn</span>
          </Link>
          <p className="text-sm text-[#2D3436] opacity-60 font-serif leading-relaxed italic">
            Synchronizing ancient Ayurvedic wisdom with modern life to awaken your true frequency.
          </p>
          <div className="flex gap-4">
            <a href="#" className="p-2 bg-[#F5F5F0] rounded-lg text-[#5A5A40] hover:bg-[#5A5A40] hover:text-white transition-all">
              <Youtube size={18} />
            </a>
            <a href="#" className="p-2 bg-[#F5F5F0] rounded-lg text-[#5A5A40] hover:bg-[#5A5A40] hover:text-white transition-all">
              <Instagram size={18} />
            </a>
            <a href="#" className="p-2 bg-[#F5F5F0] rounded-lg text-[#5A5A40] hover:bg-[#5A5A40] hover:text-white transition-all">
              <Twitter size={18} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] mb-6">Manifestations</h4>
          <ul className="space-y-4">
            <li><Link to="/ayurwear" className="text-sm text-[#2D3436] opacity-60 hover:opacity-100 hover:text-[#5A5A40] transition-all">AyurWear manifestations</Link></li>
            <li><Link to="/sanctuary" className="text-sm text-[#2D3436] opacity-60 hover:opacity-100 hover:text-[#5A5A40] transition-all">Sanctuary neural hub</Link></li>
            <li><Link to="/marketplace" className="text-sm text-[#2D3436] opacity-60 hover:opacity-100 hover:text-[#5A5A40] transition-all">GILDED Marketplace</Link></li>
            <li><Link to="/vault" className="text-sm text-[#2D3436] opacity-60 hover:opacity-100 hover:text-[#5A5A40] transition-all">Sacred Vault</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] mb-6">Sanctuary</h4>
          <ul className="space-y-4">
            <li><Link to="/about" className="text-sm text-[#2D3436] opacity-60 hover:opacity-100 hover:text-[#5A5A40] transition-all">Our Vision</Link></li>
            <li><Link to="/contact" className="text-sm text-[#2D3436] opacity-60 hover:opacity-100 hover:text-[#5A5A40] transition-all">Connect with Curators</Link></li>
            <li><Link to="/terms" className="text-sm text-[#2D3436] opacity-60 hover:opacity-100 hover:text-[#5A5A40] transition-all">Legal Synchrony</Link></li>
            <li><a href="#" className="text-sm text-[#2D3436] opacity-60 hover:opacity-100 hover:text-[#5A5A40] transition-all">Privacy Wisdom</a></li>
          </ul>
        </div>

        <div className="bg-[#F5F5F0] p-8 rounded-[32px] space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">Neural Updates</h4>
          <p className="text-xs text-[#2D3436] opacity-60 italic font-serif leading-relaxed">
            Join 12,000+ souls receiving rhythmic health guidance.
          </p>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Your email"
              className="flex-1 bg-white border border-[#D1D1C1]/50 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
            />
            <button className="bg-[#5A5A40] text-white p-2 rounded-xl hover:scale-105 transition-transform">
              <Heart size={16} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-[#D1D1C1]/20 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[10px] font-medium text-[#5A5A40]/40 uppercase tracking-widest">
          © 2026 ṚtuSyn. Neural Wellness for the Modern Soul.
        </p>
        <p className="text-[10px] font-medium text-[#5A5A40]/40 uppercase tracking-widest flex items-center gap-2">
          Designed with intention in Bharat <span className="text-[#5A5A40]/20">|</span> Real-time Biometric Integration Active
        </p>
      </div>
    </footer>
  );
};

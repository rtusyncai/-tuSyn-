import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, MessageSquare, MapPin, Send, Loader2, CheckCircle2, Phone, Sparkles } from 'lucide-react';

export const ContactPage = () => {
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('loading');
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    setFormState('success');
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 space-y-16 pb-32">
      <div className="text-center space-y-4">
        <span className="inline-block px-4 py-1.5 bg-[#5A5A40]/10 text-[#5A5A40] rounded-full text-xs font-bold uppercase tracking-[0.2em]">Contact Us</span>
        <h1 className="text-5xl md:text-6xl font-serif font-bold text-[#5A5A40]">A Connected Sanctuary</h1>
        <p className="text-lg text-[#2D3436] opacity-60 italic font-serif max-w-2xl mx-auto">
          Whether you have a question about your Dosha, need technical assistance, or want to collaborate—we are here to listen.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* Info Cards */}
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: <Mail className="text-sky-600" />, label: 'Email', value: 'awakening@rtusyn.com' },
              { icon: <Phone className="text-emerald-600" />, label: 'Neural Hotline', value: '+1 (888) RTU-SYNC' },
              { icon: <MessageSquare className="text-indigo-600" />, label: 'AIveda Chat', value: 'Available 24/7 in-app' },
              { icon: <MapPin className="text-rose-600" />, label: 'Sanctuary HQ', value: 'Varanasi / Digital Space' }
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-[32px] border border-[#D1D1C1]/50 shadow-sm hover:shadow-xl transition-all space-y-4"
              >
                <div className="w-12 h-12 bg-[#F5F5F0] rounded-xl flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">{item.label}</p>
                  <p className="text-sm font-bold text-[#5A5A40]">{item.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-[#5A5A40] p-10 rounded-[40px] text-white space-y-6 relative overflow-hidden">
            <Sparkles className="absolute -right-8 -top-8 text-white/10" size={200} />
            <h3 className="text-2xl font-serif font-bold relative z-10">Neural Support</h3>
            <p className="text-sm italic opacity-80 leading-relaxed font-serif relative z-10">
              "Every message is a spark of consciousness. We strive to harmonize with your inquiries within one lunar cycle (usually 24-48 hours)."
            </p>
            <div className="flex items-center gap-4 pt-4 relative z-10">
              <div className="flex -space-x-3">
                {[1,2,3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[#5A5A40] overflow-hidden bg-white/20">
                    <img src={`https://picsum.photos/seed/curator-${i}/100/100`} alt="Curator" loading="lazy" />
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Our curators are online</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white p-10 md:p-12 rounded-[60px] border border-[#D1D1C1] shadow-2xl relative">
          {formState === 'success' ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 space-y-6"
            >
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={64} />
              </div>
              <h3 className="text-3xl font-serif font-bold text-[#5A5A40]">Message Harmonized</h3>
              <p className="text-base text-[#2D3436] opacity-60 italic font-serif">Thank you. Your inquiry has been rhythmicized and sent to our sanctuary team.</p>
              <button 
                onClick={() => setFormState('idle')}
                className="text-[#5A5A40] font-bold text-sm uppercase tracking-widest hover:underline"
              >
                Send another message
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40 px-2">Your Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter your name"
                    className="w-full p-5 rounded-2xl bg-[#F5F5F0]/50 border border-[#D1D1C1]/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#5A5A40]/5 transition-all text-sm font-serif"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40 px-2">Health Frequency (Email)</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="you@frequency.com"
                    className="w-full p-5 rounded-2xl bg-[#F5F5F0]/50 border border-[#D1D1C1]/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#5A5A40]/5 transition-all text-sm font-serif"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40 px-2">Subject</label>
                <select 
                  className="w-full p-5 rounded-2xl bg-[#F5F5F0]/50 border border-[#D1D1C1]/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#5A5A40]/5 transition-all text-sm font-bold text-[#5A5A40]"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                >
                  <option>General Inquiry</option>
                  <option>Dosha Verification</option>
                  <option>Marketplace Support</option>
                  <option>Collaborative Proposal</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40 px-2">Manifestation (Message)</label>
                <textarea 
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Share your thoughts..."
                  className="w-full p-5 rounded-2xl bg-[#F5F5F0]/50 border border-[#D1D1C1]/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#5A5A40]/5 transition-all min-h-[160px] text-sm font-serif italic"
                />
              </div>

              <button
                type="submit"
                disabled={formState === 'loading'}
                className="w-full bg-[#5A5A40] text-white py-6 rounded-3xl font-bold text-lg hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 shadow-xl"
              >
                {formState === 'loading' ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                {formState === 'loading' ? 'Harmonizing...' : 'Send Manifestation'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

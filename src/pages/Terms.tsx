import React from 'react';
import { ShieldCheck, ScrollText, Lock, Scale, AlertCircle, Compass, Brain, Cpu } from 'lucide-react';

export const TermsPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6 space-y-12 pb-32">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-[#F5F5F0] text-[#5A5A40] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Scale size={32} />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#5A5A40]">Legal Synchrony</h1>
        <p className="text-lg text-[#2D3436] opacity-60 font-serif italic">Terms, conditions, and the ethical foundations of ṚtuSyn.</p>
      </div>

      <div className="bg-white p-10 md:p-16 rounded-[60px] border border-[#D1D1C1] shadow-2xl space-y-12">
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-[#5A5A40]">
            <Lock size={20} className="text-emerald-600" />
            <h2 className="text-2xl font-serif font-bold">1. Digital Sanctuary Agreement</h2>
          </div>
          <p className="text-[#2D3436] opacity-70 leading-relaxed font-serif">
            By accessing or using ṚtuSyn, you agree to enter our digital sanctuary. Use of this platform signifies your acceptance of these Terms and Conditions. If you do not agree with any part of these terms, we kindly ask that you gracefully exit the platform.
          </p>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 text-[#5A5A40]">
            <ShieldCheck size={20} className="text-sky-600" />
            <h2 className="text-2xl font-serif font-bold">2. Clinical Disclaimer</h2>
          </div>
          <div className="p-8 bg-amber-50 rounded-[32px] border border-amber-100 flex gap-6 italic text-[#5A5A40] opacity-80 font-serif items-start">
            <AlertCircle className="text-amber-500 shrink-0 mt-1" size={24} />
            <p className="text-sm">
              ṚtuSyn and the AIveda neural hub provide holistic wellness analysis based on ancient Ayurvedic principles and modern data points. This information is for educational and self-optimization purposes only and does NOT constitute medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health providers with any questions regarding a medical condition.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 text-[#5A5A40]">
            <ScrollText size={20} className="text-rose-600" />
            <h2 className="text-2xl font-serif font-bold">3. Data Privacy & Neural Manifestation</h2>
          </div>
          <div className="space-y-4 text-[#2D3436] opacity-80 leading-relaxed font-serif">
            <p>
              Your biological identity (Dosha), health profile, and biometric telemetry are sacred. We utilize end-to-end encryption to secure your data at every node of the neural hub.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-[#F5F5F0] rounded-2xl border border-[#D1D1C1]/20">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] mb-2 flex items-center gap-2">
                   <Compass size={14} className="text-emerald-600" /> Geospatial Awareness
                </h4>
                <p className="text-[10px] leading-relaxed">By using the Wellness Atlas, you allow ṚtuSyn to process your real-time coordinates via Google Maps APIs to identify relevant wellness hubs and environmental markers.</p>
              </div>
              <div className="p-5 bg-[#F5F5F0] rounded-2xl border border-[#D1D1C1]/20">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] mb-2 flex items-center gap-2">
                   <Brain size={14} className="text-indigo-600" /> Neural Extraction
                </h4>
                <p className="text-[10px] leading-relaxed">Medical report analysis utilizes high-dexterity Gemini AI models. Your uploaded documents are processed ephemerally for data extraction and are not used to train global base models.</p>
              </div>
            </div>
            <p className="text-sm italic">
              Third-party bridges (YouTube, Apple Health, IoT devices) are only active upon explicit user authorization and can be severed at any time within the Sanctuary Settings.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 text-[#5A5A40]">
            <Cpu size={20} className="text-amber-600" />
            <h2 className="text-2xl font-serif font-bold">4. Neural Connectivity & IoT Sync</h2>
          </div>
          <p className="text-[#2D3436] opacity-70 leading-relaxed font-serif">
            Integration with external hardware (AyurLens, Smart Shower, Kitchen Inventory) requires active Bluetooth or WiFi protocols. ṚtuSyn is not responsible for the physical performance or reliability of third-party hardware, even when synchronized with our neural blueprint.
          </p>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 text-[#5A5A40]">
            <Lock size={20} className="text-stone-600" />
            <h2 className="text-2xl font-serif font-bold">5. Commerce & Marketplace</h2>
          </div>
          <p className="text-[#2D3436] opacity-70 leading-relaxed font-serif">
            Transactions made within the ṚtuSyn Marketplace are processed through secure third-party payment gateways (Stripe/Google Pay). All sales are final for custom bio-harmonized digital content. Physical goods may be returned according to the specific vendor's return policy.
          </p>
        </section>

        <div className="pt-12 border-t border-[#D1D1C1]/30 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]/40">Last Synchronized: May 2026</p>
          <div className="flex gap-8">
            <button className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest hover:underline">Privacy Policy</button>
            <button className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest hover:underline">Cookie Wisdom</button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  MessageSquare, 
  User, 
  Clock, 
  Search, 
  Trash2, 
  FileText, 
  Send, 
  CheckCircle, 
  Edit3, 
  X, 
  Download,
  Loader2,
  Stethoscope,
  Brain,
  Zap,
  Activity,
  Printer,
  TrendingUp,
  BarChart,
  Briefcase,
  Target,
  Plus,
  Minus,
  Settings
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, addDoc, serverTimestamp, getDocs, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { geminiService } from '../services/geminiService';
import { useToast } from '../hooks/useToast';

export const AdminPortalPage = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [manifestations, setManifestations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'consultations' | 'neural' | 'users' | 'ceo'>('consultations');
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  
  // CEO Engine State
  const [budget, setBudget] = useState<number>(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [strategicPlan, setStrategicPlan] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'users') {
      const q = query(collection(db, 'profiles'), orderBy('role', 'desc'));
      getDocs(q).then(snapshot => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }
  }, [activeTab]);
  
  const [prescriptionMode, setPrescriptionMode] = useState(false);
  const [draftPrescription, setDraftPrescription] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [manualSignature, setManualSignature] = useState(false);

  useEffect(() => {
    const path = 'ayur_chats';
    const q = query(collection(db, path), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (activeTab === 'neural') {
      const q = query(collection(db, 'manifestations'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setManifestations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return unsubscribe;
    }
  }, [activeTab]);

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat session?')) {
      try {
        await deleteDoc(doc(db, 'ayur_chats', id));
        if (selectedSession?.id === id) setSelectedSession(null);
        toast('Chat session deleted', 'info');
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleGeneratePrescription = async () => {
    if (!selectedSession) return;
    setIsGenerating(true);
    try {
      const transcript = selectedSession.messages?.map((m: any) => `${m.role}: ${m.content}`).join('\n');
      const suggestionData = await geminiService.generateTreatmentSuggestions(transcript);
      setDraftPrescription({
        patientUid: selectedSession.uid,
        doctorId: user?.uid,
        doctorName: profile?.displayName || user?.email?.split('@')[0] || 'Ayurvedic Specialist',
        doctorRegNumber: profile?.doctorRegistrationNumber || 'REG-PENDING',
        treatmentPlan: suggestionData.diagnosticImpression,
        lifestyle: suggestionData.lifestyle.map((l: any) => l.text),
        dietary: suggestionData.dietary.map((d: any) => d.text),
        medicines: suggestionData.suggestedMedicines.map((m: any) => ({
          name: m.name,
          dosage: m.dosage,
          reason: m.reason
        })),
        icdCodes: suggestionData.icd10Classification || [],
        createdAt: new Date().toISOString()
      });
      setPrescriptionMode(true);
      setManualSignature(false);
    } catch (error) {
      console.error(error);
      toast('Failed to generate draft prescription', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSignPrescription = async () => {
    if (!draftPrescription) return;
    setIsSigning(true);
    try {
      await addDoc(collection(db, 'prescriptions'), {
        ...draftPrescription,
        status: 'signed',
        signatureType: manualSignature ? 'manual_placeholder' : 'digital',
        signedAt: serverTimestamp(),
      });
      toast('Prescription signed and issued with clinical authority', 'success');
      setPrescriptionMode(false);
      setDraftPrescription(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'prescriptions');
    } finally {
      setIsSigning(false);
    }
  };

  const handleExecuteBusiness = async () => {
    if (budget <= 0) {
      toast('Allocated budget must be greater than zero for manifest.', 'info');
      return;
    }
    setIsExecuting(true);
    try {
      const plan = await geminiService.simulateStrategicExecution(budget);
      setStrategicPlan(plan);
      toast('Autonomous CEO manifestation complete. Strategic alignment initiated.', 'success');
    } catch (error) {
      console.error(error);
      toast('CEO Engine failed to synthesize strategy.', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredSessions = sessions.filter(s => 
    s.uid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.messages?.some((m: any) => m.content?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 min-h-[80vh] pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#5A5A40] text-white rounded-2xl shadow-lg">
              <Shield size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-serif font-bold text-[#5A5A40]">Medical & Admin Nexus</h2>
              <p className="text-sm text-[#2D3436] opacity-60 italic">Centralized intelligence for case monitoring and clinical governance.</p>
            </div>
          </div>
        </div>
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40] opacity-40 group-focus-within:opacity-100 transition-opacity" size={20} />
          <input
            type="text"
            placeholder="Relational search (UID or Content)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 rounded-3xl border border-[#D1D1C1] focus:outline-none focus:ring-4 focus:ring-[#5A5A40]/10 bg-white/50 backdrop-blur-sm transition-all"
          />
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex bg-[#D1D1C1]/20 p-1 rounded-2xl w-fit overflow-x-auto scrollbar-hide shrink-0">
        {[
          { id: 'consultations', label: 'Consultations', icon: MessageSquare },
          { id: 'neural', label: 'Neural Evolution', icon: Brain },
          { id: 'ceo', label: 'Strategic Intelligence', icon: TrendingUp },
          { id: 'users', label: 'Traveler Registry', icon: User }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/30" 
                : "text-[#5A5A40] opacity-60 hover:opacity-100"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'consultations' ? (
          <motion.div 
            key="consultations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-25rem)] print:hidden"
          >
        {/* Session List */}
        <div className="lg:col-span-4 bg-white rounded-[40px] border border-[#D1D1C1] shadow-xl overflow-hidden flex flex-col">
          <div className="p-8 border-b border-[#D1D1C1] bg-[#F5F5F0]/50 backdrop-blur-md flex justify-between items-center">
            <h3 className="font-bold text-[#5A5A40] flex items-center gap-2 uppercase tracking-widest text-xs">
              <MessageSquare size={16} /> Active Consultations ({filteredSessions.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#D1D1C1]/50 scrollbar-hide">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedSession(session);
                  setPrescriptionMode(false);
                }}
                className={cn(
                  "w-full p-8 text-left transition-all hover:bg-[#F5F5F0] cursor-pointer flex flex-col gap-3 relative group",
                  selectedSession?.id === session.id && "bg-[#F5F5F0] border-l-[6px] border-[#5A5A40]"
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedSession(session);
                    setPrescriptionMode(false);
                  }
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#D1D1C1] flex items-center justify-center text-[#5A5A40] font-bold shadow-sm">
                      {session.uid?.slice(0, 1).toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#5A5A40]">Patient: {session.uid?.slice(0, 8)}...</div>
                      <div className="text-[10px] text-[#2D3436] opacity-40 flex items-center gap-1 font-medium">
                        <Clock size={10} /> {session.updatedAt?.toDate ? format(session.updatedAt.toDate(), 'MMM d, h:mm a') : 'Just now'}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id, e);
                    }}
                    className="p-2 text-rose-300 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-xs text-[#2D3436] opacity-60 line-clamp-2 leading-relaxed italic">
                  "{session.messages?.[session.messages.length - 1]?.content || 'Empty session...'}"
                </p>
                {session.summary && (
                  <div className="flex gap-2 flex-wrap">
                    {session.summary.diagnoses?.slice(0, 2).map((d: any, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[8px] font-bold uppercase tracking-wider">
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat & Prescription Viewer */}
        <div className="lg:col-span-8 bg-white rounded-[40px] border border-[#D1D1C1] shadow-xl overflow-hidden flex flex-col relative">
          {selectedSession ? (
            <>
              {/* Header */}
              <div className="p-8 border-b border-[#D1D1C1] bg-[#F5F5F0]/50 backdrop-blur-md flex justify-between items-center z-10 shrink-0">
                <div className="flex items-center gap-6">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-[#5A5A40]">Relational Insight</h3>
                    <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest mt-1">Patient Trace ID: {selectedSession.uid}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleGeneratePrescription}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-[#5A5A40] text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-[#4A4A30] transition-all shadow-md group disabled:opacity-50 text-xs sm:text-sm"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Synthesizing Clinical Nexus...
                      </>
                    ) : (
                      <>
                        <FileText size={16} className="group-hover:scale-110 transition-transform" />
                        Generate Prescription
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Interaction Pane */}
              <div className="flex-1 overflow-y-auto p-12 space-y-8 scrollbar-hide bg-[#F5F5F0]/20">
                <AnimatePresence mode="wait">
                  {prescriptionMode && draftPrescription ? (
                    <motion.div
                      key="prescription"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="max-w-4xl mx-auto bg-white rounded-[3rem] border border-[#D1D1C1] shadow-2xl p-12 space-y-10 relative print:shadow-none print:border-none print:p-0 print:m-0"
                    >
                      <button 
                        onClick={() => setPrescriptionMode(false)}
                        className="absolute right-8 top-8 p-2 hover:bg-rose-50 text-rose-400 rounded-full transition-all print:hidden"
                      >
                        <X size={24} />
                      </button>

                      <div className="flex justify-between items-start border-b border-[#D1D1C1]/30 pb-8">
                        <div className="space-y-4">
                          <h2 className="text-4xl font-serif font-bold text-[#5A5A40]">ṚtuSyn Sanctuary</h2>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-[#5A5A40] uppercase tracking-widest">Integrated Clinical Nexus</p>
                            <p className="text-xs text-[#2D3436]/60 italic">Bridging Antiquity with Modern Precision</p>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="inline-flex px-4 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 print:border">
                            Valid Prescription
                          </div>
                          <p className="text-xs font-mono opacity-40">DATE: {format(new Date(), 'yyyy-MM-dd')}</p>
                          <p className="text-xs font-mono opacity-40">RX-ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                          <section className="space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40 flex items-center gap-2">
                              <User size={14} /> Practitioner Credentials
                            </label>
                            <div className="bg-[#F5F5F0] p-6 rounded-[2rem] border border-[#D1D1C1]/50 space-y-2">
                              <p className="text-sm font-bold text-[#5A5A40]">Dr. {draftPrescription.doctorName}</p>
                              <p className="text-[10px] text-[#2D3436]/60 uppercase tracking-widest font-mono">NRN: {draftPrescription.doctorRegNumber}</p>
                            </div>
                          </section>

                          <section className="space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40 flex items-center gap-2">
                              <Stethoscope size={14} /> Diagnostic Impression
                            </label>
                            <textarea 
                              value={draftPrescription.treatmentPlan}
                              onChange={(e) => setDraftPrescription({...draftPrescription, treatmentPlan: e.target.value})}
                              className="w-full p-6 h-32 bg-[#F5F5F0] rounded-[2rem] border border-[#D1D1C1] text-sm italic leading-relaxed focus:outline-none focus:ring-4 focus:ring-[#5A5A40]/5 resize-none shadow-inner"
                            />
                            {draftPrescription.icdCodes && draftPrescription.icdCodes.length > 0 && (
                              <div className="flex gap-2 flex-wrap">
                                {draftPrescription.icdCodes.map((code: string, i: number) => (
                                  <span key={i} className="px-2 py-1 bg-[#5A5A40]/5 text-[#5A5A40] rounded-lg text-[9px] font-mono border border-[#5A5A40]/10">
                                    {code}
                                  </span>
                                ))}
                              </div>
                            )}
                          </section>

                          <section className="space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-amber-600/60 flex items-center gap-2">
                              <Zap size={14} /> Biological Tools & Medicines
                            </label>
                            <div className="space-y-3">
                              {draftPrescription.medicines.map((m: any, i: number) => (
                                <div key={i} className="p-4 bg-amber-50/30 border border-amber-100 rounded-2xl space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-sm font-bold text-[#5A5A40]">{m.name}</span>
                                    <span className="text-[10px] font-mono text-amber-600">{m.dosage}</span>
                                  </div>
                                  <p className="text-[10px] text-[#2D3436]/60 italic">{m.reason}</p>
                                </div>
                              ))}
                            </div>
                          </section>
                        </div>

                        <div className="space-y-8">
                          <section className="space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/60 flex items-center gap-2">
                              <Shield size={14} /> Lifestyle Modalities
                            </label>
                            <div className="space-y-3">
                              {draftPrescription.lifestyle.map((l: string, i: number) => (
                                <div key={i} className="flex gap-3 text-xs text-[#5A5A40] bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                  {l}
                                </div>
                              ))}
                            </div>
                          </section>

                          <section className="space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-amber-600/60 flex items-center gap-2">
                              <Edit3 size={14} /> Dietary Precepts
                            </label>
                            <div className="space-y-3">
                              {draftPrescription.dietary.map((d: string, i: number) => (
                                <div key={i} className="flex gap-3 text-xs text-[#5A5A40] bg-amber-50/50 p-3 rounded-2xl border border-amber-100">
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                  {d}
                                </div>
                              ))}
                            </div>
                          </section>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-[#D1D1C1]/30 space-y-8">
                        <div className="flex justify-between items-end">
                          <div className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer group print:hidden">
                              <input 
                                type="checkbox" 
                                checked={manualSignature}
                                onChange={(e) => setManualSignature(e.target.checked)}
                                className="w-5 h-5 rounded-lg border-[#D1D1C1] text-[#5A5A40] focus:ring-[#5A5A40]"
                              />
                              <span className="text-xs font-bold text-[#5A5A40]/60 group-hover:text-[#5A5A40] transition-colors">Apply Manual Physical Signature</span>
                            </label>
                            <div className="w-64 h-24 border-b-2 border-dashed border-[#D1D1C1] flex flex-col items-center justify-center relative">
                              {manualSignature ? (
                                <span className="text-[10px] uppercase tracking-widest text-[#D1D1C1] font-bold">Physical Signature Space</span>
                              ) : (
                                <div className="text-center">
                                  <p className="font-serif italic text-xl text-[#5A5A40]">Dr. {draftPrescription.doctorName}</p>
                                  <p className="text-[8px] opacity-40 font-mono">DIGITALLY ENCRYPTED & SIGNED</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right space-y-1 opacity-40">
                             <p className="text-[9px] uppercase tracking-[0.3em] font-bold">Verified Clinical Manifest</p>
                             <p className="text-[8px]">Proprietary Doshic Integrity Document</p>
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6 print:hidden">
                          <button 
                            onClick={handleSignPrescription}
                            disabled={isSigning}
                            className="flex-1 py-5 bg-[#5A5A40] text-white rounded-[2rem] font-bold flex items-center justify-center gap-3 hover:bg-[#4A4A30] transition-all shadow-xl disabled:opacity-50"
                          >
                            {isSigning ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                            Sign & Issue Manifest
                          </button>
                          <button 
                            onClick={handlePrint}
                            className="flex-1 py-5 border-2 border-[#D1D1C1] text-[#5A5A40] rounded-[2rem] font-bold flex items-center justify-center gap-3 hover:bg-white transition-all"
                          >
                            <Printer size={20} /> Print Physical Copy
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div key="messages" className="space-y-8 max-w-4xl mx-auto">
                      {selectedSession.messages?.map((msg: any, i: number) => (
                        <div
                          key={i}
                          className={cn(
                            "flex gap-6 max-w-[90%]",
                            msg.role === 'user' ? "mr-auto" : "ml-auto flex-row-reverse"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center text-sm font-bold shadow-lg",
                            msg.role === 'user' ? "bg-white border border-[#D1D1C1] text-[#5A5A40]" : "bg-[#5A5A40] text-white"
                          )}>
                            {msg.role === 'user' ? 'U' : 'AI'}
                          </div>
                          <div className={cn(
                            "p-6 rounded-[2.5rem] text-sm leading-relaxed shadow-sm",
                            msg.role === 'user' ? "bg-white border border-[#D1D1C1]/30 text-[#5A5A40]" : "bg-[#5A5A40] text-white rounded-tr-none"
                          )}>
                            {msg.content}
                            <div className="mt-4 flex items-center gap-2 text-[9px] opacity-40 font-bold uppercase tracking-widest">
                              <Clock size={10} /> {format(new Date(msg.timestamp), 'h:mm a')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-20 opacity-30 italic space-y-6">
              <div className="w-24 h-24 bg-[#F5F5F0] rounded-[2rem] flex items-center justify-center">
                <Shield size={48} className="text-[#5A5A40]" />
              </div>
              <div className="max-w-sm">
                <h4 className="text-xl font-serif font-bold text-[#5A5A40] mb-2">Omniscient Case View</h4>
                <p className="text-sm">Select a diagnostic session from the perimeter to begin professional supervision and treatment synthesis.</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    ) : activeTab === 'neural' ? (
      <motion.div
        key="neural"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[40px] border border-[#D1D1C1] space-y-4">
            <Activity className="text-emerald-500" />
            <div>
              <h4 className="font-bold text-[#5A5A40]">Autonomous Health</h4>
              <p className="text-2xl font-serif font-bold">Optimal Synergy</p>
            </div>
            <p className="text-xs opacity-60">System is processing user interaction telemetry every 5 minutes.</p>
          </div>
          <div className="bg-[#5A5A40] p-8 rounded-[40px] text-white space-y-4">
            <Zap />
            <div>
              <h4 className="font-bold">Neural Deployments</h4>
              <p className="text-2xl font-serif font-bold">{manifestations.length} Active Modules</p>
            </div>
            <p className="text-xs opacity-60">Manifestations generated across all user bio-signatures.</p>
          </div>
        </div>

        <div className="bg-white rounded-[40px] border border-[#D1D1C1] shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F5F5F0] border-b border-[#D1D1C1]">
              <tr>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest opacity-40">User UID</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest opacity-40">Type</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest opacity-40">Development</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest opacity-40">Deployment Date</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest opacity-40">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1D1C1]/50">
              {manifestations.map((m) => (
                <tr key={m.id} className="hover:bg-[#F5F5F0]/30 transition-colors group">
                  <td className="p-6 font-mono text-[10px] opacity-60">{m.userId?.slice(0, 8)}...</td>
                  <td className="p-6">
                    <span className="px-3 py-1 bg-[#5A5A40]/10 text-[#5A5A40] rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {m.type}
                    </span>
                  </td>
                  <td className="p-6 max-w-xs">
                    <div className="font-bold text-sm text-[#5A5A40] group-hover:underline">{m.title}</div>
                    <div className="text-[10px] opacity-40 truncate">{m.description}</div>
                  </td>
                  <td className="p-6 text-xs text-[#2D3436] opacity-60">
                    {m.createdAt?.toDate ? format(m.createdAt.toDate(), 'MMM d, yyyy') : 'Recently'}
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-bold">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE
                    </div>
                  </td>
                </tr>
              ))}
              {manifestations.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center opacity-40 italic">
                    Awaiting system-initiated neural cycles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    ) : activeTab === 'users' ? (
      <motion.div
        key="users"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-8"
      >
        <div className="bg-white rounded-[40px] border border-[#D1D1C1] shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F5F5F0] border-b border-[#D1D1C1]">
              <tr>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest opacity-40">Traveler</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest opacity-40">Role</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest opacity-40">Dossier</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest opacity-40">Manifest Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1D1C1]/50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#F5F5F0]/30 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#5A5A40] text-white flex items-center justify-center font-bold">
                        {u.email?.[0].toUpperCase() || u.uid?.[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#5A5A40]">{u.email || u.id}</div>
                        <div className="text-[10px] opacity-40 mono uppercase">{u.id?.slice(0, 12)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      u.role === 'admin' ? "bg-rose-50 text-rose-600" :
                      u.role === 'doctor' ? "bg-amber-50 text-amber-600" :
                      u.role === 'vendor' ? "bg-blue-50 text-blue-600" :
                      "bg-emerald-50 text-emerald-600"
                    )}>
                      {u.role || 'user'}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="text-xs font-medium text-[#5A5A40]">{u.dosha || 'Pending Quiz'}</div>
                    <div className="text-[10px] opacity-40">{u.city || 'Undisclosed Sanctuary'}</div>
                  </td>
                  <td className="p-6">
                    <div className={cn(
                      "flex items-center gap-2 text-[10px] font-bold",
                      u.status === 'deactivated' ? "text-rose-500" : "text-emerald-600"
                    )}>
                      <div className={cn(
                         "w-2 h-2 rounded-full",
                         u.status === 'deactivated' ? "bg-rose-500" : "bg-emerald-500 animate-pulse"
                      )} />
                      {u.status === 'deactivated' ? 'DEACTIVATED' : 'LIVE'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    ) : activeTab === 'ceo' ? (
      <motion.div
        key="ceo"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="space-y-10"
      >
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 bg-white p-10 rounded-[40px] border border-[#D1D1C1] shadow-xl space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-[#5A5A40] text-white rounded-3xl shadow-lg">
                <TrendingUp size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-[#5A5A40]">Strategic Growth Engine</h3>
                <p className="text-sm opacity-40 italic font-medium">Autonomous CEO manifestation and budget alignment.</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40 block ml-2">Manifestation Budget ($ USD)</label>
              <div className="flex gap-4">
                <input 
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  placeholder="Set allocation amount..."
                  className="flex-1 px-8 py-5 rounded-[2.5rem] bg-[#F5F5F0] border border-[#D1D1C1] text-xl font-bold text-[#5A5A40] focus:outline-none focus:ring-4 focus:ring-[#5A5A40]/5"
                />
                <button 
                  onClick={handleExecuteBusiness}
                  disabled={isExecuting || budget <= 0}
                  className="px-10 py-5 bg-[#5A5A40] text-white rounded-[2.5rem] font-bold shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3 whitespace-nowrap"
                >
                  {isExecuting ? <Loader2 className="animate-spin text-white" size={20} /> : <Zap size={20} />}
                  Manifest Business Cycle
                </button>
              </div>
            </div>

            {strategicPlan && (
              <div className="pt-8 border-t border-[#D1D1C1]/30 space-y-6">
                <div className="p-8 bg-[#5A5A40]/5 rounded-[3rem] border border-[#5A5A40]/10 space-y-4">
                  <div className="flex items-center gap-2 text-[#5A5A40] font-bold text-sm uppercase tracking-widest">
                    <Target size={16} /> Autonomous Vision
                  </div>
                  <h4 className="text-xl font-serif font-bold text-[#5A5A40]">{strategicPlan.title}</h4>
                  <p className="text-sm leading-relaxed text-[#2D3436]/70 italic">"{strategicPlan.vision}"</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {strategicPlan.budgetAllocation.map((item: any, i: number) => (
                    <div key={i} className="p-6 bg-white border border-[#D1D1C1] rounded-[2rem] space-y-2">
                       <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{item.sector}</p>
                       <p className="text-xl font-serif font-bold text-[#5A5A40]">${item.amount.toLocaleString()}</p>
                       <p className="text-[10px] italic opacity-60 line-clamp-2">{item.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-full md:w-96 space-y-8">
            <div className="bg-[#5A5A40] p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10 space-y-6">
                 <div className="flex items-center gap-3 opacity-60">
                   <Target size={20} />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Revenue Nexus</span>
                 </div>
                 <div className="space-y-1">
                   <p className="text-xs opacity-60">Projected Cycle Outcome</p>
                   <p className="text-5xl font-serif font-bold">${strategicPlan?.projectedRevenue?.toLocaleString() || '0'}</p>
                 </div>
                 <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-bold">STABILITY: OPTIMAL</span>
                    </div>
                    <BarChart size={20} className="opacity-40" />
                 </div>
               </div>
               <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-[#D1D1C1] shadow-xl space-y-6">
              <h4 className="text-sm font-bold text-[#5A5A40] uppercase tracking-widest flex items-center gap-2">
                <Settings size={16} /> Stack Optimizations
              </h4>
              <div className="space-y-4">
                {(strategicPlan?.softwareRecommendations || [
                  { name: 'Stripe', purpose: 'Sacred Transactions', integratedBenefit: 'Global commerce alignment.' },
                  { name: 'ShipStation', purpose: 'Manifest Logistics', integratedBenefit: 'Synchronized physical delivery.' }
                ]).map((sw: any, i: number) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F5F0] border border-[#D1D1C1] flex items-center justify-center text-[#5A5A40] group-hover:bg-[#5A5A40] group-hover:text-white transition-all shadow-sm">
                      <Plus size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-[#5A5A40]">{sw.name}</p>
                      <p className="text-[9px] opacity-40 uppercase tracking-widest">{sw.purpose}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {strategicPlan && (
          <div className="bg-white rounded-[40px] border border-[#D1D1C1] shadow-xl overflow-hidden">
             <div className="p-8 border-b border-[#D1D1C1] bg-[#F5F5F0]/50 flex justify-between items-center">
               <h3 className="text-sm font-bold text-[#5A5A40] uppercase tracking-widest flex items-center gap-2">
                 <Briefcase size={18} /> CEO Operational Manifest (Autonomous Logs)
               </h3>
               <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">EXECUTING CYCLE</div>
             </div>
             <div className="divide-y divide-[#D1D1C1]/50">
                {strategicPlan.executionLogs.map((log: any, i: number) => (
                  <div key={i} className="p-8 flex flex-col md:flex-row md:items-center gap-6 hover:bg-[#F5F5F0]/30 transition-colors">
                    <div className="w-40 shrink-0">
                      <p className="text-[10px] font-mono opacity-40">{log.timestamp}</p>
                      <div className={cn(
                        "mt-1 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest w-fit",
                        log.category === 'Marketing' ? "bg-blue-50 text-blue-600" :
                        log.category === 'Sales' ? "bg-emerald-50 text-emerald-600" :
                        log.category === 'Accounting' ? "bg-amber-50 text-amber-600" :
                        "bg-purple-50 text-purple-600"
                      )}>
                        {log.category}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[#5A5A40] font-medium leading-relaxed">{log.log}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">{log.status}</span>
                       <CheckCircle size={14} className="text-emerald-500" />
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </motion.div>
    ) : null}
    </AnimatePresence>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingBag, Users, TrendingUp, Package, Clock, CheckCircle, XCircle, Plus, Store, Sprout, Heart, MapPin } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/useToast';

export const VendorDashboardPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'services' | 'produce' | 'dropship'>('overview');
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [produce, setProduce] = useState<any[]>([]);
  const [dropshipOrders, setDropshipOrders] = useState<any[]>([]);
  const [therapyRequests, setTherapyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch products
    const qProducts = query(collection(db, 'marketplace'), where('userId', '==', user.uid));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch dropship orders
    const qDropship = query(collection(db, 'dropship_orders'), where('vendorId', '==', user.uid));
    const unsubscribeDropship = onSnapshot(qDropship, (snapshot) => {
      setDropshipOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch services
    const qServices = query(collection(db, 'marketplace_services'), where('userId', '==', user.uid));
    const unsubscribeServices = onSnapshot(qServices, (snapshot) => {
      const servicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServices(servicesData);
      
      // If therapist, fetch therapy requests directed to them
      if ((servicesData as any[]).some(s => s.type === 'Therapist')) {
        const qRequests = query(collection(db, 'therapy_requests'), where('therapistId', '==', user.uid));
        onSnapshot(qRequests, (snap) => {
          setTherapyRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
      }
    });

    // Fetch produce
    const qProduce = query(collection(db, 'marketplace_produce'), where('userId', '==', user.uid));
    const unsubscribeProduce = onSnapshot(qProduce, (snapshot) => {
      setProduce(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeDropship();
      unsubscribeServices();
      unsubscribeProduce();
    };
  }, [user]);

  const handleRequestStatus = async (requestId: string, status: 'accepted' | 'completed') => {
    try {
      await updateDoc(doc(db, 'therapy_requests', requestId), { status, updatedAt: serverTimestamp() });
      toast(`Request ${status}`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `therapy_requests/${requestId}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-[#5A5A40] text-white rounded-2xl shadow-lg">
              <Store size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-serif font-bold text-[#5A5A40]">Vendor Ecosystem Dashboard</h2>
              <p className="text-sm text-[#2D3436] opacity-60 italic">Manage your Ayurvedic offerings and patient service engagements.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            to="/marketplace"
            className="flex items-center gap-2 px-6 py-3 bg-[#D1D1C1]/20 text-[#5A5A40] rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-[#D1D1C1]/40 transition-all border border-[#D1D1C1]/30"
          >
            <ShoppingBag size={16} />
            Marketplace View
          </Link>
          <div className="flex items-center gap-2 bg-[#F5F5F0] p-1.5 rounded-2xl border border-[#D1D1C1]">
            {['overview', 'products', 'services', 'produce', 'dropship'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                  activeTab === tab ? "bg-[#5A5A40] text-white shadow-md" : "text-[#5A5A40]/50 hover:bg-[#D1D1C1]/20"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[40px] border border-[#D1D1C1] shadow-sm space-y-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit">
                <TrendingUp size={24} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">Active Listings</div>
                <div className="text-3xl font-bold text-[#5A5A40]">{products.length + services.length + produce.length}</div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-[#D1D1C1] shadow-sm space-y-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit">
                <Users size={24} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">Therapy Requests</div>
                <div className="text-3xl font-bold text-[#5A5A40]">{therapyRequests.length}</div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-[#D1D1C1] shadow-sm space-y-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl w-fit">
                <ShoppingBag size={24} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">Product Sales</div>
                <div className="text-3xl font-bold text-[#5A5A40]">0</div>
                <span className="text-[8px] opacity-40 italic mt-1 block">Live tracking coming soon</span>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-[#D1D1C1] shadow-sm space-y-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-fit">
                <Sprout size={24} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">Garden Leads</div>
                <div className="text-3xl font-bold text-[#5A5A40]">{produce.length} Items</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Therapy Requests Queue */}
            <div className="bg-white rounded-[40px] border border-[#D1D1C1] shadow-xl overflow-hidden flex flex-col">
              <div className="p-8 border-b border-[#D1D1C1] bg-[#F5F5F0]/50 backdrop-blur-md flex justify-between items-center">
                <h3 className="font-bold text-[#5A5A40] flex items-center gap-2 uppercase tracking-widest text-xs">
                  <Heart size={16} /> Patient Therapy Queue
                </h3>
              </div>
              <div className="p-2 divide-y divide-[#D1D1C1]/50">
                {therapyRequests.length === 0 ? (
                  <div className="p-12 text-center opacity-30 italic text-sm">No active therapy requests from doctors.</div>
                ) : (
                  therapyRequests.map((req) => (
                    <div key={req.id} className="p-6 flex items-center justify-between group hover:bg-[#F5F5F0] transition-all rounded-3xl">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-[#5A5A40]">{req.therapyType}</div>
                        <div className="text-[10px] text-[#2D3436] opacity-40 italic">Patient UID: {req.patientUid.slice(0, 8)}...</div>
                        <div className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider mt-1",
                          req.status === 'pending' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                          {req.status}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {req.status === 'pending' && (
                          <button 
                            onClick={() => handleRequestStatus(req.id, 'accepted')}
                            className="p-2 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        {req.status === 'accepted' && (
                          <button 
                            onClick={() => handleRequestStatus(req.id, 'completed')}
                            className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        <button className="p-2 bg-rose-50 text-rose-300 rounded-xl hover:bg-rose-100 transition-all">
                          <XCircle size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Inventory Quick View */}
            <div className="bg-white rounded-[40px] border border-[#D1D1C1] shadow-xl overflow-hidden flex flex-col">
              <div className="p-8 border-b border-[#D1D1C1] bg-[#F5F5F0]/50 backdrop-blur-md flex justify-between items-center">
                <h3 className="font-bold text-[#5A5A40] flex items-center gap-2 uppercase tracking-widest text-xs">
                  <Package size={16} /> Inventory & Stock
                </h3>
                <button className="text-[10px] font-bold text-[#5A5A40] hover:underline underline-offset-4">Manage All</button>
              </div>
              <div className="p-2 divide-y divide-[#D1D1C1]/50">
                {products.length === 0 ? (
                  <div className="p-12 text-center opacity-30 italic text-sm">No products listed yet.</div>
                ) : (
                  products.map((p) => (
                    <div key={p.id} className="p-6 flex items-center justify-between group hover:bg-[#F5F5F0] transition-all rounded-3xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#F5F5F0] rounded-2xl flex items-center justify-center text-[#5A5A40] border border-[#D1D1C1]">
                          <ShoppingBag size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#5A5A40]">{p.name}</div>
                          <div className="text-[10px] text-[#2D3436] opacity-40">{p.category} | ${p.price}</div>
                        </div>
                      </div>
                      <button className="p-2 text-[#5A5A40] hover:bg-white rounded-xl transition-all border border-transparent hover:border-[#D1D1C1]">
                        <Clock size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dropship' && (
        <div className="space-y-8">
           <div className="bg-amber-50 rounded-[40px] p-8 border border-amber-100 flex items-center gap-6">
              <div className="p-4 bg-amber-600 text-white rounded-3xl shadow-lg">
                 <ShoppingBag size={32} />
              </div>
              <div>
                 <h3 className="text-2xl font-serif font-bold text-amber-900">Hypermarket Proxy Protocol</h3>
                 <p className="text-sm text-amber-800/60 italic leading-relaxed">
                    These orders are sourced from hypermarket nodes and fulfilled via your local logistics consolidation path.
                    Neural optimizations have been applied to minimize energetic friction.
                 </p>
              </div>
           </div>

           <div className="bg-white rounded-[40px] border border-[#D1D1C1] shadow-xl overflow-hidden">
              <div className="p-8 border-b border-[#D1D1C1] bg-[#F5F5F0]/50 flex justify-between items-center">
                 <h4 className="font-bold text-[#5A5A40] flex items-center gap-2 uppercase tracking-widest text-xs">
                    <Package size={16} /> Dropship Fulfillment Queue
                 </h4>
              </div>
              <div className="divide-y divide-[#D1D1C1]/30">
                 {dropshipOrders.length === 0 ? (
                    <div className="p-20 text-center space-y-4">
                       <Package size={48} className="mx-auto text-[#5A5A40]/10" />
                       <p className="text-sm text-[#5A5A40]/40 font-bold uppercase tracking-widest">No Dropship Resonance Detected</p>
                       <p className="text-xs italic text-[#5A5A40]/20 mx-auto max-w-xs">Scan the global grid from the marketplace to initiate a hyper-dropship node.</p>
                    </div>
                 ) : (
                    dropshipOrders.map((order) => (
                       <div key={order.id} className="p-8 hover:bg-[#F5F5F0]/30 transition-all flex flex-col md:flex-row gap-8">
                          <div className="flex-1 space-y-4">
                             <div className="flex items-center gap-3">
                                <div className="px-3 py-1 bg-[#5A5A40] text-white rounded-full text-[8px] font-bold uppercase tracking-widest">
                                   Order #{order.id.slice(-6)}
                                </div>
                                <div className="text-xs font-bold text-[#5A5A40]">{order.itemName}</div>
                             </div>
                             <p className="text-xs text-[#2D3436]/60 italic leading-relaxed">{order.optimizationStrategy || "Consolidated local route path priority."}</p>
                             <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                                   <MapPin size={12} /> {order.fulfillmentNode}
                                </div>
                                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                   Impact Fee: ${order.impactFee?.toFixed(2)}
                                </div>
                             </div>
                          </div>
                          <div className="flex flex-col justify-between items-end gap-4 min-w-[150px]">
                             <div className="text-right">
                                <div className="text-lg font-bold text-[#5A5A40]">${order.price?.toFixed(2)}</div>
                                <div className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Pending Dispatch</div>
                             </div>
                             <button className="px-6 py-2.5 bg-[#5A5A40] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#4A4A30] transition-all shadow-md">
                                Confirm Node
                             </button>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      )}

      {(activeTab === 'products' || activeTab === 'services' || activeTab === 'produce') && (
        <div className="bg-white rounded-[40px] border border-[#D1D1C1] shadow-xl min-h-[400px] p-12 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 bg-[#F5F5F0] rounded-[2rem] flex items-center justify-center text-[#5A5A40] opacity-40">
            <Plus size={40} />
          </div>
          <div className="max-w-md">
            <h3 className="text-2xl font-serif font-bold text-[#5A5A40] capitalize">{activeTab} Management</h3>
            <p className="text-sm text-[#2D3436] opacity-40 italic mt-2">
              Deep inventory management including biological batch tracking and energetic certification is coming to the next iteration of the Vendor Ecosystem.
            </p>
          </div>
          <button className="px-8 py-4 bg-[#5A5A40] text-white rounded-2xl font-bold shadow-lg hover:bg-[#4A4A30] transition-all">
            Add New {activeTab.slice(0, -1)}
          </button>
        </div>
      )}
    </div>
  );
};

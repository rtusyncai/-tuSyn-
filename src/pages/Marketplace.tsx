import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Search, Filter, Gem, Info, ShoppingCart, Check, ArrowRight, Sparkles, Loader2, Stethoscope, MapPin, Plus, X as CloseIcon, Building2, UserCircle, Hospital as HospitalIcon, Sprout, Clock, Wind, Utensils, Camera, Navigation, Bell, Flower, Coins, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { db, handleFirestoreError, OperationType, trackEngagement } from '../lib/firebase';
import { doc, getDoc, collection, addDoc, onSnapshot, query, where, serverTimestamp, limit, updateDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { geminiService } from '../services/geminiService';
import { useToast } from '../hooks/useToast';
import { charityService, Charity } from '../services/charityService';
import { Heart, Store, QrCode, CheckCircle, X } from 'lucide-react';
import { LocalStoreSync } from '../components/LocalStoreSync';

const INITIAL_PRODUCTS = [
  { 
    id: '1', 
    name: 'Triphala Churna', 
    description: 'Digestive support and detoxification.', 
    price: 15.99, 
    category: 'Digestion', 
    dosha: 'Tridoshic', 
    image: 'triphala',
    energetics: {
      rasa: ['Sour', 'Bitter', 'Pungent', 'Astringent', 'Sweet'],
      virya: 'Neutral',
      vipaka: 'Sweet',
      guna: ['Light', 'Dry']
    }
  },
  { 
    id: '2', 
    name: 'Ashwagandha Capsules', 
    description: 'Stress relief and vitality.', 
    price: 24.99, 
    category: 'Vitality', 
    dosha: 'Vata/Kapha', 
    image: 'ashwagandha',
    energetics: {
      rasa: ['Bitter', 'Astringent', 'Sweet'],
      virya: 'Heating',
      vipaka: 'Sweet',
      guna: ['Unctuous', 'Heavy']
    }
  },
  { 
    id: '3', 
    name: 'Brahmi Oil', 
    description: 'Memory and cognitive support.', 
    price: 19.99, 
    category: 'Mind', 
    dosha: 'Pitta', 
    image: 'brahmi',
    energetics: {
      rasa: ['Bitter', 'Astringent'],
      virya: 'Cooling',
      vipaka: 'Sweet',
      guna: ['Light', 'Unctuous']
    }
  },
  { 
    id: '4', 
    name: 'Chyawanprash', 
    description: 'Immunity booster and rejuvenation.', 
    price: 29.99, 
    category: 'Immunity', 
    dosha: 'Tridoshic', 
    image: 'chyawanprash',
    energetics: {
      rasa: ['Sweet', 'Sour', 'Pungent'],
      virya: 'Heating',
      vipaka: 'Sweet',
      guna: ['Heavy', 'Unctuous']
    }
  },
  { 
    id: '5', 
    name: 'Kumkumadi Oil', 
    description: 'Skin radiance and anti-aging.', 
    price: 45.99, 
    category: 'Cosmetics', 
    dosha: 'Pitta/Kapha', 
    image: 'kumkumadi',
    energetics: {
      rasa: ['Bitter', 'Astringent'],
      virya: 'Cooling',
      vipaka: 'Sweet',
      guna: ['Unctuous', 'Smooth']
    }
  },
  { 
    id: '6', 
    name: 'Shatavari Powder', 
    description: 'Hormonal balance and reproductive health.', 
    price: 22.99, 
    category: 'Hormonal', 
    dosha: 'Pitta/Vata', 
    image: 'shatavari',
    energetics: {
      rasa: ['Sweet', 'Bitter'],
      virya: 'Cooling',
      vipaka: 'Sweet',
      guna: ['Heavy', 'Unctuous']
    }
  },
  { 
    id: '7', 
    name: 'Lotus Petal Face Mist', 
    description: 'Hydrating and Pitta-calming facial toner.', 
    price: 18.00, 
    category: 'Cosmetics', 
    dosha: 'Pitta', 
    image: 'face-mist',
    energetics: {
      rasa: ['Sweet', 'Astringent'],
      virya: 'Cooling',
      vipaka: 'Sweet',
      guna: ['Light', 'Cold']
    }
  },
  { 
    id: '8', 
    name: 'Santal Glow Serum', 
    description: 'Traditional sandalwood based restoration.', 
    price: 32.50, 
    category: 'Cosmetics', 
    dosha: 'Vata/Pitta', 
    image: 'glow-serum',
    energetics: {
      rasa: ['Bitter', 'Sweet'],
      virya: 'Cooling',
      vipaka: 'Sweet',
      guna: ['Light', 'Unctuous']
    }
  },
];

const INITIAL_SERVICES = [
  { 
    id: 's7', 
    name: 'Neural Chrono-Sync Rejuvenation', 
    provider: 'ṚtuSyn Sanctuary HQ', 
    description: '7-Day bio-individualized retreat. Treatments (Abhyanga, Shirodhara) are synchronized in real-time with your neural and circadian rhythms.', 
    type: 'Retreat', 
    category: 'Ayurveda', 
    location: 'Himalayan Foothills / Virtual VR', 
    rating: 5.0,
    price: 1499.00
  },
  { id: 's1', name: 'Ayurvedic Wellness Retreat', provider: 'Himalayan Sanctuary', description: '7-day detox and rejuvenation program.', type: 'Retreat', category: 'Ayurveda', location: 'Rishikesh, India', rating: 4.9, price: 999.00 },
  { id: 's2', name: 'Thai Massage Therapy', provider: 'Zen Hands', description: 'Traditional Thai pressure point therapy.', type: 'Therapist', category: 'Thai', location: 'Bangkok, Thailand', rating: 4.8, price: 85.00 },
  { id: 's3', name: 'Shiatsu Healing Session', provider: 'Ki Flow', description: 'Japanese finger-pressure therapy for energy balance.', type: 'Therapist', category: 'Shiatsu', location: 'Kyoto, Japan', rating: 4.7, price: 95.00 },
  { id: 's4', name: 'Integrative Physio', provider: 'Modern Health Hospital', description: 'Combining modern physiotherapy with Ayurvedic principles.', type: 'Hospital', category: 'Physio', location: 'London, UK', rating: 4.6, price: 120.00 },
  { id: 's5', name: 'Vinyasa Yoga Workshop', provider: 'Prana Studio', description: 'Dynamic flow for physical and mental agility.', type: 'Therapist', category: 'Yoga', location: 'Los Angeles, USA', rating: 4.9, price: 45.00 },
  { id: 's6', name: 'Panchakarma Clinical Detox', provider: 'AyurMed Hospital', description: 'Advanced clinical detoxification under medical supervision.', type: 'Hospital', category: 'Ayurveda', location: 'Kerala, India', rating: 5.0, price: 1200.00 },
];

export const MarketplacePage = () => {
  const { user } = useAuth();
  const { items: cartItems, addToCart, removeFromCart, totalPrice: cartTotalPrice, setIsOpen: setIsCartOpen } = useCart();
  const navigate = useNavigate();
  const cartIds = cartItems.map(item => item.id);

  const [profile, setProfile] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'products' | 'services' | 'produce' | 'meals' | 'dropship'>('products');
  const [ojasPoints, setOjasPoints] = useState(750); // Simulated user balance
  const [pointsRedeemed, setPointsRedeemed] = useState(0);
  const [isBurnOjas, setIsBurnOjas] = useState(false);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [services, setServices] = useState<any[]>(INITIAL_SERVICES);
  const [produce, setProduce] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [hypermarketItems, setHypermarketItems] = useState<any[]>([]);
  const [logistics, setLogistics] = useState<any>(null);
  const [isLogisticsLoading, setIsLogisticsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [serviceRecs, setServiceRecs] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [curatedPackage, setCuratedPackage] = useState<any>(null);
  const [isCurating, setIsCurating] = useState(false);
  const [curationGoal, setCurationGoal] = useState('');
  const [showCurateModal, setShowCurateModal] = useState(false);
  const { toast } = useToast();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [showProduceModal, setShowProduceModal] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const [analyzingCuisine, setAnalyzingCuisine] = useState(false);
  const [cuisineResult, setCuisineResult] = useState<any>(null);

  const [analyzingFlora, setAnalyzingFlora] = useState(false);
  const [floraResult, setFloraResult] = useState<any>(null);
  const [isDiffusing, setIsDiffusing] = useState(false);

  // Global Marketplace Discovery
  const [globalItems, setGlobalItems] = useState<any[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [userRegion, setUserRegion] = useState('Global');
  const [syncedStore, setSyncedStore] = useState<{ name: string; suggestions: any[] } | null>(null);

  useEffect(() => {
    // Detect region for store personalization
    if (navigator.language.includes('in') || navigator.language.includes('IN')) {
      setUserRegion('India');
    }
  }, []);

  const handleGlobalSearch = async () => {
    if (!searchTerm && selectedCategory === 'All') {
      setGlobalItems([]);
      return;
    }
    setLoadingGlobal(true);
    try {
      const items = await geminiService.searchGlobalMarketplace(searchTerm || selectedCategory, viewMode, userRegion, profile?.dosha);
      setGlobalItems(items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingGlobal(false);
    }
  };

  const handleHypermarketSearch = async () => {
    if (!searchTerm) {
      setHypermarketItems([]);
      return;
    }
    setLoadingGlobal(true);
    try {
      const items = await geminiService.searchHypermarketInventory(searchTerm, userRegion);
      setHypermarketItems(items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingGlobal(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (viewMode === 'dropship') {
        handleHypermarketSearch();
      } else {
        handleGlobalSearch();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, viewMode]);

  const handleStoreSync = (name: string, suggestions: any[]) => {
    setSyncedStore({ name, suggestions });
    // Scroll to the sync section after a brief delay for rendering
    setTimeout(() => {
      document.getElementById('local-sync-results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    description: '',
    type: 'Therapist',
    category: 'Ayurveda',
    location: '',
    price: '',
    unit: 'session'
  });

  const [produceData, setProduceData] = useState({
    name: '',
    description: '',
    price: '',
    unit: 'kg',
    category: 'Vegetables',
    location: '',
    regionalAvailability: 'Local',
    organic: true,
    image: null as string | null
  });

  const [mealData, setMealData] = useState({
    price: '',
    location: '',
    portions: '1',
    isCompliant: false,
    cookingMethod: 'Slow Cooked',
    regionalAvailability: 'Immediate'
  });

  const [notification, setNotification] = useState<{ title: string; body: string } | null>(null);
  const [currentCharity, setCurrentCharity] = useState<Charity | null>(null);

  useEffect(() => {
    const fetchCharity = async () => {
      const charity = await charityService.getCurrentCharity();
      setCurrentCharity(charity);
    };
    fetchCharity();
  }, []);

  useEffect(() => {
    // Simulate periodic notifications for travelers
    if (viewMode === 'meals' && !showDashboard) {
      const timer = setTimeout(() => {
        setNotification({
          title: "Bio-Sync Alert: Nearby Cooler Kitchen",
          body: "A Pitta-Cooling Saffron Rice is available 0.8 miles ahead. Matches your current neural thermal peak."
        });
        setTimeout(() => setNotification(null), 8000);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [viewMode, showDashboard]);

  useEffect(() => {
    // Listen for real services from Firestore
    const path = 'marketplace_services';
    const q = query(collection(db, path));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreServices = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setServices([...INITIAL_SERVICES, ...firestoreServices]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Listen for produce from Firestore
    const path = 'marketplace_produce';
    const q = query(collection(db, path));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProduce(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Listen for meals from Firestore
    const path = 'marketplace_meals';
    const q = query(collection(db, path));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMeals(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
    return () => unsubscribe();
  }, []);

  const handleCuisinePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzingCuisine(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await geminiService.analyzeCuisine(base64, profile?.healthData);
        setCuisineResult(result);
        setAnalyzingCuisine(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      toast("Failed to analyze meal photo.", "error");
      setAnalyzingCuisine(false);
    }
  };

  const handleFloraPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzingFlora(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await geminiService.analyzeFlora(base64);
        setFloraResult(result);
        setAnalyzingFlora(false);
        toast(`Flora detected: ${result.name}. IoT Dashboard synced.`, "success");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      toast("Failed to analyze flora.", "error");
      setAnalyzingFlora(false);
    }
  };

  const startScentDiffusion = () => {
    if (!floraResult) return;
    setIsDiffusing(true);
    toast(`IoT Trigger: Diffusing curated ${floraResult.name} scent profile...`, "success");
    setTimeout(() => {
      setIsDiffusing(false);
      toast("Scent cycle completed. Air harmonized.", "success");
    }, 5000);
  };

  const handleOptimizeDropship = async () => {
    if (hypermarketItems.length === 0) return;
    setIsLogisticsLoading(true);
    try {
      const optimization = await geminiService.optimizeDropshipLogistics(hypermarketItems, profile?.location || userRegion);
      setLogistics(optimization);
      toast("Neural Logistics Path Optimized!", "success");
    } catch (error) {
      console.error(error);
      toast("Failed to optimize logistics.", "error");
    } finally {
      setIsLogisticsLoading(false);
    }
  };

  const handleRegisterMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !cuisineResult) return;
    setRegistering(true);
    const path = 'marketplace_meals';
    try {
      await addDoc(collection(db, path), {
        ...cuisineResult,
        price: parseFloat(mealData.price),
        location: mealData.location,
        portions: parseInt(mealData.portions),
        isCompliant: mealData.isCompliant,
        cookingMethod: mealData.cookingMethod,
        regionalAvailability: mealData.regionalAvailability,
        userId: user.uid,
        userName: profile?.name || user.email,
        createdAt: serverTimestamp(),
      });
      setShowMealModal(false);
      setCuisineResult(null);
      setMealData({ price: '', location: '', portions: '1', isCompliant: false, cookingMethod: 'Slow Cooked', regionalAvailability: 'Immediate' });
      toast("Your meal has been manifested in the exchange!", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setRegistering(false);
    }
  };

  const toggleCart = (id: string) => {
    const product = products.find(p => p.id === id) || produce.find(p => p.id === id) || meals.find(m => m.id === id);
    if (!product) return;

    if (cartIds.includes(id)) {
      removeFromCart(id);
    } else {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image || `https://picsum.photos/seed/${product.id}/300/300`,
        description: product.description
      });
      setIsCartOpen(true);
    }
  };

  const handleRegisterProduce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setRegistering(true);
    const path = 'marketplace_produce';
    try {
      await addDoc(collection(db, path), {
        ...produceData,
        userId: user.uid,
        userName: profile?.name || user.email?.split('@')[0],
        price: parseFloat(produceData.price),
        createdAt: serverTimestamp(),
      });
      setShowProduceModal(false);
      setProduceData({
        name: '',
        description: '',
        price: '',
        unit: 'kg',
        category: 'Vegetables',
        location: '',
        regionalAvailability: 'Local',
        organic: true,
        image: null
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setRegistering(false);
    }
  };

  const handleBooking = async (service: any) => {
    if (!user) return;
    setRegistering(true);
    try {
      await addDoc(collection(db, 'bookings'), {
        userId: user.uid,
        serviceId: service.id,
        serviceName: service.name,
        provider: service.provider,
        price: service.price,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      toast(`Successfully requested booking for ${service.name}!`, "success");
    } catch (error) {
      console.error(error);
      toast('Failed to book service.', "error");
    } finally {
      setRegistering(false);
    }
  };

  const handleCurate = async () => {
    if (!curationGoal || !user) return;
    setIsCurating(true);
    try {
      const result = await geminiService.curateCustomPackage(curationGoal, profile?.healthData);
      setCuratedPackage(result);
      setShowCurateModal(true);
      trackEngagement('marketplace');
    } catch (error) {
      console.error(error);
      toast("Failed to curate your package. Please try again.", "error");
    } finally {
      setIsCurating(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const docRef = doc(db, 'profiles', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        
        // Get personalized recommendations
        if (data.healthData || data.dosha) {
          setLoadingRecs(true);
          try {
            const [prodRecs, servRecs] = await Promise.all([
              geminiService.recommendMarketplaceProducts(
                { dosha: data.dosha, ...data.healthData },
                INITIAL_PRODUCTS
              ),
              geminiService.recommendMarketplaceServices(
                { dosha: data.dosha, ...data.healthData },
                services
              )
            ]);
            setRecommendations(prodRecs);
            setServiceRecs(servRecs);
          } catch (error) {
            console.error(error);
          } finally {
            setLoadingRecs(false);
          }
        }
      }
    };
    fetchProfile();
  }, [user, services.length]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setRegistering(true);
    const path = 'marketplace_services';
    try {
      await addDoc(collection(db, path), {
        ...formData,
        userId: user.uid,
        rating: 5.0, // Initial rating
        createdAt: serverTimestamp(),
      });
      setShowRegisterModal(false);
      setFormData({
        name: '',
        provider: '',
        description: '',
        type: 'Therapist',
        category: 'Ayurveda',
        location: '',
        price: '',
        unit: 'session'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setRegistering(false);
    }
  };

  const categories = viewMode === 'products' 
    ? Array.from(new Set(['All', 'Poultry', 'Dairy', 'Cosmetics', 'Groceries', ...INITIAL_PRODUCTS.map(p => p.category)]))
    : viewMode === 'services'
      ? Array.from(new Set(['All', ...services.map(s => s.category)]))
      : viewMode === 'produce'
        ? Array.from(new Set(['All', 'Poultry', 'Dairy', 'Groceries', ...produce.map(p => p.category)]))
        : ['All', 'Vata-Pacifying', 'Pitta-Cooling', 'Kapha-Reducing', 'Tridoshic'];

  const filteredItems = viewMode === 'products'
    ? products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              p.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
    : viewMode === 'services' 
      ? services.filter(s => {
          const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                s.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                s.description.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
          return matchesSearch && matchesCategory;
        })
      : viewMode === 'produce'
        ? produce.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  p.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  p.regionalAvailability?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
            return matchesSearch && matchesCategory;
          })
        : meals.filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  m.cookingMethod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  m.regionalAvailability?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || m.ayurvedicProfile.dosha.includes(selectedCategory);
            return matchesSearch && matchesCategory;
          });

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setRegistering(true); // Reusing loading state for simplicity
    try {
      const subtotal = cartTotalPrice;
      const finalPrice = isBurnOjas ? Math.max(0, subtotal - (ojasPoints / 100)) : subtotal;
      
      if (isBurnOjas && finalPrice === 0) {
        toast(`Sacred Harmonization Complete! Your ${ojasPoints} Ojas points have fully manifested these artifacts.`, "success");
        setOjasPoints(prev => prev - (Math.floor(subtotal * 100)));
        setIsBurnOjas(false);
        setRegistering(false);
        // Normally would clear cart here but cart logic is in a hook
        return;
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItems }),
      });
      const data = await response.json();
      const { url, error, orderId, simulatedUrl } = data;
      
      if (url || simulatedUrl) {
        // Track donation if charity is active
        if (currentCharity) {
          const subtotal = cartTotalPrice;
          const donationAmount = subtotal * (currentCharity.donationPercentage / 100);
          await charityService.trackDonation(
            orderId || 'pending_' + Date.now(),
            donationAmount,
            currentCharity.id || 'system',
            currentCharity.name
          );
        }
        window.location.href = url || simulatedUrl;
      } else {
        throw new Error(error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      console.error(error);
      const isKeyError = error.message?.includes('Invalid API Key') || error.message?.includes('STRIPE_SECRET_KEY');
      toast(
        isKeyError 
          ? "Stripe Configuration Error: Please ensure you have provided a valid Stripe Secret Key (sk_test_...) in the application Settings." 
          : "Harmonization Error: Checkout failed. Please try again later.", 
        "error"
      );
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="space-y-12 pb-20 relative">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className="fixed top-24 right-8 z-[100] w-80 bg-indigo-900/90 text-white p-6 rounded-[32px] border border-white/20 shadow-2xl backdrop-blur-xl flex gap-4"
          >
            <div className="p-3 bg-indigo-500 rounded-2xl h-fit">
              <Bell size={20} className="animate-bounce" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm leading-tight">{notification.title}</h4>
              <p className="text-xs opacity-70 leading-relaxed">{notification.body}</p>
              <button 
                onClick={() => setShowDashboard(true)}
                className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest pt-2 flex items-center gap-1 hover:text-white transition-colors"
              >
                Sync Dashboard <ArrowRight size={10} />
              </button>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="absolute top-4 right-4 opacity-50 hover:opacity-100"
            >
              <CloseIcon size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Live Marketplace Sync</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100">
              <Sparkles size={10} className="animate-spin-slow" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Neural Delivery Active</span>
            </div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate('/profile')}
              className="flex items-center gap-1.5 px-3 py-1 bg-white text-[#5A5A40] rounded-full border border-[#D1D1C1] cursor-pointer shadow-sm ml-2"
            >
              <Coins size={12} className="text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">{ojasPoints.toLocaleString()} ✧</span>
            </motion.div>
          </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#5A5A40]">Ayurvedic Marketplace</h2>
        <p className="text-lg sm:text-xl text-[#2D3436] opacity-70 italic">Sacred remedies and professional services for your holistic wellbeing.</p>
        
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 mt-8">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => { setViewMode('products'); setSelectedCategory('All'); }}
              className={cn(
                "px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center gap-2 text-xs sm:text-sm",
                viewMode === 'products' ? "bg-[#5A5A40] text-white shadow-xl scale-105" : "bg-white text-[#5A5A40] border border-[#D1D1C1] hover:bg-[#F5F5F0]"
              )}
            >
              <ShoppingBag size={18} />
              Products
            </button>
            <button
              onClick={() => { setViewMode('services'); setSelectedCategory('All'); }}
              className={cn(
                "px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center gap-2 text-xs sm:text-sm",
                viewMode === 'services' ? "bg-[#5A5A40] text-white shadow-xl scale-105" : "bg-white text-[#5A5A40] border border-[#D1D1C1] hover:bg-[#F5F5F0]"
              )}
            >
              <Stethoscope size={18} />
              Services
            </button>
            <button
              onClick={() => { setViewMode('produce'); setSelectedCategory('All'); }}
              className={cn(
                "px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center gap-2 text-xs sm:text-sm",
                viewMode === 'produce' ? "bg-[#5A5A40] text-white shadow-xl scale-105" : "bg-white text-[#5A5A40] border border-[#D1D1C1] hover:bg-[#F5F5F0]"
              )}
            >
              <Sprout size={18} />
              Kitchen Produce
            </button>
            <button
              onClick={() => { setViewMode('meals'); setSelectedCategory('All'); }}
              className={cn(
                "px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center gap-2 text-xs sm:text-sm",
                viewMode === 'meals' ? "bg-[#5A5A40] text-white shadow-xl scale-105" : "bg-white text-[#5A5A40] border border-[#D1D1C1] hover:bg-[#F5F5F0]"
              )}
            >
              <Utensils size={18} />
              Home Meals
            </button>
            <button
              onClick={() => { setViewMode('dropship'); setSelectedCategory('All'); }}
              className={cn(
                "px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center gap-2 text-xs sm:text-sm",
                viewMode === 'dropship' ? "bg-amber-600 text-white shadow-xl scale-105" : "bg-white text-[#5A5A40] border border-[#D1D1C1] hover:bg-amber-50"
              )}
            >
              <Building2 size={18} />
              Hyper-Dropship
            </button>
          </div>
          
          <div className="h-8 w-px bg-[#D1D1C1] hidden lg:block mx-4" />
          
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => {
                if (viewMode === 'produce') setShowProduceModal(true);
                else if (viewMode === 'meals') setShowMealModal(true);
                else setShowRegisterModal(true);
              }}
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm text-[10px] sm:text-xs uppercase tracking-widest"
            >
              <Plus size={14} />
              {viewMode === 'produce' ? 'List Produce' : viewMode === 'meals' ? 'List Meal' : 'Register Provider'}
            </button>
            
            <button
              onClick={() => {
                if (viewMode === 'meals') setShowDashboard(true);
                else {
                  const el = document.getElementById('curation-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className={cn(
                "px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-white font-bold transition-all flex items-center gap-2 shadow-sm text-[10px] sm:text-xs uppercase tracking-widest",
                viewMode === 'meals' ? "bg-indigo-600 hover:bg-indigo-700" : "bg-amber-500 hover:bg-amber-600"
              )}
            >
              {viewMode === 'meals' ? <Navigation size={14} /> : <Gem size={14} />}
              {viewMode === 'meals' ? 'Sync Traveler' : 'Curate Package'}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Curation Section */}
      <section id="curation-section" className="bg-[#5A5A40] rounded-[40px] p-8 sm:p-12 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Gem size={200} />
        </div>
        
        <div className="relative z-10 max-w-2xl space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20">
              <Sparkles size={16} className="text-amber-300" />
              <span className="text-xs font-bold uppercase tracking-widest">Exclusive Concierge</span>
            </div>
            <h3 className="text-4xl font-serif font-bold">Curate Your Sacred Wellness Package</h3>
            <p className="text-lg opacity-70 italic font-serif">
              Our AIveda doctors will design a multi-day journey of neural chrono-sync treatments, 
              medicinal dietary protocols, and sonic entrainment tailored to your specific goal.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              value={curationGoal}
              onChange={(e) => setCurationGoal(e.target.value)}
              placeholder="e.g., Deep detox before summer, optimize focus for exam season..."
              className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-amber-500 outline-none text-white placeholder:text-white/40"
            />
            <button
              onClick={handleCurate}
              disabled={isCurating || !curationGoal}
              className="bg-amber-500 hover:bg-amber-600 text-[#5A5A40] font-bold px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shrink-0"
            >
              {isCurating ? <Loader2 className="animate-spin" size={20} /> : <Gem size={20} />}
              Curate Now
            </button>
          </div>
        </div>
      </section>
      {/* Local Store Sync Section */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-2xl font-serif font-bold text-[#5A5A40]">Nearby Artifacts</h3>
            <p className="text-sm text-[#2D3436] opacity-60 italic">Synchronize with local wellness nodes and apothecary inventory.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-[#D1D1C1] text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest shadow-sm">
            <CheckCircle className="text-emerald-500" size={14} /> 
            Proximity Verified
          </div>
        </div>
        
        <LocalStoreSync onSync={handleStoreSync} userDosha={profile?.dosha || 'Vata'} />
        
        {syncedStore && (
          <motion.div 
            id="local-sync-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 sm:p-12 bg-white rounded-[40px] border border-[#5A5A40]/10 shadow-2xl space-y-10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-[#5A5A40] text-white rounded-3xl shadow-lg">
                  <Store size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-serif font-bold text-[#5A5A40]">{syncedStore.name}</h3>
                  <p className="text-xs font-bold text-[#5A5A40]/40 uppercase tracking-widest">Inventory Synchronized ({syncedStore.suggestions.length} matches)</p>
                </div>
              </div>
              <button 
                onClick={() => setSyncedStore(null)}
                className="p-3 hover:bg-red-50 text-red-400 rounded-full transition-colors"
                title="Disconnect from store"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {syncedStore.suggestions.map((item: any, i: number) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 bg-[#F5F5F0] rounded-[32px] border border-[#D1D1C1]/30 space-y-4 hover:shadow-xl transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-[#5A5A40] group-hover:bg-[#5A5A40] group-hover:text-white transition-colors">
                      <ShoppingBag size={20} />
                    </div>
                    <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black tracking-widest uppercase border border-emerald-200">
                      High Alignment
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#5A5A40] text-lg">{item.name}</h4>
                    <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider font-mono">{item.category}</p>
                  </div>
                  <p className="text-sm italic text-[#2D3436]/70 leading-relaxed font-serif">"{item.reason}"</p>
                  <div className="pt-4 border-t border-[#D1D1C1]/50 flex items-center justify-between">
                    <div className="text-sm font-bold text-[#5A5A40]">{item.estimatedPrice}</div>
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#5A5A40] hover:text-amber-600 transition-colors">
                      Locate Shelf <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </section>

      {(recommendations.length > 0 || serviceRecs.length > 0) && (
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-[#5A5A40]">
            <Sparkles size={24} className="text-amber-500" />
            <h3 className="text-2xl font-bold">Recommended for Your {profile?.dosha} Energy</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {viewMode === 'products' ? recommendations.map((rec: any) => {
              const product = INITIAL_PRODUCTS.find(p => p.id === rec.productId);
              if (!product) return null;
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-50/50 p-6 rounded-3xl border border-amber-200/50 space-y-4 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles size={64} />
                  </div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-[#5A5A40] text-lg">{product.name}</h4>
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full uppercase tracking-widest">Match</span>
                  </div>
                  <p className="text-xs italic text-[#2D3436] opacity-70 leading-relaxed">
                    "{rec.reason}"
                  </p>

                  {product.energetics && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-amber-200/30">
                      <span className="text-[7px] font-bold text-amber-800/40 uppercase tracking-tighter">Energetics:</span>
                      <span className="text-[8px] font-bold text-blue-600/70">{product.energetics.virya}</span>
                      <span className="text-[8px] font-bold text-emerald-600/70">{product.energetics.vipaka}</span>
                      <div className="flex gap-1">
                        {product.energetics.rasa.slice(0, 2).map((r: string) => (
                          <span key={r} className="text-[8px] font-bold text-amber-600/70">{r}</span>
                        ))}
                        {product.energetics.rasa.length > 2 && <span className="text-[8px] font-bold text-amber-600/70">...</span>}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => toggleCart(product.id)}
                    className="w-full py-2 rounded-xl bg-white border border-amber-200 text-[#5A5A40] text-xs font-bold hover:bg-amber-100 transition-all"
                  >
                    {cartIds.includes(product.id) ? 'In Cart' : 'Add to Cart'}
                  </button>
                </motion.div>
              );
            }) : serviceRecs.map((rec: any) => {
              const service = services.find(s => s.id === rec.serviceId);
              if (!service) return null;
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-200/50 space-y-4 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Stethoscope size={64} />
                  </div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-emerald-800 text-lg">{service.name}</h4>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full uppercase tracking-widest">Expert Match</span>
                  </div>
                  <p className="text-xs italic text-[#2D3436] opacity-70 leading-relaxed">
                    "{rec.reason}"
                  </p>
                  <button
                    className="w-full py-2 rounded-xl bg-white border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-all"
                  >
                    Book Consultation
                  </button>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Home Cuisine Registration Modal */}
      <AnimatePresence>
        {showMealModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-[#D1D1C1] flex items-center justify-between bg-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white text-indigo-600 rounded-2xl shadow-sm">
                    <Utensils size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#5A5A40]">Manifest Fresh Meal</h3>
                    <p className="text-xs text-[#2D3436] opacity-60">Photo-analyzed Ayurvedic nutrition exchange.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMealModal(false)}
                  className="p-2 hover:bg-[#D1D1C1] rounded-full transition-all"
                >
                  <CloseIcon size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8">
                {!cuisineResult ? (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#D1D1C1] rounded-[32px] p-12 bg-[#F5F5F0] hover:border-indigo-500 transition-colors relative group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleCuisinePhoto}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      {analyzingCuisine ? (
                        <div className="text-center space-y-4">
                          <Loader2 size={48} className="text-indigo-600 animate-spin mx-auto" />
                          <p className="font-bold text-[#5A5A40]">AIveda Nutritionist analyzing ingredients...</p>
                        </div>
                      ) : (
                        <div className="text-center space-y-4">
                          <div className="p-6 bg-white rounded-full text-indigo-600 shadow-xl group-hover:scale-110 transition-transform">
                            <Camera size={48} />
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-[#5A5A40] text-lg">Snap Cuisine Photo</p>
                            <p className="text-sm opacity-50 italic">AI will analyze biological profile & clinical resonance</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleRegisterMeal} className="space-y-6">
                    <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex gap-6">
                      <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center text-indigo-600">
                        <Check size={40} />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h4 className="font-bold text-indigo-900 text-lg">{cuisineResult.name}</h4>
                        <p className="text-xs italic opacity-70 leading-relaxed">"{cuisineResult.description}"</p>
                        <div className="flex flex-wrap gap-2 pt-2">
                           <span className="px-2 py-0.5 bg-white rounded-full text-[8px] font-bold border border-indigo-100 text-indigo-600 uppercase tracking-widest">{cuisineResult.ayurvedicProfile.dosha}</span>
                           {cuisineResult.ayurvedicProfile.rasa.map((r: string) => (
                             <span key={r} className="px-2 py-0.5 bg-indigo-100 rounded-full text-[8px] font-bold text-indigo-800 uppercase tracking-widest">{r}</span>
                           ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">Price ($)</label>
                        <input
                          required
                          type="number"
                          step="0.01"
                          value={mealData.price}
                          onChange={(e) => setMealData({...mealData, price: e.target.value})}
                          className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">Portions</label>
                        <input
                          required
                          type="number"
                          value={mealData.portions}
                          onChange={(e) => setMealData({...mealData, portions: e.target.value})}
                          className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">Location</label>
                        <input
                          required
                          value={mealData.location}
                          onChange={(e) => setMealData({...mealData, location: e.target.value})}
                          placeholder="Hyperlocal pickup area"
                          className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">Cooking Method</label>
                        <select 
                          value={mealData.cookingMethod}
                          onChange={(e) => setMealData({ ...mealData, cookingMethod: e.target.value })}
                          className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option>Slow Cooked</option>
                          <option>Raw / Fresh</option>
                          <option>Steamed</option>
                          <option>Stir-fried</option>
                          <option>Wood-fired</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">Availability Range</label>
                        <select 
                          value={mealData.regionalAvailability}
                          onChange={(e) => setMealData({ ...mealData, regionalAvailability: e.target.value })}
                          className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option>Immediate</option>
                          <option>Within 2 Miles</option>
                          <option>City-wide Delivery</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-6 bg-[#F5F5F0] rounded-3xl space-y-4">
                      <div className="flex items-start gap-4">
                        <input 
                          type="checkbox"
                          required
                          checked={mealData.isCompliant}
                          onChange={(e) => setMealData({...mealData, isCompliant: e.target.checked})}
                          className="mt-1 w-5 h-5 rounded border-[#D1D1C1] text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">Regional Compliance Verification</p>
                          <p className="text-[10px] text-[#2D3436] opacity-60 leading-relaxed">
                            I verify that this home kitchen complies with local Cottage Food laws or regional health department guidelines. 
                            My "Nutrition Passport" analysis above accurately reflects the prepared dish.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                      <button
                        type="button"
                        onClick={() => setCuisineResult(null)}
                        className="flex-1 py-5 rounded-3xl bg-[#F5F5F0] text-[#5A5A40] font-bold hover:bg-[#D1D1C1] transition-all"
                      >
                        Retake Photo
                      </button>
                      <button
                        type="submit"
                        disabled={registering}
                        className="flex-1 py-5 rounded-3xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {registering ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                        List for Traveler Sync
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Traveler Dashboard Simulation */}
      <AnimatePresence>
        {showDashboard && (
          <div className="fixed inset-0 z-[100] bg-slate-900 overflow-hidden flex flex-col items-center justify-center p-4">
             <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="w-full max-w-5xl aspect-video bg-[#1a1a2e] rounded-[60px] border-[12px] border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex relative"
             >
                {/* Car Dashboard Simulation */}
                <div className="w-[300px] h-full bg-slate-800/50 border-r border-white/5 p-8 flex flex-col">
                   <div className="flex items-center gap-3 mb-12">
                      <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                         <Navigation size={24} />
                      </div>
                      <div>
                         <h2 className="text-white font-bold">ṚtuSyn</h2>
                         <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Connect Drive</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="p-4 bg-indigo-600/20 rounded-2xl border border-indigo-500/30">
                         <div className="text-[10px] text-indigo-300 font-bold uppercase mb-1">Arriving Near</div>
                         <div className="text-white font-bold">Pitta-Cooling Zone</div>
                         <div className="text-[10px] opacity-50">Local humidity: 82%</div>
                      </div>
                      <div className="text-indigo-400 p-4 font-bold flex items-center gap-3">
                         <Bell size={18} />
                         Nearby Bites
                      </div>

                      {/* IoT Ambient Controls */}
                      <div className="p-5 bg-slate-800/80 rounded-[32px] border border-white/5 space-y-4">
                         <div className="flex items-center justify-between px-2">
                            <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest leading-none">Ambient Intelligence</div>
                            <div className="flex items-center gap-1.5 text-[8px] text-emerald-400 font-bold uppercase">
                               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                               IoT Hub Active
                            </div>
                         </div>

                         {!floraResult ? (
                           <div className="relative group p-2">
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleFloraPhoto}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                              />
                              <div className="p-6 bg-white/5 border border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center text-center gap-2 group-hover:bg-white/10 transition-colors">
                                 {analyzingFlora ? (
                                   <Loader2 className="animate-spin text-indigo-400" size={24} />
                                 ) : (
                                   <>
                                      <Camera size={20} className="text-white/40" />
                                      <div className="text-[9px] text-white font-bold uppercase tracking-wide">Flora Sync Scanner</div>
                                      <div className="text-[8px] text-white/30 italic leading-tight px-4">Local botanical analysis for IoT scent curation</div>
                                   </>
                                 )}
                              </div>
                           </div>
                         ) : (
                           <div className="space-y-4 p-2">
                              <div className="p-4 bg-indigo-900/40 rounded-2xl border border-indigo-500/30">
                                 <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-white text-sm">{floraResult.name}</h4>
                                    <span className="text-[8px] font-bold text-indigo-300 uppercase tracking-widest bg-indigo-500/20 px-1.5 py-0.5 rounded">Detected</span>
                                 </div>
                                 <p className="text-[9px] text-white/60 italic leading-relaxed mb-3">"{floraResult.ayurvedicSignificance}"</p>
                                 
                                 <div className="flex flex-wrap gap-1.5 mb-4">
                                    {floraResult.scentProfile.notes.map((n: string) => (
                                      <span key={n} className="text-[7px] font-bold text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase">{n}</span>
                                    ))}
                                 </div>

                                 <button 
                                   onClick={startScentDiffusion}
                                   disabled={isDiffusing}
                                   className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg"
                                 >
                                   {isDiffusing ? (
                                     <>
                                        <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                                        Diffusing Ambient Scent...
                                     </>
                                   ) : (
                                     <>
                                        <Flower size={14} />
                                        Sync IoT Diffuser
                                     </>
                                   )}
                                 </button>
                              </div>
                              <button 
                                onClick={() => setFloraResult(null)}
                                className="text-[9px] font-bold text-white/40 hover:text-white mx-auto block uppercase tracking-widest"
                               >
                                Reset Flora Sync
                              </button>
                           </div>
                         )}
                      </div>

                      <div className="mt-8 space-y-4">
                         <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest px-4">Bio-Terrain Telemetry</div>
                         <div className="flex px-4 gap-2">
                            <div className="flex-1 h-32 bg-white/5 rounded-2xl border border-white/10 p-3 flex flex-col justify-between">
                               <Wind size={16} className="text-cyan-400" />
                               <div>
                                  <div className="text-[8px] text-white/40 uppercase">Moisture</div>
                                  <div className="text-xs font-bold text-white">82%</div>
                               </div>
                            </div>
                            <div className="flex-1 h-32 bg-white/5 rounded-2xl border border-white/10 p-3 flex flex-col justify-between">
                               <Sparkles size={16} className="text-amber-400" />
                               <div>
                                  <div className="text-[8px] text-white/40 uppercase">Pitta Index</div>
                                  <div className="text-xs font-bold text-white">High</div>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>

                   <button 
                    onClick={() => setShowDashboard(false)}
                    className="mt-auto p-4 bg-slate-700 text-white rounded-2xl font-bold hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
                   >
                     Exit System
                   </button>
                </div>

                <div className="flex-1 p-12 bg-gradient-to-br from-slate-900 to-indigo-950 flex flex-col">
                   <header className="flex justify-between items-center mb-12">
                      <div>
                         <h1 className="text-5xl font-black text-white italic">HYPERLOCAL SYNC</h1>
                         <p className="text-indigo-300 opacity-60">Nearby bio-individualized home cuisine manifests</p>
                      </div>
                      <div className="flex items-center gap-8 text-right">
                         <div className="px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl">
                            <div className="text-[10px] text-indigo-400 font-bold uppercase">Regional Law</div>
                            <div className="text-white font-bold flex items-center gap-1.5">
                               <Check size={14} className="text-emerald-400" />
                               Compliant
                            </div>
                         </div>
                         <div>
                            <div className="text-4xl font-bold text-white tabular-nums">04:35</div>
                            <div className="text-indigo-400 uppercase font-black tracking-tighter">Apr 22</div>
                         </div>
                      </div>
                   </header>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 overflow-y-auto pr-4 custom-scrollbar">
                      {meals.map(meal => (
                        <div key={meal.id} className="bg-slate-800/80 backdrop-blur-xl p-8 rounded-[40px] border border-white/5 flex gap-8">
                           <div className="w-32 h-32 bg-indigo-500/20 rounded-[32px] overflow-hidden relative">
                              <img 
                                src={`https://picsum.photos/seed/${meal.id}/300/300`} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                alt="meal"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-indigo-950/20 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                 <MapPin size={24} className="text-white" />
                                 <span className="text-[8px] font-bold text-white uppercase tracking-widest mt-1">~0.8 mi</span>
                              </div>
                           </div>
                           <div className="flex-1 space-y-4">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <h3 className="text-2xl font-bold text-white">{meal.name}</h3>
                                    <p className="text-xs text-indigo-400 flex items-center gap-1">
                                       <MapPin size={12} />
                                       {meal.location}
                                    </p>
                                 </div>
                                 <div className="text-2xl font-black text-indigo-400">${meal.price}</div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                 <span className="px-3 py-1 bg-indigo-900/50 rounded-full text-[10px] font-bold text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">{meal.ayurvedicProfile.dosha}</span>
                                 {meal.isCompliant && (
                                   <span className="px-3 py-1 bg-emerald-900/30 rounded-full text-[10px] font-bold text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">Law Compliant</span>
                                 )}
                              </div>
                              <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-[0_10px_20px_rgba(79,70,229,0.3)]">
                                 Request Pickup
                              </button>
                           </div>
                        </div>
                      ))}
                      {meals.length === 0 && (
                        <div className="col-span-2 flex flex-col items-center justify-center text-center p-12 opacity-30">
                           <Utensils size={80} className="mb-4" />
                           <p className="text-2xl font-bold">Scanning Local Resonances...</p>
                        </div>
                      )}
                   </div>
                </div>

                {/* Dashboard Accents */}
                <div className="absolute bottom-12 left-[340px] right-12 h-1 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500 w-1/3 animate-pulse" />
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Local Store Discovery & Inventory Sync */}
      <section className="mb-12">
        <LocalStoreSync onSync={handleStoreSync} userDosha={profile?.dosha || 'Tridoshic'} />
      </section>

      {/* Sync Results Visualization */}
      <AnimatePresence>
        {syncedStore && (
          <motion.div 
            id="local-sync-results"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 bg-[#5A5A40]/5 rounded-[40px] border-2 border-[#5A5A40]/10 overflow-hidden"
          >
            <div className="p-8 border-b border-[#5A5A40]/10 bg-white/40 backdrop-blur-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-amber-400 text-black rounded-3xl shadow-lg">
                  <Check size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-[#5A5A40]">Inventory Synchronized</h3>
                  <p className="text-xs text-[#5A5A40]/60 italic">Node: <span className="font-bold opacity-100">{syncedStore.name}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setSyncedStore(null)}
                className="text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest hover:text-red-500 transition-colors"
              >
                Disconnect Node
              </button>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {syncedStore.suggestions.map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-6 rounded-3xl border border-[#D1D1C1]/30 shadow-sm hover:shadow-xl transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <ShoppingBag size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                      High Resonance
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-[#5A5A40] text-lg">{item.name}</h4>
                    <p className="text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">{item.category}</p>
                    <p className="text-xs text-[#2D3436]/70 italic leading-relaxed">
                      {item.reason}
                    </p>
                    <div className="pt-4 flex items-center justify-between">
                      <div className="text-sm font-black text-[#5A5A40]">{item.estimatedPrice}</div>
                      <button className="flex items-center gap-2 text-[10px] font-bold text-amber-600 uppercase tracking-widest hover:gap-3 transition-all">
                        Locate Shelf <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-6 rounded-3xl border border-[#D1D1C1] shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40] opacity-40" size={20} />
          <input
            type="text"
            placeholder={viewMode === 'products' ? "Search remedies..." : viewMode === 'dropship' ? "Search Hypermarket Bulk Catalog (Inventory Node Sync)..." : "Search therapists, retreats, hospitals..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap border",
                selectedCategory === cat 
                  ? "bg-[#5A5A40] text-white border-[#5A5A40] shadow-lg scale-105" 
                  : "bg-white text-[#5A5A40] border-[#D1D1C1]/50 hover:bg-[#F5F5F0] hover:border-[#5A5A40]/30"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {filteredItems.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 space-y-6 bg-white/50 rounded-[40px] border-2 border-dashed border-[#D1D1C1]/50 mb-12"
          >
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600">
              <Sparkles size={40} className="animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-3xl font-serif font-bold text-[#5A5A40]">Zero Local Resonance</h3>
                <p className="text-[#5A5A40]/60 max-w-lg mx-auto italic">
                  Nodes in your immediate proximity are currently silent for <span className="font-bold text-[#5A5A40]">"{searchTerm || selectedCategory}"</span>. 
                  However, ṚtuSyn’s neural engine can expand the search to global affiliate grids to find the perfect energetic match for you.
                </p>
              </div>
              
              {loadingGlobal ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <Loader2 className="animate-spin text-amber-600" size={32} />
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-[0.3em] animate-pulse">Deep-Scouring Global Nodes...</p>
                </div>
              ) : globalItems.length > 0 ? (
                <div className="bg-emerald-50 text-emerald-700 px-6 py-4 rounded-2xl border border-emerald-100 max-w-md mx-auto flex items-center gap-4">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl">
                    <Check size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Global Results Manifested</p>
                    <p className="text-[10px] opacity-70 italic font-serif">We found {globalItems.length} matches in the global network.</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
                className="px-8 py-3 bg-[#5A5A40]/10 text-[#5A5A40] rounded-2xl font-bold hover:bg-[#5A5A40]/20 transition-all text-xs uppercase tracking-widest"
              >
                Reset Filter
              </button>
              <button 
                onClick={() => {
                  const el = document.getElementById('external-discovery-lab');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    handleGlobalSearch();
                  }
                }}
                className="px-8 py-3 bg-amber-600 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3 text-xs uppercase tracking-widest"
              >
                {globalItems.length > 0 ? 'View Global Finds' : 'Search Global Network'} <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn(
        "grid grid-cols-1 gap-8",
        viewMode === 'dropship' ? "lg:grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"
      )}>
        <AnimatePresence mode="popLayout">
          {viewMode === 'dropship' ? (
            <div className="space-y-12 pb-20">
              {/* Dropship Strategy Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[40px] border border-[#D1D1C1]/50 p-8 shadow-sm">
                       <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                             <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                                <Building2 size={24} />
                             </div>
                             <div>
                                <h3 className="text-xl font-bold text-[#5A5A40]">Neural Catalog Node: {userRegion}</h3>
                                <p className="text-xs text-[#5A5A40]/60">Hypermarket inventory mapped via Gemini Intelligence.</p>
                             </div>
                          </div>
                          <button 
                            onClick={handleOptimizeDropship}
                            disabled={isLogisticsLoading || hypermarketItems.length === 0}
                            className="px-6 py-2.5 bg-[#5A5A40] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#4A4A30] transition-all disabled:opacity-30"
                          >
                             {isLogisticsLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                             Optimize Logistics
                          </button>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {hypermarketItems.map((item, idx) => (
                             <motion.div 
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="p-6 bg-[#F5F5F0]/50 rounded-3xl border border-[#D1D1C1]/30 group hover:bg-white hover:shadow-xl transition-all duration-500"
                             >
                                <div className="flex items-start justify-between mb-2">
                                   <div>
                                      <h4 className="font-bold text-[#5A5A40] group-hover:text-amber-600 transition-colors uppercase tracking-tight">{item.name}</h4>
                                      <p className="text-[10px] text-[#5A5A40]/40 font-bold uppercase tracking-widest">{item.brand}</p>
                                   </div>
                                   <div className="text-right">
                                      <div className="text-sm font-bold text-[#5A5A40]">{item.estimatedPrice}</div>
                                      <div className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">Est. Bulk Price</div>
                                   </div>
                                </div>
                                <div className="space-y-4">
                                   <div className="flex items-center gap-4 text-[10px] font-bold text-[#5A5A40]/60">
                                      <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-[#D1D1C1]/20">
                                         <MapPin size={10} /> {item.fulfillmentNode}
                                      </div>
                                      <div className={cn(
                                         "px-3 py-1 rounded-lg border",
                                         item.dropshipFeasibility > 80 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                                      )}>
                                         FEASIBILITY: {item.dropshipFeasibility}%
                                      </div>
                                   </div>
                                   <div className="p-3 bg-white/80 rounded-2xl italic text-[10px] text-[#5A5A40]/80 leading-relaxed border border-[#D1D1C1]/10">
                                      {item.sacredAlignment}
                                   </div>
                                   <button 
                                      onClick={() => toggleCart(item.id || `hyper-${idx}`)}
                                      className="w-full py-2.5 bg-[#5A5A40]/5 text-[#5A5A40] text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-[#5A5A40] hover:text-white transition-all flex items-center justify-center gap-2"
                                   >
                                      <ShoppingCart size={12} /> Add to Drop-Order
                                   </button>
                                </div>
                             </motion.div>
                          ))}
                          {hypermarketItems.length === 0 && (
                             <div className="col-span-full py-12 text-center">
                                <Loader2 className="animate-spin mx-auto text-[#5A5A40]/20 mb-4" size={32} />
                                <p className="text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">Synchronizing with Regional Hypermarket Nodes...</p>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-8">
                    {/* Neural Logistics Card */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-indigo-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl"
                    >
                       <div className="absolute top-0 right-0 p-8 opacity-10">
                          <Navigation size={120} />
                       </div>
                       <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Neural Fulfillment
                       </h4>
                       
                       {isLogisticsLoading ? (
                          <div className="py-12 space-y-4 text-center">
                             <Loader2 size={32} className="animate-spin mx-auto text-indigo-400" />
                             <p className="text-xs italic text-indigo-200">Calculating Hyper-Routing Path...</p>
                          </div>
                       ) : logistics ? (
                          <div className="space-y-6 relative z-10">
                             <div className="space-y-2">
                                <h5 className="text-2xl font-serif font-bold">Logistics Optimized</h5>
                                <p className="text-xs opacity-70 italic font-serif leading-relaxed">{logistics.consolidationStrategy}</p>
                             </div>
                             
                             <div className="space-y-4">
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-1">
                                   <div className="text-[8px] font-bold text-indigo-300 uppercase tracking-widest">Efficiency Path</div>
                                   <div className="text-xs font-serif italic">{logistics.neuralPath}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <div className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-1">
                                      <div className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest">CO2 Impact</div>
                                      <div className="text-xs font-bold text-emerald-400">{logistics.carbonOffsetEstimate}</div>
                                   </div>
                                   <div className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-1">
                                      <div className="text-[8px] font-bold text-amber-300 uppercase tracking-widest">Delivery Lead</div>
                                      <div className="text-xs font-bold text-amber-400">{logistics.estimatedDeliveryDays} Days</div>
                                   </div>
                                </div>
                                <div className="p-6 bg-emerald-500/20 rounded-[32px] border border-emerald-400/30 flex items-center gap-4">
                                   <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg">
                                      <Heart size={20} className="fill-current" />
                                   </div>
                                   <div>
                                      <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Neural Impact Fee</div>
                                      <div className="text-lg font-bold">${logistics.impactFeeSuggestion.toFixed(2)}</div>
                                      <p className="text-[8px] opacity-60 italic">Automatically diverted to {currentCharity?.name || 'Local Regeneration'}</p>
                                   </div>
                                </div>
                             </div>
                          </div>
                       ) : (
                          <div className="py-12 text-center space-y-6">
                             <p className="text-xs italic text-indigo-200">Neural Engine awaiting order batch to calculate optimal fulfillment path.</p>
                             <div className="h-0.5 w-full bg-white/10 overflow-hidden rounded-full">
                                <motion.div 
                                   animate={{ x: ['-100%', '100%'] }}
                                   transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                   className="h-full w-1/2 bg-indigo-500"
                                />
                             </div>
                          </div>
                       )}
                    </motion.div>

                    {/* Dropship Help Card */}
                    <div className="bg-[#F5F5F0] rounded-[40px] p-8 border border-[#D1D1C1]/50 space-y-4">
                       <h4 className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest flex items-center gap-2">
                          <Info size={14} /> Hyper-Dropship Protocol
                       </h4>
                       <p className="text-xs text-[#5A5A40]/70 leading-relaxed italic font-serif">
                          ṚtuSyn proxies your order through localized hypermarket nodes. We verify brand alignment and optimize logistics to ensure the lowest carbon footprint while maintaining sacred commerce integrity.
                       </p>
                    </div>
                 </div>
              </div>
            </div>
          ) : filteredItems.map((item: any) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[40px] border border-[#D1D1C1]/50 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-[#5A5A40]/5 transition-all duration-500 group flex flex-col"
            >
              <div className="h-64 overflow-hidden relative">
                <img 
                  src={item.image || `https://picsum.photos/seed/${item.id}/800/600`} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#5A5A40]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {viewMode === 'produce' && (
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <div className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A40] shadow-xl">
                      {item.category}
                    </div>
                    {item.organic && (
                      <div className="px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl flex items-center gap-1.5 border border-white/20">
                        <Sparkles size={12} /> 100% Organic
                      </div>
                    )}
                  </div>
                )}
                {viewMode === 'meals' && (
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <div className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A40] shadow-xl flex items-center gap-2">
                      <Clock size={12} className="text-[#5A5A40]/60" /> {new Date(item.createdAt?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="px-4 py-1.5 bg-amber-500 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl">
                      Freshly Analyzed
                    </div>
                  </div>
                )}
                {viewMode === 'products' && (
                  <div className="absolute top-6 left-6">
                    <div className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A40] shadow-xl">
                      {item.category}
                    </div>
                  </div>
                )}
                {viewMode === 'products' && (
                  <div className="absolute top-6 right-6">
                    <div className="px-4 py-1.5 bg-[#5A5A40] text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl border border-white/20">
                      {item.dosha}
                    </div>
                  </div>
                )}
                {viewMode === 'meals' && (
                  <div className="absolute top-6 right-6">
                    <div className="px-4 py-1.5 bg-[#5A5A40] text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl border border-white/20">
                      {item.ayurvedicProfile.dosha}
                    </div>
                  </div>
                )}
                {viewMode === 'services' && (
                  <div className="absolute top-6 right-6">
                    <div className="px-4 py-1.5 bg-emerald-600 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl border border-white/20 flex items-center gap-2">
                      {item.type === 'Therapist' && <UserCircle size={14} />}
                      {item.type === 'Retreat' && <Building2 size={14} />}
                      {item.type === 'Hospital' && <HospitalIcon size={14} />}
                      {item.type}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-8 flex-1 flex flex-col space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5">
                    <h3 className="text-2xl font-serif font-bold text-[#5A5A40] leading-tight group-hover:text-amber-700 transition-colors">{item.name}</h3>
                    {viewMode === 'services' && (
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em]">{item.provider}</p>
                    )}
                    {viewMode === 'produce' && (
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em]">Crafted by {item.userName}</p>
                    )}
                    {viewMode === 'meals' && (
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em]">Mastered by {item.userName}</p>
                    )}
                  </div>
                  {viewMode === 'products' || viewMode === 'produce' || viewMode === 'meals' ? (
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-serif font-bold text-[#5A5A40]">${item.price}{viewMode === 'produce' ? `/${item.unit}` : viewMode === 'meals' ? '/meal' : ''}</div>
                      <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center justify-end gap-1.5 mt-1">
                        {Math.floor(item.price * 100)} <Coins size={12} />
                      </div>
                      {ojasPoints >= (item.price * 100) && (
                        <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-[0.2em] mt-2 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/50">
                          Affordable via Ojas
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50 px-3 py-1.5 rounded-2xl border border-amber-100 shadow-sm">
                      <Sparkles size={16} className="animate-pulse" />
                      <span className="font-bold text-lg leading-none">{item.rating}</span>
                    </div>
                  )}
                </div>
                {viewMode === 'meals' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-1.5">
                      {item.ayurvedicProfile.rasa.map((r: string) => (
                        <span key={r} className="text-[9px] font-bold bg-[#F5F5F0] px-2.5 py-1 rounded-full text-[#5A5A40] uppercase tracking-widest border border-[#D1D1C1]/30">{r}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.cookingMethod && (
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-bold uppercase tracking-[0.1em] border border-indigo-100 flex items-center gap-1.5">
                          <Clock size={10} /> {item.cookingMethod}
                        </span>
                      )}
                      {item.regionalAvailability && (
                        <span className="px-3 py-1 bg-sky-50 text-sky-600 rounded-full text-[9px] font-bold uppercase tracking-[0.1em] border border-sky-100 flex items-center gap-1.5">
                          <MapPin size={10} /> {item.regionalAvailability}
                        </span>
                      )}
                    </div>
                    {item.allergens && item.allergens.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-red-500 uppercase tracking-[0.1em] bg-red-50/50 p-2 rounded-xl border border-red-100">
                         <Info size={12} /> Allergens: {item.allergens.join(', ')}
                      </div>
                    )}
                    <div className="text-[10px] text-indigo-700 font-bold italic leading-relaxed bg-indigo-50/80 p-3 rounded-2xl border border-indigo-100 flex items-center gap-3">
                       <Check size={14} className="shrink-0" />
                       <span className="opacity-80">{item.complianceNote || "Lawful Cottage Food kitchen production."}</span>
                    </div>
                  </div>
                )}
                <p className="text-sm text-[#2D3436] opacity-60 italic leading-relaxed flex-1 line-clamp-3">
                  {item.description}
                </p>

                {viewMode === 'products' && item.energetics && (
                  <div className="pt-2 space-y-4 border-t border-[#D1D1C1]/30">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-[0.2em]">
                      <Sparkles size={12} /> Ayurvedic Energetics
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100/50 space-y-1">
                        <div className="text-[8px] font-bold text-amber-800/60 uppercase tracking-widest">Taste (Rasa)</div>
                        <div className="flex flex-wrap gap-1">
                          {item.energetics.rasa.map((r: string) => (
                            <span key={r} className="text-[9px] font-bold text-amber-700">{r}</span>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-1">
                        <div className="text-[8px] font-bold text-blue-800/60 uppercase tracking-widest">Potency (Virya)</div>
                        <div className="text-[9px] font-bold text-blue-700">{item.energetics.virya}</div>
                      </div>
                      <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 space-y-1">
                        <div className="text-[8px] font-bold text-emerald-800/60 uppercase tracking-widest">Effect (Vipaka)</div>
                        <div className="text-[10px] font-bold text-emerald-700">{item.energetics.vipaka}</div>
                      </div>
                      <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100/50 space-y-1">
                        <div className="text-[8px] font-bold text-slate-800/60 uppercase tracking-widest">Guna</div>
                        <div className="flex flex-wrap gap-1">
                          {item.energetics.guna.map((g: string) => (
                            <span key={g} className="text-[9px] font-bold text-slate-700">{g}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {viewMode === 'produce' && item.regionalAvailability && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border border-emerald-100 flex items-center gap-2">
                      <MapPin size={12} /> {item.regionalAvailability}
                    </span>
                  </div>
                )}
                {(viewMode === 'services' || viewMode === 'produce' || viewMode === 'meals') && (
                  <div className="flex items-center gap-2.5 text-[11px] text-[#5A5A40] opacity-50 font-bold uppercase tracking-widest pb-2">
                    <MapPin size={14} className="text-[#5A5A40]/40" />
                    {item.location}
                    {viewMode === 'meals' && <span className="ml-auto text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{item.portions} portions left</span>}
                  </div>
                )}
                {viewMode === 'services' ? (
                  <button
                    onClick={() => handleBooking(item)}
                    className="w-full py-5 rounded-[24px] bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                  >
                    <ArrowRight size={18} />
                    Book Consultation
                  </button>
                ) : (
                    <button
                    onClick={() => toggleCart(item.id)}
                    className={cn(
                      "w-full py-5 rounded-[24px] font-bold transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs",
                      cartIds.includes(item.id) 
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                        : "bg-[#5A5A40] text-white hover:bg-[#4A4A30] shadow-xl shadow-[#5A5A40]/20"
                    )}
                  >
                    {cartIds.includes(item.id) ? (
                      <>
                        <Check size={18} />
                        In Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={18} />
                        Add to Artifacts
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredItems.length > 0 && (searchTerm || selectedCategory !== 'All') && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="flex justify-center pt-8"
        >
          <button 
            onClick={() => {
              const el = document.getElementById('external-discovery-lab');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-2 text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-[0.3em] hover:text-[#5A5A40] transition-colors group"
          >
            Not what you're looking for? <span className="text-[#5A5A40] border-b border-[#5A5A40]/30 group-hover:border-[#5A5A40]">Search Global Network</span> <ArrowRight size={12} />
          </button>
        </motion.div>
      )}

      {/* Global Finds Section */}
      {(searchTerm || selectedCategory !== 'All') && (
        <section id="external-discovery-lab" className="mt-16 space-y-8 border-t border-[#D1D1C1]/30 pt-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#5A5A40] opacity-40 uppercase tracking-[0.2em] text-[10px] font-bold">
                <Navigation size={12} /> External Discovery Lab
              </div>
              <h3 className="text-3xl font-bold text-[#5A5A40]">
                Global Marketplace Finds
              </h3>
              <p className="text-[#5A5A40]/60 max-w-xl text-sm italic">
                AI-discovered artifacts from global platforms like {userRegion === 'India' ? 'Flipkart' : 'Amazon'} matched to your current search resonance.
              </p>
            </div>
            {loadingGlobal && (
              <div className="flex items-center gap-3 text-[#5A5A40]/40 text-xs font-bold uppercase tracking-widest animate-pulse">
                <Loader2 size={16} className="animate-spin" />
                Scouring Global Nodes...
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {globalItems.map((item, idx) => (
                <motion.div
                  key={`global-${idx}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-[#F5F5F0]/50 rounded-[32px] p-6 border border-[#D1D1C1]/50 group hover:bg-white hover:shadow-2xl transition-all duration-500 flex flex-col relative"
                >
                  {item.resonanceScore && (
                    <div className="absolute -top-3 -right-3 z-10 bg-[#5A5A40] text-white px-3 py-1.5 rounded-full shadow-lg flex flex-col items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest leading-none mb-0.5">Resonance</span>
                      <span className="text-sm font-black italic">{item.resonanceScore}%</span>
                    </div>
                  )}
                  
                  <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative">
                    <img 
                      src={item.imageUrl || `https://picsum.photos/seed/global-${idx}/400/400`} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                       <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[8px] font-bold uppercase tracking-widest text-[#5A5A40]">
                        {item.platform}
                      </div>
                      {item.categoryMatch && (
                        <div className="px-3 py-1 bg-amber-600/90 backdrop-blur-sm rounded-full text-[8px] font-bold uppercase tracking-widest text-white">
                          {item.categoryMatch}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 mb-4 flex-1">
                    <h4 className="font-bold text-[#5A5A40] text-sm group-hover:text-amber-600 transition-colors uppercase tracking-tight">{item.name}</h4>
                    <p className="text-[10px] text-[#5A5A40]/40 font-bold uppercase tracking-widest">{item.brand}</p>
                    <p className="text-xs text-[#5A5A40]/60 line-clamp-3 italic leading-relaxed">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#D1D1C1]/30">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#5A5A40]">{item.price}</span>
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1">
                        {Math.floor(parseFloat(item.price.replace(/[^0-9.]/g, '')) * 100 || 0)} <Coins size={8} />
                      </span>
                    </div>
                    <a 
                      href={item.searchUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-[#5A5A40] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-all shadow-md"
                    >
                      Source <ArrowRight size={12} />
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {!loadingGlobal && globalItems.length === 0 && (searchTerm || selectedCategory !== 'All') && (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-[#D1D1C1]/30 rounded-[40px]">
                <p className="text-[#5A5A40]/30 font-bold uppercase tracking-[0.2em] text-[10px]">No External Resonance Found</p>
              </div>
            )}
          </div>
        </section>
      )}

      {cartItems.length > 0 && (
        <motion.div 
          initial={{ y: 100 }} 
          animate={{ y: 0 }} 
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
        >
          <div className="bg-[#5A5A40] text-white p-6 rounded-[32px] shadow-2xl flex items-center justify-between gap-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
               <Heart size={120} />
            </div>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-4 relative z-10 hover:bg-white/10 p-2 rounded-2xl transition-colors text-left"
            >
              <div className="bg-white/20 p-3 rounded-2xl">
                <ShoppingBag size={24} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">{cartItems.length} Items Selected</div>
                <div className="text-lg font-bold">Complete Harmonization</div>
                {currentCharity && (
                   <p className="text-[9px] font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                      <Heart size={10} className="fill-current" /> 
                      {currentCharity.donationPercentage}% donated to {currentCharity.name}
                   </p>
                )}
              </div>
            </button>
            
            <div className="flex items-center gap-3 relative z-10">
               <div className="text-right hidden sm:block">
                  <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Total Energy</div>
                  <div className="flex flex-col items-end">
                    <div className={cn("text-xl font-bold", isBurnOjas && "text-emerald-400")}>
                      ${(isBurnOjas ? Math.max(0, cartTotalPrice - (ojasPoints / 100)) : cartTotalPrice).toFixed(2)}
                    </div>
                    {isBurnOjas && (
                      <div className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">
                        -{ojasPoints} Ojas Applied
                      </div>
                    )}
                  </div>
               </div>
               
               <div className="flex flex-col gap-2">
                 <div className="flex gap-2">
                   <button 
                    onClick={() => setIsBurnOjas(!isBurnOjas)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center gap-2",
                      isBurnOjas ? "bg-amber-500 border-amber-400 text-white shadow-inner" : "bg-white/10 border-white/20 text-white/70 hover:bg-white/20"
                    )}
                   >
                     <Coins size={12} /> {isBurnOjas ? 'Ojas Burning' : 'Burn Ojas'}
                   </button>
                   <button 
                    onClick={() => setIsCartOpen(true)}
                    className="px-4 py-2 bg-white/10 border border-white/20 text-white/70 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2"
                   >
                     <Eye size={12} /> Review
                   </button>
                 </div>
                 <button 
                   onClick={handleCheckout}
                   disabled={registering}
                   className="bg-white text-[#5A5A40] px-6 py-3 rounded-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2 font-bold text-sm shadow-lg whitespace-nowrap"
                 >
                   {registering ? <Loader2 className="animate-spin" size={16} /> : (
                      <>
                         Harmonize <ArrowRight size={16} />
                      </>
                   )}
                 </button>
               </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Custom Curated Package Modal */}
      <AnimatePresence>
        {showCurateModal && curatedPackage && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-[#F5F5F0] flex justify-between items-center bg-[#5A5A40] text-white">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <Gem size={24} className="text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-bold">{curatedPackage.packageName}</h3>
                    <p className="text-xs opacity-70 italic font-serif">A {curatedPackage.duration} Manifestation Journey</p>
                  </div>
                </div>
                <button onClick={() => setShowCurateModal(false)} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all"><CloseIcon size={20} /></button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8">
                <div className="bg-[#F5F5F0] p-6 rounded-3xl border border-[#D1D1C1]/50 italic text-[#2D3436] leading-relaxed font-serif">
                  {curatedPackage.concept}
                </div>

                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-[#5A5A40] uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                    <Clock size={16} /> Phase Schedule
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {curatedPackage.phases?.map((phase: any, idx: number) => (
                      <div key={idx} className="p-6 bg-white rounded-3xl border border-[#D1D1C1] shadow-sm relative overflow-hidden group hover:border-[#5A5A40] transition-colors">
                        <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#F5F5F0] rounded-full flex items-center justify-center text-[#5A5A40] font-bold group-hover:bg-[#5A5A40] group-hover:text-white transition-colors">
                          {idx + 1}
                        </div>
                        <div className="text-[10px] font-bold text-[#5A5A40] uppercase mb-1">{phase.dayRange}</div>
                        <h5 className="font-bold text-lg mb-3">{phase.focus}</h5>
                        <div className="space-y-2">
                          {phase.treatments?.map((t: string, i: number) => (
                            <div key={i} className="text-xs text-[#2D3436] opacity-70 flex items-start gap-2">
                              <div className="w-1 h-1 bg-[#5A5A40] rounded-full mt-1.5 shrink-0" />
                              {t}
                            </div>
                          ))}
                        </div>
                        {phase.sonicFrequency && (
                          <div className="mt-4 pt-4 border-t border-[#F5F5F0] flex items-center gap-2 text-[10px] font-bold text-sky-600 uppercase">
                            <Wind size={12} /> {phase.sonicFrequency}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 bg-amber-50 rounded-3xl border border-amber-100 flex flex-col sm:flex-row gap-8 items-center">
                  <div className="p-6 bg-white rounded-full text-amber-500 shadow-inner">
                    <Sparkles size={40} />
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-amber-800 uppercase tracking-widest">ṚtuSyn Exclusive Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {curatedPackage.rtuSynFeatures?.map((f: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-white text-amber-800 border border-amber-200 rounded-full text-[10px] font-bold">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                  <button 
                    onClick={() => {
                       toast("Package saved for confirmation!", "success");
                       setShowCurateModal(false);
                    }}
                    className="flex-1 py-4 bg-[#5A5A40] text-white rounded-2xl font-bold hover:bg-[#4A4A30] transition-all shadow-xl flex items-center justify-center gap-2"
                  >
                    Confirm Manifestation
                  </button>
                  <button 
                    onClick={() => setShowCurateModal(false)}
                    className="flex-1 py-4 bg-[#F5F5F0] text-[#5A5A40] rounded-2xl font-bold hover:bg-[#D1D1C1] transition-all"
                  >
                    Close & Review Marketplace
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-[#D1D1C1] flex items-center justify-between bg-[#F5F5F0]">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#5A5A40]">Provider Registration</h3>
                    <p className="text-xs text-[#2D3436] opacity-60">List your wellness services in the AIveda Marketplace.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRegisterModal(false)}
                  className="p-2 hover:bg-[#D1D1C1] rounded-full transition-all"
                >
                  <CloseIcon size={24} />
                </button>
              </div>

              <form onSubmit={handleRegister} className="p-8 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">Service Name</label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Deep Tissue Ayurvedic Massage"
                      className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">Provider/Clinic Name</label>
                    <input
                      required
                      value={formData.provider}
                      onChange={(e) => setFormData({...formData, provider: e.target.value})}
                      placeholder="e.g., Lotus Wellness Center"
                      className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">Description</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the healing benefits and techniques used..."
                    className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">Provider Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option>Therapist</option>
                      <option>Retreat</option>
                      <option>Hospital</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option>Ayurveda</option>
                      <option>Thai</option>
                      <option>Shiatsu</option>
                      <option>Yoga</option>
                      <option>Physio</option>
                      <option>Meditation</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">Location</label>
                    <input
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="e.g., Bali, Indonesia"
                      className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={registering}
                    className="w-full py-5 rounded-3xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {registering ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                    List My Service
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Produce Registration Modal */}
      <AnimatePresence>
        {showProduceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-[#D1D1C1] flex items-center justify-between bg-emerald-50">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white text-emerald-600 rounded-2xl shadow-sm">
                    <Sprout size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#5A5A40]">List Your Produce</h3>
                    <p className="text-xs text-[#2D3436] opacity-60">Share your harvest with the community.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowProduceModal(false)}
                  className="p-2 hover:bg-[#D1D1C1] rounded-full transition-all"
                >
                  <CloseIcon size={24} />
                </button>
              </div>

              <form onSubmit={handleRegisterProduce} className="p-8 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">Produce Image</label>
                    {produceData.image ? (
                      <div className="relative aspect-video rounded-2xl overflow-hidden group">
                        <img src={produceData.image} className="w-full h-full object-cover" alt="Produce" />
                        <button 
                          type="button"
                          onClick={() => setProduceData({...produceData, image: null})}
                          className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex aspect-video border-2 border-dashed border-[#D1D1C1] rounded-2xl flex-col items-center justify-center gap-2 hover:border-[#5A5A40] transition-colors cursor-pointer">
                        <Camera className="text-[#5A5A40]/40" />
                        <span className="text-[10px] font-bold uppercase opacity-50">Upload Photo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onloadend = () => setProduceData({...produceData, image: reader.result as string});
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">Item Name</label>
                      <input
                        required
                        value={produceData.name}
                        onChange={(e) => setProduceData({...produceData, name: e.target.value})}
                        placeholder="e.g., Organic Turmeric Root"
                        className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">Category</label>
                      <select
                        value={produceData.category}
                        onChange={(e) => setProduceData({...produceData, category: e.target.value})}
                        className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option>Vegetables</option>
                        <option>Fruit</option>
                        <option>Herbs</option>
                        <option>Grains</option>
                        <option>Spices</option>
                        <option>Poultry</option>
                        <option>Dairy</option>
                        <option>Groceries</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">Organic Status</label>
                  <label className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-[#D1D1C1] cursor-pointer hover:bg-emerald-50 transition-colors">
                    <input 
                      type="checkbox"
                      checked={produceData.organic}
                      onChange={(e) => setProduceData({...produceData, organic: e.target.checked})}
                      className="w-5 h-5 rounded border-emerald-500 text-emerald-600"
                    />
                    <span className="text-sm font-bold text-[#5A5A40]">This produce is 100% Organic / Pesticide-Free</span>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">Description</label>
                  <textarea
                    required
                    value={produceData.description}
                    onChange={(e) => setProduceData({...produceData, description: e.target.value})}
                    placeholder="Describe how it was grown, harvest date, etc..."
                    className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">Price ($)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={produceData.price}
                      onChange={(e) => setProduceData({...produceData, price: e.target.value})}
                      className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">Unit</label>
                    <select
                      value={produceData.unit}
                      onChange={(e) => setProduceData({...produceData, unit: e.target.value})}
                      className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option>kg</option>
                      <option>gram</option>
                      <option>piece</option>
                      <option>bunch</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">Location</label>
                    <input
                      required
                      value={produceData.location}
                      onChange={(e) => setProduceData({...produceData, location: e.target.value})}
                      placeholder="e.g., Your Neighborhood"
                      className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">Regional Availability</label>
                    <select 
                      value={produceData.regionalAvailability}
                      onChange={(e) => setProduceData({ ...produceData, regionalAvailability: e.target.value })}
                      className="w-full p-4 rounded-2xl border border-[#D1D1C1] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option>Local</option>
                      <option>Regional</option>
                      <option>National</option>
                      <option>Global Export</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={registering}
                    className="w-full py-5 rounded-3xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {registering ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                    Manifest My Produce
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

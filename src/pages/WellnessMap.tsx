import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow, 
  useMap, 
  useMapsLibrary,
  useAdvancedMarkerRef
} from '@vis.gl/react-google-maps';
import { 
  Compass, 
  Search, 
  Sparkles, 
  Navigation, 
  MapPin, 
  Wind, 
  Droplets, 
  Flame, 
  Sprout, 
  Info,
  Loader2,
  ChevronRight,
  LocateFixed,
  Layers,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { geminiService } from '../services/geminiService';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/useToast';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

// --- Components ---

const MapMarkers = ({ places, onSelect }: { places: any[], onSelect: (place: any) => void }) => {
  return (
    <>
      {places.map((place) => (
        <AdvancedMarker
          key={place.id}
          position={place.location}
          onClick={() => onSelect(place)}
        >
          <Pin 
            background="#5A5A40" 
            borderColor="#F5F5F0" 
            glyphColor="#F5F5F0"
            scale={1.2}
          />
        </AdvancedMarker>
      ))}
    </>
  );
};

const WellnessAtlas = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [sacredPlan, setSacredPlan] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [mapId, setMapId] = useState('rtusyn_atlas_v1');

  const map = useMap();
  const placesLib = useMapsLibrary('places');

  useEffect(() => {
    (window as any).gm_authFailure = () => {
      setMapsError('AUTH_FAILURE');
    };
    return () => {
      (window as any).gm_authFailure = undefined;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const snap = await getDoc(doc(db, 'profiles', user.uid));
      if (snap.exists()) setProfile(snap.data());
    };
    fetchProfile();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          console.error("Geolocation error:", err);
          setLocation({ lat: 37.42, lng: -122.08 });
        }
      );
    }
  }, [user]);

  const performSearch = useCallback(async (query: string, locationBias?: { lat: number, lng: number }) => {
    if (!placesLib || !query) return;
    setIsSearching(true);
    setMapsError(null);
    try {
      const { places } = await placesLib.Place.searchByText({
        textQuery: query,
        fields: ['displayName', 'location', 'formattedAddress', 'rating', 'userRatingCount', 'types'],
        locationBias: locationBias || map?.getCenter(),
        maxResultCount: 15,
      });
      setPlaces(places || []);
    } catch (error: any) {
      console.error("Search error:", error);
      const msg = error?.message || String(error);
      if (msg.includes('PERMISSION_DENIED') || msg.includes('has not been used') || msg.includes('disabled')) {
         setMapsError('PLACES_API_V1_REQUIRED');
         toast("Places API (New) must be enabled in Google Cloud Console.", "error");
      } else if (msg.includes('BillingNotEnabledMapError')) {
         setMapsError('AUTH_FAILURE');
         toast("Google Maps billing must be enabled.", "error");
      } else {
         toast("Neural link failed to find wellness nodes.", "error");
      }
    } finally {
      setIsSearching(false);
    }
  }, [placesLib, map, toast]);

  useEffect(() => {
    if (location && placesLib) {
      performSearch("wellness centers, yoga studios, organic stores", location);
    }
  }, [location, placesLib, performSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) performSearch(searchQuery);
  };

  const generatePlan = async () => {
    if (!location) return;
    setIsGeneratingPlan(true);
    try {
      const context = profile?.location || "current location";
      const dosha = profile?.dosha || "Unknown";
      
      // Use grounding tool via a new service method or refine existing
      // For this implementation, we'll assume geminiService.generateLocationPlan is added
      const result = await (geminiService as any).generateLocationPlan(
        context, 
        location, 
        dosha, 
        profile?.healthData
      );
      setSacredPlan(result.text);
    } catch (error) {
      console.error("Plan error:", error);
      toast("Neural atlas synthesis failed.", "error");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  if (!hasValidKey || mapsError) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] px-6 text-center space-y-8 bg-[#F5F5F0]">
        <div className="p-6 bg-white rounded-[40px] shadow-2xl border border-[#D1D1C1]/20 max-w-xl">
          <div className="mb-6 flex justify-center">
             <div className="p-4 bg-rose-50 text-rose-600 rounded-full">
                <Navigation size={48} />
             </div>
          </div>
          <h2 className="text-3xl font-serif font-bold text-[#5A5A40] mb-4">
            {mapsError === 'AUTH_FAILURE' ? 'Action Required: Billing' : mapsError === 'PLACES_API_V1_REQUIRED' ? 'Action Required: Enable Places' : 'Neural Atlas Offline'}
          </h2>
          <p className="text-[#5A5A40]/60 italic font-serif mb-8 leading-relaxed">
            {mapsError === 'AUTH_FAILURE' 
              ? 'Your Google Maps API key requires an active billing account. Please enable billing in the Google Cloud Console to restore neural synchrony.' 
              : mapsError === 'PLACES_API_V1_REQUIRED'
              ? 'The "Places API (New)" is required for spatial discovery. Please enable it in your Google Cloud project and ensure your API key is not restricted from this service.'
              : 'The wellness terrain requires a valid Google Maps API Key to manifest.'}
          </p>
          
          <div className="space-y-4 text-left">
            <div className="p-5 bg-[#F5F5F0] rounded-2xl">
              <p className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-[#5A5A40] text-white rounded-full text-[10px]">1</span>
                {mapsError === 'AUTH_FAILURE' ? 'Enable Billing' : mapsError === 'PLACES_API_V1_REQUIRED' ? 'Enable Places API (New)' : 'Acquire Access Key'}
              </p>
              <a 
                href={mapsError === 'AUTH_FAILURE' 
                  ? "https://console.cloud.google.com/billing" 
                  : mapsError === 'PLACES_API_V1_REQUIRED'
                  ? "https://console.cloud.google.com/apis/library/places.googleapis.com"
                  : "https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais"}
                target="_blank" 
                rel="noopener"
                className="text-xs text-indigo-500 hover:underline font-serif px-7 block"
              >
                Go to Cloud Console &rarr;
              </a>
            </div>
            
            {!mapsError && (
              <div className="p-5 bg-[#F5F5F0] rounded-2xl">
                <p className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center bg-[#5A5A40] text-white rounded-full text-[10px]">2</span>
                  Link to Sanctuary
                </p>
                <div className="px-7 space-y-1">
                  <p className="text-[10px] text-[#5A5A40]/70 font-mono">Open Settings (⚙️ Top Right) &gt; Select Secrets</p>
                  <p className="text-[10px] text-[#5A5A40]/70 font-mono">Add <code className="bg-white px-1 rounded">GOOGLE_MAPS_PLATFORM_KEY</code></p>
                </div>
              </div>
            )}
            
            {mapsError && (
               <button 
                 onClick={() => window.location.reload()}
                 className="w-full py-4 bg-[#5A5A40] text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#4A4A30] transition-colors"
               >
                 I've enabled it, Refresh now
               </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-[#F5F5F0]">
      {/* Search Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-2xl px-4">
        <div className="bg-white/80 backdrop-blur-xl p-2 rounded-[32px] shadow-2xl border border-white/20 flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-3 px-4">
            <Search size={20} className="text-[#5A5A40]/40" />
            <input 
              type="text" 
              placeholder="Search wellness hubs, yoga, organic markers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 bg-transparent text-sm focus:outline-none text-[#5A5A40] font-serif italic"
            />
          </form>
          <button 
            type="submit"
            onClick={handleSearchSubmit}
            disabled={isSearching}
            className="p-3 bg-[#5A5A40] text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            {isSearching ? <Loader2 size={24} className="animate-spin" /> : <ChevronRight size={24} />}
          </button>
        </div>
      </div>

      {/* Floating Action Button for Plan */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
        <button 
          onClick={generatePlan}
          disabled={isGeneratingPlan}
          className="flex items-center gap-3 bg-[#5A5A40] text-white px-8 py-5 rounded-[24px] shadow-2xl hover:scale-105 transition-all group border-b-4 border-[#3A3A20]"
        >
          {isGeneratingPlan ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Sparkles size={20} className="text-amber-400 group-hover:rotate-12 transition-transform" />
          )}
          <span className="font-bold text-sm uppercase tracking-[0.2em]">Generate Sacred Plan</span>
        </button>
      </div>

      {/* Main Map */}
      <Map
        mapId={mapId}
        defaultCenter={location || { lat: 37.42, lng: -122.08 }}
        defaultZoom={13}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        className="w-full h-full"
      >
        <MapMarkers places={places} onSelect={setSelectedPlace} />

        {selectedPlace && (
          <InfoWindow
            position={selectedPlace.location}
            onCloseClick={() => setSelectedPlace(null)}
          >
            <div className="p-2 max-w-xs space-y-3">
              <div>
                <h3 className="font-bold text-[#5A5A40] text-base leading-tight mb-1">{selectedPlace.displayName}</h3>
                <p className="text-[10px] text-[#5A5A40]/60 italic">{selectedPlace.formattedAddress}</p>
              </div>
              
              <div className="flex items-center gap-3">
                {selectedPlace.rating && (
                   <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-md text-[10px] font-bold">
                      <Zap size={10} fill="currentColor" /> {selectedPlace.rating}
                   </div>
                )}
                <div className="flex-1 flex gap-1">
                   {selectedPlace.types?.slice(0, 2).map((t: string) => (
                      <span key={t} className="text-[8px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                         {t.replace('_', ' ')}
                      </span>
                   ))}
                </div>
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>

      {/* Plan Sidebar/Overlay */}
      <AnimatePresence>
        {sacredPlan && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute top-0 right-0 h-full w-full sm:w-96 bg-white/95 backdrop-blur-md shadow-2xl z-20 border-l border-[#D1D1C1]/20 flex flex-col"
          >
            <div className="p-6 border-b border-[#D1D1C1]/20 flex justify-between items-center bg-[#F5F5F0]">
              <div className="flex items-center gap-3">
                 <Compass className="text-[#5A5A40]" />
                 <h2 className="text-xl font-serif font-bold text-[#5A5A40]">Location Plan</h2>
              </div>
              <button 
                onClick={() => setSacredPlan(null)}
                className="p-2 hover:bg-[#D1D1C1]/20 rounded-full"
              >
                <ChevronRight className="rotate-180" size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="prose prose-sm prose-stone font-serif italic text-[#5A5A40]/80 leading-relaxed">
                 {sacredPlan}
              </div>
            </div>
            <div className="p-6 bg-[#F5F5F0] border-t border-[#D1D1C1]/20">
               <button 
                 onClick={() => setSacredPlan(null)}
                 className="w-full py-4 bg-[#5A5A40] text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl"
               >
                 Close Manifest
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Overlay - Compass & Legend */}
      <div className="absolute bottom-10 right-10 z-10 flex flex-col gap-4">
         <button 
           onClick={() => {
             if (navigator.geolocation) {
               navigator.geolocation.getCurrentPosition(pos => {
                 const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                 setLocation(newLoc);
                 map?.panTo(newLoc);
                 performSearch("wellness", newLoc);
               });
             }
           }}
           className="p-4 bg-white rounded-full shadow-xl text-[#5A5A40] hover:scale-110 active:scale-95 transition-all"
         >
            <LocateFixed size={24} />
         </button>
         <button className="p-4 bg-white rounded-full shadow-xl text-[#5A5A40] hover:scale-110 transition-all">
            <Layers size={24} />
         </button>
      </div>

      {/* Dosage Context Visualizers */}
      <div className="absolute top-1/2 -translate-y-1/2 left-6 z-10 flex flex-col gap-6">
         {[
           { dosha: 'Vata', icon: Wind, color: 'text-sky-400 bg-sky-50' },
           { dosha: 'Pitta', icon: Flame, color: 'text-rose-400 bg-rose-50' },
           { dosha: 'Kapha', icon: Sprout, color: 'text-emerald-400 bg-emerald-50' }
         ].map(item => (
           <div 
             key={item.dosha}
             className={cn(
               "p-4 rounded-full shadow-lg border border-white transition-all transform hover:scale-110",
               item.color,
               profile?.dosha === item.dosha ? "ring-4 ring-offset-2 ring-amber-400 scale-125" : "opacity-30"
             )}
           >
              <item.icon size={24} />
           </div>
         ))}
      </div>
    </div>
  );
};

export const WellnessMapPage = () => {
  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <WellnessAtlas />
    </APIProvider>
  );
};

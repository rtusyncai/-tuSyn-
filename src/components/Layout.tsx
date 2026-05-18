import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  ClipboardList, 
  Utensils, 
  Wind, 
  MapPin, 
  Sparkles, 
  BookOpen, 
  User, 
  LogOut, 
  Menu, 
  X,
  Compass,
  ShoppingBag,
  Stethoscope,
  MessageSquare,
  Shield,
  Sprout,
  Sun,
  Moon,
  Store
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../lib/utils';
import { routes } from '../routes';
import { doc, onSnapshot } from 'firebase/firestore';
import { NeuralGrowthService } from '../services/neuralGrowthService';

import { Breadcrumbs } from './Breadcrumbs';
import { GlobalSearch } from './GlobalSearch';
import { Footer } from './Footer';
import { VisionToggle } from './VisionToggle';
import { VisionPortal } from './VisionPortal';
import { useCart } from '../hooks/useCart';
import { CartDrawer } from './CartDrawer';
import { BiometricHUD } from './BiometricHUD';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, role, isAdmin, isDoctor, isVendor, isManagement, onboardingCompleted } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { totalItems, isOpen: isCartOpen, setIsOpen: setIsCartOpen } = useCart();
  const [engagement, setEngagement] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Close mobile menu on route change
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, 'profiles', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setEngagement(snapshot.data().engagement);
      }
    }, (error) => {
      console.error("Profile onSnapshot error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const isOnboarding = location.pathname === '/onboarding';
  const isExcluded = ['/onboarding', '/login', '/deactivated'].includes(location.pathname);

  const navItems = routes.filter(r => {
    if (!r.showInNav) return false;
    if (r.admin && !isAdmin && !isDoctor) return false;
    if (r.vendor && !isVendor && !isAdmin && !isDoctor) return false;
    return true;
  });
  const bottomNavItems = navItems.slice(0, 5); // Pick top 5 for bottom nav

  const handleSignOut = async () => {
    await auth.signOut();
    navigate('/login');
  };

  // Log page views for autonomous growth
  useEffect(() => {
    if (user && location.pathname !== '/login') {
      NeuralGrowthService.logInteraction(user.uid, 'page_view', { path: location.pathname });
    }
  }, [location.pathname, user]);

  return (
    <div className="flex h-screen bg-[#F5F5F0] text-[#2D3436] dark:bg-[#1A1A15] dark:text-[#E8E8E0] transition-colors duration-300 font-sans overflow-hidden">
      {/* Sidebar - Desktop */}
      {!isOnboarding && (
        <aside className={cn(
          "bg-[#F5F5F0] border-r border-[#D1D1C1]/50 dark:bg-[#1A1A15] dark:border-[#3D3D35] transition-all duration-500 ease-in-out hidden lg:flex flex-col z-20",
          isSidebarOpen ? "w-72" : "w-24"
        )}>
          <div className="p-10 flex items-center justify-between">
            <h1 className={cn(
              "text-4xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA] tracking-tight transition-opacity duration-300 italic",
              !isSidebarOpen && "opacity-0 pointer-events-none"
            )}>
              ṚtuSyn
            </h1>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 hover:bg-[#D1D1C1] dark:hover:bg-[#3D3D35] rounded-full transition-colors text-[#5A5A40] dark:text-[#A8D5BA]"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <nav className="flex-1 px-6 space-y-2 overflow-y-auto scrollbar-hide">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => user && NeuralGrowthService.logInteraction(user.uid, 'nav_click', { to: item.path })}
                  className={cn(
                    "flex items-center p-4 rounded-[20px] transition-all duration-300 group relative",
                    isActive 
                      ? "bg-[#5A5A40] text-white shadow-xl shadow-[#5A5A40]/30 dark:bg-[#A8D5BA] dark:text-[#1A1A15] dark:shadow-[#A8D5BA]/20" 
                      : "hover:bg-[#D1D1C1]/30 text-[#5A5A40] dark:text-[#D1D1C1] dark:hover:bg-[#3D3D35]/50"
                  )}
                >
                  <item.icon size={22} className={cn("transition-transform duration-300", !isActive && "group-hover:scale-110")} />
                  {isSidebarOpen && (
                    <div className="ml-4 flex-1 flex items-center justify-between">
                      <span className="font-bold text-xs uppercase tracking-widest">{item.name}</span>
                      {item.badgeKey && engagement?.[item.badgeKey] > 0 && (
                        <span className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded-full border",
                          isActive 
                            ? "bg-white/20 text-white border-white/30 dark:bg-black/20 dark:text-black dark:border-black/30" 
                            : "bg-[#5A5A40]/10 text-[#5A5A40] border-[#5A5A40]/20 dark:bg-[#A8D5BA]/10 dark:text-[#A8D5BA] dark:border-[#A8D5BA]/20"
                        )}>
                          {engagement[item.badgeKey]}
                        </span>
                      )}
                    </div>
                  )}
                  {!isSidebarOpen && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-[#5A5A40] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 dark:bg-[#A8D5BA] dark:text-[#1A1A15]">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {user && (
            <div className="p-8 border-t border-[#D1D1C1]/30">
              <button
                onClick={handleSignOut}
                className="flex items-center w-full p-4 text-red-600/70 hover:text-red-600 hover:bg-red-50/50 rounded-2xl transition-all group"
              >
                <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
                {isSidebarOpen && <span className="ml-4 font-bold text-xs uppercase tracking-widest">Sign Out</span>}
              </button>
            </div>
          )}
        </aside>
      )}

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-[#1A1A15]/60 backdrop-blur-md z-[100]"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-[#F5F5F0] dark:bg-[#1A1A15] z-[101] shadow-2xl flex flex-col"
            >
              <div className="p-10 flex items-center justify-between">
                <h1 className="text-4xl font-serif font-bold text-[#5A5A40] dark:text-[#A8D5BA] italic">ṚtuSyn</h1>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[#5A5A40] dark:text-[#A8D5BA]">
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 px-6 space-y-2 overflow-y-auto scrollbar-hide">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center p-4 rounded-[20px] transition-all",
                        isActive 
                          ? "bg-[#5A5A40] text-white dark:bg-[#A8D5BA] dark:text-[#1A1A15]" 
                          : "text-[#5A5A40] dark:text-[#D1D1C1] hover:bg-[#D1D1C1]/30"
                      )}
                    >
                      <item.icon size={22} />
                      <span className="ml-4 font-bold text-xs uppercase tracking-widest">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
              {user && (
                <div className="p-8 border-t border-[#D1D1C1]/30">
                  <button onClick={handleSignOut} className="flex items-center w-full p-4 text-red-600 font-bold text-xs uppercase tracking-widest">
                    <LogOut size={22} />
                    <span className="ml-4">Sign Out</span>
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-[#F5F5F0] dark:bg-[#1A1A15] scrollbar-hide">
        <header className="h-24 bg-[#F5F5F0]/60 backdrop-blur-2xl border-b border-[#D1D1C1]/20 dark:bg-[#1A1A15]/60 dark:border-[#3D3D35]/20 flex items-center justify-between px-6 sm:px-12 sticky top-0 z-[40] transition-all duration-500">
          <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-[#5A5A40] dark:text-[#A8D5BA]"
            >
              <Menu size={24} />
            </button>
            
            <div className="hidden sm:flex flex-col">
               <div className="flex items-center gap-2 mb-0.5 hidden md:flex">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#5A5A40]/50 dark:text-[#A8D5BA]/50">Autonomy Active</span>
               </div>
               <div className="text-xs text-[#5A5A40] dark:text-[#A8D5BA] font-serif italic font-medium whitespace-nowrap">
                 {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
               </div>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 sm:p-3 bg-[#E8E8E0] dark:bg-[#252520] text-[#5A5A40] dark:text-[#A8D5BA] rounded-xl sm:rounded-2xl border border-[#D1D1C1] dark:border-[#3D3D35] hover:scale-105 transition-all shadow-sm"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 sm:p-3 bg-[#5A5A40] dark:bg-[#A8D5BA] text-white dark:text-[#1A1A15] rounded-xl sm:rounded-2xl border border-[#5A5A40]/20 dark:border-[#A8D5BA]/20 hover:scale-105 transition-all shadow-lg"
            >
              <ShoppingBag size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 border-2 border-white dark:border-[#1A1A15] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 max-w-md lg:max-w-xl mx-2 sm:mx-4">
            <GlobalSearch />
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
            {isManagement && (
              <Link 
                to={isVendor ? "/vendor" : "/admin"}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#5A5A40]/10 dark:bg-[#A8D5BA]/10 text-[#5A5A40] dark:text-[#A8D5BA] rounded-xl border border-[#5A5A40]/20 dark:border-[#A8D5BA]/20 hover:bg-[#5A5A40] dark:hover:bg-[#A8D5BA] hover:text-white dark:hover:text-[#1A1A15] transition-all group"
              >
                {isVendor ? <Store size={16} /> : <Shield size={16} />}
                <span className="text-[9px] font-bold uppercase tracking-widest">{isVendor ? 'Vendor' : (isDoctor ? 'Clinical' : 'Admin')}</span>
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex flex-col items-end hidden lg:flex">
                  <span className="text-xs font-bold text-[#5A5A40] dark:text-[#A8D5BA] truncate max-w-[80px]">{user.email?.split('@')[0]}</span>
                  <span className="text-[9px] text-[#5A5A40]/50 dark:text-[#A8D5BA]/50 uppercase tracking-wider font-bold">{role || 'Seeker'}</span>
                </div>
                <Link to="/profile" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#E8E8E0] dark:bg-[#252520] border border-[#D1D1C1] dark:border-[#3D3D35] overflow-hidden hover:border-[#5A5A40] dark:hover:border-[#A8D5BA] transition-colors shrink-0">
                  <div className="w-full h-full flex items-center justify-center text-[#5A5A40] dark:text-[#A8D5BA] font-bold text-xs sm:text-base">
                    {user.email?.[0].toUpperCase()}
                  </div>
                </Link>
              </div>
            ) : (
              <Link to="/login" className="px-4 py-1.5 sm:px-6 sm:py-2 rounded-full border border-[#5A5A40] dark:border-[#A8D5BA] text-xs sm:text-sm font-bold text-[#5A5A40] dark:text-[#A8D5BA] hover:bg-[#5A5A40] dark:hover:bg-[#A8D5BA] hover:text-white dark:hover:text-[#1A1A15] transition-all">
                Sign In
              </Link>
            )}
          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-10 lg:p-12 xl:p-16 max-w-7xl 2xl:max-w-[1400px] mx-auto pb-32 lg:pb-10">
          {!isExcluded && <Breadcrumbs />}
          {children}
        </div>

        <VisionToggle />
        <VisionPortal />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        <BiometricHUD />

        {!isExcluded && <Footer />}

        {/* Bottom Navigation for Mobile */}
        {!isOnboarding && !isExcluded && (
          <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-16 bg-[#5A5A40]/90 dark:bg-[#A8D5BA]/90 backdrop-blur-lg rounded-[2.5rem] shadow-2xl z-[50] flex items-center justify-around px-4 border border-white/20">
            {bottomNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "p-3 rounded-2xl transition-all duration-300",
                    isActive 
                      ? "bg-white text-[#5A5A40] shadow-md dark:bg-black dark:text-[#A8D5BA]" 
                      : "text-white dark:text-black hover:bg-white/10 dark:hover:bg-black/10"
                  )}
                >
                  <item.icon size={20} />
                </Link>
              );
            })}
          </nav>
        )}
      </main>
    </div>
  );
};

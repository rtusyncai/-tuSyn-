import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { VisionProvider } from './hooks/useVision';
import { Layout } from './components/Layout';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider } from './hooks/useToast';
import { CartProvider } from './hooks/useCart';
import { BiometricProvider } from './hooks/useBiometrics';

import { routes } from './routes';
import { AnimatePresence, motion } from 'motion/react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, onboardingCompleted, isDeactivated } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex items-center justify-center h-screen bg-[#F5F5F0] dark:bg-[#1A1A15]">
    <div className="animate-pulse text-[#5A5A40] dark:text-[#A8D5BA] font-serif italic text-xl">Loading Experience...</div>
  </div>;
  if (!user) return <Navigate to="/login" />;
  
  if (isDeactivated && location.pathname !== '/deactivated') {
    return <Navigate to="/deactivated" />;
  }

  if (!onboardingCompleted && location.pathname !== '/onboarding' && location.pathname !== '/deactivated') {
    return <Navigate to="/onboarding" />;
  }
  
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, role } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-[#F5F5F0] dark:bg-[#1A1A15]">
    <div className="animate-pulse text-[#5A5A40] dark:text-[#A8D5BA] font-serif italic text-xl">Verifying Authority...</div>
  </div>;
  if (!user || (role !== 'admin' && role !== 'doctor')) return <Navigate to="/" />;
  return <>{children}</>;
};

const VendorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, role } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-[#F5F5F0] dark:bg-[#1A1A15]">
    <div className="animate-pulse text-[#5A5A40] dark:text-[#A8D5BA] font-serif italic text-xl">Verifying Credentials...</div>
  </div>;
  if (!user || (role !== 'vendor' && role !== 'admin' && role !== 'doctor')) return <Navigate to="/" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <VisionProvider>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <CartProvider>
              <BiometricProvider>
                <Router>
                  <AppContent />
                </Router>
              </BiometricProvider>
            </CartProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </VisionProvider>
  );
}

const AppContent = () => {
  const location = useLocation();
  
  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {routes.map((route) => {
            let element = <route.component />;
            
            if (route.admin) {
              element = <AdminRoute>{element}</AdminRoute>;
            } else if (route.vendor) {
              element = <VendorRoute>{element}</VendorRoute>;
            } else if (route.protected) {
              element = <ProtectedRoute>{element}</ProtectedRoute>;
            }

            return (
              <Route 
                key={route.path} 
                path={route.path} 
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="w-full"
                  >
                    {element}
                  </motion.div>
                } 
              />
            );
          })}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}

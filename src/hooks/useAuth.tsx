import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: 'user' | 'doctor' | 'admin' | 'vendor' | null;
  profile: any;
  isAdmin: boolean;
  isDoctor: boolean;
  isVendor: boolean;
  isManagement: boolean;
  onboardingCompleted: boolean;
  isDeactivated: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  role: null,
  profile: null,
  isAdmin: false,
  isDoctor: false,
  isVendor: false,
  isManagement: false,
  onboardingCompleted: true,
  isDeactivated: false,
  refreshAuth: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'user' | 'doctor' | 'admin' | 'vendor' | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const isAdmin = role === 'admin';
  const isDoctor = role === 'doctor';
  const isVendor = role === 'vendor';
  const isManagement = isAdmin || isDoctor || isVendor;
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshAuth = async () => {
    if (auth.currentUser) {
      const userDoc = await getDoc(doc(db, 'profiles', auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfile(data);
        setRole(data.role || 'user');
        setOnboardingCompleted(data.onboardingCompleted !== false);
        setIsDeactivated(data.status === 'deactivated');
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await refreshAuth();
      } else {
        setRole(null);
        setProfile(null);
        setOnboardingCompleted(true);
        setIsDeactivated(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      role, 
      profile,
      isAdmin, 
      isDoctor, 
      isVendor, 
      isManagement, 
      onboardingCompleted, 
      isDeactivated, 
      refreshAuth 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

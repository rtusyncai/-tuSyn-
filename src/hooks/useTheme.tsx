import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from './useAuth';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('rtusyn-theme');
    return (saved as Theme) || 'light';
  });

  // Sync with localStorage and HTML class
  useEffect(() => {
    localStorage.setItem('rtusyn-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync with Firestore if user is logged in
  useEffect(() => {
    if (!user) return;
    
    const syncTheme = async () => {
      const docRef = doc(db, 'profiles', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.theme && data.theme !== theme) {
          setTheme(data.theme);
        }
      }
    };
    
    syncTheme();
  }, [user]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    if (user) {
      try {
        await updateDoc(doc(db, 'profiles', user.uid), {
          theme: newTheme,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to sync theme to Firestore:', error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

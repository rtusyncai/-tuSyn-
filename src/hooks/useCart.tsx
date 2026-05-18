import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  description?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isPersisted: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rtusyn_cart');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse cart from local storage', e);
          return [];
        }
      }
    }
    return [];
  });
  const [isPersisted, setIsPersisted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [hasMerged, setHasMerged] = useState(false);

  // Sync with Firestore if user is logged in
  useEffect(() => {
    if (!user) {
      setIsPersisted(false);
      setHasMerged(false);
      return;
    }

    const userRef = doc(db, 'profiles', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const serverItems = (data.cartItems as CartItem[]) || [];
        
        // Update items only if we are not in the middle of a merge
        // and only if the server version is different from what we have
        setItems(prev => {
          if (hasMerged) {
            // Check if lists are actually different to avoid unnecessary updates
            const isDifferent = JSON.stringify(prev) !== JSON.stringify(serverItems);
            return isDifferent ? serverItems : prev;
          }
          return prev; // Wait for initial merge logic to complete
        });
        setIsPersisted(true);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `profiles/${user.uid}`);
    });

    return () => unsubscribe();
  }, [user, hasMerged]);

  // Initial Merge Logic
  useEffect(() => {
    if (user && !hasMerged) {
      const performMerge = async () => {
        const userRef = doc(db, 'profiles', user.uid);
        const saved = localStorage.getItem('rtusyn_cart');
        let guestItems: CartItem[] = [];
        
        if (saved) {
          try {
            guestItems = JSON.parse(saved);
          } catch (e) {
            console.error('Failed to parse guest cart', e);
          }
        }

        try {
          const profileSnap = await getDoc(userRef);
          if (profileSnap.exists()) {
            const data = profileSnap.data();
            const serverItems = (data.cartItems as CartItem[]) || [];
            
            if (guestItems.length > 0) {
              const merged = [...serverItems];
              guestItems.forEach(localItem => {
                const existingIdx = merged.findIndex(si => si.id === localItem.id);
                if (existingIdx > -1) {
                  merged[existingIdx] = { 
                    ...merged[existingIdx], 
                    quantity: merged[existingIdx].quantity + localItem.quantity 
                  };
                } else {
                  merged.push(localItem);
                }
              });
              
              await updateDoc(userRef, { cartItems: merged });
              setItems(merged);
              localStorage.removeItem('rtusyn_cart');
            } else {
              setItems(serverItems);
            }
          }
          setHasMerged(true);
        } catch (error) {
          console.error("Initial cart merge failed:", error);
          // Fallback: just use whatever we have local for now
          setHasMerged(true);
        }
      };
      
      performMerge();
    }
  }, [user, hasMerged]);

  // Sync state to local storage and Firestore (debounced)
  useEffect(() => {
    // Save to local storage
    if (items.length > 0) {
      localStorage.setItem('rtusyn_cart', JSON.stringify(items));
    } else {
      localStorage.removeItem('rtusyn_cart');
    }
    
    const syncToFirestore = async () => {
      if (user && hasMerged) {
        const userRef = doc(db, 'profiles', user.uid);
        try {
          await updateDoc(userRef, { cartItems: items });
          setIsPersisted(true);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `profiles/${user.uid}`);
        }
      }
    };

    const timeout = setTimeout(syncToFirestore, 1500); 
    return () => clearTimeout(timeout);
  }, [items, user, hasMerged]);

  const addToCart = (newItem: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === newItem.id);
      if (existing) {
        return prev.map(item => 
          item.id === newItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item
    ).filter(item => item.quantity > 0));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      totalItems,
      totalPrice,
      isPersisted,
      isOpen,
      setIsOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type VisionMode = 'standard' | 'ar' | 'vr' | 'glasses' | 'neuro';

interface VisionContextType {
  mode: VisionMode;
  setMode: (mode: VisionMode) => void;
  payload: any;
  setPayload: (payload: any) => void;
  isARSupported: boolean;
  isVRSupported: boolean;
}

const VisionContext = createContext<VisionContextType | undefined>(undefined);

export const VisionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<VisionMode>('standard');
  const [payload, setPayload] = useState<any>(null);
  
  // Real check would be more complex, but we'll assume support for modern browsers
  const [isARSupported] = useState(true);
  const [isVRSupported] = useState(true);

  return (
    <VisionContext.Provider value={{ mode, setMode, payload, setPayload, isARSupported, isVRSupported }}>
      {children}
    </VisionContext.Provider>
  );
};

export const useVision = () => {
  const context = useContext(VisionContext);
  if (context === undefined) {
    throw new Error('useVision must be used within a VisionProvider');
  }
  return context;
};

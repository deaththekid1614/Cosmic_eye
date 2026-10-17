import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Observation } from '../types/observation';

type CompareContextType = {
  selectedObs: Observation[];
  toggleObservation: (obs: Observation) => void;
  clearSelection: () => void;
};

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [selectedObs, setSelectedObs] = useState<Observation[]>([]);

  const toggleObservation = (obs: Observation) => {
    setSelectedObs((prev) => {
      const exists = prev.find((o) => o.id === obs.id && o.band === obs.band);
      if (exists) {
        return prev.filter((o) => !(o.id === obs.id && o.band === obs.band));
      }
      if (prev.length >= 2) {
        return [prev[1], obs];
      }
      return [...prev, obs];
    });
  };

  const clearSelection = () => setSelectedObs([]);

  return (
    <CompareContext.Provider value={{ selectedObs, toggleObservation, clearSelection }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}

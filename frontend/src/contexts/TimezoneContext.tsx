import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TimezoneContextType {
  timezone: string;
  setTimezone: (tz: string) => void;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

export const TimezoneProvider = ({ children }: { children: ReactNode }) => {
  const [timezone, setTimezone] = useState(() => {
    const saved = localStorage.getItem('timezone');
    return saved || 'Europe/Moscow';
  });

  useEffect(() => {
    localStorage.setItem('timezone', timezone);
  }, [timezone]);

  return (
    <TimezoneContext.Provider value={{ timezone, setTimezone }}>
      {children}
    </TimezoneContext.Provider>
  );
};

export const useTimezone = () => {
  const context = useContext(TimezoneContext);
  if (!context) throw new Error('useTimezone must be used within TimezoneProvider');
  return context;
};
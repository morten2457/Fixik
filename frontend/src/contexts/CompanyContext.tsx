import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CompanyContextType {
  companyName: string;
  setCompanyName: (name: string) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [companyName, setCompanyName] = useState(() => {
    const saved = localStorage.getItem('companyName');
    return saved || 'Ремонт-Сервис';
  });

  useEffect(() => {
    localStorage.setItem('companyName', companyName);
  }, [companyName]);

  return (
    <CompanyContext.Provider value={{ companyName, setCompanyName }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) throw new Error('useCompany must be used within CompanyProvider');
  return context;
};
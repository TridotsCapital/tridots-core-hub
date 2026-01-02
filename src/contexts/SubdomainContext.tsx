import { createContext, useContext, ReactNode, useMemo } from 'react';
import { 
  Portal, 
  getPortalFromSubdomain, 
  getCurrentSubdomain,
  isProductionSubdomain 
} from '@/lib/subdomain';

interface SubdomainContextType {
  portal: Portal;
  subdomain: string | null;
  isProduction: boolean;
  isInternalPortal: boolean;
  isAgencyPortal: boolean;
  isUnknownPortal: boolean;
}

const SubdomainContext = createContext<SubdomainContextType | undefined>(undefined);

export function SubdomainProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => {
    const subdomain = getCurrentSubdomain();
    const portal = getPortalFromSubdomain();
    
    return {
      portal,
      subdomain,
      isProduction: isProductionSubdomain(),
      isInternalPortal: portal === 'internal',
      isAgencyPortal: portal === 'agency',
      isUnknownPortal: portal === 'unknown',
    };
  }, []);

  return (
    <SubdomainContext.Provider value={value}>
      {children}
    </SubdomainContext.Provider>
  );
}

export function useSubdomain() {
  const context = useContext(SubdomainContext);
  if (!context) {
    throw new Error('useSubdomain must be used within SubdomainProvider');
  }
  return context;
}

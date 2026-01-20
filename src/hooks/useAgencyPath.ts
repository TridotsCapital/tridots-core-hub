import { useCallback } from 'react';
import { useSubdomain } from '@/contexts/SubdomainContext';

/**
 * Hook to construct paths for the agency portal that work in both production and dev
 * In production (portal.tridotscapital.com), routes don't have /agency prefix
 * In dev/preview, routes use /agency prefix
 */
export function useAgencyPath() {
  const { isAgencyPortal } = useSubdomain();
  
  const agencyPath = useCallback((path: string): string => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    // In production (isAgencyPortal = true), no prefix needed
    // In dev/preview, use /agency prefix
    return isAgencyPortal ? cleanPath : `/agency${cleanPath}`;
  }, [isAgencyPortal]);
  
  return { agencyPath };
}

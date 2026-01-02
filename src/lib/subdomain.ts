export type Portal = 'internal' | 'agency' | 'unknown';

/**
 * Extracts the subdomain from the current hostname
 * Returns null for localhost, bare domains, or www
 */
export function getCurrentSubdomain(): string | null {
  const hostname = window.location.hostname;
  
  // Local development - no subdomain
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }
  
  // Lovable preview (*.lovable.app)
  if (hostname.endsWith('.lovable.app')) {
    // projectid.lovable.app -> no subdomain
    const parts = hostname.split('.');
    if (parts.length === 3) return null;
    return null; // Preview always uses route-based navigation
  }
  
  // Production (*.tridotscapital.com)
  if (hostname.endsWith('.tridotscapital.com')) {
    const subdomain = hostname.replace('.tridotscapital.com', '');
    // www or bare domain -> no subdomain
    if (subdomain === 'www' || !subdomain) return null;
    return subdomain;
  }
  
  return null;
}

/**
 * Determines which portal the user is accessing based on subdomain
 */
export function getPortalFromSubdomain(): Portal {
  const subdomain = getCurrentSubdomain();
  
  // No subdomain (local dev, preview, www) -> use route-based detection
  if (subdomain === null) {
    return 'unknown';
  }
  
  if (subdomain === 'app') return 'internal';
  if (subdomain === 'portal') return 'agency';
  
  return 'unknown';
}

/**
 * Checks if the current portal matches the user's role
 */
export function isCorrectPortalForRole(portal: Portal, role: string | null): boolean {
  // Unknown portal (dev environment) allows all roles
  if (portal === 'unknown') return true;
  
  if (portal === 'internal' && (role === 'master' || role === 'analyst')) return true;
  if (portal === 'agency' && role === 'agency_user') return true;
  
  return false;
}

/**
 * Gets the correct portal URL for a given role
 */
export function getPortalUrlForRole(role: string | null): string | null {
  if (role === 'master' || role === 'analyst') {
    return 'https://app.tridotscapital.com';
  }
  if (role === 'agency_user') {
    return 'https://portal.tridotscapital.com';
  }
  return null;
}

/**
 * Checks if we're in a production subdomain environment
 */
export function isProductionSubdomain(): boolean {
  return getCurrentSubdomain() !== null;
}

/**
 * Gets the default route for the current portal
 * In production with subdomains, both portals use "/" as their root
 * In dev/preview, internal uses "/" and agency uses "/agency"
 */
export function getDefaultRouteForPortal(portal: Portal, role: string | null): string {
  // Production subdomains - both use root
  if (portal === 'internal' || portal === 'agency') {
    return '/';
  }
  
  // Dev/preview - use role-based routing
  if (role === 'agency_user') {
    return '/agency';
  }
  
  return '/';
}

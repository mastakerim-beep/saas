/**
 * Aura ERP - Merkezi Rota Güvenlik Denetleyicisi
 * Public (herkese açık) ve Private (yetki gerektiren) rotaları tek bir merkezden yönetir.
 */

export const PUBLIC_ROUTES = ['/book', '/portal', '/kiosk', '/login'];

export const isPublicAuraRoute = (pathname: string | null): boolean => {
    if (!pathname) return true; // Hidratasyon sırasında kilitleme yapmamak için güvenli bölge
    
    const normalizedPath = pathname.replace(/\/+$/, '') || '/';
    
    // 1. Statik genel rotalar
    if (PUBLIC_ROUTES.some(route => normalizedPath === route || normalizedPath.startsWith(route + '/'))) {
        return true;
    }
    
    // 2. Dinamik tenant public rotaları: /[slug]/book, /[slug]/portal, /[slug]/kiosk
    const tenantPublicPattern = /^\/[^/]+\/(book|portal|kiosk)(\/|$)/;
    if (tenantPublicPattern.test(normalizedPath)) {
        return true;
    }
    
    return false;
};

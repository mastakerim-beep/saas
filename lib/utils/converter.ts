/**
 * Aura Core - Utility Functions
 * Bu dosya sistem genelinde kullanılan dönüşüm ve yardımcı fonksiyonları içerir.
 */

/**
 * Snake Case'den Camel Case'e dönüşüm yapar (Deep conversion)
 */
export const toCamel = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(v => toCamel(v));
    if (obj !== null && typeof obj === 'object') {
        const n: any = {};
        for (let k of Object.keys(obj)) {
            const camelK = k.replace(/_([a-z])/g, (_, m) => m.toUpperCase());
            n[camelK] = toCamel(obj[k]);
        }
        return n;
    }
    return obj;
};

/**
 * Camel Case'den Snake Case'e dönüşüm yapar (Deep conversion)
 * Veritabanı uyumluluğu için boş stringleri null'a çevirir.
 */
export const toSnake = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(v => toSnake(v));
    if (obj !== null && typeof obj === 'object') {
        const n: any = {};
        for (let k of Object.keys(obj)) {
            const snakeK = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            let val = obj[k];
            if (val === undefined || val === '') val = null;
            n[snakeK] = toSnake(val);
        }
        return n;
    }
    return obj;
};

/**
 * Şube adına göre benzersiz bir müşteri referans kodu üretir.
 */
export const generateReferenceCode = (branchName: string, existingCustomers: any[]) => {
    const prefix = (branchName || 'GEN').substring(0, 3).toUpperCase();
    const branchCodes = existingCustomers
        .map(c => c.referenceCode)
        .filter(code => code && typeof code === 'string' && code.startsWith(prefix))
        .map(code => {
            const parts = code.split('-');
            return parts.length > 1 ? parseInt(parts[1]) : 0;
        });
    
    const maxNum = branchCodes.length > 0 ? Math.max(...branchCodes) : 1000;
    const nextNum = Math.max(1000, maxNum) + 1;
    return `${prefix}-${nextNum}`;
};

/**
 * Ödemeler için kısa bir referans kodu üretir.
 */
export const generatePaymentRef = () => {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
};

/**
 * Yerel saat dilimine uygun ISO tarih dizisi döner.
 */
export const getLocalISO = () => {
    const now = new Date();
    const off = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - off).toISOString();
};

/**
 * Bugünün tarihini YYYY-MM-DD formatında döner.
 */
export const getTodayDate = () => {
    return new Date().toLocaleDateString('sv-SE');
};

/**
 * Belirli bir süre bekletme yapar (Async sleep)
 */
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * İstekleri belirli bir deneme sayısıyla yeniden çalıştırır.
 */
export const retryRequest = async <T,>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    try {
        return await fn();
    } catch (error) {
        if (retries <= 0) throw error;
        await sleep(delay);
        return retryRequest(fn, retries - 1, delay * 2);
    }
};
/**
 * Fiyatı yerel ayarlara göre formatlar.
 */
export const formatPrice = (amount: number, locale: 'tr' | 'en' = 'tr') => {
    const formatter = new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
        style: 'currency',
        currency: locale === 'tr' ? 'TRY' : 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    return formatter.format(amount);
};

/**
 * Şube saat dilimine göre şimdiki zamanı döner.
 */
export const getBranchTime = (timezone: string = 'Europe/Istanbul') => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: timezone,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const map: Record<string, string> = {};
    parts.forEach(p => map[p.type] = p.value);
    
    return {
        full: `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}`,
        date: `${map.year}-${map.month}-${map.day}`,
        time: `${map.hour}:${map.minute}`
    };
};

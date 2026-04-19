/**
 * Aura Spa - Akıllı Veri Eşleştirme Motoru (Fuzzy Matcher)
 * Bu modül, veri aktarımı sırasında benzer isimli hizmet/ürünleri yakalar.
 */

/**
 * İki metin arasındaki benzerlik oranını (0-1 arası) hesaplayan Levenshtein algoritması.
 */
export const getSimilarity = (s1: string, s2: string): number => {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = editDistance(longer.toLowerCase(), shorter.toLowerCase());
    return (longer.length - distance) / longer.length;
};

const editDistance = (s1: string, s2: string): number => {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
};

/**
 * Verilen bir kelimeyi listedeki en benzer kelimeyle eşleştirmeye çalışır.
 * @param query Aranacak kelime (örn: "Kalsik Masaj")
 * @param candidates Mevcut hizmet listesi (örn: ["Klasik Masaj", "Lazer Epilasyon"])
 * @param threshold Benzerlik eşiği (varsayılan: 0.7)
 */
export const findBestMatch = (query: string, candidates: string[], threshold = 0.7) => {
    let bestMatch = { target: '', similarity: 0 };
    
    for (const target of candidates) {
        const similarity = getSimilarity(query, target);
        if (similarity > bestMatch.similarity) {
            bestMatch = { target, similarity };
        }
    }
    
    return bestMatch.similarity >= threshold ? bestMatch : null;
};

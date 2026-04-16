"use client";

/**
 * Aura SaaS - Store Master
 * Bu dosya yeni modüler mimariyi dışarıya açan ana giriş noktasıdır.
 */

import { StoreProvider, useStore } from './store/StoreProvider';
import { useAuth } from './store/AuthContext';
import { useBusiness } from './store/BusinessContext';
import { useData } from './store/DataContext';

// Geriye dönük uyumluluk için ana bileşenleri ve hook'ları dışarı aktar
export { StoreProvider, useStore };

// İhtiyaç duyulursa alt context'lere doğrudan erişim
export { useAuth, useBusiness, useData };

// Tip tanımlarını dışarı aktar
export * from './store/types';

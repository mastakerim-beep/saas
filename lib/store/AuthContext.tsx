"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { AppUser, Business } from './types';

interface AuthContextType {
    currentUser: AppUser | null;
    isInitialized: boolean;
    allUsers: AppUser[];
    impersonatedBusinessId: string | null;
    isImpersonating: boolean;
    
    login: (email: string, pass: string) => Promise<AppUser | null>;
    logout: () => void;
    setCurrentUser: (user: AppUser | null) => void;
    setAllUsers: (users: AppUser[]) => void;
    setImpersonatedBusinessId: (id: string | null) => void;
    
    updateBusinessStatus: (id: string, status: Business['status']) => void;
    deleteBusiness: (id: string) => void;
    addBusiness: (b: Partial<Business> & { name: string; slug: string }) => Promise<Business | null>;
    provisionBusinessUser: (data: { email: string; password: string; name: string; businessId: string }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [allUsers, setAllUsers] = useState<AppUser[]>([]);
    const [impersonatedBusinessId, setImpersonatedBusinessId] = useState<string | null>(null);
    const isImpersonating = !!impersonatedBusinessId;

    const fetchAppUserProfile = async (authUserId: string, email: string): Promise<AppUser | null> => {
        try {
            const { data, error } = await supabase
                .from('app_users')
                .select('*')
                .eq('email', email)
                .single();

            if (error || !data) {
                const { data: byId } = await supabase.from('app_users').select('*').eq('id', authUserId).single();
                if (!byId) {
                    return null;
                }
                return {
                    id: byId.id,
                    businessId: byId.business_id,
                    branchId: byId.branch_id || null,
                    role: byId.role || 'Staff',
                    name: byId.name || 'Kullanıcı',
                    email: byId.email,
                    permissions: byId.permissions || [],
                    allowedBranches: byId.allowed_branches || []
                };
            }
            return {
                id: data.id,
                businessId: data.business_id || null,
                branchId: data.branch_id || null,
                role: data.role || 'Staff',
                name: data.name || 'Kullanıcı',
                email: data.email,
                permissions: data.permissions || [],
                allowedBranches: data.allowed_branches || []
            };
        } catch (err) {
            console.error('Critical Profile Fetch Failure:', err);
            return null;
        }
    };

    useEffect(() => {
        // --- 1. Immediate Initial Check ---
        const checkInitialSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const appUser = await fetchAppUserProfile(session.user.id, session.user.email!);
                    setCurrentUser(appUser);
                }
            } catch (err) {
                console.error('🛡️ [Auth Trace] Initial session check failed:', err);
            } finally {
                setIsInitialized(true); 
            }
        };
        checkInitialSession();

        // --- 2. Auth State Listener ---
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🛡️ [Auth Trace] Event:', event, session?.user?.email);
            
            if (session?.user) {
                try {
                    const appUser = await fetchAppUserProfile(session.user.id, session.user.email!);
                    setCurrentUser(appUser);
                } catch (err) {
                    console.error('Profile fetch error:', err);
                } finally {
                    setIsInitialized(true);
                }
            } else {
                setCurrentUser(null);
                setIsInitialized(true);
            }
        });

        // --- SAFETY TIMEOUT: Force initialization if auth listener is stuck ---
        // Reduced timeout for better UX, now that we have multiple safety layers
        const safetyTimeoutMs = 1500; 
        const safetyTimer = setTimeout(() => {
            setIsInitialized(prev => {
                if (!prev) {
                    console.warn('⚠️ [Auth Trace] Initialization timeout. Forced unlock.');
                    // Try manual session check
                    supabase.auth.getSession().then(({ data: { session } }) => {
                        if (session?.user) {
                            fetchAppUserProfile(session.user.id, session.user.email!).then(profile => {
                                if (profile) setCurrentUser(profile);
                            });
                        }
                    });
                }
                return true; 
            });
        }, safetyTimeoutMs);

        return () => {
            subscription.unsubscribe();
            clearTimeout(safetyTimer);
        };
    }, []);

    const login = async (email: string, pass: string): Promise<AppUser | null> => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error || !data.user) return null;
        
        const appUser = await fetchAppUserProfile(data.user.id, email);
        if (!appUser) {
            await supabase.auth.signOut();
            return null;
        }
        setCurrentUser(appUser);
        return appUser;
    };

    const logout = async () => {
        // Clear user state but keep initialization true to allow routing
        setCurrentUser(null);
        
        try {
            // Background cleanup
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('supabase.auth.token') || key.startsWith('sb-'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
            localStorage.removeItem('aura_business_catalog');
            localStorage.removeItem('aura_last_branch');

            // Sign out from Supabase
            await supabase.auth.signOut();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            // Force hard redirect to clear all states and memory
            window.location.replace('/login');
        }
    };

    // Placeholder Business Management methods
    const updateBusinessStatus = async (id: string, status: Business['status']) => {
        const { error } = await supabase.from('businesses').update({ status }).eq('id', id);
        if (error) console.error('Error updating business status:', error);
    };

    const deleteBusiness = async (id: string) => {
        const { error } = await supabase.from('businesses').delete().eq('id', id);
        if (error) console.error('Error deleting business:', error);
    };

    const addBusiness = async (b: Partial<Business> & { name: string; slug: string }) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;

        const response = await fetch('/api/admin/create-business', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify(b)
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error);
        return result.business as Business;
    };

    const provisionBusinessUser = async (data: { email: string; password: string; name: string; businessId: string }) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return { success: false, error: 'Oturum bulunamadı.' };

        const response = await fetch('/api/admin/provision-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify(data)
        });

        return await response.json();
    };

    const contextValue = useMemo(() => ({ 
        currentUser, isInitialized, allUsers, impersonatedBusinessId, isImpersonating,
        login, logout, setCurrentUser, setAllUsers, setImpersonatedBusinessId,
        updateBusinessStatus, deleteBusiness, addBusiness, provisionBusinessUser
    }), [currentUser, isInitialized, allUsers, impersonatedBusinessId, isImpersonating]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

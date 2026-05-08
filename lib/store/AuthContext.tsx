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
            // Priority 1: Fetch by ID (Primary Key is fastest)
            const { data: byId } = await supabase.from('app_users').select('*').eq('id', authUserId).single();
            
            if (byId) {
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

            // Priority 2: Fallback to email if ID match fails (e.g. legacy records)
            const { data: byEmail } = await supabase.from('app_users').select('*').eq('email', email).single();
            if (byEmail) {
                return {
                    id: byEmail.id,
                    businessId: byEmail.business_id || null,
                    branchId: byEmail.branch_id || null,
                    role: byEmail.role || 'Staff',
                    name: byEmail.name || 'Kullanıcı',
                    email: byEmail.email,
                    permissions: byEmail.permissions || [],
                    allowedBranches: byEmail.allowed_branches || []
                };
            }
            
            return null;
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
                    console.log('🛡️ [Auth Trace] Initial profile fetched:', !!appUser);
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
                    if (!appUser) {
                        // CRITICAL: If session exists but profile is missing, this is a corrupted state.
                        // We must perform a hard logout immediately to break potential loops.
                        console.error('🛡️ [Auth Trace] Profile missing for session. Performing hard reset.');
                        setCurrentUser(null);
                        
                        // Clear local storage and cookies immediately
                        if (typeof window !== 'undefined') {
                            localStorage.removeItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0].split('//')[1] + '-auth-token');
                            document.cookie.split(";").forEach((c) => {
                                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                            });
                        }
                        
                        await supabase.auth.signOut();
                    } else {
                        setCurrentUser(appUser);
                    }
                } catch (err) {
                    console.error('Profile fetch error:', err);
                } finally {
                    console.log('🛡️ [Auth Trace] Auth listener finalized.');
                    setIsInitialized(true);
                }
            } else {
                setCurrentUser(null);
                setIsInitialized(true);
            }
        });

        // INCREASED TIMEOUT: 1.5s was causing loops on slow networks.
        // We wait longer to give the profile fetch a chance to complete.
        const safetyTimeoutMs = 8000; 
        const safetyTimer = setTimeout(() => {
            setIsInitialized(prev => {
                if (!prev) {
                    console.warn('⚠️ [Auth Trace] Initialization timeout (8s). Forced unlock.');
                    // Try manual session check one last time
                    supabase.auth.getSession().then(({ data: { session } }) => {
                        if (session) {
                            console.log("⏳ [Auth Trace] Session detected but profile missing. Waiting for AuthContext cleanup...");
                            // Do NOT redirect yet, wait for AuthContext to detect the missing profile and sign out.
                            return; 
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
        setIsInitialized(true); // CRITICAL: Unlock immediately after login
        return appUser;
    };

    const logout = async () => {
        // 1. Immediate UI cleanup
        setCurrentUser(null);
        
        try {
            // 2. Clear Auth Tokens from LocalStorage immediately
            if (typeof window !== 'undefined') {
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.includes('supabase.auth.token') || key.startsWith('sb-') || key.includes('aura_'))) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));
                
                // 3. Clear session cookies (Supabase specific)
                document.cookie.split(";").forEach((c) => {
                    document.cookie = c
                        .replace(/^ +/, "")
                        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });
            }

            // 4. Background sign out (don't wait for it to redirect)
            supabase.auth.signOut().catch(e => console.error('Signout background error:', e));
            
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            // 5. Force hard redirect to clear memory and states
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
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

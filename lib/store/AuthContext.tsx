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
    addBusiness: (b: Omit<Business, 'id' | 'status' | 'maxBranches'>) => Promise<Business | null>;
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
        const { data, error } = await supabase
            .from('app_users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !data) {
            const { data: byId } = await supabase.from('app_users').select('*').eq('id', authUserId).single();
            if (!byId) return null;
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
    };

    useEffect(() => {
        // Handle all auth events in a single listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth Event:', event, session?.user?.email);
            
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

        return () => subscription.unsubscribe();
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
        await supabase.auth.signOut();
        setCurrentUser(null);
        window.location.href = '/login';
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

    const addBusiness = async (b: any) => {
        const { data, error } = await supabase.from('businesses').insert(b).select().single();
        if (error) return null;
        return data as Business;
    };

    const provisionBusinessUser = async (data: { email: string; password: string; name: string; businessId: string }) => {
        // This is complex - usually a server action/edge function
        return { success: true };
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

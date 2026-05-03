import { Business } from "../types";
import { checkQuota } from "@/lib/utils/feature-gate";

export const useBusinessMethods = (deps: any) => {
    const { 
        activeBizIdRef, 
        syncDb, 
        bizRef,
        authRef,
        setQuotaError,
        fetchData
    } = deps;

    return {
        updateBusiness: async (updates: Partial<Business>) => {
            const bizId = activeBizIdRef.current;
            if (!bizId) return false;
            bizRef.current.setCurrentTenant((prev: Business | null) => prev ? { ...prev, ...updates } : null);
            return !!(await syncDb('businesses', 'update', updates, bizId, bizId));
        },
        updateAnyBusiness: async (id: string, updates: any) => {
            bizRef.current.setAllBusinesses((prev: any[]) => prev.map((b: any) => b.id === id ? { ...b, ...updates } : b));
            await syncDb('businesses', 'update', updates, id, id);
            if (fetchData) await fetchData(undefined, undefined, true); 
            return true;
        },
        addBranch: async (branch: any) => {
            const bizData = bizRef.current.currentTenant;
            const bizId = activeBizIdRef.current;
            if (bizData) {
                const { allowed, limit } = checkQuota(bizData, 'branches', bizRef.current.branches.length);
                if (!allowed) {
                    if (setQuotaError) setQuotaError({ resource: 'Şube', limit });
                    return false;
                }
            }
            const id = crypto.randomUUID();
            const nb = { ...branch, id, businessId: bizId, createdAt: new Date().toISOString() };
            bizRef.current.setBranches((prev: any) => [...prev, nb]);
            await syncDb('branches', 'insert', nb, id, bizId);
            return true;
        },
        updateBranch: async (id: string, branch: any) => {
            bizRef.current.setBranches((prev: any) => prev.map((b: any) => b.id === id ? { ...b, ...branch } : b));
            await syncDb('branches', 'update', branch, id, activeBizIdRef.current);
        },
        deleteBranch: async (id: string) => {
            bizRef.current.setBranches((prev: any) => prev.filter((b: any) => b.id !== id));
            await syncDb('branches', 'delete', null, id, activeBizIdRef.current);
        },
        setImpersonatedBusinessId: (id: string | null) => {
            authRef.current.setImpersonatedBusinessId(id);
            if (id) {
                const bizItem = bizRef.current.allBusinesses.find((b: any) => b.id === id);
                if (bizItem) {
                    window.location.href = `/${bizItem.slug}/dashboard`;
                }
            } else {
                window.location.href = '/admin';
            }
        },
    };
};

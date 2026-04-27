import { checkQuota } from '@/lib/utils/feature-gate';

export const useStaffMethods = (deps: any) => {
    const { 
        dataRef, 
        activeBizIdRef, 
        syncDb, 
        stableMethodsRef, 
        bizRef,
        authRef,
        setQuotaError
    } = deps;

    return {
        addStaff: async (s: any) => {
            const bizData = bizRef.current.currentTenant;
            if (bizData) {
                const activeStaffCount = dataRef.current.staffMembers.filter((s:any) => s.status === 'active').length;
                const { allowed, limit } = checkQuota(bizData, 'users', activeStaffCount);
                if (!allowed) {
                    if (setQuotaError) setQuotaError({ resource: 'Personel', limit });
                    return false;
                }
            }
            const id = crypto.randomUUID();
            const ns = { ...s, id, isVisibleOnCalendar: true, sortOrder: 0, businessId: activeBizIdRef.current, createdAt: new Date().toISOString() };
            dataRef.current.setAllStaff((prev: any[]) => [...prev, ns]);
            await syncDb('staff', 'insert', ns, id, activeBizIdRef.current);
            return true;
        },
        updateStaff: async (id: string, s: any) => {
            dataRef.current.setAllStaff((prev: any[]) => prev.map((st: any) => st.id === id ? { ...st, ...s } : st));
            await syncDb('staff', 'update', s, id, activeBizIdRef.current);
        },
        deleteStaff: async (id: string) => {
            const staff = dataRef.current.staffMembers.find((st: any) => st.id === id);
            if (!staff) return;
            dataRef.current.setAllStaff((prev: any[]) => prev.filter((st: any) => st.id !== id));
            await syncDb('staff', 'delete', {}, id, activeBizIdRef.current);
            if (stableMethodsRef.current?.addLog) stableMethodsRef.current.addLog('Personel Silindi', staff.name);
        },
        updateStaffPermissions: async (userId: string, perms: string[]) => {
            await syncDb('users', 'update', { permissions: perms }, userId, activeBizIdRef.current);
        },
        addCommissionRule: async (rule: any) => {
            const id = crypto.randomUUID();
            const nr = { ...rule, id };
            dataRef.current.setAllCommissionRules((prev: any) => [nr, ...prev]);
            await syncDb('commission_rules', 'insert', nr, id, activeBizIdRef.current);
        },
        removeCommissionRule: async (id: string) => {
            dataRef.current.setAllCommissionRules((prev: any[]) => prev.filter((r: any) => r.id !== id));
            await syncDb('commission_rules', 'delete', {}, id, activeBizIdRef.current);
        },
    };
};


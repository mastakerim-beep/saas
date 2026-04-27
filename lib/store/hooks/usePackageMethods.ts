export const usePackageMethods = (deps: any) => {
    const { 
        dataRef, 
        activeBizIdRef, 
        syncDb, 
        stableMethodsRef, 
        bizRef
    } = deps;

    return {
        addPackage: async (p: any) => {
            const id = crypto.randomUUID();
            const np = { 
                ...p, 
                id, 
                usedSessions: p.usedSessions || 0, 
                status: p.status || 'active',
                createdAt: new Date().toISOString() 
            };
            if (!np.expiry && p.validityDays) {
                const date = new Date();
                date.setDate(date.getDate() + p.validityDays);
                np.expiry = date.toISOString().split('T')[0];
            }
            dataRef.current.setAllPackages((prev: any[]) => [np, ...prev]);
            await syncDb('packages', 'insert', np, id, activeBizIdRef.current);
            if (stableMethodsRef.current?.addLog) stableMethodsRef.current.addLog('Paket Eklendi', p.customerId, '', p.name);
        },
        updatePackage: async (id: string, updates: any, historyLog?: any) => {
            dataRef.current.setAllPackages((prev: any[]) => prev.map((p: any) => p.id === id ? { ...p, ...updates } : p));
            await syncDb('packages', 'update', updates, id, activeBizIdRef.current);
            if (historyLog) {
                const hid = crypto.randomUUID();
                const log = { ...historyLog, id: hid, businessId: activeBizIdRef.current, packageId: id, createdAt: new Date().toISOString() };
                dataRef.current.setPackageUsageHistory((prev: any[]) => [log, ...prev]);
                await syncDb('package_usage_history', 'insert', log, hid, activeBizIdRef.current);
            }
        },
        addPackageUsageHistory: async (h: any) => {
            const id = crypto.randomUUID();
            const nh = { ...h, id, businessId: activeBizIdRef.current, createdAt: new Date().toISOString() };
            dataRef.current.setPackageUsageHistory((prev: any[]) => [nh, ...prev]);
            await syncDb('package_usage_history', 'insert', nh, id, activeBizIdRef.current);
        },
        addPackageDefinition: async (p: any) => {
            const id = crypto.randomUUID();
            const np = { ...p, id };
            dataRef.current.setAllPackageDefinitions((prev: any) => [np, ...prev]);
            await syncDb('package_definitions', 'insert', np, id, activeBizIdRef.current);
        },
        updatePackageDefinition: async (id: string, p: any) => {
            dataRef.current.updatePackageDefinition(id, p);
            await syncDb('package_definitions', 'update', p, id, activeBizIdRef.current);
        },
        removePackageDefinition: async (id: string) => {
            const item = dataRef.current.packageDefinitions.find((p: any) => p.id === id);
            if (!item) return false;
            dataRef.current.removePackageDefinition(id);
            const ok = await syncDb('package_definitions', 'delete', {}, id, activeBizIdRef.current);
            if (!ok && item) dataRef.current.setAllPackageDefinitions((prev: any) => [...prev, item]);
            return ok;
        },
        addMembershipPlan: async (p: any) => {
            const id = crypto.randomUUID();
            const np = { ...p, id };
            dataRef.current.setMembershipPlans((prev: any[]) => [np, ...prev]);
            await syncDb('membership_plans', 'insert', np, id, activeBizIdRef.current);
            if (stableMethodsRef.current?.addLog) stableMethodsRef.current.addLog('Üyelik Planı Oluşturuldu', 'Sistem', '', p.name);
        },
        assignMembership: async (cid: string, pid: string) => {
            const plan = dataRef.current.membershipPlans.find((p: any) => p.id === pid);
            if (!plan) return;
            const id = crypto.randomUUID();
            const m = { 
                id, customerId: cid, planId: pid, 
                startDate: new Date().toISOString().split('T')[0], 
                expiryDate: new Date(Date.now() + (plan.periodDays || 30) * 86400000).toISOString().split('T')[0], 
                remainingSessions: plan.sessionsPerMonth, 
                status: 'active' as const 
            };
            dataRef.current.setCustomerMemberships((prev: any) => [...prev, m]);
            await syncDb('customer_memberships', 'insert', m, id, activeBizIdRef.current);
        }
    };
};


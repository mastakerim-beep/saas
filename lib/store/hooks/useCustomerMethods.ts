export const useCustomerMethods = (deps: any) => {
    const { 
        dataRef, 
        activeBizIdRef, 
        syncDb, 
        stableMethodsRef, 
        bizRef,
        markAsModified
    } = deps;

    return {
        addCustomer: async (c: any) => {
            const refCode = c.referenceCode || (() => {
                const branchName = bizRef.current.currentBranch?.name || bizRef.current.branches[0]?.name || 'GEN';
                const prefix = branchName.substring(0, 3).toUpperCase();
                const existingNums = dataRef.current.customers
                    .map((cx: any) => cx.referenceCode)
                    .filter((code: any) => code && typeof code === 'string' && code.startsWith(prefix))
                    .map((code: any) => { const parts = (code as string).split('-'); return parts.length > 1 ? parseInt(parts[1]) : 0; });
                const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 1000;
                return `${prefix}-${Math.max(1000, maxNum) + 1}`;
            })();
            const customer = dataRef.current.addCustomer({ ...c, referenceCode: refCode });
            await syncDb('customers', 'insert', customer, customer.id, activeBizIdRef.current);
            return customer;
        },
        updateCustomer: async (id: string, updates: any) => {
            dataRef.current.updateCustomer(id, updates);
            await syncDb('customers', 'update', updates, id, activeBizIdRef.current);
            if (stableMethodsRef.current?.addLog) stableMethodsRef.current.addLog('Müşteri Güncellendi', id, '', 'Güncelleme');
        },
        deleteCustomer: async (id: string) => {
            if (markAsModified) markAsModified(id);
            const customer = dataRef.current.customers.find((c: any) => c.id === id);
            const ok = await dataRef.current.deleteCustomer(id);
            if (ok) {
                await syncDb('customers', 'delete', {}, id, activeBizIdRef.current);
                if (customer && stableMethodsRef.current?.addLog) stableMethodsRef.current.addLog('Müşteri Silindi', customer.name);
            }
            return ok;
        },
    };
};


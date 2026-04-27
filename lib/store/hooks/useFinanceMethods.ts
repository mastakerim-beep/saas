export const useFinanceMethods = (deps: any) => {
    const { 
        dataRef, 
        activeBizIdRef, 
        syncDb, 
        stableMethodsRef, 
        bizRef,
        authRef
    } = deps;

    return {
        addExpense: async (e: any) => {
            const id = crypto.randomUUID();
            const ne = { ...e, id, user: authRef.current.currentUser?.name };
            dataRef.current.setAllExpenses((prev: any[]) => [ne, ...prev]);
            await syncDb('expenses', 'insert', ne, id, activeBizIdRef.current);
            if (stableMethodsRef.current?.addLog) stableMethodsRef.current.addLog('Gider Eklendi', 'Muhasebe', '', e.desc);
        },
        addPaymentDefinition: async (p: any) => {
            const id = crypto.randomUUID();
            const np = { ...p, id };
            bizRef.current.setPaymentDefinitions((prev: any[]) => [...prev, np]);
            await syncDb('payment_definitions', 'insert', np, id, activeBizIdRef.current);
        },
        updatePaymentDefinition: async (id: string, p: any) => {
            bizRef.current.setPaymentDefinitions((prev: any[]) => prev.map((x: any) => x.id === id ? { ...x, ...p } : x));
            await syncDb('payment_definitions', 'update', p, id, activeBizIdRef.current);
        },
        removePaymentDefinition: async (id: string) => {
            bizRef.current.setPaymentDefinitions((prev: any[]) => prev.filter((x: any) => x.id !== id));
            await syncDb('payment_definitions', 'delete', {}, id, activeBizIdRef.current);
        },
        addBankAccount: async (b: any) => {
            const id = crypto.randomUUID();
            const nb = { ...b, id };
            bizRef.current.setBankAccounts((prev: any[]) => [...prev, nb]);
            await syncDb('bank_accounts', 'insert', nb, id, activeBizIdRef.current);
        },
        updateBankAccount: async (id: string, b: any) => {
            bizRef.current.setBankAccounts((prev: any[]) => prev.map((x: any) => x.id === id ? { ...x, ...b } : x));
            await syncDb('bank_accounts', 'update', b, id, activeBizIdRef.current);
        },
        removeBankAccount: async (id: string) => {
            bizRef.current.setBankAccounts((prev: any[]) => prev.filter((x: any) => x.id !== id));
            await syncDb('bank_accounts', 'delete', {}, id, activeBizIdRef.current);
        },
        addExpenseCategory: async (c: any) => {
            const id = crypto.randomUUID();
            const nc = { ...c, id };
            bizRef.current.setExpenseCategories((prev: any[]) => [...prev, nc]);
            await syncDb('expense_categories', 'insert', nc, id, activeBizIdRef.current);
        },
        updateExpenseCategory: async (id: string, c: any) => {
            bizRef.current.setExpenseCategories((prev: any[]) => prev.map((x: any) => x.id === id ? { ...x, ...c } : x));
            await syncDb('expense_categories', 'update', c, id, activeBizIdRef.current);
        },
        removeExpenseCategory: async (id: string) => {
            bizRef.current.setExpenseCategories((prev: any[]) => prev.filter((x: any) => x.id !== id));
            await syncDb('expense_categories', 'delete', {}, id, activeBizIdRef.current);
        },
        updateRates: (nr: any[]) => bizRef.current.setAllRates(nr),
    };
};


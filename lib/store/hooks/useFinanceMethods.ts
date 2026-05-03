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
        payDebt: async (id: string, amount: number, methods: any) => {
            const debt = dataRef.current.debts.find((d: any) => d.id === id);
            if (!debt) return false;
            const newStatus = debt.amount - amount <= 0 ? 'kapandı' : 'açık';
            dataRef.current.setAllDebts((prev: any[]) => prev.map((d: any) => d.id === id ? { ...d, status: newStatus } : d));
            await syncDb('debts', 'update', { status: newStatus }, id, activeBizIdRef.current);
            const paymentId = crypto.randomUUID();
            const pay = { 
                id: paymentId, 
                customerId: debt.customerId, 
                customerName: 'Borç Ödemesi', 
                service: 'Borç Tahsilatı', 
                methods, 
                totalAmount: amount, 
                date: new Date().toISOString().split('T')[0], 
                note: 'Borç ödemesi',
                businessId: activeBizIdRef.current,
                createdAt: new Date().toISOString()
            };
            dataRef.current.setAllPayments((prev: any[]) => [pay, ...prev]);
            await syncDb('payments', 'insert', pay, paymentId, activeBizIdRef.current);
            return true;
        },
        addZReport: async (reportData: any) => {
            const ok = await syncDb('z_reports', 'insert', {
                ...reportData,
                businessId: activeBizIdRef.current,
                branchId: bizRef.current.currentBranch?.id,
                closedBy: authRef.current.currentUser?.id,
                closedByName: authRef.current.currentUser?.name
            });
            if (ok && stableMethodsRef.current?.fetchData) await stableMethodsRef.current.fetchData();
            return ok;
        },
        closeDay: async (reportData: any) => {
            const bizId = activeBizIdRef.current;
            if (!bizId) return false;
            const today = new Date().toISOString().split('T')[0];
            const paymentsToday = dataRef.current.payments.filter((p: any) => p.date === today);
            const total = paymentsToday.reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0) || 0;
            const id = crypto.randomUUID();
            const report = { 
                ...reportData, 
                id, 
                businessId: bizId, 
                branchId: bizRef.current.currentBranch?.id, 
                closedBy: authRef.current.currentUser?.name || 'Sistem', 
                createdAt: new Date().toISOString() 
            };
            dataRef.current.setZReports((prev: any[]) => [...prev, report]);
            const success = await syncDb('z_reports', 'insert', report, id, bizId);
            if (success) {
                const { generateZReportPDF } = require('@/lib/utils/pdf-generator');
                generateZReportPDF(report, bizRef.current.currentTenant);
                if (stableMethodsRef.current?.addLog) {
                    stableMethodsRef.current.addLog('Gün Kapatıldı', 'Sistem', '', `Ciro: ${total}`);
                }
            }
            return !!success;
        },
        downloadZReportPDF: (report: any) => {
            const { generateZReportPDF } = require('@/lib/utils/pdf-generator');
            generateZReportPDF(report, bizRef.current.currentTenant);
        },
    };
};


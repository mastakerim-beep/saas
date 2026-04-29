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

        getWallet: (customerId: string) => {
            return dataRef.current.wallets.find((w: any) => w.customerId === customerId);
        },

        loadWallet: async (customerId: string, amount: number, desc: string = 'Bakiye Yükleme') => {
            const bizId = activeBizIdRef.current;
            if (!bizId) return;

            let wallet = dataRef.current.wallets.find((w: any) => w.customerId === customerId);
            
            if (!wallet) {
                const id = crypto.randomUUID();
                wallet = { id, customerId, balance: 0, loyaltyPoints: 0, businessId: bizId };
                dataRef.current.setWallets((prev: any[]) => [...prev, wallet]);
                await syncDb('customer_wallets', 'insert', wallet, id, bizId);
            }

            const newBalance = Number(wallet.balance || 0) + amount;
            dataRef.current.setWallets((prev: any[]) => prev.map((w: any) => w.id === wallet.id ? { ...w, balance: newBalance } : w));
            await syncDb('customer_wallets', 'update', { balance: newBalance }, wallet.id, bizId);

            const txId = crypto.randomUUID();
            const tx = {
                id: txId,
                walletId: wallet.id,
                businessId: bizId,
                type: 'LOAD',
                amount: amount,
                description: desc,
                createdAt: new Date().toISOString()
            };
            dataRef.current.setWalletTransactions((prev: any[]) => [tx, ...prev]);
            await syncDb('wallet_transactions', 'insert', tx, txId, bizId);
            
            if (stableMethodsRef.current?.addLog) {
                const customer = dataRef.current.customers.find((c: any) => c.id === customerId);
                stableMethodsRef.current.addLog('Cüzdan Yükleme', customer?.name || 'Bilinmiyor', '', `${amount} TL yüklendi`);
            }
        },

        spendFromWallet: async (customerId: string, amount: number, desc: string = 'Ödeme') => {
            const bizId = activeBizIdRef.current;
            if (!bizId) return false;

            const wallet = dataRef.current.wallets.find((w: any) => w.customerId === customerId);
            if (!wallet || Number(wallet.balance || 0) < amount) return false;

            const newBalance = Number(wallet.balance) - amount;
            dataRef.current.setWallets((prev: any[]) => prev.map((w: any) => w.id === wallet.id ? { ...w, balance: newBalance } : w));
            await syncDb('customer_wallets', 'update', { balance: newBalance }, wallet.id, bizId);

            const txId = crypto.randomUUID();
            const tx = {
                id: txId,
                walletId: wallet.id,
                businessId: bizId,
                type: 'SPEND',
                amount: amount,
                description: desc,
                createdAt: new Date().toISOString()
            };
            dataRef.current.setWalletTransactions((prev: any[]) => [tx, ...prev]);
            await syncDb('wallet_transactions', 'insert', tx, txId, bizId);
            
            if (stableMethodsRef.current?.addLog) {
                const customer = dataRef.current.customers.find((c: any) => c.id === customerId);
                stableMethodsRef.current.addLog('Cüzdan Harcaması', customer?.name || 'Bilinmiyor', '', `${amount} TL harcandı`);
            }
            return true;
        },
    };
};


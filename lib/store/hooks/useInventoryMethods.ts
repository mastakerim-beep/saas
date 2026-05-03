export const useInventoryMethods = (deps: any) => {
    const { 
        dataRef, 
        activeBizIdRef, 
        syncDb, 
        stableMethodsRef, 
        bizRef,
        markAsModified
    } = deps;

    return {
        addBlock: async (b: any) => {
            const id = crypto.randomUUID();
            const block = { ...b, id };
            dataRef.current.setAllBlocks((prev: any[]) => [block, ...prev]);
            const ok = await syncDb('calendar_blocks', 'insert', block, id, activeBizIdRef.current);
            if (ok && stableMethodsRef.current?.addLog) stableMethodsRef.current.addLog('Takvim Engeli Eklendi', 'Mekan', '', b.reason || 'Blok');
            return ok;
        },
        updateBlock: async (id: string, updates: any) => {
            dataRef.current.updateBlock(id, updates);
            await syncDb('calendar_blocks', 'update', updates, id, activeBizIdRef.current);
            return true;
        },
        removeBlock: async (id: string) => {
            dataRef.current.removeBlock(id);
            const ok = await syncDb('calendar_blocks', 'delete', {}, id, activeBizIdRef.current);
            return ok;
        },
        addProduct: async (p: any) => {
            const id = crypto.randomUUID();
            const np = { ...p, id };
            dataRef.current.setAllInventory((prev: any[]) => [np, ...prev]);
            await syncDb('inventory', 'insert', np, id, activeBizIdRef.current);
            if (stableMethodsRef.current?.addLog) stableMethodsRef.current.addLog('Envanter Eklendi', 'Depo', '', p.name);
        },
        updateProduct: async (id: string, p: any) => {
            dataRef.current.updateProduct(id, p);
            await syncDb('inventory', 'update', p, id, activeBizIdRef.current);
        },
        removeProduct: async (id: string) => {
            if (markAsModified) markAsModified(id);
            const product = dataRef.current.inventory.find((p: any) => p.id === id);
            if (!product) return;
            dataRef.current.removeProduct(id);
            await syncDb('inventory', 'delete', {}, id, activeBizIdRef.current);
            if (stableMethodsRef.current?.addLog) stableMethodsRef.current.addLog('Envanterden Silindi', product.name, 'Yönetici Onaylı');
        },
        addRoom: async (r: any) => {
            const id = crypto.randomUUID();
            const room = { ...r, id, createdAt: new Date().toISOString() };
            dataRef.current.setAllRooms((prev: any[]) => [...prev, room]);
            await syncDb('rooms', 'insert', room, id, activeBizIdRef.current);
            if (stableMethodsRef.current?.addLog) stableMethodsRef.current.addLog('Oda Eklendi', 'Mekan', '', r.name);
        },
        updateRoom: async (id: string, updates: any) => {
            dataRef.current.updateRoom(id, updates);
            await syncDb('rooms', 'update', updates, id, activeBizIdRef.current);
        },
        deleteRoom: async (id: string) => {
            const room = dataRef.current.rooms.find((r: any) => r.id === id);
            if (!room) return;
            dataRef.current.removeRoom(id);
            const ok = await syncDb('rooms', 'delete', {}, id, activeBizIdRef.current);
            if (!ok) {
                dataRef.current.setAllRooms((prev: any) => [...prev, room]);
                return;
            }
            if (stableMethodsRef.current?.addLog) stableMethodsRef.current.addLog('Kabin Silindi', room.name, 'Yönetici Onaylı');
        },
        addUsageNorm: async (norm: any) => {
            const id = crypto.randomUUID();
            const nn = { ...norm, id, businessId: activeBizIdRef.current };
            dataRef.current.setUsageNorms((prev: any) => [...prev, nn]);
            await syncDb('inventory_usage_norms', 'insert', nn, id, activeBizIdRef.current);
        },
        updateUsageNorm: async (id: string, updates: any) => {
            dataRef.current.setUsageNorms((prev: any[]) => prev.map(n => n.id === id ? { ...n, ...updates } : n));
            await syncDb('inventory_usage_norms', 'update', updates, id, activeBizIdRef.current);
        },
        addInventoryCategory: async (c: any) => {
            const id = crypto.randomUUID();
            const nc = { ...c, id, businessId: activeBizIdRef.current };
            dataRef.current.setAllInventoryCategories((prev: any) => [...prev, nc]);
            await syncDb('inventory_categories', 'insert', nc, id, activeBizIdRef.current);
        },
        updateInventoryCategory: async (id: string, updates: any) => {
            dataRef.current.setAllInventoryCategories((prev: any[]) => prev.map(c => c.id === id ? { ...c, ...updates } : c));
            await syncDb('inventory_categories', 'update', updates, id, activeBizIdRef.current);
        },
        removeInventoryCategory: async (id: string) => {
            dataRef.current.setAllInventoryCategories((prev: any[]) => prev.filter(c => c.id !== id));
            await syncDb('inventory_categories', 'delete', {}, id, activeBizIdRef.current);
        },
        transferProduct: async (transfer: any) => {
            const bizId = activeBizIdRef.current;
            if (!bizId) return false;
            const { productId, fromBranchId, toBranchId, quantity, transferType, pricePerUnit } = transfer;
            const inventory = dataRef.current.inventory;
            const fromProduct = inventory.find((p: any) => p.id === productId && p.branchId === fromBranchId);
            const toProduct = inventory.find((p: any) => p.id === productId && p.branchId === toBranchId);
            
            if (fromProduct) {
                const newFromStock = Math.max(0, (fromProduct.stock || 0) - quantity);
                dataRef.current.updateProduct(fromProduct.id, { stock: newFromStock });
                await syncDb('inventory', 'update', { stock: newFromStock }, fromProduct.id, bizId);
            }
            if (toProduct) {
                const newToStock = (toProduct.stock || 0) + quantity;
                dataRef.current.updateProduct(toProduct.id, { stock: newToStock });
                await syncDb('inventory', 'update', { stock: newToStock }, toProduct.id, bizId);
            }
            const tid = crypto.randomUUID();
            await syncDb('inventory_transfers', 'insert', { ...transfer, id: tid, businessId: bizId, createdAt: new Date().toISOString() }, tid, bizId);
            
            if (transferType === 'cost' || transferType === 'profit') {
                const amount = quantity * (pricePerUnit || 0);
                const expId = crypto.randomUUID();
                await syncDb('expenses', 'insert', {
                    id: expId, businessId: bizId, branchId: toBranchId,
                    category: 'URUN_TRANSFERI', amount: amount, date: new Date().toISOString().split('T')[0],
                    description: `${fromProduct?.name || 'Ürün'} Transfer Maliyeti`, payout_status: 'ODENDI', createdAt: new Date().toISOString()
                }, expId, bizId);
            }
            return true;
        },
        predictInventory: () => {
            return dataRef.current.inventory.map((p: any) => {
                const daysLeft = Math.floor((p.stock || 0) / 0.5); // Simplified consumption rate
                const runoutDate = new Date();
                runoutDate.setDate(runoutDate.getDate() + daysLeft);
                return { productId: p.id, productName: p.name, daysLeft, runoutDate: runoutDate.toISOString() };
            });
        },
    };
};


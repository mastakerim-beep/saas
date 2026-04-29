export const usePaymentMethods = (deps: any) => {
    const { 
        dataRef, 
        activeBizIdRef, 
        syncDb, 
        stableMethodsRef, 
        bizRef,
        setSyncStatus,
        setPendingVetoes
    } = deps;

    return {
        processCheckout: async (paymentData: any, options: any = {}) => {
            const { installments, soldProducts, earnedPoints, tipAmount, pointsUsed, packageId } = options;
            const bizId = activeBizIdRef.current;
            if (!bizId) return { success: false, message: 'İşletme kimliği bulunamadı (Session hatası, sayfayı yenileyin).' };
            if (setSyncStatus) setSyncStatus('syncing');
            
            try {
                const paymentId = crypto.randomUUID();
                const payYear = new Date().getFullYear();
                const paymentRef = `ODM-${payYear}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
                
                // Draconian Veto Interceptor
                const isHighDiscount = paymentData.originalPrice && paymentData.totalAmount < paymentData.originalPrice * 0.7;
                const isGifted = options.isGift || tipAmount > paymentData.totalAmount;
                const needsVeto = isHighDiscount || isGifted;
                const draconianStatus = needsVeto ? 'PENDING_APPROVAL' : 'APPROVED';

                const paymentRecord = { ...paymentData, id: paymentId, referenceCode: paymentRef, tipAmount: tipAmount || 0, soldProducts: soldProducts || [], draconian_status: draconianStatus, createdAt: new Date().toISOString() };
                
                if (needsVeto) {
                    if (setPendingVetoes) setPendingVetoes((prev: any[]) => [{ type: 'payment', data: paymentRecord }, ...prev]);
                    dataRef.current.setAllPayments((prev: any[]) => [paymentRecord, ...prev]);
                    await syncDb('payments', 'insert', paymentRecord, paymentId, bizId);
                    stableMethodsRef.current?.addLog('🔴 VETO SİSTEMİ', paymentData.customerName || 'Bilinmiyor', `Ref: ${paymentRef}`, 'Sistem onaya aldı - Şüpheli indirim/tutar');
                    if (setSyncStatus) setSyncStatus('idle');
                    return { success: false, vetoed: true, message: 'Yetkili onayı bekleniyor...' };
                }
                
                // 1. Loyalty Points Logic
                if (paymentData.customerId) {
                    const customer = dataRef.current.customers.find((c: any) => c.id === paymentData.customerId);
                    if (customer) {
                        let newPoints = (customer.loyaltyPoints || 0) + (earnedPoints || 0) - (pointsUsed || 0);
                        dataRef.current.setAllCustomers((prev: any[]) => prev.map((c: any) => c.id === customer.id ? { ...c, loyaltyPoints: newPoints } : c));
                        await syncDb('customers', 'update', { loyalty_points: newPoints }, customer.id, bizId);
                    }
                }

                // 2. Retail Stock Deduction
                if (soldProducts && soldProducts.length > 0) {
                    for (const sp of soldProducts) {
                        const product = dataRef.current.inventory.find((i: any) => i.id === sp.id || i.name === sp.name);
                        if (product) {
                            const newStock = Math.max(0, (product.stock || 0) - (sp.quantity || 1));
                            dataRef.current.updateProduct(product.id, { stock: newStock });
                            await syncDb('inventory', 'update', { stock: newStock }, product.id, bizId);
                        }
                    }
                }

                // 3. Automated Commission & Expense
                const apptId = paymentData.appointmentId;
                const isBundleSale = !!options.isBundleOrMembershipSale;
                
                if (apptId || paymentData.staffId) {
                    const appt = apptId ? dataRef.current.appointments.find((a: any) => a.id === apptId) : null;
                    const primaryStaffId = paymentData.staffId || appt?.staffId;
                    const staffsToPay = [primaryStaffId, ...(appt?.additionalStaff?.map((s:any) => s.id) || [])].filter(Boolean);
                    
                    for (const sid of staffsToPay) {
                        const amount = (paymentData.totalAmount || 0) / staffsToPay.length;
                        const comm = stableMethodsRef.current?.calculateCommission(sid, appt?.service || (isBundleSale ? 'Satış/Paket' : 'Hizmet'), amount);
                        
                        if (comm > 0) {
                            const expId = crypto.randomUUID();
                            const exp = {
                                id: expId, businessId: bizId, branchId: bizRef.current.currentBranch?.id,
                                category: 'PERSONEL_PRIMI', amount: comm, date: new Date().toISOString().split('T')[0],
                                description: `${paymentData.customerName || 'Müşteri'} - ${isBundleSale ? 'Paket/Üyelik Satış' : (appt?.service || 'Hizmet')} Primi`,
                                payout_status: 'BEKLEMEDE', related_staff_id: sid, related_appointment_id: apptId,
                                createdAt: new Date().toISOString()
                            };
                            dataRef.current.setAllExpenses((prev: any[]) => [exp, ...prev]);
                            await syncDb('expenses', 'insert', exp, expId, bizId);
                        }
                    }

                    if (soldProducts && soldProducts.length > 0 && primaryStaffId) {
                        for (const sp of soldProducts) {
                            const prodComm = stableMethodsRef.current?.calculateCommission(primaryStaffId, sp.name || 'Ürün', sp.price * sp.quantity);
                            if (prodComm > 0) {
                                const expId = crypto.randomUUID();
                                const exp = {
                                    id: expId, businessId: bizId, branchId: bizRef.current.currentBranch?.id,
                                    category: 'PERSONEL_PRIMI', amount: prodComm, date: new Date().toISOString().split('T')[0],
                                    description: `${paymentData.customerName || 'Müşteri'} - ${sp.name} Ürün Satış Primi`,
                                    payout_status: 'BEKLEMEDE', related_staff_id: primaryStaffId,
                                    createdAt: new Date().toISOString()
                                };
                                dataRef.current.setAllExpenses((prev: any[]) => [exp, ...prev]);
                                await syncDb('expenses', 'insert', exp, expId, bizId);
                            }
                        }
                    }
                }

                dataRef.current.setAllPayments((prev: any[]) => [paymentRecord, ...prev]);
                await syncDb('payments', 'insert', paymentRecord, paymentId, bizId);
                
                if (paymentData.appointmentId) {
                    const updates: any = { status: 'completed', isPaid: true, paymentId };
                    if (packageId) {
                        updates.packageId = packageId;
                        const pkg = dataRef.current.packages.find((p: any) => p.id === packageId);
                        if (pkg) {
                            const newUsed = Math.min(pkg.totalSessions, (pkg.usedSessions || 0) + 1);
                            dataRef.current.setAllPackages((prev: any[]) => prev.map((p: any) => p.id === packageId ? { ...p, usedSessions: newUsed } : p));
                            await syncDb('packages', 'update', { used_sessions: newUsed }, packageId, bizId);
                            
                            const hid = crypto.randomUUID();
                            const log = {
                                id: hid, businessId: bizId, packageId: packageId,
                                customerId: paymentData.customerId, action: 'use', sessionsImpact: 1,
                                appointmentId: paymentData.appointmentId,
                                note: `${paymentData.service || 'Hizmet'} kullanımı`,
                                createdAt: new Date().toISOString()
                            };
                            dataRef.current.setPackageUsageHistory((prev: any[]) => [log, ...prev]);
                            await syncDb('package_usage_history', 'insert', log, hid, bizId);
                        }
                    }
                    dataRef.current.updateAppointment(paymentData.appointmentId, updates);
                    await syncDb('appointments', 'update', updates, paymentData.appointmentId, bizId);
                }
                // 4. Coupon Logic
                if (options.couponId) {
                    const coupon = dataRef.current.coupons.find((c: any) => c.id === options.couponId);
                    if (coupon) {
                        const now = new Date().toISOString();
                        dataRef.current.setCoupons((prev: any[]) => prev.map((c: any) => c.id === coupon.id ? { ...c, isUsed: true, usedAt: now } : c));
                        await syncDb('coupons', 'update', { is_used: true, used_at: now }, coupon.id, bizId);
                    }
                }

                if (setSyncStatus) setSyncStatus('idle');
                return { success: true };
            } catch (err) {
                console.error("Checkout Error:", err);
                if (setSyncStatus) setSyncStatus('error');
                return { success: false, error: err };
            }
        },

        approveDraconianVeto: async (type: 'payment' | 'appointment', id: string) => {
            const updates = { draconian_status: 'APPROVED' };
            if (type === 'payment') {
                dataRef.current.setAllPayments((prev: any[]) => prev.map((p: any) => p.id === id ? { ...p, ...updates } : p));
                await syncDb('payments', 'update', updates, id, activeBizIdRef.current);
            } else {
                dataRef.current.updateAppointment(id, updates);
                await syncDb('appointments', 'update', updates, id, activeBizIdRef.current);
            }
            if (setPendingVetoes) setPendingVetoes((prev: any[]) => prev.filter(v => v.data.id !== id));
            stableMethodsRef.current?.addLog('🟢 İmparator Onayı', id, 'VETO', 'ONAYLANDI');
            return true;
        },

        rejectDraconianVeto: async (type: 'payment' | 'appointment', id: string, reason?: string) => {
            const updates = { draconian_status: 'REJECTED', draconian_veto_reason: reason };
            if (type === 'payment') {
                dataRef.current.setAllPayments((prev: any[]) => prev.map((p: any) => p.id === id ? { ...p, ...updates } : p));
                await syncDb('payments', 'update', updates, id, activeBizIdRef.current);
            } else {
                dataRef.current.updateAppointment(id, updates);
                await syncDb('appointments', 'update', updates, id, activeBizIdRef.current);
            }
            if (setPendingVetoes) setPendingVetoes((prev: any[]) => prev.filter(v => v.data.id !== id));
            stableMethodsRef.current?.addLog('🔴 İmparator Reddi', id, 'VETO', `REDDEDİLDİ: ${reason || 'Sebep belirtilmedi'}`);
            return true;
        },
    };
};


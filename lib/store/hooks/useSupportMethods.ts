export const useSupportMethods = (deps: any) => {
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
        analyzeSystem: async () => {
            const activeBizId = activeBizIdRef.current;
            if (!activeBizId) return;
            const data = dataRef.current;
            const newInsights: any[] = [];
            const lowStockProducts = data.inventory.filter((p: any) => (p.stock || 0) < 10);
            if (lowStockProducts.length > 0) {
                newInsights.push({
                    id: crypto.randomUUID(),
                    title: 'Stok Yönetim Uyarısı',
                    desc: `${lowStockProducts.length} üründe stok azalıyor. Operasyonel aksama riskine karşı kontrol edin.`,
                    impact: 'high',
                    category: 'inventory',
                    suggestedAction: 'Envanteri İncele'
                });
            }
            const churnRisks = data.customers.filter((c: any) => stableMethodsRef.current?.determineChurnRisk && stableMethodsRef.current.determineChurnRisk(c));
            if (churnRisks.length > 0) {
                newInsights.push({
                    id: crypto.randomUUID(),
                    title: 'Müşteri Kayıp Riski (Churn)',
                    desc: `${churnRisks.length} sadık müşteri son 30 gündür işlem yapmadı.`,
                    impact: 'medium',
                    category: 'crm',
                    suggestedAction: 'Geri Kazanım Kampanyası'
                });
            }
            dataRef.current.setAiInsights(newInsights);
            for (const insight of newInsights.filter(i => i.impact === 'high')) {
                await syncDb('ai_insights', 'insert', insight, insight.id, activeBizId);
            }
        },
        runImperialAudit: () => {
            const alerts: any[] = [];
            const today = new Date().toISOString().split('T')[0];
            const data = dataRef.current;
            const appts = data.appointments;
            
            data.rooms.forEach((room: any) => {
                if (room.status === 'occupied' && !appts.some((a: any) => a.date === today && a.roomId === room.id && a.status === 'in-service')) {
                    alerts.push({ 
                        type: 'critical', 
                        title: 'Hayalet Oda', 
                        desc: `${room.name} dolu ama aktif randevu yok!`, 
                        targetId: room.id 
                    });
                }
            });

            appts.forEach((a: any) => {
                if (a.status === 'completed' && !a.isPaid && a.price > 0 && !a.isSealed) {
                    alerts.push({ 
                        type: 'critical', 
                        title: `Tahsilat Kaçağı`, 
                        desc: `${a.customerName} - ${a.service} tamamlandı ama ödeme ALINMADI!`, 
                        targetId: a.id 
                    });
                }
            });

            return alerts;
        },
        sendNotification: async (cid: string, type: any, content: string) => {
            const id = crypto.randomUUID();
            const n = { id, customerId: cid, type, content, status: 'SENT', sentAt: new Date().toISOString(), triggerSource: 'manual' };
            dataRef.current.setAllNotifs((prev: any[]) => [n, ...prev]);
            await syncDb('notification_logs', 'insert', n, id, activeBizIdRef.current);
        },
        broadcastAnnouncement: async (title: string, content: string, type: any) => {
            const id = crypto.randomUUID();
            const ann = { id, title, content, type, businessId: activeBizIdRef.current || null, isActive: true, createdAt: new Date().toISOString() };
            await syncDb('system_announcements', 'insert', ann, id, activeBizIdRef.current || '');
        },
    };
};


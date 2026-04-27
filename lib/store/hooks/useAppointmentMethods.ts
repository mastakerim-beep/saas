import { AppointmentStatus } from '../types';

export const useAppointmentMethods = (deps: any) => {
    const { 
        dataRef, 
        activeBizIdRef, 
        authRef, 
        syncDb, 
        stableMethodsRef, 
        triggerWebhooks,
        markAsModified,
        unmarkAsModified,
        bizRef
    } = deps;

    return {
        addAppointment: async (a: any) => {
            const id = crypto.randomUUID();
            const targetBizId = activeBizIdRef.current || a.businessId || authRef.current.currentUser?.businessId;
            const year = new Date().getFullYear();
            const apptPrefix = 'RND';
            const existingNums = dataRef.current.appointments
                .filter((ap: any) => ap.apptRef && (ap.apptRef as string).startsWith(`${apptPrefix}-${year}-`))
                .map((ap: any) => parseInt((ap.apptRef as string).split('-')[2] || '0'));
            const maxApptNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
            const apptRef = `${apptPrefix}-${year}-${String(maxApptNum + 1).padStart(4, '0')}`;
            const appt = { ...a, id, businessId: targetBizId, apptRef };
            dataRef.current.setAllAppointments((prev: any) => [appt, ...prev]);
            const { bodyMapData, ...dbPayload } = appt;
            const ok = await syncDb('appointments', 'insert', dbPayload, id, targetBizId);
            if (!ok) {
                dataRef.current.setAllAppointments((prev: any) => prev.filter((ap: any) => ap.id !== id));
                return false;
            }
            const regions = a.selectedRegions || a.bodyMapData;
            if (regions && regions.length > 0) {
                const bmId = crypto.randomUUID();
                const bm = { id: bmId, appointmentId: id, customerId: a.customerId, mapData: regions, isCritical: true, businessId: targetBizId, createdAt: new Date().toISOString() };
                dataRef.current.setBodyMaps((prev: any) => [...prev, bm]);
                await syncDb('consultation_body_maps', 'insert', bm, bmId, targetBizId);
            }
            stableMethodsRef.current?.addLog('Randevu Oluşturuldu', a.customerName, '', `${a.service} (${a.communicationSource || 'Direkt'})`);
            if (triggerWebhooks) triggerWebhooks('appointment.created', appt, bizRef.current.webhooks);
            return true;
        },
        deleteAppointment: async (id: string) => {
            const apt = dataRef.current.appointments.find((a: any) => a.id === id);
            if (!apt) return false;
            if (apt.isSealed) {
                console.error("❌ Mühürlü randevu silinemez!");
                return false;
            }
            markAsModified(id);
            const okLocal = await dataRef.current.deleteAppointment(id);
            if (okLocal) {
                const okRemote = await syncDb('appointments', 'delete', {}, id, activeBizIdRef.current);
                if (!okRemote) {
                    console.error("❌ Veritabanı silme işlemi başarısız. Geri alınıyor...");
                    dataRef.current.setAllAppointments((prev: any) => [...prev, apt]);
                    if (unmarkAsModified) unmarkAsModified(id);
                    alert("⚠️ Randevu silinemedi! Bu kayıt mühürlü olabilir veya veri sahipliği (RLS) kısıtına takılmış olabilirsiniz. Lütfen sayfayı yenileyip tekrar deneyin.");
                    return false;
                }
                if (triggerWebhooks) triggerWebhooks('appointment.cancelled', apt, bizRef.current.webhooks);
                await stableMethodsRef.current?.addLog('Randevu Silindi', apt.customerName, 'İşlem Başarılı', `${apt.service} randevusu silindi.`);
                return true;
            }
            return false;
        },
        updateAppointment: async (id: string, updates: any) => {
            const prevState = dataRef.current.appointments.find((a: any) => a.id === id);
            if (prevState?.isSealed && !updates.isSealed) {
                console.error("❌ Mühürlü randevu güncellenemez!");
                return false;
            }
            dataRef.current.updateAppointment(id, updates);
            const ok = await syncDb('appointments', 'update', updates, id, activeBizIdRef.current);
            if (!ok && prevState) {
                dataRef.current.updateAppointment(id, prevState);
                return false;
            }
            return true;
        },
        moveAppointment: async (id: string, newTime: string, newStaffId?: string, newRoomId?: string) => {
            const ok = await dataRef.current.moveAppointment(id, newTime, newStaffId, newRoomId);
            if (ok) {
                await syncDb('appointments', 'update', { time: newTime, staff_id: newStaffId, room_id: newRoomId }, id, activeBizIdRef.current);
                stableMethodsRef.current?.addLog('Randevu Taşındı', id, '', newTime);
            }
            return ok;
        },
        updateAppointmentStatus: async (id: string, status: AppointmentStatus) => {
            const appt = dataRef.current.appointments.find((a: any) => a.id === id);
            const ok = await dataRef.current.updateAppointmentStatus(id, status);
            if (ok && appt) {
                await syncDb('appointments', 'update', { status }, id, activeBizIdRef.current);
                if (appt.packageId) {
                    const pkg = dataRef.current.packages.find((p: any) => p.id === appt.packageId);
                    if (pkg) {
                        if (status === 'excused' || status === 'cancelled') {
                            const newUsed = Math.max(0, (pkg.usedSessions || 0) - 1);
                            dataRef.current.setAllPackages((prev: any[]) => prev.map(p => p.id === pkg.id ? { ...p, usedSessions: newUsed } : p));
                            await syncDb('packages', 'update', { used_sessions: newUsed }, pkg.id, activeBizIdRef.current);
                            stableMethodsRef.current?.addLog('İptal (Seans İade)', appt.customerName, `Eski: ${pkg.usedSessions}`, `Yeni: ${newUsed}`);
                        }
                    }
                } else {
                    stableMethodsRef.current?.addLog('Randevu Durumu Güncellendi', appt.customerName, appt.status, status);
                }
            }
            return !!ok;
        },
    };
};


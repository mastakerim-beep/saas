import { supabase } from '../supabase';
import { findBestMatch } from './fuzzy-matcher';

export interface MigrationItem {
    type: 'customer' | 'service' | 'appointment' | 'package';
    data: any;
}

export interface MigrationHealthReport {
    total: number;
    passed: number;
    failed: number;
    errors: { rowId: string; note: string; data: any }[];
    autoMatches: { original: string; matchedWith: string; type: string }[];
}

export class MigrationEngine {
    private businessId: string;
    private branchId?: string;

    constructor(businessId: string, branchId?: string) {
        this.businessId = businessId;
        this.branchId = branchId;
    }

    /**
     * Ham verileri staging (temp_migrations) tablosuna yükler.
     */
    async uploadToStaging(items: MigrationItem[]) {
        const insertData = items.map(item => ({
            business_id: this.businessId,
            branch_id: this.branchId || null,
            data_type: item.type,
            raw_data: item.data,
            status: 'pending' as const
        }));

        const { data, error } = await supabase
            .from('temp_migrations')
            .insert(insertData)
            .select();

        if (error) throw error;
        return data;
    }

    /**
     * Staging alanındaki verileri analiz eder ve sağlık raporu çıkarır.
     * Bu aşamada henüz ana tablolara yazım yapılmaz.
     */
    async validateStaging(): Promise<MigrationHealthReport> {
        const { data: rawItems, error } = await supabase
            .from('temp_migrations')
            .select('*')
            .eq('business_id', this.businessId)
            .eq('status', 'pending');

        if (error) throw error;

        const report: MigrationHealthReport = {
            total: rawItems?.length || 0,
            passed: 0,
            failed: 0,
            errors: [],
            autoMatches: []
        };

        // Mevcut hizmetleri çekelim (Fuzzy matching için)
        const { data: existingServices } = await supabase
            .from('services')
            .select('name')
            .eq('business_id', this.businessId);
        
        const serviceNames = existingServices?.map(s => s.name) || [];

        for (const item of (rawItems || [])) {
            let isItemValid = true;
            let note = '';

            // Örnek Validasyon Logic (Geliştirilecek)
            if (item.data_type === 'customer') {
                if (!item.raw_data.name || item.raw_data.name.length < 2) {
                    isItemValid = false;
                    note = 'Müşteri ismi geçersiz.';
                }
            } else if (item.data_type === 'appointment') {
                const serviceName = item.raw_data.service;
                // Hizmet ismi sistemde yoksa fuzzy match dene
                if (!serviceNames.includes(serviceName)) {
                    const match = findBestMatch(serviceName, serviceNames);
                    if (match) {
                        report.autoMatches.push({
                            original: serviceName,
                            matchedWith: match.target,
                            type: 'service'
                        });
                    } else {
                        isItemValid = false;
                        note = `Sistemde '${serviceName}' isimli bir hizmet bulunamadı ve eşleştirilemedi.`;
                    }
                }
            }

            if (isItemValid) {
                report.passed++;
                await supabase.from('temp_migrations').update({ status: 'validating', system_note: 'Doğrulandı' }).eq('id', item.id);
            } else {
                report.failed++;
                report.errors.push({ rowId: item.id, note, data: item.raw_data });
                await supabase.from('temp_migrations').update({ status: 'error', system_note: note }).eq('id', item.id);
            }
        }

        return report;
    }

    /**
     * Geçerli olan verileri asıl tablolara aktarır.
     * Sıralama: Hizmetler -> Müşteriler -> Randevular
     */
    async executeMigration() {
        const results = {
            services: { success: 0, new: 0 },
            customers: { success: 0, error: 0 },
            appointments: { success: 0, error: 0 }
        };

        // 1. Hizmetleri aktar (Randevular için sistemde hizmet olmalı)
        const { data: sData, error: sError } = await supabase.rpc('process_services_migration', { 
            p_business_id: this.businessId 
        });
        if (sError) throw sError;
        results.services = sData[0] || { success: 0, new: 0 };

        // 2. Müşterileri aktar
        const { data: cData, error: cError } = await supabase.rpc('process_customers_migration', { 
            p_business_id: this.businessId 
        });
        if (cError) throw cError;
        results.customers = cData[0] || { success: 0, error: 0 };

        // 3. Randevuları aktar (Artık müşteri ve hizmetler içeride olduğu için bağlar kurulabilir)
        const { data: aData, error: aError } = await supabase.rpc('process_appointments_migration', { 
            p_business_id: this.businessId 
        });
        if (aError) throw aError;
        results.appointments = aData[0] || { success: 0, error: 0 };

        return results;
    }
}

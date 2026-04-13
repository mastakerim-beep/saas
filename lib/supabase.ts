import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL veya Anon Key eksik. .env.local dosyasını kontrol edin.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Server-side işlemler için (RLS bypass) — sadece güvenli server kod içinde kullanılır
export const createServiceClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

export type Database = {
  public: {
    Tables: {
      businesses: { Row: BusinessRow; Insert: BusinessInsert; Update: Partial<BusinessInsert> };
      branches: { Row: BranchRow; Insert: BranchInsert; Update: Partial<BranchInsert> };
      app_users: { Row: AppUserRow; Insert: AppUserInsert; Update: Partial<AppUserInsert> };
      customers: { Row: CustomerRow; Insert: CustomerInsert; Update: Partial<CustomerInsert> };
      appointments: { Row: AppointmentRow; Insert: AppointmentInsert; Update: Partial<AppointmentInsert> };
      payments: { Row: PaymentRow; Insert: PaymentInsert; Update: Partial<PaymentInsert> };
      debts: { Row: DebtRow; Insert: DebtInsert; Update: Partial<DebtInsert> };
      expenses: { Row: ExpenseRow; Insert: ExpenseInsert; Update: Partial<ExpenseInsert> };
      inventory: { Row: ProductRow; Insert: ProductInsert; Update: Partial<ProductInsert> };
      membership_plans: { Row: MembershipPlanRow; Insert: MembershipPlanInsert; Update: Partial<MembershipPlanInsert> };
      customer_memberships: { Row: CustomerMembershipRow; Insert: CustomerMembershipInsert; Update: Partial<CustomerMembershipInsert> };
      staff: { Row: StaffRow; Insert: StaffInsert; Update: Partial<StaffInsert> };
      rooms: { Row: RoomRow; Insert: RoomInsert; Update: Partial<RoomInsert> };
      services: { Row: ServiceRow; Insert: ServiceInsert; Update: Partial<ServiceInsert> };
      audit_logs: { Row: AuditLogRow; Insert: AuditLogInsert; Update: Partial<AuditLogInsert> };
      customer_media: { Row: CustomerMediaRow; Insert: CustomerMediaInsert; Update: Partial<CustomerMediaInsert> };
    };
  };
};

export interface CustomerMediaRow { id: string; business_id: string; customer_id: string; url: string; type: 'before' | 'after' | 'other'; note: string; date: string; created_at: string; }
export interface CustomerMediaInsert { business_id: string; customer_id: string; url: string; type?: 'before' | 'after' | 'other'; note?: string; date: string; }

// Row type definitions (mirrors the SQL schema)
export interface BusinessRow { id: string; name: string; slug: string; owner_name: string; plan: string; expiry_date: string; status: string; mrr: number; max_users: number; created_at: string; }
export interface BusinessInsert { name: string; slug: string; owner_name: string; plan?: string; expiry_date: string; status?: string; mrr?: number; max_users?: number; }
export interface BranchRow { id: string; business_id: string; name: string; location: string; created_at: string; }
export interface BranchInsert { business_id: string; name: string; location?: string; }
export interface AppUserRow { id: string; business_id: string; branch_id: string | null; role: string; name: string; email: string; permissions: string[]; created_at: string; }
export interface AppUserInsert { business_id: string; branch_id?: string | null; role: string; name: string; email: string; permissions?: string[]; }
export interface CustomerRow { id: string; business_id: string; name: string; phone: string; email: string; birthdate: string; segment: string; note: string; is_churn_risk: boolean; created_at: string; }
export interface CustomerInsert { business_id: string; name: string; phone: string; email?: string; birthdate?: string; segment?: string; note?: string; is_churn_risk?: boolean; }
export interface AppointmentRow { id: string; business_id: string; branch_id: string; customer_id: string; customer_name: string; service: string; staff_name: string; staff_id: string; room_id: string | null; date: string; time: string; duration: number; status: string; price: number; deposit_paid: number; is_online: boolean; package_id: string | null; membership_id: string | null; selected_regions: string[]; sync_status: string; created_at: string; }
export interface AppointmentInsert { business_id: string; branch_id: string; customer_id: string; customer_name: string; service: string; staff_name?: string; staff_id?: string; room_id?: string | null; date: string; time: string; duration?: number; status?: string; price: number; deposit_paid?: number; is_online?: boolean; selected_regions?: string[]; }
export interface PaymentRow { id: string; business_id: string; branch_id: string; appointment_id: string; customer_id: string; customer_name: string; service: string; methods: object; total_amount: number; date: string; note: string; sync_status: string; created_at: string; }
export interface PaymentInsert { business_id: string; branch_id: string; appointment_id: string; customer_id: string; customer_name: string; service: string; methods: object; total_amount: number; date: string; note?: string; }
export interface DebtRow { id: string; business_id: string; customer_id: string; appointment_id: string | null; amount: number; due_date: string; description: string; status: string; created_at: string; }
export interface DebtInsert { business_id: string; customer_id: string; appointment_id?: string | null; amount: number; due_date: string; description?: string; status?: string; }
export interface ExpenseRow { id: string; business_id: string; desc: string; amount: number; category: string; date: string; user: string; created_at: string; }
export interface ExpenseInsert { business_id: string; desc: string; amount: number; category?: string; date: string; user?: string; }
export interface ProductRow { id: string; business_id: string; name: string; category: string; price: number; stock: number; created_at: string; }
export interface ProductInsert { business_id: string; name: string; category?: string; price: number; stock?: number; }
export interface MembershipPlanRow { id: string; business_id: string; name: string; price: number; period_days: number; benefits: string[]; allowed_services: string[]; sessions_per_month: number; created_at: string; }
export interface MembershipPlanInsert { business_id: string; name: string; price: number; period_days?: number; benefits?: string[]; allowed_services?: string[]; sessions_per_month?: number; }
export interface CustomerMembershipRow { id: string; business_id: string; customer_id: string; plan_id: string; start_date: string; expiry_date: string; remaining_sessions: number; status: string; created_at: string; }
export interface CustomerMembershipInsert { business_id: string; customer_id: string; plan_id: string; start_date: string; expiry_date: string; remaining_sessions?: number; status?: string; }
export interface StaffRow { id: string; business_id: string; branch_id: string; name: string; role: string; status: string; weekly_off_day: number; staff_type: 'Terapist' | 'Satış Tem.' | 'Diğer'; is_visible_on_calendar: boolean; sort_order: number; created_at: string; }
export interface StaffInsert { business_id: string; branch_id: string; name: string; role?: string; status?: string; weekly_off_day?: number; staff_type?: 'Terapist' | 'Satış Tem.' | 'Diğer'; is_visible_on_calendar?: boolean; sort_order?: number; }
export interface RoomRow { id: string; business_id: string; branch_id: string; name: string; status: string; created_at: string; }
export interface RoomInsert { business_id: string; branch_id: string; name: string; status?: string; }
export interface ServiceRow { id: string; business_id: string; name: string; duration: number; price: number; color: string; consumables: Record<string, number>; created_at: string; }
export interface ServiceInsert { business_id: string; name: string; duration: number; price: number; color?: string; consumables?: Record<string, number>; }
export interface AuditLogRow { id: string; business_id: string; date: string; customer_name: string; action: string; old_value: string | null; new_value: string | null; user: string; created_at: string; }
export interface AuditLogInsert { business_id: string; customer_name?: string; action: string; old_value?: string | null; new_value?: string | null; user: string; }

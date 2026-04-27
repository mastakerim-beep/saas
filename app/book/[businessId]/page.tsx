import { createServiceClient, Database } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import BookingClient from './BookingClient';

type Business = Database['public']['Tables']['businesses']['Row'];
type Staff = Database['public']['Tables']['staff']['Row'];
type Appointment = Database['public']['Tables']['appointments']['Row'];

export default async function BookingPage({ 
  params, 
  searchParams 
}: { 
  params: { businessId: string };
  searchParams: { branch?: string };
}) {
  const supabase = createServiceClient();
  const businessId = params.businessId;
  const branchIdFromUrl = searchParams.branch;

  // Fetch Business Data
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  if (bizError || !business) {
    return notFound(); 
  }

  // Fetch Branches to validate or get fallback
  const { data: branches } = await supabase
    .from('branches')
    .select('id, name')
    .eq('business_id', businessId)
    .eq('status', 'Aktif');

  const activeBranchId = branchIdFromUrl || branches?.[0]?.id || businessId;

  // Fetch Available Staff for THIS branch
  const { data: staffData } = await supabase
    .from('staff')
    .select('*')
    .eq('business_id', businessId)
    .eq('branch_id', activeBranchId)
    .eq('status', 'active');

  // Fetch existing appointments for blocking
  const today = new Date().toLocaleDateString('sv-SE');
  const { data: apptData } = await supabase
    .from('appointments')
    .select('date, time, duration, staff_id')
    .eq('business_id', businessId)
    .eq('branch_id', activeBranchId)
    .gte('date', today);

  // Fetch Dynamic Pricing Rules
  const { data: pricingData } = await supabase
    .from('dynamic_pricing_rules')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true);

  // Fetch Public Services
  const { data: servicesData } = await supabase
    .from('services')
    .select('name, duration, price')
    .eq('business_id', businessId)
    .eq('is_public', true);

  const staff = staffData || [];
  const bookedSlots = apptData || [];
  const pricingRules = pricingData || [];
  const services = servicesData || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 py-12 md:p-8 flex flex-col">
          <BookingClient 
            business={business} 
            staff={staff} 
            bookedSlots={bookedSlots} 
            services={services}
            pricingRules={pricingRules}
            branchId={activeBranchId}
          />
      </div>
    </div>
  );
}

import { createServiceClient, Database } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import BookingClient from './BookingClient';

type Business = Database['public']['Tables']['businesses']['Row'];
type Staff = Database['public']['Tables']['staff']['Row'];
type Appointment = Database['public']['Tables']['appointments']['Row'];

export default async function BookingPage({ params }: { params: { businessId: string } }) {
  const supabase = createServiceClient();
  const businessId = params.businessId;

  // Fetch Business Data
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  if (bizError || !business) {
    return notFound(); // Show 404 if business doesn't exist
  }

  // Fetch Available Staff
  const { data: staffData } = await supabase
    .from('staff')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'Aktif');

  // Fetch existing appointments to block slots (for today and next 7 days in a real app, but let's fetch all future for MVP)
  const today = new Date(new Date().getTime() + (3 * 3600000)).toISOString().split('T')[0];
  const { data: apptData } = await supabase
    .from('appointments')
    .select('date, time, duration, staff_id')
    .eq('business_id', businessId)
    .gte('date', today);

  const staff = staffData || [];
  const bookedSlots = apptData || [];

  // MVP: Hardcoded defaults for now, can be moved to a 'services' table later
  const DEFAULT_SERVICES = [
    { name: 'Bali Masajı', duration: 60, price: 3400 },
    { name: 'İsveç Masajı', duration: 60, price: 2800 },
    { name: 'VIP Hamam Ritüeli', duration: 45, price: 2100 },
    { name: 'Medikal Cilt Bakımı', duration: 90, price: 4200 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 py-12 md:p-8 flex flex-col">
          <BookingClient 
            business={business} 
            staff={staff} 
            bookedSlots={bookedSlots} 
            services={DEFAULT_SERVICES}
          />
      </div>
    </div>
  );
}

'use server';

import { createServiceClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function submitBooking(data: {
  businessId: string;
  customerName: string;
  phone: string;
  service: string;
  staffId: string;
  staffName: string;
  date: string;
  time: string;
  duration: number;
  price: number;
}) {
  const supabase = createServiceClient();

  // 1. Check or Create Customer
  // Very simplistic logic for MVP: just find by phone or create
  let customerId = '';
  const { data: existingCust } = await supabase
    .from('customers')
    .select('id')
    .eq('business_id', data.businessId)
    .eq('phone', data.phone)
    .single();

  if (existingCust) {
    customerId = existingCust.id;
  } else {
    // Generate new UUID
    customerId = crypto.randomUUID();
    await supabase.from('customers').insert({
      id: customerId,
      business_id: data.businessId,
      name: data.customerName,
      phone: data.phone,
      segment: 'Yeni',
    });
  }

  // 2. Insert Appointment
  const apptId = crypto.randomUUID();
  const branchId = 'b2000000-0000-0000-0000-000000000000'; // Temporary hardcode, normally fetched dynamically or passed from UI

  const { error } = await supabase.from('appointments').insert({
    id: apptId,
    business_id: data.businessId,
    branch_id: branchId,
    customer_id: customerId,
    customer_name: data.customerName,
    service: data.service,
    staff_id: data.staffId,
    staff_name: data.staffName,
    date: data.date,
    time: data.time,
    duration: data.duration,
    status: 'pending',
    price: data.price,
    is_online: true, // indicates it was booked via portal
    sync_status: 'synced'
  });

  if (error) {
    return { success: false, error: 'Randevu oluşturulurken teknik bir hata oluştu.' };
  }

  // Revalidate the cache so the page refetches slots
  revalidatePath(`/book`);

  return { success: true, appointmentId: apptId };
}

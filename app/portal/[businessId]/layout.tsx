import { createServiceClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import PortalClient from './PortalClient';

export default async function PortalLayout({ children, params }: { children: React.ReactNode, params: { businessId: string } }) {
  const supabase = createServiceClient();
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', params.businessId)
    .single();

  if (!business) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-[Inter]">
      {children}
    </div>
  );
}

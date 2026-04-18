import { createServiceClient } from '@/lib/supabase';
import PortalClient from './PortalClient';

export default async function PortalPage({ params }: { params: { businessId: string } }) {
  const supabase = createServiceClient();
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', params.businessId)
    .single();

  return <PortalClient business={business} />;
}

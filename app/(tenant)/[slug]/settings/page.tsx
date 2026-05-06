import { redirect } from 'next/navigation';

export default async function SettingsRedirect({ params }: { params: { slug: string } }) {
    // Legacy /settings route now points to /system
    redirect(`/${params.slug}/system`);
}

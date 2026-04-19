/**
 * Aura Intelligence - Webhook Sender Utility
 * Bu dosya sistemdeki olayları harici URL'lere (n8n, WhatsApp Bot, vb.) iletir.
 */

import { Webhook } from '@/lib/store/types';

export async function triggerWebhooks(
    event: string, 
    payload: any, 
    webhooks: Webhook[]
) {
    if (!webhooks || webhooks.length === 0) return;

    const activeWebhooks = webhooks.filter(w => w.isActive && w.events.includes(event));
    
    if (activeWebhooks.length === 0) return;

    console.log(`📡 [Webhook] Triggering ${activeWebhooks.length} webhooks for event: ${event}`);

    const promises = activeWebhooks.map(async (wh) => {
        try {
            const response = await fetch(wh.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Aura-Event': event,
                },
                body: JSON.stringify({
                    event,
                    timestamp: new Date().toISOString(),
                    data: payload
                }),
            });
            if (!response.ok) {
                console.error(`❌ Webhook failure [${wh.name}]:`, response.statusText);
            }
        } catch (err) {
            console.error(`❌ Webhook Error [${wh.name}]:`, err);
        }
    });

    await Promise.allSettled(promises);
}

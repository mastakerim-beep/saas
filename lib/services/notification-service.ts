
/**
 * Aura Notification Service
 * Orchestrates WhatsApp, SMS and Email notifications for the SaaS ecosystem.
 */

export interface NotificationPayload {
    to: string;
    customerName: string;
    businessName: string;
    type: 'payment_success' | 'appointment_reminder' | 'link_payment_request';
    amount?: number;
    link?: string;
}

export const NotificationService = {
    /**
     * Sends a WhatsApp notification using the configured gateway (Mocked for Aura Simulation)
     */
    async sendWhatsApp(payload: NotificationPayload) {
        console.log(`[Aura Notification] Sending WhatsApp to ${payload.to}...`);
        
        const templates = {
            payment_success: `Merhaba ${payload.customerName}, ${payload.businessName} için ₺${payload.amount} tutarındaki ödemeniz başarıyla alınmıştır. Bizi tercih ettiğiniz için teşekkürler!`,
            appointment_reminder: `Hatırlatma: ${payload.businessName} randevunuz bugün saat {time}'da. Sizi bekliyoruz!`,
            link_payment_request: `Merhaba ${payload.customerName}, ${payload.businessName} ödemeniz için güvenli link: ${payload.link}`
        };

        const message = templates[payload.type] || 'Bildirim alındı.';

        // In a real implementation, we would call Twilio, Wati or a custom WhatsApp API here.
        // For Aura, we simulate the success.
        await new Promise(r => setTimeout(r, 1000));
        
        console.log(`[Aura Notification] WhatsApp Message Sent: "${message}"`);
        return true;
    },

    /**
     * Standard SMS fallback
     */
    async sendSMS(payload: NotificationPayload) {
        console.log(`[Aura Notification] Sending SMS to ${payload.to}...`);
        // Mock implementation
        return true;
    }
};

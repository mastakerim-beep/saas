/**
 * Aura Intelligence - Browser Push Notification Service
 * Managing retention alerts and appointment reminders
 */

export const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
        console.warn("Bu tarayıcı bildirimleri desteklemiyor.");
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    }

    if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }

    return false;
};

export const sendPushNotification = (title: string, options?: NotificationOptions) => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
        return null;
    }

    const defaultOptions: NotificationOptions = {
        icon: '/aura-logo.png', // Fallback logo path
        badge: '/aura-badge.png',
        silent: false,
        ...options
    };

    return new Notification(title, defaultOptions);
};

export const scheduleRetentionAlert = (customerName: string, daysGone: number) => {
    const title = "Churn Riski Alarmı!";
    const body = `${customerName} en son ${daysGone} gün önce geldi. Geri kazanmak için kupon göndermek ister misiniz?`;
    
    return sendPushNotification(title, { body, tag: 'retention-alert' });
};

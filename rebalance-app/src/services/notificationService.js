import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Bildirim davranışını yapılandır
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export const requestNotificationPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return false;
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    return true;
};

export const scheduleDailyCoachNotification = async (userName = 'Abdul') => {
    // Mevcut planlı bildirimleri temizle (çakışmamak için)
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Sabah motivasyonu (09:00)
    await Notifications.scheduleNotificationAsync({
        content: {
            title: `Günaydın ${userName}! ✨`,
            body: 'Bugünkü dengeni kurmaya hazır mısın? Güne su içerek başlamayı unutma!',
            data: { screen: 'Dashboard' },
        },
        trigger: {
            hour: 9,
            minute: 0,
            repeats: true,
        },
    });

    // AkÅŸam Ã¶zeti (20:30)
    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Günün Nasıl Geçti? 📈',
            body: 'Bugünkü verilerini kaydetmeyi unutma. AI Koçun analize hazır!',
            data: { screen: 'Dashboard' },
        },
        trigger: {
            hour: 20,
            minute: 30,
            repeats: true,
        },
    });

    console.log('Bildirimler başarıyla planlandı.');
};

export const sendInstantNotification = async (title, body) => {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
        },
        trigger: null, // Hemen gönder
    });
};

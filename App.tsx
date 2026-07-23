import React, { useEffect } from 'react';
import { StatusBar, Platform, useWindowDimensions } from 'react-native';
import { I18nextProvider } from 'react-i18next';
import * as Notifications from 'expo-notifications';
import i18n from './i18n';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { LanguageProvider } from './context/LanguageContext';
import { SyncProvider } from './context/SyncContext';
import AppNavigator from './navigation/AppNavigator';
import { initLocalDb } from './services/localDb';
import { setupNotificationChannels, requestNotificationPermission } from './services/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function AppContent() {
  const { isDark, colors } = useTheme();

  useEffect(() => {
    setupNotificationChannels();
    requestNotificationPermission();

    // Handle notification tap — navigate to the right screen
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string> | undefined;
      const type: string = data?.type || '';
      const id: string = data?.id || '';

      // The app navigates based on notification type
      // Navigation is handled by the app's existing navigation state;
      // the listener just posts a custom event for screens to listen to
      if (type || id) {
        // Emit a custom event that screens can subscribe to
        // e.g. Notifications.addListener('notificationTap', ({ type, id }) => { ... })
        Notifications.emitNotificationsEvent(type, id);
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#0D0D1A' : '#FCFBFE'}
      />
      <AppNavigator />
    </>
  );
}

export default function App() {
  useEffect(() => {
    initLocalDb();
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <ThemeProvider>
          <SyncProvider>
            <AuthProvider>
              <NotificationProvider>
                <AppContent />
              </NotificationProvider>
            </AuthProvider>
          </SyncProvider>
        </ThemeProvider>
      </LanguageProvider>
    </I18nextProvider>
  );
}
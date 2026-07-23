import React, { useEffect, useState } from 'react';
import { StatusBar, Text, View, Platform } from 'react-native';
import { I18nextProvider } from 'react-i18next';
import * as Notifications from 'expo-notifications';
import i18n from './i18n';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { LanguageProvider } from './context/LanguageContext';
import AppNavigator from './navigation/AppNavigator';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function configureNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('cervitrack', {
      name: 'CerviTrack Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C5CE7',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#F59E0B',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('results', {
      name: 'Test Results',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500, 250, 500],
      lightColor: '#10B981',
      sound: 'default',
    });
  }
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
}

function AppContent() {
  const { isDark, colors } = useTheme();

  useEffect(() => {
    configureNotifications();
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
  return (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <AppContent />
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </I18nextProvider>
  );
}

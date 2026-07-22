import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
} from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { logout } = useAuth();
  const { t } = useTranslation();

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      'Are you sure you want to log out?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.logout'), style: 'destructive', onPress: logout },
      ],
    );
  };

  const s = styles(colors);

  return (
    <ScrollView
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.section}>
        <View style={s.row}>
          <View style={s.rowIcon}>
            <Ionicons
              name={isDark ? 'moon' : 'sunny'}
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={s.rowContent}>
            <Text style={s.rowLabel}>{t('settings.darkMode')}</Text>
            <Text style={s.rowHint}>
              {isDark ? 'Dark mode active' : 'Light mode active'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary + '60' }}
            thumbColor={isDark ? colors.primary : colors.textSecondary}
          />
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>{t('settings.language')}</Text>
        <TouchableOpacity
          style={[s.langRow, language === 'en' && s.langRowActive]}
          onPress={() => setLanguage('en')}
        >
          <View style={s.rowIcon}>
            <MaterialCommunityIcons name="flag" size={20} color={colors.primary} />
          </View>
          <Text style={[s.langText, language === 'en' && s.langTextActive]}>
            English
          </Text>
          {language === 'en' && (
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.langRow, language === 'sw' && s.langRowActive]}
          onPress={() => setLanguage('sw')}
        >
          <View style={s.rowIcon}>
            <MaterialCommunityIcons name="flag" size={20} color={colors.primary} />
          </View>
          <Text style={[s.langText, language === 'sw' && s.langTextActive]}>
            Kiswahili
          </Text>
          {language === 'sw' && (
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>{t('settings.about')}</Text>
        <View style={s.row}>
          <View style={s.rowIcon}>
            <Feather name="info" size={20} color={colors.primary} />
          </View>
          <View style={s.rowContent}>
            <Text style={s.rowLabel}>{t('common.appName')}</Text>
            <Text style={s.rowHint}>Version {APP_VERSION}</Text>
          </View>
        </View>
        <View style={s.row}>
          <View style={s.rowIcon}>
            <MaterialCommunityIcons name="shield-check" size={20} color={colors.primary} />
          </View>
          <View style={s.rowContent}>
            <Text style={s.rowLabel}>Privacy Policy</Text>
            <Text style={s.rowHint}>Your data is encrypted and secure</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={s.logoutText}>{t('settings.logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    scroll: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      backgroundColor: colors.bg,
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 16,
      marginTop: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textSecondary,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: 12,
      marginLeft: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
    },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rowContent: { flex: 1, marginLeft: 12 },
    rowLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
    rowHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    langRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderRadius: 14,
      marginBottom: 4,
    },
    langRowActive: { backgroundColor: colors.primaryLight },
    langText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 12,
    },
    langTextActive: { color: colors.primary, fontWeight: '700' },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 14,
      marginTop: 30,
      borderWidth: 1,
      borderColor: colors.error + '40',
      backgroundColor: colors.error + '08',
    },
    logoutText: {
      color: colors.error,
      fontSize: 15,
      fontWeight: '700',
      marginLeft: 8,
    },
  });

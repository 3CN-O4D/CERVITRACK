import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const BIOMETRIC_KEY = '@cervitrack_biometric_enabled';

interface LockScreenProps {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const { colors } = useTheme();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (compatible && enrolled) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Fingerprint');
        } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          setBiometricType('Iris');
        } else {
          setBiometricType('Biometric');
        }
        setBiometricAvailable(true);
        // Auto-prompt on mount
        setTimeout(() => authenticate(), 500);
      } else {
        // No biometrics — just show a tap to enter button (device PIN still works via fallback)
        setBiometricAvailable(false);
      }
    } catch {
      setBiometricAvailable(false);
    } finally {
      setChecking(false);
    }
  };

  const authenticate = useCallback(async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock CerviTrack',
        cancelLabel: 'Use PIN',
        disableDeviceFallback: false,
      });
      if (result.success) {
        onUnlock();
      }
    } catch {
      // User cancelled or error — stay on lock screen
    }
  }, [onUnlock]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="shield-checkmark" size={56} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>CerviTrack</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your health data is protected
        </Text>

        {checking ? (
          <Text style={[styles.status, { color: colors.textSecondary }]}>Checking security...</Text>
        ) : (
          <TouchableOpacity
            style={[styles.authBtn, { backgroundColor: colors.primary }]}
            onPress={authenticate}
          >
            <Ionicons
              name={biometricAvailable ? 'finger-print-outline' : 'lock-closed-outline'}
              size={22}
              color="#FFF"
            />
            <Text style={styles.authBtnText}>
              {biometricAvailable
                ? `Unlock with ${biometricType}`
                : 'Tap to authenticate'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={onUnlock} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export async function isBiometricEnabled(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(BIOMETRIC_KEY);
  return val === 'true';
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_KEY, enabled ? 'true' : 'false');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 32,
    textAlign: 'center',
  },
  status: {
    fontSize: 14,
    marginBottom: 16,
  },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
  },
  authBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  skipBtn: {
    marginTop: 20,
    padding: 8,
  },
  skipText: {
    fontSize: 14,
  },
});

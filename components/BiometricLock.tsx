import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const BIOMETRIC_KEY = '@cervitrack_biometric_enabled';
const PIN_KEY = '@cervitrack_pin';
const PIN_SETUP_DONE_KEY = '@cervitrack_pin_setup_done';

interface LockScreenProps {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const { colors } = useTheme();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [checking, setChecking] = useState(true);
  const [pinSet, setPinSet] = useState(false);
  const [pinMode, setPinMode] = useState<'unlock' | 'setup' | 'confirm' | 'none'>('none');
  const [pinInput, setPinInput] = useState('');
  const [setupPin, setSetupPin] = useState('');

  useEffect(() => {
    checkSecurity();
  }, []);

  const checkSecurity = async () => {
    try {
      const pinDone = await SecureStore.getItemAsync(PIN_SETUP_DONE_KEY);
      const hasPin = pinDone === 'true';

      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const bioAvail = compatible && enrolled;

      if (bioAvail) {
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
      }

      if (hasPin) {
        setPinSet(true);
        setPinMode('unlock');
      } else if (bioAvail) {
        setPinMode('none');
        setTimeout(() => authenticate(), 500);
      } else {
        setPinMode('setup');
      }
    } catch {
      setPinMode('setup');
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
      } else {
        if (pinSet) setPinMode('unlock');
      }
    } catch {
      if (pinSet) setPinMode('unlock');
    }
  }, [onUnlock, pinSet]);

  const handlePinSubmit = async () => {
    if (pinMode === 'unlock') {
      const storedPin = await SecureStore.getItemAsync(PIN_KEY);
      if (pinInput === storedPin) {
        setPinInput('');
        onUnlock();
      } else {
        Alert.alert('Wrong PIN', 'Please try again.');
        setPinInput('');
      }
    } else if (pinMode === 'setup') {
      if (pinInput.length < 4) {
        Alert.alert('Invalid', 'PIN must be 4 digits.');
        return;
      }
      setSetupPin(pinInput);
      setPinInput('');
      setPinMode('confirm');
    } else if (pinMode === 'confirm') {
      if (pinInput === setupPin) {
        await SecureStore.setItemAsync(PIN_KEY, pinInput);
        await SecureStore.setItemAsync(PIN_SETUP_DONE_KEY, 'true');
        setPinInput('');
        onUnlock();
      } else {
        Alert.alert('PIN Mismatch', 'PINs do not match. Try again.');
        setPinInput('');
        setPinMode('setup');
      }
    }
  };

  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 4) {
      setPinInput(prev => prev + digit);
    }
  };

  const handlePinDelete = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (pinInput.length === 4) {
      handlePinSubmit();
    }
  }, [pinInput]);

  const renderPinDots = () => {
    const dots = [];
    for (let i = 0; i < 4; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.pinDot,
            {
              backgroundColor: i < pinInput.length ? colors.primary : colors.border,
              borderColor: colors.border,
            },
          ]}
        />
      );
    }
    return dots;
  };

  const renderPinPad = () => {
    const keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'del'],
    ];

    return (
      <View style={styles.pinPad}>
        {keys.map((row, ri) => (
          <View key={ri} style={styles.pinRow}>
            {row.map((key) => {
              if (key === '') return <View key="empty" style={styles.pinKeyPlaceholder} />;
              if (key === 'del') {
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.pinKey}
                    onPress={handlePinDelete}
                  >
                    <Ionicons name="backspace-outline" size={24} color={colors.text} />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.pinKey, { backgroundColor: colors.inputBg }]}
                  onPress={() => handlePinDigit(key)}
                >
                  <Text style={[styles.pinKeyText, { color: colors.text }]}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight || colors.primary + '20' }]}>
          <Ionicons name="shield-checkmark" size={56} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>CerviTrack</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {pinMode === 'setup'
            ? 'Set a 4-digit PIN to protect your data'
            : pinMode === 'confirm'
            ? 'Confirm your PIN'
            : pinMode === 'unlock'
            ? 'Enter your PIN to unlock'
            : 'Your health data is protected'}
        </Text>

        {checking ? (
          <Text style={[styles.status, { color: colors.textSecondary }]}>Checking security...</Text>
        ) : pinMode === 'none' && biometricAvailable && !pinSet ? (
          <>
            <TouchableOpacity
              style={[styles.authBtn, { backgroundColor: colors.primary }]}
              onPress={authenticate}
            >
              <Ionicons name="finger-print-outline" size={22} color="#FFF" />
              <Text style={styles.authBtnText}>
                Unlock with {biometricType}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setPinMode('setup'); setPinInput(''); }}
              style={styles.skipBtn}
            >
              <Text style={[styles.skipText, { color: colors.textSecondary }]}>
                Set up PIN instead
              </Text>
            </TouchableOpacity>
          </>
        ) : pinMode === 'unlock' || pinMode === 'setup' || pinMode === 'confirm' ? (
          <>
            <View style={styles.pinDotsContainer}>
              {renderPinDots()}
            </View>
            {pinMode === 'unlock' && biometricAvailable && (
              <TouchableOpacity
                style={[styles.authBtnSmall, { borderColor: colors.border }]}
                onPress={authenticate}
              >
                <Ionicons name="finger-print-outline" size={20} color={colors.primary} />
                <Text style={[styles.authBtnSmallText, { color: colors.primary }]}>
                  Use {biometricType}
                </Text>
              </TouchableOpacity>
            )}
            {renderPinPad()}
          </>
        ) : (
          <TouchableOpacity
            style={[styles.authBtn, { backgroundColor: colors.primary }]}
            onPress={onUnlock}
          >
            <Ionicons name="lock-open-outline" size={22} color="#FFF" />
            <Text style={styles.authBtnText}>Enter App</Text>
          </TouchableOpacity>
        )}
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

export async function getPinStatus(): Promise<{ hasPin: boolean }> {
  const val = await SecureStore.getItemAsync(PIN_SETUP_DONE_KEY);
  return { hasPin: val === 'true' };
}

export async function removePin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
  await SecureStore.deleteItemAsync(PIN_SETUP_DONE_KEY);
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
    width: '100%',
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
  authBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  authBtnSmallText: {
    fontSize: 14,
    fontWeight: '600',
  },
  skipBtn: {
    marginTop: 20,
    padding: 8,
  },
  skipText: {
    fontSize: 14,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  pinPad: {
    width: '100%',
    maxWidth: 280,
    gap: 12,
  },
  pinRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  pinKey: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinKeyPlaceholder: {
    width: 72,
    height: 72,
  },
  pinKeyText: {
    fontSize: 28,
    fontWeight: '600',
  },
});

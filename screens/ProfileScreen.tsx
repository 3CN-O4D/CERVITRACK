import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image, Modal,
  KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { uploadToCloudinary } from '../lib/cloudinary';
import { getPinStatus, removePin } from '../components/BiometricLock';
import * as SecureStore from 'expo-secure-store';

const PIN_SETUP_DONE_KEY = '@cervitrack_pin_setup_done';
const PIN_KEY = '@cervitrack_pin';

export default function ProfileScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, updateProfile, logout, deleteAccount, requestData } = useAuth();
  const { t } = useTranslation();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');
  const [lastHealedDate, setLastHealedDate] = useState(user?.lastHealedDate || '');
  const [photo, setPhoto] = useState(user?.photo || '');
  const [county, setCounty] = useState(user?.county || '');
  const [subCounty, setSubCounty] = useState(user?.subCounty || '');
  const [ward, setWard] = useState(user?.ward || '');
  const [saving, setSaving] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinMode, setPinMode] = useState<'setup' | 'confirm'>('setup');
  const [setupPin, setSetupPin] = useState('');
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'birth' | 'healed'>('birth');
  const [pickerYear, setPickerYear] = useState(2000);
  const [pickerMonth, setPickerMonth] = useState(1);
  const [pickerDay, setPickerDay] = useState(1);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone);
      setBirthDate(user.birthDate);
      setLastHealedDate(user.lastHealedDate);
      setPhoto(user.photo);
      setCounty(user.county || '');
      setSubCounty(user.subCounty || '');
      setWard(user.ward || '');
    }
    getPinStatus().then(s => setPinEnabled(s.hasPin));
  }, [user]);

  const hpvFreeDays = (() => {
    if (user?.lastHealedDate) {
      const start = new Date(user.lastHealedDate);
      return Math.floor((Date.now() - start.getTime()) / 86400000);
    }
    if (user?.birthDate) {
      const start = new Date(user.birthDate);
      return Math.floor((Date.now() - start.getTime()) / 86400000);
    }
    return null;
  })();

  const handlePickPhoto = () => {
    Alert.alert('Change Profile Photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Allow camera access to take a photo.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true, aspect: [1, 1], quality: 0.7,
            });
            if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to open camera');
          }
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Allow access to your photo library.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true, aspect: [1, 1], quality: 0.7,
            });
            if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to open gallery');
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let photoUrl = photo;
      if (photo && !photo.startsWith('http')) {
        try { photoUrl = await uploadToCloudinary(photo); } catch {}
      }
      await updateProfile({ name, email, phone, birthDate, lastHealedDate, photo: photoUrl, county, subCounty, ward });
      setPhoto(photoUrl);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const openDatePicker = (target: 'birth' | 'healed') => {
    const d = target === 'birth'
      ? (birthDate ? new Date(birthDate) : new Date(1990, 0, 1))
      : (lastHealedDate ? new Date(lastHealedDate) : new Date());
    setPickerYear(d.getFullYear());
    setPickerMonth(d.getMonth() + 1);
    setPickerDay(d.getDate());
    setPickerTarget(target);
    setShowYearPicker(true);
    setShowMonthPicker(false);
    setShowDayPicker(false);
  };

  const confirmDate = () => {
    const formatted = `${pickerYear}-${String(pickerMonth).padStart(2, '0')}-${String(pickerDay).padStart(2, '0')}`;
    if (pickerTarget === 'birth') setBirthDate(formatted);
    else setLastHealedDate(formatted);
    setShowYearPicker(false);
    setShowMonthPicker(false);
    setShowDayPicker(false);
  };

  const handleTogglePin = async (value: boolean) => {
    if (value) {
      setPinInput('');
      setPinMode('setup');
      setShowPinSetup(true);
    } else {
      await removePin();
      setPinEnabled(false);
    }
  };

  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 4) setPinInput(prev => prev + digit);
  };

  const handlePinDelete = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (pinInput.length === 4 && showPinSetup) {
      if (pinMode === 'setup') {
        setSetupPin(pinInput);
        setPinInput('');
        setPinMode('confirm');
      } else if (pinMode === 'confirm') {
        if (pinInput === setupPin) {
          SecureStore.setItemAsync(PIN_KEY, pinInput);
          SecureStore.setItemAsync(PIN_SETUP_DONE_KEY, 'true');
          setPinEnabled(true);
          setShowPinSetup(false);
          Alert.alert('PIN Set', 'Your 4-digit PIN has been saved.');
        } else {
          Alert.alert('Mismatch', 'PINs do not match. Try again.');
          setPinInput('');
          setPinMode('setup');
        }
      }
    }
  }, [pinInput]);

  const styles = createStyles(colors, insets);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.avatarWrap} onPress={handlePickPhoto}>
            <View style={styles.avatarFrame}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={40} color={colors.primary} />
              )}
            </View>
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.nameText}>{user?.name || 'User'}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.roleText, { color: colors.primary }]}>
              {t(`roles.${user?.role || 'patient'}`)}
            </Text>
          </View>
        </View>

        {/* HPV Free Days */}
        <View style={[styles.statCard, { backgroundColor: colors.primary + '15' }]}>
          <Text style={styles.statEmoji}>{hpvFreeDays !== null ? '🎉' : '📋'}</Text>
          <View>
            {hpvFreeDays !== null ? (
              <>
                <Text style={[styles.statValue, { color: colors.primary }]}>{hpvFreeDays.toLocaleString()}</Text>
                <Text style={styles.statLabel}>days HPV-free!</Text>
              </>
            ) : (
              <Text style={styles.statLabel}>No data yet</Text>
            )}
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Text style={styles.fieldLabel}>Full Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textSecondary} />
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={colors.textSecondary} />
          <Text style={styles.fieldLabel}>Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={colors.textSecondary} />

          <Text style={styles.fieldLabel}>Date of Birth</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('birth')}>
            <MaterialCommunityIcons name="calendar" size={18} color={colors.textSecondary} />
            <Text style={[styles.dateText, { color: birthDate ? colors.text : colors.textSecondary }]}>
              {birthDate || 'Select date of birth'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.fieldLabel}>Last Treatment Date</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('healed')}>
            <MaterialCommunityIcons name="calendar" size={18} color={colors.textSecondary} />
            <Text style={[styles.dateText, { color: lastHealedDate ? colors.text : colors.textSecondary }]}>
              {lastHealedDate || 'Select last treatment date'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Location</Text>
          <Text style={styles.fieldLabel}>County</Text>
          <TextInput style={styles.input} value={county} onChangeText={setCounty} placeholder="e.g. Nairobi" placeholderTextColor={colors.textSecondary} />
          <Text style={styles.fieldLabel}>Sub-County</Text>
          <TextInput style={styles.input} value={subCounty} onChangeText={setSubCounty} placeholder="e.g. Westlands" placeholderTextColor={colors.textSecondary} />
          <Text style={styles.fieldLabel}>Ward</Text>
          <TextInput style={styles.input} value={ward} onChangeText={setWard} placeholder="e.g. Parklands" placeholderTextColor={colors.textSecondary} />

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save" size={18} color="#FFF" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.switchRow}>
            <View>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>App Lock PIN</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Require a 4-digit PIN to open the app</Text>
            </View>
            <Switch
              value={pinEnabled}
              onValueChange={handleTogglePin}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={pinEnabled ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation?.navigate('Feedback')}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Send Feedback</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={requestData}>
            <Ionicons name="download-outline" size={20} color={colors.text} />
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Request My Data</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[styles.actionBtnText, { color: colors.error }]}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteBtn]}
            onPress={() => {
              Alert.alert(
                'Delete My Data',
                'This will permanently delete all your data from CerviTrack. This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete Everything', style: 'destructive', onPress: deleteAccount },
                ],
              );
            }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={styles.deleteText}>Delete My Data & Revoke Consent</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Step-by-step Date Picker */}
      <Modal visible={showYearPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Year</Text>
            <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
              {Array.from({ length: 100 }, (_, i) => 1940 + i).reverse().map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.pickerItem, pickerYear === y && { backgroundColor: colors.primary + '20' }]}
                  onPress={() => { setPickerYear(y); setShowYearPicker(false); setShowMonthPicker(true); }}
                >
                  <Text style={[styles.pickerItemText, { color: pickerYear === y ? colors.primary : colors.text }]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowYearPicker(false)}>
              <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showMonthPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Month</Text>
            <View style={styles.monthGrid}>
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.monthItem, { backgroundColor: colors.inputBg, borderColor: colors.border }, pickerMonth === i + 1 && { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                  onPress={() => { setPickerMonth(i + 1); setShowMonthPicker(false); setShowDayPicker(true); }}
                >
                  <Text style={[styles.monthItemText, { color: pickerMonth === i + 1 ? colors.primary : colors.text }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowMonthPicker(false)}>
              <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showDayPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Day</Text>
            <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
              {Array.from({ length: new Date(pickerYear, pickerMonth, 0).getDate() }, (_, i) => i + 1).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.pickerItem, pickerDay === d && { backgroundColor: colors.primary + '20' }]}
                  onPress={() => { setPickerDay(d); setShowDayPicker(false); confirmDate(); }}
                >
                  <Text style={[styles.pickerItemText, { color: pickerDay === d ? colors.primary : colors.text }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowDayPicker(false)}>
              <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PIN Setup Modal */}
      <Modal visible={showPinSetup} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, maxWidth: 320 }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {pinMode === 'setup' ? 'Set a 4-digit PIN' : 'Confirm your PIN'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 20 }}>
              {pinMode === 'setup' ? 'Enter a PIN you will use to unlock the app' : 'Re-enter your PIN to confirm'}
            </Text>
            <View style={styles.pinDots}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[styles.pinDot, { backgroundColor: i < pinInput.length ? colors.primary : colors.border, borderColor: colors.border }]} />
              ))}
            </View>
            <View style={styles.pinPad}>
              {[['1','2','3'],['4','5','6'],['7','8','9'],['', '0', 'del']].map((row, ri) => (
                <View key={ri} style={styles.pinRow}>
                  {row.map((key) => {
                    if (key === '') return <View key="e" style={styles.pinKeyPlaceholder} />;
                    if (key === 'del') return (
                      <TouchableOpacity key={key} style={styles.pinKey} onPress={handlePinDelete}>
                        <Ionicons name="backspace-outline" size={24} color={colors.text} />
                      </TouchableOpacity>
                    );
                    return (
                      <TouchableOpacity key={key} style={[styles.pinKey, { backgroundColor: colors.inputBg }]} onPress={() => handlePinDigit(key)}>
                        <Text style={[styles.pinKeyText, { color: colors.text }]}>{key}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
            <TouchableOpacity onPress={() => { setShowPinSetup(false); setPinInput(''); }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 12 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any, insets: any) => StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: insets.top + 10,
    paddingBottom: insets.bottom + 80,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarFrame: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.primary + '40',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.primary,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statEmoji: {
    fontSize: 28,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.inputBg,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.inputBg,
  },
  dateText: {
    fontSize: 15,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 16,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.error + '12',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  deleteText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalCard: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  pickerScroll: {
    maxHeight: 300,
  },
  pickerItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 4,
  },
  pickerItemText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  monthItem: {
    width: '30%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  monthItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  pinDots: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    marginBottom: 24,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  pinPad: {
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

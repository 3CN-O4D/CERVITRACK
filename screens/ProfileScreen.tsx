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
import SearchableDropdown from '../components/SearchableDropdown';
import { getCountyNames, getSubCounties, getWards } from '../data/kenya';

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
          )}
          <View style={s.cameraBadge}>
            <Ionicons name="camera" size={14} color="#FFF" />
          </View>
        </TouchableOpacity>
        <Text style={s.nameText}>{user?.name || 'User'}</Text>
        <View style={s.roleBadge}>
          <Text style={s.roleText}>
            {t(`roles.${user?.role || 'patient'}`)}
          </Text>
        </View>
      </View>

      {hpvFreeDays !== null && (
        <View style={s.hpvCard}>
          <Text style={s.hpvEmoji}>🎉</Text>
          <View style={s.hpvTextWrap}>
            <Text style={s.hpvCount}>{hpvFreeDays.toLocaleString()}</Text>
            <Text style={s.hpvLabel}>days HPV-free!</Text>
          </View>
        </View>
      )}
      {hpvFreeDays === null && (
        <View style={s.hpvCard}>
          <Text style={s.hpvEmoji}>📋</Text>
          <Text style={s.hpvEmpty}>No data yet</Text>
        </View>
      )}

      <View style={s.formSection}>
        <Text style={s.sectionTitle}>{t('profile.personalInfo')}</Text>

        <Text style={s.fieldLabel}>{t('auth.name')}</Text>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={s.fieldLabel}>{t('auth.email')}</Text>
        <TextInput
          style={s.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={s.fieldLabel}>{t('auth.phone')}</Text>
        <TextInput
          style={s.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={s.fieldLabel}>{t('profile.birthDate')}</Text>
        <TouchableOpacity
          style={[s.input, s.dateInput]}
          onPress={() => {
            const d = birthDate ? new Date(birthDate) : new Date(1990, 0, 1);
            setPickerYear(d.getFullYear());
            setPickerMonth(d.getMonth() + 1);
            setPickerDay(d.getDate());
            setShowDatePicker('birth');
          }}
        >
          <MaterialCommunityIcons name="calendar" size={18} color={colors.textSecondary} />
          <Text style={[s.dateText, { color: birthDate ? colors.text : colors.textSecondary }]}>
            {birthDate || 'Select date of birth'}
          </Text>
        </TouchableOpacity>

        <Text style={s.fieldLabel}>{t('profile.lastTreated')}</Text>
        <TouchableOpacity
          style={[s.input, s.dateInput]}
          onPress={() => {
            const d = lastHealedDate ? new Date(lastHealedDate) : new Date();
            setPickerYear(d.getFullYear());
            setPickerMonth(d.getMonth() + 1);
            setPickerDay(d.getDate());
            setShowDatePicker('healed');
          }}
        >
          <MaterialCommunityIcons name="calendar" size={18} color={colors.textSecondary} />
          <Text style={[s.dateText, { color: lastHealedDate ? colors.text : colors.textSecondary }]}>
            {lastHealedDate || 'Select last treatment date'}
          </Text>
        </TouchableOpacity>

        <Text style={[s.sectionTitle, { marginTop: 16 }]}>{t('profile.location') || 'Location'}</Text>

        <SearchableDropdown
          label={t('profile.county') || 'County'}
          items={getCountyNames()}
          selected={county}
          onSelect={(v) => { setCounty(v); setSubCounty(''); setWard(''); }}
          placeholder="Select your county"
        />

        {county ? (
          <SearchableDropdown
            label={t('profile.subCounty') || 'Sub-County'}
            items={getSubCounties(county)}
            selected={subCounty}
            onSelect={(v) => { setSubCounty(v); setWard(''); }}
            placeholder="Select sub-county"
          />
        ) : null}
        {county && subCounty ? (
          <SearchableDropdown
            label={t('profile.ward') || 'Ward'}
            items={getWards(county, subCounty)}
            selected={ward}
            onSelect={setWard}
            placeholder="Select ward"
          />
        ) : null}

        <TouchableOpacity
          style={[s.saveBtn, saving && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save" size={18} color="#FFF" />
              <Text style={s.saveBtnText}>{t('profile.saveChanges')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.feedbackBtn} onPress={() => navigation?.navigate('Feedback')}>
        <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
        <Text style={s.feedbackText}>Send Feedback</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={s.logoutText}>{t('settings.logout')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.requestDataBtn}
        onPress={() => {
          Alert.alert('Data Request', 'Your data request has been submitted. We will email you a copy of your data within 7 days.');
        }}
      >
        <Ionicons name="download-outline" size={18} color={colors.primary} />
        <Text style={s.requestDataText}>Request My Data</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.deleteBtn]}
        onPress={() => {
          Alert.alert(
            'Delete My Data',
            'This will permanently delete all your data from CerviTrack, including screening history, messages, and profile. This action cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete Everything', style: 'destructive', onPress: deleteAccount },
            ],
          );
        }}
      >
        <Ionicons name="trash-outline" size={18} color={colors.error} />
        <Text style={s.deleteText}>Delete My Data & Revoke Consent</Text>
      </TouchableOpacity>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker !== null} transparent animationType="fade">
        <View style={s.datePickerOverlay}>
          <View style={[s.datePickerModal, { backgroundColor: colors.card }]}>
            <Text style={[s.datePickerTitle, { color: colors.text }]}>
              {showDatePicker === 'birth' ? 'Date of Birth' : 'Last Treatment Date'}
            </Text>
            <View style={s.datePickerCols}>
              <View style={s.datePickerCol}>
                <Text style={[s.datePickerLabel, { color: colors.textSecondary }]}>Year</Text>
                  <ScrollView style={[s.datePickerScroll, { height: 200 }]}>
                  {Array.from({ length: 100 }, (_, i) => 1940 + i).reverse().map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[s.datePickerItem, pickerYear === y && { backgroundColor: colors.primary + '20' }]}
                      onPress={() => setPickerYear(y)}
                    >
                      <Text style={[s.datePickerItemText, { color: pickerYear === y ? colors.primary : colors.text }]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={s.datePickerCol}>
                <Text style={[s.datePickerLabel, { color: colors.textSecondary }]}>Month</Text>
                <ScrollView style={s.datePickerScroll}>
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[s.datePickerItem, pickerMonth === i + 1 && { backgroundColor: colors.primary + '20' }]}
                      onPress={() => {
                        setPickerMonth(i + 1);
                        const maxDay = new Date(pickerYear, i + 1, 0).getDate();
                        if (pickerDay > maxDay) setPickerDay(maxDay);
                      }}
                    >
                      <Text style={[s.datePickerItemText, { color: pickerMonth === i + 1 ? colors.primary : colors.text }]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={s.datePickerCol}>
                <Text style={[s.datePickerLabel, { color: colors.textSecondary }]}>Day</Text>
                <ScrollView style={s.datePickerScroll}>
                  {Array.from({ length: new Date(pickerYear, pickerMonth, 0).getDate() }, (_, i) => i + 1).map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[s.datePickerItem, pickerDay === d && { backgroundColor: colors.primary + '20' }]}
                      onPress={() => setPickerDay(d)}
                    >
                      <Text style={[s.datePickerItemText, { color: pickerDay === d ? colors.primary : colors.text }]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={s.datePickerActions}>
              <TouchableOpacity
                style={[s.datePickerBtn, { borderColor: colors.border }]}
                onPress={() => setShowDatePicker(null)}
              >
                <Text style={[s.datePickerBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.datePickerBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  const formatted = `${pickerYear}-${pickerMonth.toString().padStart(2, '0')}-${pickerDay.toString().padStart(2, '0')}`;
                  if (showDatePicker === 'birth') setBirthDate(formatted);
                  else setLastHealedDate(formatted);
                  setShowDatePicker(null);
                }}
              >
                <Text style={[s.datePickerBtnText, { color: '#FFF' }]}>Confirm</Text>
              </TouchableOpacity>
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

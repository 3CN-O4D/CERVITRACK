import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { uploadToCloudinary } from '../lib/cloudinary';

export default function ProfileScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user, updateProfile, logout, deleteAccount } = useAuth();
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
  const [showDatePicker, setShowDatePicker] = useState<'birth' | 'healed' | null>(null);
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
  }, [user]);

  const hpvFreeDays = (() => {
    if (user?.lastHealedDate) {
      const start = new Date(user.lastHealedDate);
      const now = new Date();
      return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
    if (user?.birthDate) {
      const start = new Date(user.birthDate);
      const now = new Date();
      return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
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
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });
            if (!result.canceled && result.assets[0]) {
              setPhoto(result.assets[0].uri);
            }
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
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });
            if (!result.canceled && result.assets[0]) {
              setPhoto(result.assets[0].uri);
            }
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
        try {
          photoUrl = await uploadToCloudinary(photo);
        } catch {
          // If upload fails, keep local URI (will vanish on logout but at least saves now)
        }
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

  const s = styles(colors);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
    <ScrollView
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.profileCard}>
        <TouchableOpacity style={s.avatarWrap} onPress={handlePickPhoto}>
          {photo ? (
            <Image source={{ uri: photo }} style={s.avatarImage} />
          ) : (
            <View style={s.avatarPlaceholder}>
              <FontAwesome5 name="user-alt" size={30} color={colors.primary} />
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

        <Text style={s.fieldLabel}>{t('profile.county') || 'County'}</Text>
        <TextInput
          style={s.input}
          value={county}
          onChangeText={setCounty}
          placeholder="e.g. Nairobi"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={s.fieldLabel}>{t('profile.subCounty') || 'Sub-County'}</Text>
        <TextInput
          style={s.input}
          value={subCounty}
          onChangeText={setSubCounty}
          placeholder="e.g. Westlands"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={s.fieldLabel}>{t('profile.ward') || 'Ward'}</Text>
        <TextInput
          style={s.input}
          value={ward}
          onChangeText={setWard}
          placeholder="e.g. Parklands"
          placeholderTextColor={colors.textSecondary}
        />

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
                <ScrollView style={s.datePickerScroll}>
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
          </View>
        </View>
      </Modal>
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
    profileCard: {
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 28,
      padding: 28,
      marginTop: 10,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatarWrap: { position: 'relative', marginBottom: 14 },
    avatarImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cameraBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.card,
    },
    nameText: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 6 },
    roleBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    roleText: { fontSize: 12, fontWeight: '700', color: colors.primary },
    hpvCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.success + '15',
      borderRadius: 20,
      padding: 18,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.success + '30',
    },
    hpvEmoji: { fontSize: 28, marginRight: 14 },
    hpvTextWrap: { flex: 1 },
    hpvCount: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.success,
      letterSpacing: -0.5,
    },
    hpvLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 2 },
    hpvEmpty: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
    formSection: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 16,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 4,
      marginTop: 8,
    },
    input: {
      backgroundColor: colors.inputBg,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 13,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveBtn: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
      marginLeft: 8,
    },
    feedbackBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.primary + '40',
      backgroundColor: colors.primary + '08',
      marginBottom: 10,
    },
    feedbackText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '700',
      marginLeft: 8,
    },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 14,
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
    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.error + '20',
      backgroundColor: colors.error + '05',
      marginTop: 10,
      marginBottom: 20,
    },
    deleteText: {
      color: colors.error,
      fontSize: 13,
      fontWeight: '600',
      marginLeft: 8,
    },
    dateInput: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    dateText: { fontSize: 15, fontWeight: '500', flex: 1 },
    datePickerOverlay: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingHorizontal: 20,
    },
    datePickerModal: {
      borderRadius: 20,
      padding: 20,
      maxHeight: '70%',
    },
    datePickerTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
    datePickerCols: {
      flexDirection: 'row',
      gap: 8,
    },
    datePickerCol: { flex: 1, alignItems: 'center' },
    datePickerLabel: { fontSize: 11, fontWeight: '700', marginBottom: 8 },
    datePickerScroll: { maxHeight: 200, width: '100%' },
    datePickerItem: { paddingVertical: 10, alignItems: 'center', borderRadius: 8, marginBottom: 2 },
    datePickerItemText: { fontSize: 15, fontWeight: '600' },
    datePickerActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    datePickerBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      borderWidth: 1,
    },
    datePickerBtnText: { fontSize: 15, fontWeight: '700' },
  });

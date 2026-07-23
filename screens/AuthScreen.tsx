import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import SearchableDropdown from '../components/SearchableDropdown';
import { getCountyNames, getSubCounties, getWards } from '../data/kenya';



type AuthMode = 'otp' | 'email';
type RegStep = 'info' | 'otp';

export default function AuthScreen() {
  const { colors } = useTheme();
  const { login, loginByPhone, register, updateProfile } = useAuth();
  const { t } = useTranslation();

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [authMode, setAuthMode] = useState<AuthMode>('otp');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [county, setCounty] = useState('');
  const [subCounty, setSubCounty] = useState('');
  const [ward, setWard] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [regStep, setRegStep] = useState<RegStep>('info');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const [loginShowOtpInput, setLoginShowOtpInput] = useState(false);
  const [loginOtp, setLoginOtp] = useState(['', '', '', '', '', '']);
  const loginOtpRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (index: number, value: string, isLogin: boolean) => {
    const arr = isLogin ? [...loginOtp] : [...otp];
    if (value.length > 1) return;
    arr[index] = value;
    if (isLogin) {
      setLoginOtp(arr);
    } else {
      setOtp(arr);
    }
    if (value && index < 5) {
      const ref = isLogin ? loginOtpRefs.current[index + 1] : otpRefs.current[index + 1];
      ref?.focus();
    }
  };

  const handleOtpKeyPress = (index: number, key: string, isLogin: boolean) => {
    if (key === 'Backspace') {
      const arr = isLogin ? [...loginOtp] : [...otp];
      const refs = isLogin ? loginOtpRefs : otpRefs;
      if (!arr[index] && index > 0) {
        refs.current[index - 1]?.focus();
      }
    }
  };

  const handleLoginWithOtp = async () => {
    setLoading(true);
    setError('');
    const result = await loginByPhone(phone.trim());
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Login failed');
      setLoginOtp(['', '', '', '', '', '']);
      loginOtpRefs.current[0]?.focus();
    }
  };

  const handleSendOtp = () => {
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }
    setError('');
    setLoginShowOtpInput(true);
    setTimeout(() => loginOtpRefs.current[0]?.focus(), 100);
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError('');
    const locParts = [county, subCounty, ward].filter(Boolean);
    const locStr = locParts.join(', ');
    const payload = {
      name: name.trim(),
      email: email.trim() || `${phone.trim()}@cervitrack.app`,
      phone: phone.trim(),
      password: password || 'default123',
      role: 'patient',
      location: locStr,
      photo: photoUri,
    };
    const result = await register(
      payload.name,
      payload.email,
      payload.phone,
      payload.password,
      payload.role,
      payload.location,
      county,
      subCounty,
      ward,
      photoUri,
    );
    if (result.success && photoUri) {
      updateProfile({ photo: photoUri });
    }
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Registration failed');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
  };

  const handleLoginEmail = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  const handleRegisterStep1 = () => {
    setError('');
    if (!name.trim() || !email.trim() || !phone.trim() || !county) {
      setError('Name, email, phone and county are required');
      return;
    }
    setRegStep('otp');
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library to add a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleResendOtp = () => {
    setOtp(['', '', '', '', '', '']);
    Alert.alert('OTP Sent', 'A new 6-digit code has been sent to your phone.');
    otpRefs.current[0]?.focus();
  };

  const switchTab = (t: 'login' | 'register') => {
    setTab(t);
    setError('');
    setRegStep('info');
    setOtp(['', '', '', '', '', '']);
    setLoginOtp(['', '', '', '', '', '']);
    setLoginShowOtpInput(false);
  };

  const s = styles(colors);

  const renderOtpBoxes = (isLogin: boolean) => {
    const code = isLogin ? loginOtp : otp;
    const refs = isLogin ? loginOtpRefs : otpRefs;
    return (
      <View style={s.otpRow}>
        {code.map((digit, i) => (
          <TextInput
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            style={[s.otpBox, { borderColor: digit ? colors.primary : colors.border, color: colors.text }]}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(v) => handleOtpChange(i, v, isLogin)}
            onKeyPress={({ nativeEvent }) => handleOtpKeyPress(i, nativeEvent.key, isLogin)}
          />
        ))}
      </View>
    );
  };

  const renderLoginOtp = () => (
    <>
      <Text style={s.otpLabel}>Enter the 6-digit code sent to {phone}</Text>
      {renderOtpBoxes(true)}
      <TouchableOpacity
        style={[s.submitBtn, loading && s.submitBtnDisabled]}
        onPress={handleLoginWithOtp}
        disabled={loading || loginOtp.join('').length < 6}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={s.submitBtnText}>Verify & Sign In</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setLoginShowOtpInput(false)} style={s.backLink}>
        <Text style={s.backLinkText}>Change phone number</Text>
      </TouchableOpacity>
    </>
  );

  const renderLoginEmail = () => (
    <>
      <TextInput
        style={s.input}
        placeholder="Email"
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <View style={s.passwordRow}>
        <TextInput
          style={s.inputPassword}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' }}
        >
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[s.submitBtn, loading && s.submitBtnDisabled]}
        onPress={handleLoginEmail}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={s.submitBtnText}>Sign In</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderLogin = () => (
    <>
      <View style={s.modeToggle}>
        <TouchableOpacity
          style={[s.modeTab, authMode === 'otp' && s.modeTabActive]}
          onPress={() => { setAuthMode('otp'); setError(''); setLoginShowOtpInput(false); setLoginOtp(['', '', '', '', '', '']); }}
        >
          <MaterialCommunityIcons name="cellphone" size={16} color={authMode === 'otp' ? '#FFF' : colors.textSecondary} />
          <Text style={[s.modeTabText, authMode === 'otp' && s.modeTabTextActive]}>Phone & OTP</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.modeTab, authMode === 'email' && s.modeTabActive]}
          onPress={() => { setAuthMode('email'); setError(''); }}
        >
          <MaterialCommunityIcons name="email-outline" size={16} color={authMode === 'email' ? '#FFF' : colors.textSecondary} />
          <Text style={[s.modeTabText, authMode === 'email' && s.modeTabTextActive]}>Email & Password</Text>
        </TouchableOpacity>
      </View>

      {authMode === 'otp' ? (
        loginShowOtpInput ? renderLoginOtp() : (
          <>
            <Text style={s.fieldLabel}>Phone Number</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. +254 712 345 678"
              placeholderTextColor={colors.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Text style={s.hint}>We'll send a 6-digit code to verify your number</Text>
            <TouchableOpacity
              style={[s.submitBtn, loading && s.submitBtnDisabled]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={s.submitBtnText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </>
        )
      ) : renderLoginEmail()}
    </>
  );

  const renderRegisterInfo = () => (
    <>
      <Text style={s.fieldLabel}>Full Name</Text>
      <TextInput
        style={s.input}
        placeholder="Enter your name"
        placeholderTextColor={colors.textSecondary}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      <Text style={s.fieldLabel}>Email</Text>
      <TextInput
        style={s.input}
        placeholder="e.g. you@example.com"
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={s.fieldLabel}>Phone Number</Text>
      <TextInput
        style={s.input}
        placeholder="e.g. +254 712 345 678"
        placeholderTextColor={colors.textSecondary}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TouchableOpacity style={s.photoRow} onPress={pickPhoto}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={s.photoPreview} />
        ) : (
          <View style={s.photoPlaceholder}>
            <MaterialCommunityIcons name="camera-plus" size={28} color={colors.primary} />
            <Text style={s.photoLabel}>Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <SearchableDropdown
        label="County"
        items={getCountyNames()}
        selected={county}
        onSelect={(v) => { setCounty(v); setSubCounty(''); setWard(''); }}
        placeholder="Select your county"
      />
      {county ? (
        <SearchableDropdown
          label="Sub-County"
          items={getSubCounties(county)}
          selected={subCounty}
          onSelect={(v) => { setSubCounty(v); setWard(''); }}
          placeholder="Select sub-county"
        />
      ) : null}
      {county && subCounty ? (
        <SearchableDropdown
          label="Ward"
          items={getWards(county, subCounty)}
          selected={ward}
          onSelect={setWard}
          placeholder="Select ward"
        />
      ) : null}

      <TouchableOpacity
        style={s.consentRow}
        onPress={() => setConsentAgreed(!consentAgreed)}
        activeOpacity={0.7}
      >
        <View style={[s.consentCheckbox, consentAgreed && s.consentCheckboxActive]}>
          {consentAgreed && <MaterialCommunityIcons name="check" size={14} color="#FFF" />}
        </View>
        <Text style={s.consentLabel}>
          I consent to CerviTrack collecting, storing, and sharing my health data with affiliated healthcare providers. I understand that AI-screening tools are not 100% accurate and abnormal results must be confirmed by a certified pathologist. I agree to the Terms of Service and Medical Disclaimer. I understand this app does not replace professional medical advice.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.submitBtn, (!consentAgreed || loading) && s.submitBtnDisabled]}
        onPress={handleRegisterStep1}
        disabled={!consentAgreed || loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={s.submitBtnText}>Continue</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderRegisterOtp = () => (
    <>
      <View style={s.otpInfo}>
        <MaterialCommunityIcons name="shield-check-outline" size={40} color={colors.primary} />
        <Text style={s.otpInfoTitle}>Verify Your Phone</Text>
        <Text style={s.otpInfoText}>Enter the 6-digit code sent to {phone}</Text>
      </View>
      {renderOtpBoxes(false)}
      <TouchableOpacity
        style={[s.submitBtn, loading && s.submitBtnDisabled]}
        onPress={handleVerifyOtp}
        disabled={loading || otp.join('').length < 6}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={s.submitBtnText}>Verify & Create Account</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={handleResendOtp} style={s.resendBtn}>
        <Text style={s.resendLink}>Resend OTP</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={s.backLink}
        onPress={() => { setRegStep('info'); setOtp(['', '', '', '', '', '']); }}
      >
        <Text style={s.backLinkText}>Back to registration form</Text>
      </TouchableOpacity>
    </>
  );

  const renderRegister = () => (
    regStep === 'info' ? renderRegisterInfo() : renderRegisterOtp()
  );

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.heroCard}>
          <Image source={require('../assets/logo.jpeg')} style={s.logoImage} />
          <Text style={s.heroTitle}>CerviTrack</Text>
          <Text style={s.heroSub}>AI-Powered HPV Screening</Text>
        </View>

        <View style={s.formCard}>
          <View style={s.tabRow}>
            <TouchableOpacity
              style={[s.tab, tab === 'login' && s.tabActive]}
              onPress={() => switchTab('login')}
            >
              <Text style={[s.tabText, tab === 'login' && s.tabTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tab, tab === 'register' && s.tabActive]}
              onPress={() => switchTab('register')}
            >
              <Text style={[s.tabText, tab === 'register' && s.tabTextActive]}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={s.errorBox}>
              <MaterialCommunityIcons name="alert-circle" size={18} color={colors.error} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          {tab === 'login' ? renderLogin() : renderRegister()}

          <TouchableOpacity
            style={s.switchLink}
            onPress={() => switchTab(tab === 'login' ? 'register' : 'login')}
          >
            <Text style={s.switchLinkText}>
              {tab === 'login'
                ? "Don't have an account? Create one"
                : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (colors: ReturnType<typeof import('../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.bg },
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
    },
    heroCard: {
      alignItems: 'center',
      marginBottom: 32,
    },
    logoImage: {
      width: 120,
      height: 80,
      borderRadius: 16,
      resizeMode: 'contain',
    },
    heroTitle: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.text,
      marginTop: 12,
      letterSpacing: -0.5,
    },
    heroSub: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
      marginTop: 4,
    },
    formCard: {
      backgroundColor: colors.card,
      borderRadius: 28,
      padding: 24,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 28,
      elevation: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabRow: {
      flexDirection: 'row',
      backgroundColor: colors.inputBg,
      borderRadius: 14,
      padding: 4,
      marginBottom: 20,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: 'center',
    },
    tabActive: { backgroundColor: colors.primary },
    tabText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    tabTextActive: { color: '#FFFFFF' },
    modeToggle: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 18,
    },
    modeTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBg,
      gap: 6,
    },
    modeTabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    modeTabText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    modeTabTextActive: { color: '#FFFFFF' },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
      marginTop: 4,
    },
    hint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 12,
      marginTop: -6,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.error + '15',
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    errorText: {
      color: colors.error,
      fontSize: 13,
      fontWeight: '600',
      marginLeft: 8,
      flex: 1,
    },
    input: {
      backgroundColor: colors.inputBg,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      color: colors.text,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    passwordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    inputPassword: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      color: colors.text,
    },
    photoRow: {
      alignItems: 'center',
      marginBottom: 16,
    },
    photoPreview: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 3,
      borderColor: colors.primary,
    },
    photoPlaceholder: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.inputBg,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
    },
    photoLabel: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: '600',
      marginTop: 2,
    },
    consentRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 12,
      marginBottom: 4,
    },
    consentCheckbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: '#adb5bd',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
      marginTop: 2,
    },
    consentCheckboxActive: {
      backgroundColor: '#6C5CE7',
      borderColor: '#6C5CE7',
    },
    consentLabel: {
      flex: 1,
      fontSize: 12,
      color: '#495057',
      lineHeight: 18,
      fontWeight: '500',
    },
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 4,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    switchLink: { alignItems: 'center', marginTop: 16 },
    switchLinkText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '600',
    },
    otpInfo: {
      alignItems: 'center',
      marginBottom: 24,
    },
    otpInfoTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      marginTop: 12,
    },
    otpInfoText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    otpLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    otpRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 10,
      marginBottom: 20,
    },
    otpBox: {
      width: 48,
      height: 56,
      borderRadius: 14,
      borderWidth: 1.5,
      fontSize: 22,
      fontWeight: '700',
      textAlign: 'center',
      backgroundColor: colors.inputBg,
    },
    resendBtn: {
      alignItems: 'center',
      marginBottom: 8,
    },
    resendLink: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 14,
    },
    backLink: {
      alignItems: 'center',
      marginTop: 12,
    },
    backLinkText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '600',
    },
  });

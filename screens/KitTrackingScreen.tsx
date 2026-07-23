import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { scanKit, registerKit, pairKit, collectKit, type Kit, type KitEvent } from '../services/api';
import { getItem, setItem } from '../services/storage';

const { width } = Dimensions.get('window');

type KitStatus = 'REGISTERED' | 'PAIRED' | 'COLLECTED' | 'IN_TRANSIT' | 'IN_LAB' | 'PROCESSED';

const STATUS_CONFIG: Record<KitStatus, { label: string; color: string; bg: string; icon: string }> = {
  REGISTERED: { label: 'Registered', color: '#2563EB', bg: '#EFF6FF', icon: '📋' },
  PAIRED: { label: 'Paired', color: '#D97706', bg: '#FFFBEB', icon: '🔗' },
  COLLECTED: { label: 'Collected', color: '#16A34A', bg: '#F0FDF4', icon: '✅' },
  IN_TRANSIT: { label: 'In Transit', color: '#9333EA', bg: '#FAF5FF', icon: '🚚' },
  IN_LAB: { label: 'At Lab', color: '#0891B2', bg: '#ECFEFF', icon: '🔬' },
  PROCESSED: { label: 'Results Ready', color: '#059669', bg: '#ECFDF5', icon: '📄' },
};

const STATUS_FLOW: KitStatus[] = ['REGISTERED', 'PAIRED', 'COLLECTED', 'IN_TRANSIT', 'IN_LAB', 'PROCESSED'];
const KITS_LOG_KEY = '@cervitrack_kits';

export default function KitTrackingScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [kit, setKit] = useState<Kit | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [action, setAction] = useState<'register' | 'pair' | 'collect' | null>(null);
  const [collectionMethod, setCollectionMethod] = useState('');
  const [myKits, setMyKits] = useState<Kit[]>([]);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const lastScanned = useRef<string>('');

  useEffect(() => { loadMyKits(); }, []);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const scanLineY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 180] });

  const loadMyKits = async () => {
    const uid = user?.id || 'default';
    const raw = await getItem(`${KITS_LOG_KEY}_${uid}`);
    if (raw) setMyKits(JSON.parse(raw));
  };

  const saveMyKits = async (kits: Kit[]) => {
    const uid = user?.id || 'default';
    await setItem(`${KITS_LOG_KEY}_${uid}`, JSON.stringify(kits));
    setMyKits(kits);
  };

  const handleBarCodeScanned = useCallback(async ({ data }: { data: string }) => {
    if (data === lastScanned.current) return;
    lastScanned.current = data;
    setBarcode(data);
    await lookupKit(data);
  }, []);

  const lookupKit = async (code: string) => {
    if (!code.trim()) return;
    setScanning(true);
    setError('');
    setSuccess('');
    setKit(null);
    setAction(null);

    try {
      const found = await scanKit(code.trim());
      if (found) {
        setKit(found);
      } else {
        setAction('register');
      }
    } catch {
      setError('Network error — will work offline');
      setAction('register');
    } finally {
      setScanning(false);
    }
  };

  const handleRegister = async () => {
    setScanning(true);
    setError('');
    try {
      const result = await registerKit(barcode, {
        facilityId: 'home',
        registeredBy: user?.id || 'self',
        registeredByName: user?.user_metadata?.full_name || 'Patient',
      });
      if (result) {
        setKit(result);
        setAction(null);
        setSuccess('Kit registered successfully');
        saveMyKits([result, ...myKits.filter(k => k.barcode !== barcode)]);
      } else {
        setError('Failed to register kit');
      }
    } catch {
      setError('Network error');
    } finally {
      setScanning(false);
    }
  };

  const handlePair = async () => {
    setScanning(true);
    setError('');
    try {
      const result = await pairKit(barcode, {
        patientId: user?.id || 'unknown',
        patientName: user?.user_metadata?.full_name || 'Patient',
        pairedBy: user?.id || 'self',
        pairedByName: user?.user_metadata?.full_name || 'Patient (Self)',
      });
      if (result) {
        setKit(result);
        setAction(null);
        setSuccess('Kit paired to your account');
        saveMyKits(myKits.map(k => k.barcode === barcode ? result : k));
      } else {
        setError('Failed to pair kit');
      }
    } catch {
      setError('Network error');
    } finally {
      setScanning(false);
    }
  };

  const handleCollect = async (method: string) => {
    setScanning(true);
    setError('');
    try {
      const result = await collectKit(barcode, {
        collectedBy: user?.id || 'self',
        collectedByName: user?.user_metadata?.full_name || 'Patient (Self-Collection)',
        collectionMethod: method,
        location: 'home',
      });
      if (result) {
        setKit(result);
        setAction(null);
        setCollectionMethod('');
        setSuccess('Sample collection confirmed');
        saveMyKits(myKits.map(k => k.barcode === barcode ? result : k));
      } else {
        setError('Failed to confirm collection');
      }
    } catch {
      setError('Network error');
    } finally {
      setScanning(false);
    }
  };

  const currentStep = kit ? STATUS_FLOW.indexOf(kit.status as KitStatus) : -1;
  const s = styles(colors);

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <MaterialCommunityIcons name="barcode" size={24} color={colors.primary} />
          <Text style={[s.headerTitle, { color: colors.text }]}>Kit Tracker</Text>
        </View>
        <Text style={[s.headerSub, { color: colors.textSecondary }]}>
          Scan barcode to track your sample kit
        </Text>
      </View>

      {/* Scanner */}
      {mode === 'camera' && permission?.granted && !kit && (
        <View style={s.cameraWrap}>
          <CameraView
            ref={cameraRef}
            style={s.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39'] }}
            onBarcodeScanned={scanning ? undefined : handleBarCodeScanned}
          >
            <View style={s.scanOverlay}>
              <View style={s.scanFrame}>
                <View style={[s.corner, s.cornerTL]} />
                <View style={[s.corner, s.cornerTR]} />
                <View style={[s.corner, s.cornerBL]} />
                <View style={[s.corner, s.cornerBR]} />
                <Animated.View style={[s.scanLine2, { backgroundColor: colors.primary, transform: [{ translateY: scanLineY }] }]} />
              </View>
              <Text style={s.scanText}>Point camera at kit barcode</Text>
            </View>
          </CameraView>
        </View>
      )}

      {/* Manual Input */}
      {!kit && (
        <View style={s.inputSection}>
          <View style={s.modeToggle}>
            <TouchableOpacity onPress={() => setMode(mode === 'camera' ? 'manual' : 'camera')} style={s.modeBtn}>
              <Ionicons name={mode === 'camera' ? 'keypad' : 'camera'} size={16} color={colors.primary} />
              <Text style={[s.modeBtnText, { color: colors.primary }]}>{mode === 'camera' ? 'Enter Manually' : 'Use Camera'}</Text>
            </TouchableOpacity>
          </View>

          {mode === 'manual' && (
            <View style={s.manualInput}>
              <TextInput
                style={[s.textInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
                value={barcode}
                onChangeText={setBarcode}
                placeholder="Enter barcode number..."
                placeholderTextColor={colors.textSecondary}
                keyboardType="default"
                autoFocus
              />
              <TouchableOpacity
                style={[s.scanBtn, { backgroundColor: colors.primary }]}
                onPress={() => lookupKit(barcode)}
                disabled={!barcode.trim() || scanning}
              >
                {scanning ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="search" size={18} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Alerts */}
      {error ? (
        <View style={[s.alert, s.alertError]}>
          <Ionicons name="alert-circle" size={16} color="#DC2626" />
          <Text style={[s.alertText, { color: '#DC2626' }]}>{error}</Text>
        </View>
      ) : null}
      {success ? (
        <View style={[s.alert, s.alertSuccess]}>
          <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
          <Text style={[s.alertText, { color: '#16A34A' }]}>{success}</Text>
        </View>
      ) : null}

      <ScrollView style={s.scrollView} contentContainerStyle={s.scrollContent}>
        {/* Kit Status Card */}
        {kit && (
          <View style={[s.kitCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Status Badge */}
            <View style={[s.statusBadge, { backgroundColor: STATUS_CONFIG[kit.status as KitStatus]?.bg || '#F3F4F6' }]}>
              <Text style={s.statusIcon}>{STATUS_CONFIG[kit.status as KitStatus]?.icon}</Text>
              <View>
                <Text style={[s.statusText, { color: STATUS_CONFIG[kit.status as KitStatus]?.color || '#6B7280' }]}>
                  {STATUS_CONFIG[kit.status as KitStatus]?.label}
                </Text>
                <Text style={[s.statusDesc, { color: colors.textSecondary }]}>
                  {kit.status === 'REGISTERED' ? 'Scan to pair to your account' :
                   kit.status === 'PAIRED' ? 'Collect your sample when ready' :
                   kit.status === 'COLLECTED' ? 'Waiting for lab processing' :
                   kit.status === 'IN_TRANSIT' ? 'Sample being transported' :
                   kit.status === 'IN_LAB' ? 'Lab is processing your sample' :
                   'Results are available'}
                </Text>
              </View>
            </View>

            {/* Kit Info */}
            <View style={s.kitInfo}>
              <View style={s.kitInfoRow}>
                <Text style={[s.kitInfoLabel, { color: colors.textSecondary }]}>Barcode</Text>
                <Text style={[s.kitInfoValue, { color: colors.text }]}>{kit.barcode}</Text>
              </View>
              <View style={s.kitInfoRow}>
                <Text style={[s.kitInfoLabel, { color: colors.textSecondary }]}>Type</Text>
                <Text style={[s.kitInfoValue, { color: colors.text }]}>{kit.kitType}</Text>
              </View>
              {kit.patientName && (
                <View style={s.kitInfoRow}>
                  <Text style={[s.kitInfoLabel, { color: colors.textSecondary }]}>Patient</Text>
                  <Text style={[s.kitInfoValue, { color: colors.text }]}>{kit.patientName}</Text>
                </View>
              )}
              {kit.result && (
                <View style={s.kitInfoRow}>
                  <Text style={[s.kitInfoLabel, { color: colors.textSecondary }]}>Result</Text>
                  <Text style={[s.kitInfoValue, { color: '#16A34A', fontWeight: '800' }]}>{kit.result}</Text>
                </View>
              )}
            </View>

            {/* Progress Bar */}
            <View style={s.progressWrap}>
              <View style={s.progressDots}>
                {STATUS_FLOW.map((st, i) => (
                  <View key={st} style={s.progressDotWrap}>
                    <View style={[s.progressDot, { backgroundColor: i <= currentStep ? colors.primary : colors.border }]} />
                    <Text style={[s.progressLabel, { color: i <= currentStep ? colors.primary : colors.textSecondary }]} numberOfLines={1}>
                      {STATUS_CONFIG[st].label.split(' ')[0]}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={s.progressBar}>
                <View style={[s.progressFill, { backgroundColor: colors.primary, width: `${(currentStep / (STATUS_FLOW.length - 1)) * 100}%` }]} />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={s.actions}>
              {kit.status === 'REGISTERED' && !action && (
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#2563EB' }]} onPress={handlePair} disabled={scanning}>
                  <Ionicons name="link" size={18} color="#FFF" />
                  <Text style={s.actionBtnText}>Pair to My Account</Text>
                </TouchableOpacity>
              )}
              {kit.status === 'PAIRED' && !action && (
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#16A34A' }]} onPress={() => setAction('collect')}>
                  <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                  <Text style={s.actionBtnText}>I Collected My Sample</Text>
                </TouchableOpacity>
              )}
              {kit.status === 'COLLECTED' && (
                <View style={[s.infoBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                  <Text style={[s.infoBoxText, { color: '#16A34A' }]}>Sample collected. Waiting for lab.</Text>
                </View>
              )}
              {kit.status === 'PROCESSED' && (
                <View style={[s.infoBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                  <Text style={[s.infoBoxText, { color: '#059669', fontWeight: '800' }]}>Results: {kit.result}</Text>
                  <Text style={[s.infoBoxSub, { color: colors.textSecondary }]}>Contact your provider for details</Text>
                </View>
              )}
            </View>

            {/* Collection Method Selection */}
            {action === 'collect' && (
              <View style={s.collectForm}>
                <Text style={[s.collectTitle, { color: colors.text }]}>How did you collect the sample?</Text>
                {[
                  { id: 'HPV_SELF', label: 'Self-Collection (Vaginal Swab)', icon: 'hand-pointing-up' },
                  { id: 'HPV_CLINICIAN', label: 'Clinician-Collected', icon: 'hospital-box' },
                  { id: 'VIA', label: 'VIA (Visual Inspection)', icon: 'eye' },
                ].map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[s.collectOption, { borderColor: colors.border }]}
                    onPress={() => handleCollect(m.id)}
                    disabled={scanning}
                  >
                    <MaterialCommunityIcons name={m.icon as any} size={20} color={colors.primary} />
                    <Text style={[s.collectOptionText, { color: colors.text }]}>{m.label}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => setAction(null)}>
                  <Text style={[s.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Kit Timeline */}
            {kit.events && kit.events.length > 0 && (
              <View style={s.timeline}>
                <Text style={[s.timelineTitle, { color: colors.textSecondary }]}>Kit History</Text>
                {kit.events.map((evt: KitEvent) => (
                  <View key={evt.id} style={s.timelineItem}>
                    <View style={[s.timelineDot, { backgroundColor: colors.primary }]} />
                    <View style={s.timelineContent}>
                      <Text style={[s.timelineAction, { color: colors.text }]}>{evt.action}</Text>
                      <Text style={[s.timelineMeta, { color: colors.textSecondary }]}>
                        {evt.scannedByName} · {new Date(evt.timestamp).toLocaleString()}
                      </Text>
                      {evt.notes ? <Text style={[s.timelineNotes, { color: colors.textSecondary }]}>{evt.notes}</Text> : null}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* New Scan Button */}
            <TouchableOpacity style={[s.newScanBtn, { borderColor: colors.border }]} onPress={() => { setKit(null); setBarcode(''); setError(''); setSuccess(''); setAction(null); lastScanned.current = ''; }}>
              <Ionicons name="scan" size={16} color={colors.primary} />
              <Text style={[s.newScanText, { color: colors.primary }]}>Scan Another Kit</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* My Kits */}
        {!kit && myKits.length > 0 && (
          <View style={s.myKitsSection}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>My Kits ({myKits.length})</Text>
            {myKits.slice(0, 10).map((k) => (
              <TouchableOpacity
                key={k.barcode}
                style={[s.kitListItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => { setKit(k); setBarcode(k.barcode); }}
              >
                <View style={s.kitListInfo}>
                  <Text style={[s.kitListBarcode, { color: colors.text }]}>{k.barcode}</Text>
                  <Text style={[s.kitListType, { color: colors.textSecondary }]}>{k.kitType}</Text>
                </View>
                <View style={[s.kitListStatus, { backgroundColor: STATUS_CONFIG[k.status as KitStatus]?.bg || '#F3F4F6' }]}>
                  <Text style={[s.kitListStatusText, { color: STATUS_CONFIG[k.status as KitStatus]?.color || '#6B7280' }]}>
                    {STATUS_CONFIG[k.status as KitStatus]?.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* How It Works */}
        {!kit && (
          <View style={s.howItWorks}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>How Kit Tracking Works</Text>
            {[
              { step: 1, icon: 'scan', title: 'Scan Barcode', desc: 'Scan the barcode on your sample kit' },
              { step: 2, icon: 'link', title: 'Pair to You', desc: 'Link the kit to your account' },
              { step: 3, icon: 'flask', title: 'Collect Sample', desc: 'Follow instructions, scan again to confirm' },
              { step: 4, icon: 'truck', title: 'Track Transport', desc: 'Follow your sample to the lab' },
              { step: 5, icon: 'microscope', title: 'Lab Processing', desc: 'Results entered by scanning the same barcode' },
              { step: 6, icon: 'document-text', title: 'View Results', desc: 'Results appear in your app' },
            ].map(({ step, icon, title, desc }) => (
              <View key={step} style={s.howItem}>
                <View style={[s.howIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name={icon as any} size={18} color={colors.primary} />
                </View>
                <View style={s.howText}>
                  <Text style={[s.howTitle, { color: colors.text }]}>{title}</Text>
                  <Text style={[s.howDesc, { color: colors.textSecondary }]}>{desc}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, fontWeight: '500', marginTop: 4 },

  cameraWrap: { marginHorizontal: 20, height: 220, borderRadius: 20, overflow: 'hidden', marginBottom: 12 },
  camera: { flex: 1 },
  scanOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 240, height: 180, position: 'relative' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#FFF' },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  scanLine2: { position: 'absolute', left: 0, right: 0, height: 2, opacity: 0.8 },
  scanText: { color: '#FFF', fontSize: 13, fontWeight: '600', marginTop: 16, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },

  inputSection: { paddingHorizontal: 20, marginBottom: 8 },
  modeToggle: { alignItems: 'center', marginBottom: 10 },
  modeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  modeBtnText: { fontSize: 13, fontWeight: '600' },
  manualInput: { flexDirection: 'row', gap: 8 },
  textInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  scanBtn: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  alert: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 8, padding: 12, borderRadius: 12 },
  alertError: { backgroundColor: '#FEF2F2' },
  alertSuccess: { backgroundColor: '#F0FDF4' },
  alertText: { fontSize: 13, fontWeight: '600', flex: 1 },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  kitCard: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 20 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, marginBottom: 16 },
  statusIcon: { fontSize: 28 },
  statusText: { fontSize: 16, fontWeight: '800' },
  statusDesc: { fontSize: 12, marginTop: 2 },

  kitInfo: { marginBottom: 16 },
  kitInfoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  kitInfoLabel: { fontSize: 13 },
  kitInfoValue: { fontSize: 13, fontWeight: '600', fontFamily: 'monospace' },

  progressWrap: { marginBottom: 16 },
  progressDots: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressDotWrap: { alignItems: 'center', width: 50 },
  progressDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
  progressLabel: { fontSize: 9, fontWeight: '600', textAlign: 'center' },
  progressBar: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },

  actions: { marginBottom: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  actionBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  infoBox: { padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  infoBoxText: { fontSize: 14, fontWeight: '700' },
  infoBoxSub: { fontSize: 12, marginTop: 4 },

  collectForm: { marginTop: 8 },
  collectTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  collectOption: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 8 },
  collectOptionText: { flex: 1, fontSize: 14, fontWeight: '600' },
  cancelText: { fontSize: 13, textAlign: 'center', marginTop: 8 },

  timeline: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16, marginTop: 4 },
  timelineTitle: { fontSize: 12, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase' },
  timelineItem: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  timelineContent: { flex: 1 },
  timelineAction: { fontSize: 13, fontWeight: '700' },
  timelineMeta: { fontSize: 11, marginTop: 2 },
  timelineNotes: { fontSize: 11, marginTop: 2, fontStyle: 'italic' },

  newScanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingVertical: 12, marginTop: 8 },
  newScanText: { fontSize: 13, fontWeight: '600' },

  myKitsSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  kitListItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 8 },
  kitListInfo: { flex: 1 },
  kitListBarcode: { fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
  kitListType: { fontSize: 12, marginTop: 2 },
  kitListStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  kitListStatusText: { fontSize: 11, fontWeight: '700' },

  howItWorks: { marginTop: 8 },
  howItem: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  howIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  howText: { flex: 1 },
  howTitle: { fontSize: 14, fontWeight: '700' },
  howDesc: { fontSize: 12, marginTop: 2 },
});

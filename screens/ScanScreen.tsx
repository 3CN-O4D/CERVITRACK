import React, { useState, useRef, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { scanKit, registerKit, pairKit, patientCollectKit, transitKit, Kit } from '../services/api';

const { width } = Dimensions.get('window');
const GUIDE_W = width * 0.75;

type Phase = 'scan' | 'kit';

const TIMELINE = ['PAIRED', 'WITH_PATIENT', 'IN_TRANSIT', 'IN_LAB', 'PROCESSED'];

const STATUS_LABEL: Record<string, string> = {
  UNREGISTERED: 'Unregistered',
  REGISTERED: 'Registered',
  PAIRED: 'Linked to you',
  WITH_PATIENT: 'Collected - with you',
  COLLECTED: 'Sample collected',
  IN_TRANSIT: 'On the way to lab',
  IN_LAB: 'Received by lab',
  PROCESSED: 'Results ready',
};

const STATUS_HINT: Record<string, string> = {
  PAIRED: 'Follow the self-sampling guide, then mark your sample as collected.',
  WITH_PATIENT: 'Sample collected and still with you. Keep it safe, then submit it so it can be sent to the lab.',
  COLLECTED: 'Your sample is ready. Submit it so it can be sent to the lab.',
  IN_TRANSIT: 'Your sample is on the way to the laboratory.',
  IN_LAB: 'The lab has received your sample and is processing it.',
  PROCESSED: 'Your results are ready. Open My Results to view them.',
};

export default function ScanScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('scan');
  const [kit, setKit] = useState<Kit | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [torch, setTorch] = useState(false);
  const [checking, setChecking] = useState(true);
  const scanLock = useRef(false);

  const isMine = !!kit && !!user?.id && kit.patientId === user.id;
  const status = kit?.status || 'UNREGISTERED';

  const load = useCallback(async (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      const found = await scanKit(trimmed);
      setCode(trimmed);
      setKit(found || ({ barcode: trimmed, status: 'UNREGISTERED' } as Kit));
      setPhase('kit');
    } finally {
      setBusy(false);
      scanLock.current = false;
    }
  }, [busy]);

  const handleScan = useCallback(({ data }: { data: string }) => {
    if (scanLock.current) return;
    scanLock.current = true;
    load(data);
  }, [load]);

  const reset = () => {
    setPhase('scan');
    setKit(null);
    setCode('');
    setTorch(false);
    scanLock.current = false;
  };

  const linkKit = async () => {
    if (!kit || !user?.id || busy) return;
    setBusy(true);
    try {
      const paired = await pairKit(kit.barcode, {
        patientId: user.id,
        patientName: user.name || 'Patient',
        pairedBy: user.id,
        pairedByName: user.name || 'Patient (Self)',
      });
      if (paired && 'error' in paired) {
        Alert.alert('Cannot link kit', paired.error);
      } else if (paired) {
        setKit(paired as Kit);
      } else {
        Alert.alert('Error', 'Failed to link kit. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const registerAndLink = async () => {
    if (!kit || !user?.id || busy) return;
    setBusy(true);
    try {
      const registered = await registerKit(kit.barcode, {
        facilityId: 'home',
        registeredBy: user.id,
        registeredByName: user.name || 'Patient',
      });
      if (!registered) {
        Alert.alert('Error', 'Failed to register kit. Please try again.');
        return;
      }
      const paired = await pairKit(kit.barcode, {
        patientId: user.id,
        patientName: user.name || 'Patient',
        pairedBy: user.id,
        pairedByName: user.name || 'Patient (Self)',
      });
      if (paired && 'error' in paired) {
        setKit({ ...registered, status: 'REGISTERED' });
      } else if (paired) {
        setKit(paired as Kit);
      } else {
        setKit({ ...registered, status: 'REGISTERED' });
      }
    } finally {
      setBusy(false);
    }
  };

  const markCollected = async () => {
    if (!kit || !user?.id || busy) return;
    setBusy(true);
    try {
      const updated = await patientCollectKit(kit.barcode, {
        collectedBy: user.id,
        collectedByName: user.name || 'Patient',
        collectionMethod: 'self',
      });
      if (updated) setKit(updated);
      else Alert.alert('Error', 'Failed to update kit. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitSample = async () => {
    if (!kit || !user?.id || busy) return;
    setBusy(true);
    try {
      const updated = await transitKit(kit.barcode, {
        scannedBy: user.id,
        scannedByName: user.name || 'Patient',
        toLocation: 'Laboratory',
      });
      if (updated) {
        setKit(updated);
        Alert.alert('Submitted', 'Your sample has been submitted for laboratory testing.');
      } else {
        Alert.alert('Error', 'Failed to submit sample. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const s = styles(colors);

  if (!permission) {
    return <View style={[s.container, s.centered]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }
  if (!permission.granted) {
    return (
      <View style={[s.container, s.centered]}>
        <MaterialCommunityIcons name="camera-off" size={56} color={colors.textSecondary} />
        <Text style={[s.noPermText, { color: colors.text }]}>Camera access required</Text>
        <Text style={[s.noPermSub, { color: colors.textSecondary }]}>Allow camera to scan your sample kit</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
          <Text style={s.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'kit' && kit) {
    const stepIndex = TIMELINE.indexOf(status);
    return (
      <ScrollView style={[s.container, { backgroundColor: colors.bg }]} contentContainerStyle={s.scrollBody}>
        <View style={s.header}>
          <MaterialCommunityIcons name="test-tube" size={24} color={colors.primary} />
          <Text style={[s.headerTitle, { color: colors.text }]}>Sample & Submit</Text>
        </View>

        <View style={[s.kitCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.kitLabel, { color: colors.textSecondary }]}>Kit barcode</Text>
          <Text style={[s.kitCode, { color: colors.primary }]}>{kit.barcode}</Text>
          <View style={[s.statusPill, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[s.statusPillText, { color: colors.primary }]}>{STATUS_LABEL[status] || status}</Text>
          </View>
        </View>

        {status === 'UNREGISTERED' && (
          <>
            <Text style={[s.bodyText, { color: colors.textSecondary }]}>
              This kit isn't registered yet. Register it and link it to your account to start sampling.
            </Text>
            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.primary }]} onPress={registerAndLink} disabled={busy}>
              {busy ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="add-circle" size={18} color="#FFF" />}
              <Text style={s.primaryBtnText}>Register & Link Kit</Text>
            </TouchableOpacity>
          </>
        )}

        {status === 'REGISTERED' && !isMine && (
          <>
            <Text style={[s.bodyText, { color: colors.textSecondary }]}>
              This kit is registered but not linked to your account. Link it before sampling.
            </Text>
            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.primary }]} onPress={linkKit} disabled={busy}>
              {busy ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="link" size={18} color="#FFF" />}
              <Text style={s.primaryBtnText}>Link to My Account</Text>
            </TouchableOpacity>
          </>
        )}

        {['REGISTERED', 'PAIRED'].includes(status) && isMine ? (
          <>
            <Text style={[s.bodyText, { color: colors.textSecondary }]}>
              {STATUS_HINT.PAIRED}
            </Text>
            <View style={[s.stepsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.stepsTitle, { color: colors.text }]}>Before you collect</Text>
              <Text style={[s.stepItem, { color: colors.textSecondary }]}>1. Read the self-sampling guide in My Health.</Text>
              <Text style={[s.stepItem, { color: colors.textSecondary }]}>2. Collect your sample with the kit provided.</Text>
              <Text style={[s.stepItem, { color: colors.textSecondary }]}>3. Mark it collected here, then submit it to the lab.</Text>
            </View>
            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.primary }]} onPress={markCollected} disabled={busy}>
              {busy ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="checkmark-done" size={18} color="#FFF" />}
              <Text style={s.primaryBtnText}>Mark Sample Collected</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {['WITH_PATIENT', 'COLLECTED'].includes(status) && (
          <>
            <Text style={[s.bodyText, { color: colors.textSecondary }]}>{STATUS_HINT[status]}</Text>
            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.success }]} onPress={submitSample} disabled={busy}>
              {busy ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="paper-plane" size={18} color="#FFF" />}
              <Text style={s.primaryBtnText}>Submit Sample for Lab</Text>
            </TouchableOpacity>
          </>
        )}

        {['IN_TRANSIT', 'IN_LAB', 'PROCESSED'].includes(status) && (
          <Text style={[s.bodyText, { color: colors.textSecondary }]}>{STATUS_HINT[status]}</Text>
        )}

        <View style={[s.timeline, { borderColor: colors.border }]}>
          {TIMELINE.map((stage, i) => {
            const done = stepIndex >= i;
            return (
              <View key={stage} style={s.timelineStep}>
                <View style={[s.timelineDot, { backgroundColor: done ? colors.primary : colors.border }]} />
                {i < TIMELINE.length - 1 && (
                  <View style={[s.timelineBar, { backgroundColor: stepIndex > i ? colors.primary : colors.border }]} />
                )}
                <Text style={[s.timelineLabel, { color: done ? colors.text : colors.textSecondary }]}>
                  {STATUS_LABEL[stage]}
                </Text>
              </View>
            );
          })}
        </View>

        {kit.events?.length ? (
          <View style={[s.eventsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.stepsTitle, { color: colors.text }]}>Activity</Text>
            {[...kit.events].reverse().map((ev) => (
              <View key={ev.id} style={s.eventRow}>
                <View style={[s.eventDot, { backgroundColor: colors.primary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.eventAction, { color: colors.text }]}>{STATUS_LABEL[ev.action] || ev.action}</Text>
                  <Text style={[s.eventMeta, { color: colors.textSecondary }]}>
                    {new Date(ev.timestamp).toLocaleString()}{ev.scannedByName ? ` · ${ev.scannedByName}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity style={s.secondaryBtn} onPress={reset} disabled={busy}>
          <Ionicons name="scan-outline" size={18} color={colors.primary} />
          <Text style={[s.secondaryBtnText, { color: colors.primary }]}>Scan Another Kit</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (!checking) {
    return null;
  }
  setChecking(false);

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <View style={s.header}>
        <MaterialCommunityIcons name="barcode-scan" size={24} color={colors.primary} />
        <Text style={[s.headerTitle, { color: colors.text }]}>Sample & Submit</Text>
      </View>
      <Text style={[s.instruction, { color: colors.textSecondary }]}>
        Scan the barcode on your sample kit to link it, collect your sample and submit it to the lab.
      </Text>
      <View style={s.cameraWrap}>
        <CameraView
          style={s.camera}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e', 'pdf417', 'aztec', 'datamatrix', 'codabar'] }}
          onBarcodeScanned={handleScan}
        >
          <View style={s.cameraControls}>
            <TouchableOpacity style={s.controlBtn} onPress={() => setTorch(!torch)}>
              <Ionicons name={torch ? 'flash' : 'flash-outline'} size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={s.scanOverlay}>
            <View style={[s.scanBox, { borderColor: '#FFF' }]} />
            <Text style={s.scanText}>Point camera at kit barcode</Text>
          </View>
        </CameraView>
      </View>
      <View style={s.manualRow}>
        <TextInput
          style={[s.manualInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          value={code}
          onChangeText={(v) => { setCode(v); scanLock.current = false; }}
          placeholder="Or enter kit barcode..."
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="characters"
          onSubmitEditing={() => load(code)}
          returnKeyType="go"
        />
        <TouchableOpacity
          style={[s.manualBtn, { backgroundColor: colors.primary }]}
          onPress={() => load(code)}
          disabled={!code.trim() || busy}
        >
          {busy ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="checkmark" size={18} color="#FFF" />}
        </TouchableOpacity>
      </View>
      <Text style={[s.hint, { color: colors.textSecondary }]}>
        Don't have a kit yet? Pick up a free self-sampling kit, then scan its barcode here to register and link it.
      </Text>
    </View>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 50 },
  scrollBody: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  instruction: { fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  cameraWrap: { width: width - 32, height: (width - 32) * 0.75, borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  camera: { flex: 1 },
  cameraControls: { position: 'absolute', top: 16, right: 16, gap: 16, zIndex: 10 },
  controlBtn: { padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  scanOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanBox: { width: GUIDE_W, height: 90, borderRadius: 12, borderWidth: 2.5 },
  scanText: { color: '#FFF', fontSize: 13, fontWeight: '600', marginTop: 12, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
  manualRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  manualInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, letterSpacing: 1 },
  manualBtn: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  hint: { fontSize: 12, textAlign: 'center', lineHeight: 18, paddingHorizontal: 8 },
  kitCard: { borderWidth: 1, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 14 },
  kitLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  kitCode: { fontSize: 18, fontWeight: '800', letterSpacing: 1, fontFamily: 'monospace' },
  statusPill: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusPillText: { fontSize: 12, fontWeight: '700' },
  bodyText: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  stepsCard: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 14 },
  stepsTitle: { fontSize: 13, fontWeight: '800', marginBottom: 6 },
  stepItem: { fontSize: 12, lineHeight: 19 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 14, marginBottom: 16 },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  timeline: { borderTopWidth: 1, paddingTop: 16, marginBottom: 16 },
  timelineStep: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  timelineDot: { width: 14, height: 14, borderRadius: 7 },
  timelineBar: { width: 3, height: 18, marginLeft: 5.5, marginTop: -2, marginBottom: -2, position: 'absolute', top: 14, left: 0 },
  timelineLabel: { fontSize: 13, fontWeight: '600', marginLeft: 10 },
  eventsCard: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 16 },
  eventRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  eventDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  eventAction: { fontSize: 13, fontWeight: '600' },
  eventMeta: { fontSize: 11, marginTop: 2 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  secondaryBtnText: { fontSize: 14, fontWeight: '700' },
  noPermText: { fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  noPermSub: { fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  permBtn: { backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  permBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});

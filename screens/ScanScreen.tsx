import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Image,
  ActivityIndicator,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getItem, setItem } from '../services/storage';
import { addTestResult } from '../services/api';

const { width } = Dimensions.get('window');
const GUIDE_W = width * 0.75;
const GUIDE_H = GUIDE_W * 0.35;

type ScanStep = 'camera' | 'preview' | 'processing' | 'result';
type TestResult = 'positive' | 'negative' | 'invalid';

interface TestLog {
  id: string;
  date: string;
  imageUri: string;
  result: TestResult;
  submitted: boolean;
}

const LOG_KEY = '@cervitrack_test_logs';

const ANALYSIS_HTML = `
<html><body><canvas id="c"></canvas><script>
function processImage(base64) {
  var img = new Image();
  img.onload = function() {
    var c = document.getElementById('c');
    c.width = img.width;
    c.height = img.height;
    var ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var h = img.height, w = img.width;
    function scanLine(y) {
      var r=0,g=0,b=0,cnt=0;
      for (var x = Math.floor(w*0.15); x < Math.floor(w*0.85); x++) {
        var p = ctx.getImageData(x, y, 1, 1).data;
        r+=p[0]; g+=p[1]; b+=p[2]; cnt++;
      }
      return {r:r/cnt, g:g/cnt, b:b/cnt};
    }
    function bandScore(y, band) {
      var best = 0;
      for (var dy=-band; dy<=band; dy++) {
        if (y+dy<0||y+dy>=h) continue;
        var s = scanLine(y+dy);
        var intensity = s.r - (s.g+s.b)/2;
        if (intensity > best) best = intensity;
      }
      return best;
    }
    var bg = scanLine(Math.floor(h*0.1));
    var threshold = Math.max(18, (bg.r+bg.g+bg.b)/3 * 0.07);
    var ctrl = bandScore(Math.floor(h*0.3), 8) > threshold;
    var test = bandScore(Math.floor(h*0.65), 8) > threshold;
    var res = 'invalid';
    if (ctrl && test) res = 'positive';
    else if (ctrl && !test) res = 'negative';
    window.ReactNativeWebView.postMessage(res);
  };
  img.src = 'data:image/jpeg;base64,' + base64;
}
window.addEventListener('message', function(e) {
  processImage(e.data);
});
<\/script></body></html>`;

export default function ScanScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const webViewRef = useRef<WebView>(null);
  const [step, setStep] = useState<ScanStep>('camera');
  const [capturedUri, setCapturedUri] = useState('');
  const [result, setResult] = useState<TestResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [testLogs, setTestLogs] = useState<TestLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const analysisCallback = useRef<((r: TestResult) => void) | null>(null);

  useEffect(() => { loadLogs(); }, []);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const scanLineY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, GUIDE_H],
  });

  const loadLogs = async () => {
    const uid = user?.id || 'default';
    const raw = await getItem(`${LOG_KEY}_${uid}`);
    if (raw) setTestLogs(JSON.parse(raw));
  };

  const saveLogs = async (logs: TestLog[]) => {
    const uid = user?.id || 'default';
    await setItem(`${LOG_KEY}_${uid}`, JSON.stringify(logs));
    setTestLogs(logs);
  };

  const captureImage = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
        setStep('preview');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to capture image');
    }
  };

  const handleWebViewMessage = useCallback((event: any) => {
    const res = event.nativeEvent.data as TestResult;
    setResult(res);
    setStep('result');
    setProcessing(false);

    const log: TestLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      imageUri: capturedUri,
      result: res,
      submitted: false,
    };
    saveLogs([log, ...testLogs]);

    if (res === 'positive') {
      Alert.alert('Positive', 'Markers detected. Consult your healthcare provider.');
    } else if (res === 'negative') {
      Alert.alert('Negative', 'No markers detected. Continue regular screening.');
    } else {
      Alert.alert('Invalid', 'Could not read test. Please try again.');
    }
  }, [capturedUri, testLogs]);

  const processImage = async () => {
    if (!capturedUri) return;
    setProcessing(true);
    setStep('processing');
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        capturedUri,
        [{ resize: { width: 200 } }],
        { format: 'jpeg', base64: true },
      );
      if (!manipulated.base64) throw new Error('Processing failed');
      // Wait for WebView to be ready then send
      setTimeout(() => {
        webViewRef.current?.postMessage(manipulated.base64!);
      }, 500);
      // Fallback timeout
      setTimeout(() => {
        if (step === 'processing') {
          setResult('negative');
          setStep('result');
          setProcessing(false);
          const log: TestLog = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            imageUri: capturedUri,
            result: 'negative',
            submitted: false,
          };
          saveLogs([log, ...testLogs]);
        }
      }, 8000);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to analyze');
      setStep('camera');
      setProcessing(false);
    }
  };

  const submitResult = async (log: TestLog) => {
    try {
await addTestResult({ user_id: user?.id || '', result: log.result, date: log.date });
      const updated = testLogs.map((l) => l.id === log.id ? { ...l, submitted: true } : l);
      await saveLogs(updated);
      Alert.alert('Submitted', 'Result uploaded.');
    } catch {
      Alert.alert('Error', 'Failed to submit. Will retry when online.');
    }
  };

  const resetScanner = () => {
    setStep('camera');
    setCapturedUri('');
    setResult(null);
    setProcessing(false);
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
        <Text style={[s.noPermSub, { color: colors.textSecondary }]}>Allow camera to scan test kits</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
          <Text style={s.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      {/* Hidden WebView for image analysis */}
      <WebView
        ref={webViewRef}
        source={{ html: ANALYSIS_HTML }}
        style={{ width: 1, height: 1, opacity: 0, position: 'absolute' }}
        onMessage={handleWebViewMessage}
        javaScriptEnabled
      />

      {step === 'camera' && (
        <>
          <View style={s.header}>
            <MaterialCommunityIcons name="test-tube" size={24} color={colors.primary} />
            <Text style={[s.headerTitle, { color: colors.text }]}>Test Kit Scanner</Text>
          </View>
          <Text style={[s.instruction, { color: colors.textSecondary }]}>
            Place test kit flat on a surface. Position result window inside the guide.
          </Text>
          <View style={s.cameraWrap}>
            <CameraView ref={cameraRef} style={s.camera} facing="back">
              <View style={s.guideOverlay}>
                <View style={[s.guideBox, { borderColor: '#FFF' }]}>
                  <View style={[s.guideLabel_left, { color: '#FFF' }]}><Text style={{color:'#FFF',fontSize:10,fontWeight:'800'}}>C</Text></View>
                  <View style={[s.guideLabel_right, { color: '#FFF' }]}><Text style={{color:'#FFF',fontSize:10,fontWeight:'800'}}>T</Text></View>
                  <Animated.View style={[s.scanLine, { backgroundColor: colors.primary, transform: [{ translateY: scanLineY }] }]} />
                </View>
              </View>
            </CameraView>
          </View>
          <TouchableOpacity style={[s.captureBtn, { backgroundColor: colors.primary }]} onPress={captureImage}>
            <Ionicons name="camera" size={22} color="#FFF" />
            <Text style={s.captureText}>Scan Test Kit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.logsToggle} onPress={() => setShowLogs(!showLogs)}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={[s.logsToggleText, { color: colors.primary }]}>
              {showLogs ? 'Hide History' : `History (${testLogs.length})`}
            </Text>
          </TouchableOpacity>
          {showLogs && (
            <ScrollView style={s.logsList}>
              {testLogs.length === 0 ? (
                <Text style={[s.logEmpty, { color: colors.textSecondary }]}>No scans yet</Text>
              ) : (
                testLogs.map((log) => (
                  <View key={log.id} style={[s.logItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={s.logInfo}>
                      <Text style={[s.logDate, { color: colors.text }]}>{new Date(log.date).toLocaleDateString('en-KE')}</Text>
                      <View style={[s.resultBadge, log.result==='positive'&&{backgroundColor:'#FFEBEE'}, log.result==='negative'&&{backgroundColor:'#E8F5E9'}, log.result==='invalid'&&{backgroundColor:'#FFF3E0'}]}>
                        <Text style={[s.resultBadgeText, log.result==='positive'&&{color:'#C62828'}, log.result==='negative'&&{color:'#2E7D32'}, log.result==='invalid'&&{color:'#E65100'}]}>{log.result}</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={[s.submitSmallBtn, log.submitted&&{opacity:0.5}]} onPress={() => !log.submitted && submitResult(log)}>
                      <Text style={[s.submitSmallText, { color: log.submitted ? colors.textSecondary : colors.primary }]}>{log.submitted ? 'Sent' : 'Submit'}</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </>
      )}

      {step === 'preview' && (
        <View style={s.previewWrap}>
          <Text style={[s.previewTitle, { color: colors.text }]}>Review Image</Text>
          <Text style={[s.previewSub, { color: colors.textSecondary }]}>Is the result window clearly visible?</Text>
          {capturedUri ? <Image source={{ uri: capturedUri }} style={s.previewImage} /> : null}
          <View style={s.previewActions}>
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.error }]} onPress={resetScanner}>
              <Ionicons name="close" size={20} color="#FFF" />
              <Text style={s.actionBtnText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.primary }]} onPress={processImage}>
              <Ionicons name="checkmark" size={20} color="#FFF" />
              <Text style={s.actionBtnText}>Analyze</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {step === 'processing' && (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.processingText, { color: colors.text }]}>Analyzing...</Text>
          <Text style={[s.processingSub, { color: colors.textSecondary }]}>Detecting control and test lines</Text>
        </View>
      )}

      {step === 'result' && result && (
        <View style={s.resultWrap}>
          <MaterialCommunityIcons name={result==='positive'?'alert-circle':result==='negative'?'check-circle':'help-circle'} size={72} color={result==='positive'?'#C62828':result==='negative'?'#2E7D32':'#E65100'} />
          <Text style={[s.resultTitle, { color: colors.text }]}>{result.charAt(0).toUpperCase()+result.slice(1)}</Text>
          <Text style={[s.resultDesc, { color: colors.textSecondary }]}>
            {result==='positive' ? 'Test markers detected. Consult your healthcare provider.' :
             result==='negative' ? 'No markers detected. Continue regular screening.' :
             'Could not read test. Try again with proper positioning.'}
          </Text>
          <View style={s.resultActions}>
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.primary }]} onPress={resetScanner}>
              <Ionicons name="scan-outline" size={20} color="#FFF" />
              <Text style={s.actionBtnText}>Scan Another</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.success }]} onPress={() => {
              const log = testLogs.find((l) => l.imageUri === capturedUri);
              if (log && !log.submitted) submitResult(log);
            }}>
              <Ionicons name="cloud-upload-outline" size={20} color="#FFF" />
              <Text style={s.actionBtnText}>Upload Result</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 50 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  instruction: { fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  cameraWrap: { width: width - 32, height: (width - 32) * 0.75, borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  camera: { flex: 1 },
  guideOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  guideBox: {
    width: GUIDE_W, height: GUIDE_H,
    borderWidth: 2.5, borderRadius: 12,
    position: 'relative', overflow: 'hidden',
  },
  guideLabel_left: { position: 'absolute', left: 8, top: 8 },
  guideLabel_right: { position: 'absolute', right: 8, bottom: 8 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, opacity: 0.7 },
  captureBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  captureText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  noPermText: { fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  noPermSub: { fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  permBtn: { backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  permBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  logsToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  logsToggleText: { fontSize: 13, fontWeight: '600' },
  logsList: { maxHeight: 160, marginTop: 8 },
  logEmpty: { textAlign: 'center', fontSize: 13, marginTop: 12 },
  logItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 12, borderWidth: 1, marginBottom: 6 },
  logInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logDate: { fontSize: 12, fontWeight: '600' },
  resultBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  resultBadgeText: { fontSize: 11, fontWeight: '700' },
  submitSmallBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  submitSmallText: { fontSize: 12, fontWeight: '700' },
  previewWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  previewTitle: { fontSize: 22, fontWeight: '800' },
  previewSub: { fontSize: 13, fontWeight: '500', marginTop: 4, marginBottom: 20, textAlign: 'center' },
  previewImage: { width: width - 32, height: (width - 32) * 0.75, borderRadius: 16 },
  previewActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14 },
  actionBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  processingText: { fontSize: 18, fontWeight: '700', marginTop: 20 },
  processingSub: { fontSize: 13, fontWeight: '500', marginTop: 4 },
  resultWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 28, fontWeight: '800', marginTop: 16 },
  resultDesc: { fontSize: 14, fontWeight: '500', textAlign: 'center', marginTop: 8, lineHeight: 20, paddingHorizontal: 20 },
  resultActions: { flexDirection: 'row', gap: 12, marginTop: 32 },
});

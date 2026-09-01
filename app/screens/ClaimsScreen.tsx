import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Text from '../components/AppText';
import MorningBackground from '../components/MorningBackground';
import { useResponsive } from '../hooks/useResponsive';
import { API_BASE } from '../utils/config';
import type { UserProfile } from '../types';

const BRAND = {
  primary: '#D7AB6A',
  primaryLight: '#F7EFE2',
  primaryDark: '#31122B',
  text: '#FFFFFF',
  textDim: '#CBAF8C',
  border: '#4A2040',
  success: '#2E8B57',
  danger: '#E05050',
};

type Props = {
  onBack: () => void;
  user: UserProfile | null;
};

type ClaimRequest = {
  id: string;
  type: 'advance' | 'reimbursement';
  amount: string;
  purpose: string;
  photo?: string;
  status: {
    manager: 'pending' | 'approved' | 'rejected';
    finance: 'pending' | 'approved' | 'rejected';
  };
  date: string;
  user: string;
};

export default function ClaimsScreen({ onBack, user }: Props) {
  const { scale } = useResponsive();
  const [activeSubTab, setActiveSubTab] = useState<'advance' | 'reimbursement' | 'status'>('advance');
  const [claimsList, setClaimsList] = useState<ClaimRequest[]>([]);

  // Advance Form State
  const [advAmount, setAdvAmount] = useState('');
  const [advPurpose, setAdvPurpose] = useState('');
  const [isSubmittingAdv, setIsSubmittingAdv] = useState(false);

  // Reimbursement Form State
  const [reimbPhoto, setReimbPhoto] = useState<string | null>(null);
  const [reimbAmount, setReimbAmount] = useState('');
  const [reimbPurpose, setReimbPurpose] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmittingReimb, setIsSubmittingReimb] = useState(false);

  const fetchClaims = () => {
    fetch(`${API_BASE}/api/claims`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          // Filter requests belonging to this user
          const myClaims = res.data.filter(
            (c: any) => c.user?.toLowerCase() === user?.email?.toLowerCase()
          );
          setClaimsList(myClaims);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (user?.email) {
      fetchClaims();
    }
  }, [user]);

  const handleApplyAdvance = () => {
    const amt = parseFloat(advAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive advance amount.');
      return;
    }
    if (!advPurpose.trim()) {
      Alert.alert('Purpose Needed', 'Please state the purpose of the advance request.');
      return;
    }

    setIsSubmittingAdv(true);
    const newClaim = {
      type: 'advance',
      amount: advAmount,
      purpose: advPurpose.trim(),
      user: user?.email ?? 'guest@kworks.com',
    };

    fetch(`${API_BASE}/api/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClaim),
    })
      .then((res) => res.json())
      .then((res) => {
        setIsSubmittingAdv(false);
        if (res.success) {
          Alert.alert('Success', 'Advance request submitted for approval.');
          setAdvAmount('');
          setAdvPurpose('');
          fetchClaims();
          setActiveSubTab('status');
        } else {
          Alert.alert('Error', 'Submission failed. Please try again.');
        }
      })
      .catch(() => {
        setIsSubmittingAdv(false);
        Alert.alert('Error', 'Network error. Request could not be sent.');
      });
  };

  const handlePickReceipt = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Denied', 'Gallery access is required to upload receipt.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return;

    const selectedPhoto = result.assets[0].uri;
    const photoBase64 = result.assets[0].base64
      ? `data:image/jpeg;base64,${result.assets[0].base64}`
      : selectedPhoto;

    setReimbPhoto(photoBase64);
    setIsScanning(true);

    // Mock OCR Receipt scanning animation & amount mining
    setTimeout(() => {
      setIsScanning(false);
      // Generate a realistic random transaction amount (₹150 to ₹2500)
      const minedAmount = (150 + Math.random() * 2350).toFixed(2);
      setReimbAmount(minedAmount);
      Alert.alert(
        'Receipt Scanned',
        `Mined receipt data:\nDetected Amount: ₹${minedAmount}\n\nYou can update the amount or purpose before submitting.`
      );
    }, 2000);
  };

  const handleApplyReimbursement = () => {
    const amt = parseFloat(reimbAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please capture or enter a valid reimbursement amount.');
      return;
    }
    if (!reimbPhoto) {
      Alert.alert('Receipt Required', 'Please capture or upload a photo of the receipt.');
      return;
    }
    if (!reimbPurpose.trim()) {
      Alert.alert('Purpose Needed', 'Please enter the purpose of this claim.');
      return;
    }

    setIsSubmittingReimb(true);
    const newClaim = {
      type: 'reimbursement',
      amount: reimbAmount,
      purpose: reimbPurpose.trim(),
      photo: reimbPhoto,
      user: user?.email ?? 'guest@kworks.com',
    };

    fetch(`${API_BASE}/api/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClaim),
    })
      .then((res) => res.json())
      .then((res) => {
        setIsSubmittingReimb(false);
        if (res.success) {
          Alert.alert('Success', 'Reimbursement claim submitted.');
          setReimbAmount('');
          setReimbPurpose('');
          setReimbPhoto(null);
          fetchClaims();
          setActiveSubTab('status');
        } else {
          Alert.alert('Error', 'Submission failed. Please try again.');
        }
      })
      .catch(() => {
        setIsSubmittingReimb(false);
        Alert.alert('Error', 'Network error. Request could not be sent.');
      });
  };

  return (
    <View style={styles.root}>
      <MorningBackground />
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.topBar, { paddingTop: 44 }]}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>{'<'} Back</Text>
          </Pressable>
          <Text style={styles.title}>Claims &amp; Advances</Text>
          <View style={styles.backBtn} />
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tabBtn, activeSubTab === 'advance' && styles.tabBtnActive]}
            onPress={() => setActiveSubTab('advance')}
          >
            <Text style={[styles.tabBtnText, activeSubTab === 'advance' && styles.tabBtnTextActive]}>
              Apply Advance
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeSubTab === 'reimbursement' && styles.tabBtnActive]}
            onPress={() => setActiveSubTab('reimbursement')}
          >
            <Text style={[styles.tabBtnText, activeSubTab === 'reimbursement' && styles.tabBtnTextActive]}>
              Reimbursement
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeSubTab === 'status' && styles.tabBtnActive]}
            onPress={() => {
              setActiveSubTab('status');
              fetchClaims();
            }}
          >
            <Text style={[styles.tabBtnText, activeSubTab === 'status' && styles.tabBtnTextActive]}>
              Track Status ({claimsList.length})
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* TAB 1: APPLY ADVANCE */}
          {activeSubTab === 'advance' && (
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>REQUEST CASH ADVANCE</Text>
              <Text style={styles.label}>ADVANCE AMOUNT (₹)</Text>
              <TextInput
                style={styles.input}
                value={advAmount}
                onChangeText={setAdvAmount}
                placeholder="e.g. 5000"
                placeholderTextColor={BRAND.textDim}
                keyboardType="numeric"
              />

              <Text style={styles.label}>PURPOSE / DESCRIPTION</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                multiline
                value={advPurpose}
                onChangeText={setAdvPurpose}
                placeholder="e.g. Travel allowance for client visit"
                placeholderTextColor={BRAND.textDim}
              />

              {isSubmittingAdv ? (
                <ActivityIndicator color={BRAND.primary} style={{ marginTop: 20 }} />
              ) : (
                <Pressable style={styles.submitBtn} onPress={handleApplyAdvance}>
                  <Text style={styles.submitBtnText}>Submit Advance Request</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* TAB 2: REIMBURSEMENT CLAIM */}
          {activeSubTab === 'reimbursement' && (
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>CLAIM MEALS/TRAVEL REIMBURSEMENT</Text>

              <Text style={styles.label}>RECEIPT ATTACHMENT</Text>
              <Pressable style={styles.photoBtn} onPress={handlePickReceipt} disabled={isScanning}>
                <Text style={styles.photoBtnText}>
                  {reimbPhoto ? '✓ Receipt Loaded' : '📷 Take / Upload Receipt Image'}
                </Text>
              </Pressable>

              {isScanning && (
                <View style={styles.scanningBox}>
                  <ActivityIndicator color={BRAND.primary} />
                  <Text style={styles.scanningText}>OCR Analysis: Mining amount from receipt...</Text>
                </View>
              )}

              {reimbPhoto && !isScanning && (
                <Image source={{ uri: reimbPhoto }} style={styles.previewImage} />
              )}

              <Text style={styles.label}>CLAIM AMOUNT (₹)</Text>
              <TextInput
                style={styles.input}
                value={reimbAmount}
                onChangeText={setReimbAmount}
                placeholder="e.g. 850"
                placeholderTextColor={BRAND.textDim}
                keyboardType="numeric"
              />

              <Text style={styles.label}>PURPOSE / EXPLANATION</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                multiline
                value={reimbPurpose}
                onChangeText={setReimbPurpose}
                placeholder="e.g. Dinner with team during project deployment"
                placeholderTextColor={BRAND.textDim}
              />

              {isSubmittingReimb ? (
                <ActivityIndicator color={BRAND.primary} style={{ marginTop: 20 }} />
              ) : (
                <Pressable style={styles.submitBtn} onPress={handleApplyReimbursement}>
                  <Text style={styles.submitBtnText}>Submit Reimbursement Claim</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* TAB 3: TRACK APPROVAL STATUS */}
          {activeSubTab === 'status' && (
            <View style={styles.statusWrap}>
              <Text style={styles.sectionTitle}>MY FILED CLAIMS &amp; APPROVAL PROCESS</Text>
              {claimsList.length === 0 ? (
                <Text style={styles.emptyText}>No requests submitted yet.</Text>
              ) : (
                claimsList.map((item) => {
                  const mStatus = item.status?.manager || 'pending';
                  const fStatus = item.status?.finance || 'pending';
                  const isRejected = mStatus === 'rejected' || fStatus === 'rejected';
                  const isApproved = mStatus === 'approved' && fStatus === 'approved';

                  return (
                    <View key={item.id} style={styles.claimCard}>
                      <View style={styles.claimHeader}>
                        <View>
                          <Text style={styles.claimType}>{item.type.toUpperCase()}</Text>
                          <Text style={styles.claimId}>{item.id} &middot; {item.date}</Text>
                        </View>
                        <Text style={styles.claimAmount}>₹{item.amount}</Text>
                      </View>

                      <Text style={styles.claimPurpose}>Purpose: {item.purpose}</Text>

                      {/* Approval flow stages */}
                      <View style={styles.flowRow}>
                        <View style={styles.flowStep}>
                          <Text style={[styles.flowStepDot, mStatus === 'approved' ? styles.dotApproved : mStatus === 'rejected' ? styles.dotRejected : styles.dotPending]} />
                          <Text style={styles.flowLabel}>Stage 1: Manager ({mStatus})</Text>
                        </View>
                        <View style={styles.flowLine} />
                        <View style={styles.flowStep}>
                          <Text style={[styles.flowStepDot, fStatus === 'approved' ? styles.dotApproved : fStatus === 'rejected' ? styles.dotRejected : styles.dotPending]} />
                          <Text style={styles.flowLabel}>Stage 2: Accounts ({fStatus})</Text>
                        </View>
                      </View>

                      <View style={styles.statusBox}>
                        <Text style={styles.statusLabel}>OVERALL PROCESS STATUS:</Text>
                        <Text style={[styles.statusVal, isApproved ? styles.valApproved : isRejected ? styles.valRejected : styles.valPending]}>
                          {isApproved
                            ? 'DISBURSED / APPROVED'
                            : isRejected
                            ? 'REJECTED'
                            : mStatus === 'approved'
                            ? 'PENDING ACCOUNTS RELEASE'
                            : 'PENDING MANAGER APPROVAL'}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { minWidth: 70 },
  backText: { color: BRAND.primary, fontSize: 16, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', color: BRAND.primary },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(42,16,36,0.5)',
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    padding: 6,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: BRAND.primary },
  tabBtnText: { color: BRAND.textDim, fontWeight: '700', fontSize: 13 },
  tabBtnTextActive: { color: '#FFFFFF' },
  content: { padding: 16, paddingBottom: 60 },
  formCard: {
    backgroundColor: 'rgba(42,16,36,0.65)',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND.primary,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  label: { fontSize: 11, fontWeight: '700', color: BRAND.textDim, letterSpacing: 0.5, marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(26,9,22,0.6)',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: BRAND.text,
    fontSize: 14,
  },
  submitBtn: { backgroundColor: BRAND.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  photoBtn: {
    backgroundColor: 'rgba(215,171,106,0.15)',
    borderWidth: 1.5,
    borderColor: BRAND.primary,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  photoBtnText: { color: BRAND.primary, fontWeight: '700', fontSize: 13 },
  scanningBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, backgroundColor: 'rgba(215,171,106,0.1)', padding: 12, borderRadius: 8 },
  scanningText: { color: BRAND.primary, fontSize: 12, fontWeight: '700' },
  previewImage: { width: '100%', height: 160, borderRadius: 10, marginTop: 12, resizeMode: 'cover' },
  emptyText: { color: BRAND.textDim, fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 30 },
  statusWrap: { gap: 12 },
  claimCard: {
    backgroundColor: 'rgba(42,16,36,0.65)',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 14,
    padding: 16,
  },
  claimHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(74,32,64,0.4)', paddingBottom: 10, marginBottom: 10 },
  claimType: { fontSize: 12, fontWeight: '800', color: BRAND.primary, letterSpacing: 0.5 },
  claimId: { fontSize: 10, color: BRAND.textDim, marginTop: 2 },
  claimAmount: { fontSize: 18, fontWeight: '800', color: BRAND.text },
  claimPurpose: { fontSize: 13, color: BRAND.textDim, lineHeight: 18 },
  flowRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  flowStep: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flowStepDot: { width: 8, height: 8, borderRadius: 4 },
  dotApproved: { backgroundColor: BRAND.success },
  dotRejected: { backgroundColor: BRAND.danger },
  dotPending: { backgroundColor: BRAND.primary },
  flowLabel: { fontSize: 11, color: BRAND.textDim, fontWeight: '600' },
  flowLine: { flex: 1, height: 1.5, backgroundColor: 'rgba(74,32,64,0.4)' },
  statusBox: {
    backgroundColor: 'rgba(26,9,22,0.4)',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  statusLabel: { fontSize: 10, fontWeight: '700', color: BRAND.textDim },
  statusVal: { fontSize: 11, fontWeight: '800' },
  valApproved: { color: BRAND.success },
  valRejected: { color: BRAND.danger },
  valPending: { color: BRAND.primary },
});

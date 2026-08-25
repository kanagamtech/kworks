import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Text from '../components/AppText';
import MorningBackground from '../components/MorningBackground';
import { useResponsive } from '../hooks/useResponsive';
import ITSupportScreen, { type SupportDept } from './ITSupportScreen';
import type { UserProfile } from '../types';

const BRAND = {
  primary: '#D7AB6A',
  primaryLight: '#D7AB6A',
  primaryDark: '#31122B',
  text: '#FFFFFF',
  textDim: '#CBAF8C',
};

const DEPTS: { id: SupportDept; label: string }[] = [
  { id: 'management', label: 'MANAGEMENT' },
  { id: 'hr', label: 'HR' },
  { id: 'finance', label: 'FINANCE' },
  { id: 'it', label: 'IT' },
];

type Props = {
  onBack: () => void;
  user: UserProfile | null;
};

export default function SupportScreen({ onBack, user }: Props) {
  const { columns, contentMaxWidth, cardAspect } = useResponsive();
  const [dept, setDept] = useState<SupportDept | null>(null);

  if (dept) {
    return <ITSupportScreen department={dept} onBack={() => setDept(null)} user={user} />;
  }

  const cardWidth = 100 / columns - 2.5;
  const rows: (typeof DEPTS)[] = [];
  for (let i = 0; i < DEPTS.length; i += columns) {
    rows.push(DEPTS.slice(i, i + columns));
  }

  return (
    <View style={styles.root}>
      <MorningBackground />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.inner, { maxWidth: contentMaxWidth }]}>
          <View style={styles.topBar}>
            <Pressable onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backText}>{'<'} Back</Text>
            </Pressable>
            <Text style={styles.title}>Support</Text>
            <View style={styles.backBtn} />
          </View>
          <Text style={styles.subTitle}>Choose a department to raise your request</Text>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((d) => (
                <Pressable
                  key={d.id}
                  style={[styles.card, { width: `${cardWidth}%`, aspectRatio: cardAspect }]}
                  onPress={() => setDept(d.id)}
                >
                  <View style={styles.deptIcon}>
                    <Text style={styles.deptIconText}>{d.label[0]}</Text>
                  </View>
                  <Text style={styles.cardLabel}>{d.label}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  inner: {
    width: '100%',
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backBtn: {
    minWidth: 70,
  },
  backText: {
    color: BRAND.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  title: {
    color: BRAND.primaryLight,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  subTitle: {
    color: BRAND.textDim,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(215,171,106,0.35)',
    backgroundColor: 'rgba(26,9,22,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  deptIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: BRAND.primaryDark,
    borderWidth: 2,
    borderColor: '#D7AB6A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deptIconText: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.primary,
  },
  cardLabel: {
    fontWeight: '700',
    letterSpacing: 0.8,
    color: BRAND.text,
    textAlign: 'center',
  },
});
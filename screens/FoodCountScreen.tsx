import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Text from '../components/AppText';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import MorningBackground from '../components/MorningBackground';
import { saveFoodCount, todayKey } from '../utils/records';
import { API_BASE } from '../utils/config';
import type { UserProfile } from '../types';

const BRAND = {
  primary: '#D7AB6A',
  primaryLight: '#D7AB6A',
  text: '#FFFFFF',
  textDim: '#CBAF8C',
  success: '#D7AB6A',
  warn: '#D7AB6A',
};

type MealKey = 'breakfast' | 'morningSnacks' | 'lunch' | 'eveningSnacks';

const MEALS: { key: MealKey; label: string; icon: React.ReactNode }[] = [
  {
    key: 'breakfast',
    label: 'Breakfast',
    icon: (
      <Svg width={26} height={26} viewBox="0 0 24 24">
        <Rect x={3} y={10} width={13} height={9} rx={1.5} stroke="#D7AB6A" strokeWidth={1.7} fill="rgba(215,171,106,0.35)" />
        <Path d="M16 13 h2 a2.4 2.4 0 0 1 0 4.8 h-2" stroke="#D7AB6A" strokeWidth={1.7} fill="none" />
        <Path d="M7 10 V8 M10.5 10 V7 M14 10 V8.5" stroke="#D7AB6A" strokeWidth={1.7} strokeLinecap="round" fill="none" />
        <Path d="M2 22 h15" stroke="#D7AB6A" strokeWidth={1.7} strokeLinecap="round" />
      </Svg>
    ),
  },
  {
    key: 'morningSnacks',
    label: 'Morning Snacks',
    icon: (
      <Svg width={26} height={26} viewBox="0 0 24 24">
        <Circle cx={12} cy={13} r={8} stroke="#D7AB6A" strokeWidth={1.7} fill="rgba(215,171,106,0.35)" />
        <Circle cx={12} cy={13} r={2} fill="#D7AB6A" />
        <Circle cx={8} cy={9.5} r={1} fill="#D7AB6A" />
        <Circle cx={16} cy={9.5} r={1} fill="#D7AB6A" />
        <Circle cx={8} cy={16} r={1} fill="#D7AB6A" />
        <Circle cx={16} cy={16} r={1} fill="#D7AB6A" />
      </Svg>
    ),
  },
  {
    key: 'lunch',
    label: 'Lunch',
    icon: (
      <Svg width={26} height={26} viewBox="0 0 24 24">
        <Path d="M4 12 h16 a8 8 0 0 1 -16 0 Z" stroke="#D7AB6A" strokeWidth={1.7} fill="rgba(215,171,106,0.35)" />
        <Path d="M2 14 h20" stroke="#D7AB6A" strokeWidth={1.7} strokeLinecap="round" />
      </Svg>
    ),
  },
  {
    key: 'eveningSnacks',
    label: 'Evening Snacks',
    icon: (
      <Svg width={26} height={26} viewBox="0 0 24 24">
        <Path d="M7 11 h10 l-1.5 8 h-7 Z" stroke="#D7AB6A" strokeWidth={1.7} fill="rgba(215,171,106,0.35)" strokeLinejoin="round" />
        <Path d="M5.5 7 h13 a3.4 3.4 0 0 1 -3.4 3.4 h-6.2 A3.4 3.4 0 0 1 5.5 7 Z" stroke="#D7AB6A" strokeWidth={1.7} fill="rgba(215,171,106,0.35)" strokeLinejoin="round" />
        <Circle cx={12} cy={6.4} r={1.1} fill="#D7AB6A" />
        <Path d="M11 19 h2 M10.6 21.5 h2.8" stroke="#D7AB6A" strokeWidth={1.7} strokeLinecap="round" />
      </Svg>
    ),
  },
];

type Props = {
  onBack: () => void;
  onSubmit: () => void;
  user: UserProfile | null;
};

export default function FoodCountScreen({ onBack, onSubmit, user }: Props) {
  const [counts, setCounts] = useState<Record<MealKey, boolean | null>>({
    breakfast: null,
    morningSnacks: null,
    lunch: null,
    eveningSnacks: null,
  });

  const allSelected = Object.values(counts).every((v) => v !== null);

  const handleSubmit = () => {
    const payload = {
      date: todayKey(),
      user: user?.email ?? 'guest@kworks.com',
      meals: counts,
    };
    saveFoodCount(payload);
    fetch(`${API_BASE}/api/food`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
    onSubmit();
  };

  return (
    <View style={styles.root}>
      <MorningBackground />
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>{'<'} Back</Text>
          </Pressable>
          <Text style={styles.title}>Food Count</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>Did the employee receive their meals today?</Text>
          <View style={styles.list}>
            {MEALS.map((meal) => {
              const selected = counts[meal.key];
              const yes = selected === true;
              const no = selected === false;
              return (
                <View key={meal.key} style={styles.row}>
                  <View style={styles.mealLeft}>
                    <View style={styles.mealIconWrap}>{meal.icon}</View>
                    <Text style={styles.mealLabel}>{meal.label}</Text>
                  </View>
                  <View style={styles.toggleRow}>
                    <Pressable
                      style={[styles.toggleBtn, yes ? styles.toggleYes : styles.toggleIdle]}
                      onPress={() => setCounts((prev) => ({ ...prev, [meal.key]: true }))}
                    >
                      <Text style={[styles.toggleText, yes && styles.toggleTextYes]}>YES</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.toggleBtn, no ? styles.toggleNo : styles.toggleIdle]}
                      onPress={() => setCounts((prev) => ({ ...prev, [meal.key]: false }))}
                    >
                      <Text style={[styles.toggleText, no && styles.toggleTextNo]}>NO</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
          {allSelected ? (
            <Pressable style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Submit</Text>
            </Pressable>
          ) : (
            <Text style={styles.footnote}>Select YES or NO for all four meals to submit.</Text>
          )}
        </ScrollView>
      </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  backBtn: {
    minWidth: 70,
  },
  backText: {
    color: BRAND.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    color: BRAND.primaryLight,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  content: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  subtitle: {
    color: BRAND.text,
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
    marginBottom: 24,
  },
  list: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7AB6A',
    backgroundColor: 'rgba(26,9,22,0.55)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(215,171,106,0.35)',
  },
  mealLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D7AB6A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealLabel: {
    color: BRAND.text,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    width: 62,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  toggleYes: {
    backgroundColor: 'rgba(215,171,106,0.35)',
    borderColor: BRAND.success,
  },
  toggleNo: {
    backgroundColor: '#D7AB6A',
    borderColor: BRAND.warn,
  },
  toggleIdle: {
    backgroundColor: 'rgba(42,16,36,0.5)',
    borderColor: '#D7AB6A',
  },
  toggleText: {
    color: BRAND.textDim,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  toggleTextYes: {
    color: BRAND.success,
  },
  toggleTextNo: {
    color: BRAND.warn,
  },
  footnote: {
    color: BRAND.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 18,
    maxWidth: 300,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: 26,
    backgroundColor: BRAND.success,
    borderRadius: 14,
    paddingHorizontal: 56,
    paddingVertical: 14,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
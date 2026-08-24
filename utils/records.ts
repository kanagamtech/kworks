import AsyncStorage from '@react-native-async-storage/async-storage';

export type AttendanceRecord = {
  date: string;
  time: string;
  user: string;
  name?: string;
  location: string | null;
  photoUri: string | null;
};

export type MealKey = 'breakfast' | 'morningSnacks' | 'lunch' | 'eveningSnacks';

export type FoodCountRecord = {
  date: string;
  user: string;
  meals: Record<MealKey, boolean | null>;
};

export const ATTENDANCE_KEY = 'kworks_attendance_records';
export const FOOD_KEY = 'kworks_food_counts';

export const loadRecords = <T>(key: string): Promise<T[]> =>
  AsyncStorage.getItem(key)
    .then((raw) => {
      if (!raw) return [];
      try {
        return JSON.parse(raw) as T[];
      } catch {
        return [];
      }
    })
    .catch(() => []);

export const saveAttendanceRecord = (record: AttendanceRecord) =>
  loadRecords<AttendanceRecord>(ATTENDANCE_KEY)
    .then((list) => {
      list.unshift(record);
      return AsyncStorage.setItem(ATTENDANCE_KEY, JSON.stringify(list.slice(0, 300))).catch(() => {});
    })
    .catch(() => {});

export const saveFoodCount = (record: FoodCountRecord) =>
  loadRecords<FoodCountRecord>(FOOD_KEY)
    .then((list) => {
      const idx = list.findIndex((r) => r.date === record.date);
      if (idx >= 0) list[idx] = record;
      else list.unshift(record);
      return AsyncStorage.setItem(FOOD_KEY, JSON.stringify(list.slice(0, 300))).catch(() => {});
    })
    .catch(() => {});

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export const lastNDayKeys = (n: number) => {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    );
  }
  return keys;
};
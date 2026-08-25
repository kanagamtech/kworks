import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { INDIA_HOLIDAYS, type Festival } from '../data/indiaHolidays';

export type { Festival };

const GOOGLE_FEED =
  'https://calendar.google.com/calendar/ical/en.indian%23holiday@group.v.calendar.google.com/public/basic.ics';

const PROXIES = [
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://test.cors.workers.dev/?${u}`,
  (u: string) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
];

const CACHE_KEY = 'kworks_google_holidays_v2';
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

const EMOJI_FOR: Record<string, string> = {
  'New Year': '🎉',
  Pongal: '🪔',
  'Mattu Pongal': '🐄',
  'Kaanum Pongal': '🪁',
  'Republic Day': '🇮🇳',
  "Valentine's Day": '💝',
  'Maha Shivaratri': '🔱',
  Holi: '🎨',
  "Women's Day": '🌷',
  'Eid al-Fitr': '🌙',
  "April Fools' Day": '😜',
  'Good Friday': '✝️',
  Easter: '🐣',
  'Tamil New Year': '🎊',
  'May Day': '🛠️',
  "Mother's Day": '👩',
  'Eid al-Adha': '🐑',
  "Father's Day": '👨',
  'Friendship Day': '🤝',
  'Independence Day': '🇮🇳',
  Onam: '🎋',
  'Raksha Bandhan': '🪢',
  Janmashtami: '🦚',
  "Teachers' Day": '📚',
  'Ganesh Chaturthi': '🐘',
  'Gandhi Jayanti': '🕊️',
  Navaratri: '🎭',
  Dussehra: '🏹',
  Halloween: '🎃',
  Diwali: '🪔',
  "Children's Day": '🧒',
  'Karthigai Deepam': '🏮',
  Christmas: '🎄',
  "New Year's Eve": '🎆',
  'Mahatma Gandhi Jayanti': '🕊️',
  Ramzan: '🌙',
  'Ramadan': '🌙',
  'Bakr Id': '🐑',
  Muharram: '🌙',
  'Milad un-Nabi': '🌙',
  'Guru Nanak Jayanti': '🙏',
  'Gurpurab': '🙏',
};

function parseICS(text: string): Record<string, Festival> {
  const out: Record<string, Festival> = {};
  const blocks = text.split('BEGIN:VEVENT').slice(1);
  for (const block of blocks) {
    const dt = block.match(/DTSTART(?:;VALUE=DATE)?:(\d{8})/);
    const sum = block.match(/^SUMMARY:(.*)$/m);
    if (dt && sum) {
      const d = dt[1];
      const key = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
      const name = sum[1].replace(/\\,/g, ',').trim();
      if (name && key >= '2026-01-01') out[key] = { name, emoji: EMOJI_FOR[name] ?? '🎉' };
    }
  }
  return out;
}

export function useHolidays() {
  const [holidays, setHolidays] = useState<Record<string, Festival>>(INDIA_HOLIDAYS);

  useEffect(() => {
    let cancelled = false;

    if (Platform.OS === 'web') {
      return () => {
        cancelled = true;
      };
    }

    const tryFetch = async (url: string): Promise<string> => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    };

    const fetchText = async (): Promise<string> => {
      try {
        return await tryFetch(GOOGLE_FEED);
      } catch {}
      for (const proxy of PROXIES) {
        try {
          return await tryFetch(proxy(GOOGLE_FEED));
        } catch {}
      }
      throw new Error('all holiday sources failed');
    };

    const mergeEmoji = (parsed: Record<string, Festival>): Record<string, Festival> => {
      const out: Record<string, Festival> = {};
      Object.keys(parsed).forEach((k) => {
        out[k] = { ...parsed[k], emoji: EMOJI_FOR[parsed[k].name] ?? parsed[k].emoji ?? '🎉' };
      });
      return out;
    };

    const fetchHolidays = () => {
      fetchText()
        .then((text) => {
          const parsed = mergeEmoji(parseICS(text));
          if (!cancelled && Object.keys(parsed).length > 0) {
            setHolidays((prev) => ({ ...prev, ...parsed }));
            AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: parsed })).catch(() => {});
          }
        })
        .catch(() => {});
    };

    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => {
        if (!raw) {
          fetchHolidays();
          return;
        }
        try {
          const cached = JSON.parse(raw);
          if (Date.now() - (cached?.ts ?? 0) < TTL_MS && cached?.data && Object.keys(cached.data).length > 0) {
            setHolidays((prev) => ({ ...prev, ...cached.data }));
            return;
          }
        } catch {}
        fetchHolidays();
      })
      .catch(() => fetchHolidays());

    return () => {
      cancelled = true;
    };
  }, []);

  return holidays;
}
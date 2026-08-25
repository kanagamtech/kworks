import { useEffect, useRef } from 'react';
import { Alert, Animated, Easing, Image, Platform, Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import Text from '../components/AppText';
import MorningBackground from '../components/MorningBackground';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../theme';
import type { UserProfile } from '../types';

const useNativeDriver = Platform.OS !== 'web';

const BRAND = {
  primary: '#D7AB6A',
  primaryLight: '#D7AB6A',
  primaryDark: '#31122B',
  bgMain: '#31122B',
  text: '#FFFFFF',
  textDim: '#CBAF8C',
};

const MENU_ITEMS = [
  { id: 'attendance', label: 'ATTENDANCE', icon: require('../assets/images/icon-attendance.png'), theme: 'blue' },
  { id: 'leave', label: 'LEAVE MANAGEMENT', icon: require('../assets/images/icon-leave.png'), theme: 'green' },
  { id: 'notification', label: 'NOTIFICATION', icon: require('../assets/images/icon-notification.png'), theme: 'blue' },
  { id: 'support', label: 'SUPPORT', icon: require('../assets/images/icon-support.png'), theme: 'green' },
  { id: 'claims', label: 'CLAIMS & ADVANCES', icon: require('../assets/images/icon-support.png'), theme: 'blue' },
  { id: 'chat', label: 'COMPANY CHAT', icon: require('../assets/images/icon-notification.png'), theme: 'green' },
];

type Props = {
  user: UserProfile | null;
  onLoginPress: () => void;
  onOpenAttendance: () => void;
  onOpenLeave: () => void;
  onOpenNotifications: () => void;
  onOpenSupport: () => void;
  onOpenClaims: () => void;
  onOpenChat: () => void;
};

export default function HomeScreen({ user, onLoginPress, onOpenAttendance, onOpenLeave, onOpenNotifications, onOpenSupport, onOpenClaims, onOpenChat }: Props) {
  const { theme, mode, toggleTheme } = useTheme();
  const { kind, columns, contentMaxWidth, cardAspect, scale } = useResponsive();
  const gridOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(gridOpacity, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver,
    }).start();
  }, [gridOpacity]);

  const isMobile = kind === 'mobile';
  const cardWidth = 100 / columns - 2.5;
  const cardStyle: ViewStyle = {
    width: `${cardWidth}%`,
    flexShrink: 0,
    aspectRatio: isMobile ? 1.02 : cardAspect,
  };

  const rows: typeof MENU_ITEMS[] = [];
  for (let i = 0; i < MENU_ITEMS.length; i += columns) {
    rows.push(MENU_ITEMS.slice(i, i + columns));
  }

  const handleCardPress = (id: string) => {
    if (id === 'attendance') {
      onOpenAttendance();
    } else if (id === 'leave') {
      onOpenLeave();
    } else if (id === 'notification') {
      onOpenNotifications();
    } else if (id === 'support') {
      onOpenSupport();
    } else if (id === 'claims') {
      onOpenClaims();
    } else if (id === 'chat') {
      onOpenChat();
    } else {
      Alert.alert('Coming Soon', `${MENU_ITEMS.find((i) => i.id === id)?.label} is under development.`);
    }
  };

  return (
    <View style={styles.root}>
      <MorningBackground />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.inner, { maxWidth: contentMaxWidth }]}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', gap: 8, position: 'absolute', left: 0, top: 0 }}>
              <Pressable style={[styles.themeBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={toggleTheme} hitSlop={10}>
                <Text style={[styles.themeIcon, { color: theme.primary }]}>{mode === 'dark' ? '☀' : '☾'}</Text>
              </Pressable>
            </View>
            <Image source={require('../assets/images/logo-kanagam.png')} style={{ width: 76 * scale, height: 76 * scale }} resizeMode="contain" />
            <Text style={[styles.headerTitle, { fontSize: 30 * scale, color: theme.primary }]}>KwOrKs</Text>
            <Text style={[styles.headerSub, { fontSize: 13 * scale, color: theme.textDim }]}>Work that moves forward</Text>
          </View>
          <Animated.View style={[styles.grid, isMobile && styles.gridFill, { opacity: gridOpacity }]}>
            {rows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.card, cardStyle, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => handleCardPress(item.id)}
                  >
                    <Image source={item.icon} style={[styles.cardIcon, { width: 72 * scale, height: 72 * scale }]} resizeMode="contain" />
                    <Text style={[styles.cardLabel, { fontSize: 12.5 * scale, color: theme.text }]}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </Animated.View>

          <Pressable style={[styles.loginBar, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={onLoginPress}>
            <View style={[styles.avatar, { backgroundColor: theme.cardFill, borderColor: theme.primary }]}>
              {user?.photoUri ? (
                <Image source={{ uri: user.photoUri }} style={styles.avatarImg} />
              ) : (
                <Text style={[styles.avatarText, { color: theme.primary }]}>{user ? user.name.trim()[0].toUpperCase() : 'U'}</Text>
              )}
            </View>
            <View style={styles.loginInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.loginName, { color: theme.text }]} numberOfLines={1}>
                  {user ? user.name : 'Employee User'}
                </Text>
                {user?.company ? (
                  <View style={{ backgroundColor: 'rgba(215,171,106,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ color: theme.primary, fontSize: 10.5, fontWeight: '700' }}>
                      {user.company}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.loginEmail, { color: theme.textDim }]} numberOfLines={1}>
                {user ? user.email : 'Tap to view profile & settings'}
              </Text>
            </View>
            <Text style={[styles.loginArrow, { color: theme.primary }]}>{'>'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  root: {
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
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  themeBtn: {
    position: 'absolute',
    top: -6,
    right: 0,
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeIcon: {
    fontSize: 20,
    fontWeight: '800',
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: 2,
    color: BRAND.primaryLight,
    marginTop: 8,
  },
  headerSub: {
    marginTop: 4,
    letterSpacing: 1,
    color: BRAND.textDim,
  },
  grid: {
    flexDirection: 'column',
  },
  gridFill: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginBottom: 16,
  },
  cardIcon: {
    marginBottom: 10,
  },
  cardLabel: {
    fontWeight: '700',
    letterSpacing: 0.8,
    color: BRAND.text,
    textAlign: 'center',
  },
  loginBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BRAND.bgMain,
    borderWidth: 2,
    borderColor: '#D7AB6A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: BRAND.primary,
  },
  loginInfo: {
    flex: 1,
    marginLeft: 12,
  },
  loginName: {
    color: BRAND.text,
    fontSize: 16,
    fontWeight: '700',
  },
  loginEmail: {
    color: BRAND.textDim,
    fontSize: 12.5,
    marginTop: 2,
  },
  loginArrow: {
    color: '#D7AB6A',
    fontSize: 22,
    fontWeight: '800',
    marginLeft: 8,
  },
});
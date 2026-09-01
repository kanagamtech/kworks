import React, { useEffect, useRef, memo } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

const STEP_MS = 1000;

type FloatDot = {
  x: number;
  y: number;
  size: number;
  alpha: number;
  drift: number;
};

const DOTS: FloatDot[] = Array.from({ length: 14 }, (_, n) => ({
  x: ((n * 47 + 13) % 100) / 100,
  y: ((n * 83 + 29) % 100) / 100,
  size: 2 + ((n * 7) % 4),
  alpha: 0.16 + (((n * 11) % 100) / 100) * 0.18,
  drift: 10 + ((n * 13) % 22),
}));

function MorningBackground() {
  const { theme } = useTheme();
  const bgColors = theme.bgColors;
  const dims = useWindowDimensions();
  const width = dims.width;
  // On mobile web, virtual keyboard shrinks viewport height. Use screen height or max height to prevent layout jumps:
  const height = Platform.OS === 'web' && typeof window !== 'undefined' && window.screen?.height
    ? Math.max(dims.height, window.screen.height)
    : dims.height;
  const progress = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const build = (from: number, to: number) =>
      Animated.timing(progress, {
        toValue: to,
        duration: STEP_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      });
    const forward = bgColors.slice(0, bgColors.length - 1).map((_, i) => build(i, i + 1));
    const backward = bgColors.slice(1).reverse().map((_, i) => build(bgColors.length - 1 - i, bgColors.length - 2 - i));
    const colorLoop = Animated.loop(Animated.sequence([...forward, ...backward]));

    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );

    colorLoop.start();
    bob.start();
    return () => {
      colorLoop.stop();
      bob.stop();
    };
  }, [progress, float, bgColors]);

  const backgroundColor = progress.interpolate({
    inputRange: bgColors.map((_, i) => i),
    outputRange: bgColors,
  });

  const glowSize = Math.min(width * 0.9, 640);

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor }]} />
      <LinearGradient
        colors={theme.overlay as [string, string, ...string[]]}
        locations={[0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: theme.glow,
            left: -glowSize * 0.35,
            top: -glowSize * 0.4,
            transform: [
              { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, 26] }) },
              { translateX: float.interpolate({ inputRange: [0, 1], outputRange: [0, 18] }) },
            ],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: theme.darkGlow,
            right: -glowSize * 0.4,
            bottom: -glowSize * 0.45,
            transform: [
              { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -22] }) },
              { translateX: float.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }) },
            ],
          },
        ]}
      />
      {DOTS.map((d, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={[
            styles.dot,
            {
              width: d.size,
              height: d.size,
              borderRadius: d.size / 2,
              backgroundColor: theme.dotColor(d.alpha),
              left: d.x * width,
              top: d.y * height,
              transform: [
                {
                  translateY: float.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, d.drift * (i % 2 === 0 ? 1 : -1)],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

export default memo(MorningBackground);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
  },
  dot: {
    position: 'absolute',
  },
});
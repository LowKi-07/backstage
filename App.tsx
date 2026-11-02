// Per-weight imports so only the five font files in use are bundled.
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Logo } from './src/components/icons';
import { RoleNavigator } from './src/navigation/RoleNavigator';
import { LoginScreen } from './src/screens/LoginScreen';
import { StoreProvider, useStore } from './src/store/Store';
import { colors } from './src/theme';

// Keep the native splash up until the JS splash (same black + logo) has painted, so there's no flash.
SplashScreen.preventAutoHideAsync().catch(() => {});

const MIN_SPLASH_MS = 1400;
// Matches the native splash image and app icon (white mark on black).
const SPLASH_BG = '#000000';

function Root() {
  const { ready, currentUser } = useStore();
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const [minElapsed, setMinElapsed] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const logoIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    Animated.timing(logoIn, { toValue: 1, duration: 600, useNativeDriver: Platform.OS !== 'web' }).start();
    return () => clearTimeout(t);
  }, [logoIn]);

  const appReady = ready && (fontsLoaded || !!fontError);

  // The splash runs once per launch: when everything is loaded it fades out and never comes back.
  useEffect(() => {
    if (!appReady || !minElapsed || splashDone) return;
    Animated.timing(fade, { toValue: 0, duration: 350, useNativeDriver: Platform.OS !== 'web' }).start(() => setSplashDone(true));
  }, [appReady, minElapsed, splashDone, fade]);

  return (
    <View style={{ flex: 1, backgroundColor: splashDone ? colors.bg : SPLASH_BG }}>
      {appReady ? currentUser ? <RoleNavigator /> : <LoginScreen /> : null}
      {!splashDone ? (
        <Animated.View style={[StyleSheet.absoluteFill, styles.splash, { opacity: fade }]} onLayout={() => SplashScreen.hideAsync().catch(() => {})}>
          <Animated.View style={{ opacity: logoIn, transform: [{ scale: logoIn.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }}>
            <Logo size={112} color={colors.onInk} />
          </Animated.View>
        </Animated.View>
      ) : null}
      <StatusBar style={splashDone ? 'dark' : 'light'} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        {/* On web, keep the layout phone-sized so it previews like the mobile app. */}
        <View style={styles.outer}>
          <View style={styles.device}>
            <Root />
          </View>
        </View>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Platform.OS === 'web' ? '#EDEDED' : colors.bg, alignItems: 'center' },
  device: { flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 440 : undefined, overflow: 'hidden', backgroundColor: colors.bg },
  splash: { backgroundColor: SPLASH_BG, alignItems: 'center', justifyContent: 'center' },
});

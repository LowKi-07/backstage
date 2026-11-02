import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { Urbanist_400Regular, Urbanist_500Medium, Urbanist_600SemiBold, Urbanist_700Bold, useFonts } from '@expo-google-fonts/urbanist';
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

function Root() {
  const { ready, currentUser } = useStore();
  const [fontsLoaded, fontError] = useFonts({
    Urbanist_400Regular,
    Urbanist_500Medium,
    Urbanist_600SemiBold,
    Urbanist_700Bold,
    DMSerifDisplay_400Regular,
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
    <View style={{ flex: 1, backgroundColor: splashDone ? colors.bg : colors.nav }}>
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
  splash: { backgroundColor: colors.nav, alignItems: 'center', justifyContent: 'center' },
});

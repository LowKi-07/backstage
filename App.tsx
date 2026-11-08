// Per-weight imports so only the font files in use are bundled.
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium';
import { IBMPlexMono_700Bold } from '@expo-google-fonts/ibm-plex-mono/700Bold';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RoleNavigator } from './src/navigation/RoleNavigator';
import { LoginScreen } from './src/screens/LoginScreen';
import { StoreProvider, useStore } from './src/store/Store';
import { colors } from './src/theme';

// Keep the native splash up only until the sign-in splash (poster collage) can paint.
SplashScreen.preventAutoHideAsync().catch(() => {});

function Root() {
  const { ready, currentUser } = useStore();
  useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    IBMPlexMono_500Medium,
    IBMPlexMono_700Bold,
  });
  // Don't hold the first paint for fonts or storage: the sign-in splash shows at once and the
  // brand font swaps in when it arrives. Only the signed-in app waits for saved data.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // The app always opens on the sign-in splash (LoginScreen); there's no separate logo screen.
  return (
    <View style={{ flex: 1, backgroundColor: currentUser ? colors.bg : '#000000' }}>
      {currentUser && ready ? <RoleNavigator /> : <LoginScreen />}
      <StatusBar style={currentUser ? 'dark' : 'light'} />
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
});

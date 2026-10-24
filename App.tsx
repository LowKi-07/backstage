import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RoleNavigator } from './src/navigation/RoleNavigator';
import { LoginScreen } from './src/screens/LoginScreen';
import { StoreProvider, useStore } from './src/store/Store';
import { colors } from './src/theme';

function Root() {
  const { ready, currentUser } = useStore();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.header }}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }
  return currentUser ? <RoleNavigator /> : <LoginScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="light" />
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
  outer: { flex: 1, backgroundColor: Platform.OS === 'web' ? '#2B2925' : colors.bg, alignItems: 'center' },
  device: { flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 440 : undefined, overflow: 'hidden' },
});

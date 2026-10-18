import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import Navigator from './src/navigation/Navigator';
import { colors } from './src/theme/colors';

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
  },
};

function Splash() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

function Root() {
  const { initializing } = useAuth();
  if (initializing) return <Splash />;
  return (
    <NavigationContainer theme={navTheme}>
      <Navigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});

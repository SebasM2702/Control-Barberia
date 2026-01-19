import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RefreshProvider, useRefresh } from '../utils/RefreshContext';

function InnerLayout() {
  const { session, sessionLoaded } = useRefresh();
  const router = useRouter();

  // Global listener for session loss
  useEffect(() => {
    if (!sessionLoaded) return;

    // If we lose session while inside the app (tabs), send to login
    if (!session?.uid || !session?.businessId) {
      // Small check to avoid interrupting the initial redirect in index.tsx
      // if we are already on login, this is a no-op
      // router.replace('/login');
    }
  }, [session, sessionLoaded]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile-missing" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RefreshProvider>
        <StatusBar style="dark" />
        <InnerLayout />
      </RefreshProvider>
    </GestureHandlerRootView>
  );
}

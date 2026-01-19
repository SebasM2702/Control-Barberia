import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';

// Minimal redirect component — preserves the route but avoids leftover code
export default function EntradaScreen() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/negocio');
  }, [router]);
  return <Text style={{ display: 'none' }}>Redirigiendo a Negocio…</Text>;
}

// keep tab hidden
export const options = {
  tabBarButton: () => null,
};


import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';

// Salida removed — keep a lightweight redirect to /barberia to preserve routes
export default function SalidaScreen() {
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

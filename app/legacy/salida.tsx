import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';

// Legacy copy of salida moved out of (tabs)
export default function SalidaLegacy() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/barberia');
  }, [router]);
  return <Text>Redirigiendo a Barbería…</Text>;
}

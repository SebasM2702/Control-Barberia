import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';

// Legacy copy of entrada moved out of (tabs)
export default function EntradaLegacy() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/barberia');
  }, [router]);
  return <Text>Redirigiendo a Barbería…</Text>;
}

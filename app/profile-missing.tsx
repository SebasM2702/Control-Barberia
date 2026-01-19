import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { Button } from '../components/ui/Button';
import { signOut } from '../utils/auth';
import { useRouter } from 'expo-router';

export default function ProfileMissingScreen() {
  const router = useRouter();

  const onContact = () => {
    const email = 'admin@control-negocio.example';
    Linking.openURL(`mailto:${email}?subject=Acceso%20Control%20Negocio`);
  };

  const onLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil no encontrado</Text>
      <Text style={styles.message}>
        No pudimos encontrar tu perfil en la base de datos. Si crees que esto es un error, contacta
        al administrador para que te asigne un negocio.
      </Text>

      <View style={styles.actions}>
        <Button onPress={onContact} variant="outline" style={{ flex: 1 }}>
          Contactar al administrador
        </Button>
        <Button onPress={onLogout} style={{ flex: 1 }}>
          Cerrar sesión
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12, color: '#0f172a' },
  message: { color: '#64748b', fontSize: 16, marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 8 },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { signIn } from '../utils/auth';
import { useRefresh } from '../utils/RefreshContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setLoading, showToast, setSession } = useRefresh();
  const router = useRouter();

  const onSubmit = async () => {
    try {
      setLoading(true);
      const result = await signIn(email.trim(), password);
      setSession({ uid: result.uid, ...result.profile });
      showToast('Inicio de sesión correcto', 'success');
      // navigate to main tab (negocio)
      router.replace('/negocio');
    } catch (err: any) {
      const msg = err?.message || 'Error al iniciar sesión';
      // If profile not found, redirect to friendly screen
      if (err?.code === 'PROFILE_NOT_FOUND') {
        router.replace('/profile-missing');
        return;
      }
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.box}>
        <Text style={styles.title}>Control Financiero</Text>
        <Text style={styles.subtitle}>Inicia sesión con tu cuenta</Text>

        <Input value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
        <Input value={password} onChangeText={setPassword} placeholder="Contraseña" secureTextEntry />

        <Button onPress={onSubmit} style={styles.button}>
          Entrar
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#f8fafc' },
  box: { padding: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  subtitle: { color: '#64748b', marginBottom: 16 },
  button: { marginTop: 12 },
});

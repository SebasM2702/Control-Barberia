import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Mail, Lock, TrendingUp, Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRefresh } from '../utils/RefreshContext';
import { useRouter } from 'expo-router';
import { signIn, sendPasswordReset } from '../utils/auth';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);

  const { setLoading, showToast, setSession } = useRefresh();
  const router = useRouter();

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showToast('Por favor, ingresa tu email para restablecer la contraseña', 'error');
      return;
    }

    try {
      setLoading(true);
      await sendPasswordReset(email.trim());
      showToast('Se ha enviado un correo para restablecer tu contraseña. Revisa también tu carpeta de spam.', 'success');
    } catch (err: any) {
      showToast('Error al enviar el correo de recuperación', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    try {
      setLoading(true);
      const result = await signIn(email.trim(), password);
      setSession({ uid: result.uid, ...result.profile });
      showToast('Inicio de sesión correcto', 'success');
      router.replace('/negocio');
    } catch (err: any) {
      const msg = err?.message || 'Error al iniciar sesión';
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
    <LinearGradient
      colors={['#f8fafc', '#eff6ff', '#ecfdf5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.innerContainer}>
          {/* Logo y encabezado */}
          <View style={styles.header}>
            <LinearGradient
              colors={['#2563eb', '#10b981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoContainer}
            >
              <TrendingUp size={32} color="white" strokeWidth={2.5} />
            </LinearGradient>
            <Text style={styles.title}>Control Financiero</Text>
            <Text style={styles.subtitle}>Inicia sesión con tu cuenta</Text>
          </View>

          {/* Tarjeta de login */}
          <View style={styles.card}>
            <View style={styles.form}>
              {/* Campo de Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.iconContainer}>
                    <Mail
                      size={20}
                      color={isFocusedEmail ? '#2563eb' : '#94a3b8'}
                    />
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      isFocusedEmail && styles.inputFocused
                    ]}
                    placeholder="tu@email.com"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setIsFocusedEmail(true)}
                    onBlur={() => setIsFocusedEmail(false)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Campo de Contraseña */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.iconContainer}>
                    <Lock
                      size={20}
                      color={isFocusedPassword ? '#2563eb' : '#94a3b8'}
                    />
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      styles.inputWithToggle,
                      isFocusedPassword && styles.inputFocused
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setIsFocusedPassword(true)}
                    onBlur={() => setIsFocusedPassword(false)}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#94a3b8" />
                    ) : (
                      <Eye size={20} color="#94a3b8" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Enlace de recuperación */}
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>

              {/* Botón de login */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onSubmit}
              >
                <LinearGradient
                  colors={['#2563eb', '#10b981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>Entrar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingLeft: 48,
    paddingRight: 16,
    fontSize: 16,
    color: '#1e293b',
  },
  inputWithToggle: {
    paddingRight: 48,
  },
  inputFocused: {
    borderColor: '#2563eb',
    backgroundColor: '#ffffff',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  toggleButton: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  separatorText: {
    marginHorizontal: 16,
    color: '#64748b',
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  socialIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    color: '#64748b',
    fontSize: 14,
  },
  registerText: {
    color: '#2563eb',
    fontWeight: '600',
  },
});

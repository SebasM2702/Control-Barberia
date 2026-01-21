import React from 'react';
import { View, Text, StyleSheet, Linking, Platform } from 'react-native';
import { UserX, Mail, LogOut, ShieldAlert } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { signOut } from '../utils/auth';
import { useRouter } from 'expo-router';

export default function ProfileMissingScreen() {
  const router = useRouter();

  const onContact = () => {
    const email = 'sebastianlmoreno02@gmail.com'; // Updated with dev email found in config
    Linking.openURL(`mailto:${email}?subject=Acceso%20Control%20Barberia`);
  };

  const onLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <LinearGradient colors={['#f8fafc', '#fef2f2', '#fff1f2']} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <UserX size={48} color="#ef4444" strokeWidth={1.5} />
          </View>
          <View style={styles.statusBadge}>
            <ShieldAlert size={14} color="#fff" strokeWidth={3} />
            <Text style={styles.statusBadgeText}>Acceso Restringido</Text>
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Perfil no encontrado</Text>
          <Text style={styles.message}>
            No pudimos encontrar tu perfil en nuestra base de datos. Es posible que tu cuenta aún no esté vinculada a un negocio activo.
          </Text>
        </View>

        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <Text style={styles.infoTitle}>¿Qué puedes hacer?</Text>
            <Text style={styles.infoText}>
              Contacta a soporte técnico para que verifiquen tu información y te asignen los permisos necesarios.
            </Text>

            <View style={styles.actions}>
              <Button onPress={onContact} variant="outline" style={styles.contactBtn}>
                <Mail size={18} color="#1e293b" style={{ marginRight: 8 }} />
                Contactar Soporte
              </Button>
            </View>
          </CardContent>
        </Card>

        <TouchableOpacity
          onPress={onLogout}
          style={styles.logoutLink}
          activeOpacity={0.7}
        >
          <LogOut size={18} color="#ef4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Volver al Inicio / Salir</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

import { TouchableOpacity } from 'react-native-gesture-handler';

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24, alignItems: 'center' },

  iconContainer: { marginBottom: 32, alignItems: 'center' },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: -16,
    gap: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  statusBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

  textContainer: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: '#1e293b', marginBottom: 12, textAlign: 'center' },
  message: { color: '#64748b', fontSize: 16, textAlign: 'center', lineHeight: 24, paddingHorizontal: 12 },

  card: { width: '100%', marginBottom: 32 },
  cardContent: { padding: 8 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: 20 },

  actions: { width: '100%' },
  contactBtn: { height: 52, flexDirection: 'row' },

  logoutLink: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
});

import React, { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRefresh } from '../../utils/RefreshContext';
import { getStoredSession, loadUserProfile } from '../../utils/auth';

export default function TabLayout() {
  const { refresh, showToast, refreshKey, session } = useRefresh();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

  // Load user name for header
  useEffect(() => {
    if (session?.name) {
      setUserName(session.name);
    } else if (session?.uid) {
      loadUserProfile(session.uid).then(profile => {
        if (profile?.name) setUserName(profile.name);
      });
    }
  }, [session]);

  return (
    <Tabs
      // Use a custom tabBar to render exactly the four desired tabs
      tabBar={(props: any) => <CustomTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#e2e8f0',
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '700',
          color: '#0f172a',
        },
        headerTitle: () => (
          <View style={styles.headerTitle}>
            <Ionicons name="business" size={24} color="#0f172a" />
            <Text style={styles.headerTitleText}>{userName || 'Control Financiero'}</Text>
          </View>
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={() => {
              refresh();
              showToast('Actualizando...', 'info');
            }}
            style={styles.headerRefresh}
          >
            <Ionicons name="refresh" size={20} color="#0f172a" />
          </TouchableOpacity>
        ),
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#0f172a',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        // Hide any tabs named 'entrada' or 'salida'
        tabBarButton: route.name === 'entrada' || route.name === 'salida' ? () => null : undefined,
      })}
    >
      <Tabs.Screen
        name="negocio"
        options={{
          title: 'Negocio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="personal"
        options={{
          title: 'Personal',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="resultados"
        options={{
          title: 'Resultados',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="config-negocio"
        options={{
          title: 'Configuración',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const desired = [
    { name: 'negocio', label: 'Negocio', icon: 'business' },
    { name: 'personal', label: 'Personal', icon: 'people' },
    { name: 'resultados', label: 'Resultados', icon: 'bar-chart' },
    { name: 'config-negocio', label: 'Configuración', icon: 'settings' },
  ];

  return (
    <View style={styles.customBar}>
      {desired.map((d) => {
        const isFocused = state?.routes?.[state.index]?.name === d.name;
        return (
          <TouchableOpacity
            key={d.name}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={() => navigation.navigate(d.name)}
            style={styles.customTab}
          >
            <Ionicons name={d.icon as any} size={22} color={isFocused ? '#0f172a' : '#94a3b8'} />
            <Text style={[styles.customLabel, isFocused && { color: '#0f172a' }]}>{d.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerRefresh: {
    marginRight: 12,
    padding: 6,
  },
  customBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 65,
    paddingBottom: 8,
    paddingTop: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  customTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 4,
  },
});

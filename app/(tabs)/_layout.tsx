import React, { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import {
  Building2,
  User,
  PieChart,
  Settings,
  RotateCw,
  Wallet,
  LayoutDashboard,
  BarChart3
} from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRefresh } from '../../utils/RefreshContext';
import { loadUserProfile } from '../../utils/auth';

export default function TabLayout() {
  const { refresh, showToast, session } = useRefresh();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    if (session?.name) {
      setUserName(session.name);
    } else if (session?.uid) {
      loadUserProfile(session.uid).then(profile => {
        if (profile?.name) setUserName(profile.name);
      });
    }
  }, [session]);

  const getScreenTheme = (routeName: string) => {
    switch (routeName) {
      case 'negocio': return { color: '#2563eb', bg: '#eff6ff' };
      case 'personal': return { color: '#10b981', bg: '#ecfdf5' };
      case 'resultados': return { color: '#9333ea', bg: '#f5f3ff' };
      case 'config-negocio': return { color: '#ea580c', bg: '#fff7ed' };
      default: return { color: '#2563eb', bg: '#eff6ff' };
    }
  };

  return (
    <Tabs
      tabBar={(props: any) => <CustomTabBar {...props} />}
      screenOptions={({ route }) => {
        const theme = getScreenTheme(route.name);
        return {
          headerStyle: {
            backgroundColor: '#ffffff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#f8fafc',
            height: Platform.OS === 'ios' ? 110 : 80,
          },
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: '800',
            color: '#1e293b',
          },
          headerTitle: () => (
            <View style={styles.headerTitleContainer}>
              <View style={[styles.headerIconBox, { backgroundColor: theme.color }]}>
                <BarChart3 size={16} color="#ffffff" strokeWidth={2.5} />
              </View>
              <Text style={styles.headerTitleText} numberOfLines={1}>{userName || 'Barbero Sebas'}</Text>
            </View>
          ),
          headerRight: () => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                refresh();
                showToast('Actualizando datos...', 'info');
              }}
              style={styles.headerRefresh}
            >
              <RotateCw size={18} color="#64748b" strokeWidth={2.5} />
            </TouchableOpacity>
          ),
          tabBarButton: route.name === 'entrada' || route.name === 'salida' ? () => null : undefined,
        };
      }}
    >
      <Tabs.Screen name="negocio" options={{ title: 'Negocio' }} />
      <Tabs.Screen name="personal" options={{ title: 'Personal' }} />
      <Tabs.Screen name="resultados" options={{ title: 'Resultados' }} />
      <Tabs.Screen name="config-negocio" options={{ title: 'Configuración' }} />
    </Tabs>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const desired = [
    { name: 'negocio', label: 'Negocio', Icon: LayoutDashboard, color: '#2563eb', bg: '#eff6ff' },
    { name: 'personal', label: 'Personal', Icon: User, color: '#10b981', bg: '#ecfdf5' },
    { name: 'resultados', label: 'Resultados', Icon: BarChart3, color: '#9333ea', bg: '#f5f3ff' },
    { name: 'config-negocio', label: 'Configuración', Icon: Settings, color: '#ea580c', bg: '#fff7ed' },
  ];

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.customBar}>
        {desired.map((d) => {
          const isFocused = state?.routes?.[state.index]?.name === d.name;
          return (
            <TouchableOpacity
              key={d.name}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={() => navigation.navigate(d.name)}
              style={[styles.customTab, isFocused && { backgroundColor: d.bg, borderRadius: 12 }]}
              activeOpacity={0.7}
            >
              <d.Icon
                size={20}
                color={isFocused ? d.color : '#94a3b8'}
                strokeWidth={isFocused ? 2.5 : 2}
              />
              <Text style={[styles.customLabel, isFocused && { color: d.color, fontWeight: '700' }]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  headerRefresh: {
    marginRight: 16,
    padding: 8,
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 70,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  customBar: {
    flexDirection: 'row',
    height: 50,
    alignItems: 'center',
  },
  customTab: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginHorizontal: 4,
  },
  customLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
  },
});

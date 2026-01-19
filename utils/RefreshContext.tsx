import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Animated, Text, View, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { getStoredSession } from './auth';

type ToastType = 'info' | 'success' | 'error';

type RefreshContextType = {
  refreshKey: number;
  refresh: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  session: { uid?: string; businessId?: string; role?: string; name?: string } | null;
  setSession: (s: any) => void;
  sessionLoaded: boolean;
};

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  // Load session on mount
  useEffect(() => {
    (async () => {
      try {
        let s = await getStoredSession();
        if (s.uid && !s.businessId) {
          const { loadUserProfile, saveSession } = await import('./auth');
          const profile = await loadUserProfile(s.uid);
          if (profile && profile.businessId) {
            s = { uid: s.uid!, ...profile };
            await saveSession(s.uid!, profile.businessId!, profile.role || '', profile.name || '');
          }
        }

        setSession(s);
      } catch (e) {
        console.error('[RefreshContext] Error loading session:', e);
      } finally {
        setSessionLoaded(true);
      }
    })();
  }, []);

  const refresh = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
    // Also re-check session on global refresh
    (async () => {
      const s = await getStoredSession();
      setSession(s);
    })();
  };

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');
  const toastAnim = useRef(new Animated.Value(0)).current;
  const hideTimeout = useRef<number | null>(null);

  const showToast = (message: string, type: ToastType = 'info', duration = 2500) => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current as any);
      hideTimeout.current = null;
    }
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    hideTimeout.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setToastVisible(false));
    }, duration) as unknown as number;
  };

  useEffect(() => {
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current as any);
    };
  }, []);

  return (
    <RefreshContext.Provider value={{ refreshKey, refresh, loading, setLoading, showToast, session, setSession, sessionLoaded }}>
      {children}

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#0f172a" />
        </View>
      )}

      {/* Toast */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toast,
            { transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }], opacity: toastAnim },
          ]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </RefreshContext.Provider>
  );
};

export const useRefresh = (): RefreshContextType => {
  const ctx = useContext(RefreshContext);
  if (!ctx) throw new Error('useRefresh must be used within a RefreshProvider');
  return ctx;
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    zIndex: 9999,
  },
  toast: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    maxWidth: width - 40,
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    zIndex: 10000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default RefreshContext;

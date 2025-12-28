import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Animated, Text, View, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';

type ToastType = 'info' | 'success' | 'error';

type RefreshContextType = {
  refreshKey: number;
  refresh: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  showToast: (message: string, type?: ToastType, duration?: number) => void;
};

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  };

  const [loading, setLoading] = useState(false);

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
    <RefreshContext.Provider value={{ refreshKey, refresh, loading, setLoading, showToast }}>
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

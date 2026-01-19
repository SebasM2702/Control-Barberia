import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useRefresh } from '../utils/RefreshContext';

export default function Index() {
    const { session, sessionLoaded } = useRefresh();
    const router = useRouter();

    useEffect(() => {
        if (!sessionLoaded) return;

        if (session?.uid && session?.businessId) {
            router.replace('/negocio');
        } else {
            router.replace('/login');
        }
    }, [session, sessionLoaded]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
            <ActivityIndicator size="large" color="#0f172a" />
        </View>
    );
}

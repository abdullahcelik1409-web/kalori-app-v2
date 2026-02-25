import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './lib/supabase';
import { colors } from './src/constants/colors';

// Ekranlar
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';

const Stack = createNativeStackNavigator();

/**
 * Uygulama bazlı hata yakalayıcı için fallback bileşeni.
 * ChatGPT'nin belirttiği geçersiz JSX hatalarını önlemek için View ve Text kullanır.
 */
function ErrorFallback({ error }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Bir hata oluştu:</Text>
      <Text style={styles.errorMessage}>{error?.message || 'Bilinmeyen hata'}</Text>
    </View>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    console.log("App mount edildi");
    let isMounted = true;

    async function checkSession() {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (isMounted) {
          setSession(currentSession);
          setLoading(false);
        }
      } catch (err) {
        console.error("Oturum kontrol hatası:", err);
        if (isMounted) {
          setHasError(true);
          setErrorMsg(err.message);
          setLoading(false);
        }
      }
    }

    checkSession();

    // Oturum değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log("Kimlik durumu değişti:", _event);
      if (isMounted) {
        setSession(newSession);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Hata durumunda boş dönmek yerine ErrorFallback göster
  if (hasError) {
    return <ErrorFallback error={{ message: errorMsg }} />;
  }

  // Yükleme sırasında görsel geri bildirim
  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
        <ActivityIndicator size="large" color={colors?.primary || '#10B981'} animating={!!loading} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            headerBackVisible: false,
            contentStyle: { backgroundColor: '#000000' },
            animation: 'slide_from_right'
          }}
        >
          {session && session.user ? (
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
          ) : (
            <Stack.Group>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </Stack.Group>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 10
  },
  errorMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center'
  },
  loadingText: {
    color: '#FFFFFF',
    marginBottom: 20,
    fontSize: 16
  }
});

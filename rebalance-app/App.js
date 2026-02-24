import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './lib/supabase';
import { colors } from './src/constants/colors';

// Screens
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';

const Stack = createNativeStackNavigator();

function ErrorFallback({ error }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'red' }}>Bir hata oluÅŸtu:</Text>
      <Text>{error.message}</Text>
    </View>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    console.log("App mounted");
    try {
      // Mevcut oturumu kontrol et
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log("Session checked", session);
        setSession(session);
        setLoading(false);
      }).catch(err => {
        console.error("Session error", err);
        setHasError(true);
        setErrorMsg(err.message);
        setLoading(false);
      });

      // Oturum deÄŸiÅŸikliklerini dinle
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log("Auth state changed", session);
        setSession(session);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } catch (err) {
      console.error("App useEffect error", err);
      setHasError(true);
      setErrorMsg(err.message);
    }
  }, []);

  if (hasError) {
    return <ErrorFallback error={{ message: errorMsg }} />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>YÃ¼kleniyor...</Text>
        <ActivityIndicator size="large" color={colors.primary || 'green'} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer fallback={<Text>Loading Nav...</Text>}>
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }}>
          {session && session.user ? (
            // Oturum aÃ§mÄ±ÅŸ kullanÄ±cÄ±lar iÃ§in ekranlar
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
          ) : (
            // Oturum aÃ§mamÄ±ÅŸ kullanÄ±cÄ±lar iÃ§in Auth ekranlarÄ±
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

import React, { useEffect, useState } from 'react';
import { SafeAreaView, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import PatientCardScreen from './screens/PatientCardScreen';

const Stack = createStackNavigator();

export default function App() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await SecureStore.getItemAsync('genidoc_token');
        if (t) setToken(t);
      } catch (e) {
        console.warn('SecureStore read error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={token ? 'Home' : 'Login'}
        screenOptions={{ headerShown: false }}
      >
        {token ? (
          <>
            <Stack.Screen name="Home">
              {(props) => (
                <HomeScreen
                  {...props}
                  token={token}
                  onLogout={async () => {
                    await SecureStore.deleteItemAsync('genidoc_token');
                    setToken(null);
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="PatientCard" component={PatientCardScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login">
              {(props) => (
                <LoginScreen
                  {...props}
                  onLoginSuccess={async (t) => {
                    await SecureStore.setItemAsync('genidoc_token', t);
                    setToken(t);
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

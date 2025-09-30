// App.js
import 'react-native-gesture-handler';               // ← PRIMERO
import 'react-native-reanimated';                    // ← antes de cualquier uso de Reanimated
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Provider } from 'react-redux';

import store from './src/store';
import MainNavigator from './src/navigation/MainNavigator';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [loaded, error] = useFonts({
    'Karla-Regular': require('./assets/fonts/Karla-Regular.ttf'),
    'Karla-Bold': require('./assets/fonts/Karla-Bold.ttf'),
    'Karla-Italic': require('./assets/fonts/Karla-Italic.ttf'),
    'Karla-Light': require('./assets/fonts/Karla-Light.ttf'),
    'PressStart2P': require('./assets/fonts/PressStart2P-Regular.ttf'),
    'Mulidey': require('./assets/fonts/Mulidey.ttf'),
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.loadingContainer}>
          <Image source={require('./assets/logo.png')} style={styles.logo} />
          <StatusBar style="light" />
        </View>
      </GestureHandlerRootView>
    );
  }

  console.log('AUTH_URL', process.env.EXPO_PUBLIC_AUTH_BASE_URL);
  console.log('API_KEY', (process.env.EXPO_PUBLIC_API_KEY || '').slice(0, 8));
  console.log('RTDB_URL', process.env.EXPO_PUBLIC_BASE_RTDB_URL);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <View style={styles.appContainer}>
          <StatusBar style="light" />
          <MainNavigator />
        </View>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 220,
    height: 220,
    resizeMode: 'contain',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
});

import React from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CartProvider } from './context/CartContext';
import { SettingsProvider } from './context/SettingsContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import ToastHost from './components/ui/ToastHost';
import { Router } from './routes/Router';
import { store } from './redux/store';

const ThemedStatusBar = () => {
  const { isDark, colors } = useTheme();

  return (
    <StatusBar
      barStyle={isDark ? 'light-content' : 'dark-content'}
      backgroundColor={colors.background}
    />
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SettingsProvider>
            <CartProvider>
              <ThemedStatusBar />
              <Router />
              <ToastHost />
            </CartProvider>
          </SettingsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
};

export default App;
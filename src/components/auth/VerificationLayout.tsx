import React, { PropsWithChildren, useEffect } from 'react';
import {
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing } from '../../theme';

type Props = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

/**
 * Shared chrome for the email / phone / OTP screens (matches Login/Signup).
 * These screens are NOT inside a navigator, so Android Back closes the
 * keyboard first (like useKeyboardBackHandler) without any navigation hooks.
 */
const VerificationLayout = ({ title, subtitle, children }: Props) => {
  const { colors } = useTheme();

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (Keyboard.isVisible()) {
        Keyboard.dismiss();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          </View>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VerificationLayout;

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: { marginBottom: spacing.lg },
  title: { fontSize: 28, fontWeight: '800', marginBottom: spacing.xs },
  subtitle: { fontSize: 15, lineHeight: 22 },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
  },
});

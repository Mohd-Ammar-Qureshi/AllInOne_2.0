import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '../../assets/images';
import SettingsRow from '../../components/settings/SettingsRow';
import SettingsSection from '../../components/settings/SettingsSection';
import AppHeader from '../../components/ui/AppHeader';
import Illustration from '../../components/ui/Illustration';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme';
import { SettingsStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Security'>;

const SecurityScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <AppHeader
            title="Security"
            subtitle="Keep your account safe"
            onBack={() => navigation.goBack()}
          />

          <Illustration
            source={images.changePasswordIllustration}
            maxWidth={220}
            style={styles.illustration}
          />

          <SettingsSection title="Sign-in security">
            <SettingsRow
              icon="lock"
              title="Change password"
              subtitle="Update the password for your account"
              onPress={() => navigation.navigate('ChangePassword')}
            />
            <SettingsRow
              icon="email"
              title="Change email"
              subtitle="Update and verify your email address"
              onPress={() => navigation.navigate('ChangeEmail')}
            />
          </SettingsSection>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SecurityScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xxl },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  illustration: { marginBottom: spacing.lg },
});

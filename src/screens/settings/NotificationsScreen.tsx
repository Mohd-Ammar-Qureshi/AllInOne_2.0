import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppwrite } from '../../appwrite/AppwriteContext';
import SettingsSection from '../../components/settings/SettingsSection';
import AppHeader from '../../components/ui/AppHeader';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { getNotificationOptions } from '../../settings/settingsConfig';
import { radius, spacing } from '../../theme';
import { SettingsStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Notifications'>;

const NotificationsScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { role } = useAppwrite();
  const { isNotificationEnabled, setNotificationEnabled } = useSettings();

  const options = getNotificationOptions(role);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <AppHeader
            title="Notifications"
            subtitle="Choose what you want to hear about"
            onBack={() => navigation.goBack()}
          />

          <View
            style={[
              styles.banner,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}>
            <MaterialIcons name="info" size={20} color={colors.primary} />
            <Text style={[styles.bannerText, { color: colors.textSecondary }]}>
              These choices only control push alerts, which arrive once a
              later update adds them. Your in-app notifications — order
              status updates and more — are always on and available from the
              bell icon on your Home screen.
            </Text>
          </View>

          <SettingsSection title="Alerts">
            {options.map(option => {
              const enabled = isNotificationEnabled(
                option.id,
                option.defaultEnabled,
              );

              return (
                <View key={option.id} style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={[styles.rowTitle, { color: colors.text }]}>
                      {option.title}
                    </Text>
                    <Text
                      style={[
                        styles.rowDescription,
                        { color: colors.textSecondary },
                      ]}>
                      {option.description}
                    </Text>
                  </View>
                  <Switch
                    value={enabled}
                    onValueChange={value =>
                      setNotificationEnabled(option.id, value)
                    }
                    accessibilityLabel={option.title}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              );
            })}
          </SettingsSection>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  banner: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowDescription: { fontSize: 13, marginTop: 2, lineHeight: 18 },
});
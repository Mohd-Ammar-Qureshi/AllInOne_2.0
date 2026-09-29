import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/ui/AppHeader';
import { LEGAL_DOCUMENTS } from '../../content/legal';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme';
import { SettingsStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<
  SettingsStackParamList,
  'Terms' | 'Privacy'
>;

/**
 * One screen renders both legal documents. The route name ('Terms' or
 * 'Privacy') decides which text from content/legal.ts is shown.
 */
const LegalScreen = ({ navigation, route }: Props) => {
  const { colors } = useTheme();
  const document =
    route.name === 'Terms' ? LEGAL_DOCUMENTS.terms : LEGAL_DOCUMENTS.privacy;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <AppHeader
            title={document.title}
            subtitle={document.updated}
            onBack={() => navigation.goBack()}
          />

          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            {document.intro}
          </Text>

          {document.sections.map(section => (
            <View key={section.heading} style={styles.section}>
              <Text style={[styles.heading, { color: colors.text }]}>
                {section.heading}
              </Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                {section.body}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LegalScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  intro: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  heading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
  },
});
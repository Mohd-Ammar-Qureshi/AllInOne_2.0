import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, shadows } from '../../theme';

type Badge = {
  label: string;
  tone: 'primary' | 'success' | 'warning';
};

type ProfileSummaryCardProps = {
  name: string;
  email: string;
  badges: Badge[];
  onPress: () => void;
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
};

const ProfileSummaryCard = ({
  name,
  email,
  badges,
  onPress,
}: ProfileSummaryCardProps) => {
  const { colors } = useTheme();

  const tonePalette = (tone: Badge['tone']) =>
    tone === 'success'
      ? { bg: colors.successSoft, fg: colors.successText }
      : tone === 'warning'
        ? { bg: colors.warningSoft, fg: colors.warningText }
        : { bg: colors.infoSoft, fg: colors.infoText };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open profile"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.divider,
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
        <Text style={[styles.initials, { color: colors.primary }]}>
          {getInitials(name)}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {name || 'Your profile'}
        </Text>
        {email ? (
          <Text
            style={[styles.email, { color: colors.textSecondary }]}
            numberOfLines={1}>
            {email}
          </Text>
        ) : null}
        <View style={styles.badges}>
          {badges.map(badge => (
            <View
              key={badge.label}
              style={[
                styles.badge,
                { backgroundColor: tonePalette(badge.tone).bg },
              ]}>
              <Text
                style={[
                  styles.badgeText,
                  { color: tonePalette(badge.tone).fg },
                ]}>
                {badge.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <MaterialIcons
        name="chevron-right"
        size={24}
        color={colors.textMuted}
      />
    </Pressable>
  );
};

export default ProfileSummaryCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.card,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 22,
    fontWeight: '800',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
  },
  email: {
    fontSize: 13,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
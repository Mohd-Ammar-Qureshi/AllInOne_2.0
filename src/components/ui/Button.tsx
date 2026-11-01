import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, sizes, spacing } from '../../theme';
import { getReadableTextColor } from '../../utils/color';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';

type ButtonProps = {
  title: string;
  onPress: () => void;
  /**
   * primary: filled brand colour. secondary: soft blue tint with a blue label.
   * ghost: outlined. danger: filled red. link: text only.
   */
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}: ButtonProps) => {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
        ? colors.primaryTint
        : variant === 'danger'
          ? colors.error
          : 'transparent';

  const borderColor =
    variant === 'secondary'
      ? colors.borderStrong
      : variant === 'ghost'
        ? colors.border
        : variant === 'link'
          ? 'transparent'
          : backgroundColor;

  // Filled buttons pick white or dark text, whichever reads better on the
  // fill (the dark theme's light blue/red fail WCAG AA with white text).
  const textColor =
    variant === 'secondary' || variant === 'link'
      ? colors.primary
      : variant === 'ghost'
        ? colors.text
        : getReadableTextColor(backgroundColor);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={variant === 'link' ? 8 : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        size === 'sm' ? styles.small : styles.medium,
        variant === 'link' && styles.link,
        {
          backgroundColor,
          borderColor,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
          <Text
            numberOfLines={2}
            style={[
              styles.text,
              size === 'sm' && styles.textSmall,
              { color: textColor },
              textStyle,
            ]}>
            {title}
          </Text>
          {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
};

export default Button;

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  medium: { minHeight: sizes.controlHeight },
  small: { minHeight: sizes.controlHeightSmall, paddingHorizontal: spacing.md },
  link: {
    minHeight: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
    maxWidth: '100%',
  },
  iconLeft: { marginRight: spacing.sm, flexShrink: 0 },
  iconRight: { marginLeft: spacing.sm, flexShrink: 0 },
  text: { flexShrink: 1, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  textSmall: { fontSize: 14 },
});

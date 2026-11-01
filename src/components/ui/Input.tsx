import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useTheme } from '../../context/ThemeContext';
import { MAX_FONT_SCALE, radius, sizes, spacing } from '../../theme';
import { MaterialIconName } from './IconBadge';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  /** Icon shown inside the field, before the text. */
  leftIcon?: MaterialIconName;
};

/**
 * Text field: bordered box that turns blue on focus and red on error.
 * Password fields (secureTextEntry) get a show/hide eye automatically.
 * `style` is applied to the inner TextInput (e.g. multiline height).
 */
const Input = ({
  label,
  error,
  leftIcon,
  style,
  secureTextEntry,
  onFocus,
  onBlur,
  multiline,
  ...props
}: InputProps) => {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const isPassword = Boolean(secureTextEntry);

  const borderColor = error
    ? colors.error
    : focused
      ? colors.primary
      : colors.border;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.box,
          multiline && styles.boxMultiline,
          { backgroundColor: colors.surface, borderColor },
        ]}>
        {leftIcon ? (
          <MaterialIcons
            name={leftIcon}
            size={20}
            color={focused ? colors.primary : colors.textSecondary}
            style={styles.leftIcon}
          />
        ) : null}
        <TextInput
          accessibilityLabel={label ?? props.placeholder}
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.primary}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          multiline={multiline}
          secureTextEntry={isPassword && !visible}
          autoCapitalize={isPassword ? 'none' : props.autoCapitalize}
          onFocus={event => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={event => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, { color: colors.text }, style]}
          {...props}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            hitSlop={8}
            onPress={() => setVisible(value => !value)}
            style={styles.toggle}>
            <MaterialIcons
              name={visible ? 'visibility-off' : 'visibility'}
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.error, { color: colors.error }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.controlHeight,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  boxMultiline: { alignItems: 'flex-start' },
  leftIcon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    paddingVertical: spacing.sm,
    minHeight: sizes.minTouchTarget,
  },
  toggle: { paddingLeft: spacing.sm, justifyContent: 'center' },
  error: {
    marginTop: spacing.xs,
    fontSize: 13,
  },
});

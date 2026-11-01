import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useTheme } from '../../context/ThemeContext';
import { MAX_FONT_SCALE, radius, sizes, spacing } from '../../theme';

type Props = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  accessibilityLabel?: string;
};

/** Pill search field with a clear button. */
const SearchBar = ({
  placeholder,
  value,
  onChangeText,
  accessibilityLabel,
}: Props) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: colors.searchBackground, borderColor: colors.border },
      ]}>
      <MaterialIcons name="search" size={22} color={colors.textSecondary} />
      <TextInput
        accessibilityLabel={accessibilityLabel ?? placeholder}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.primary}
        value={value}
        onChangeText={onChangeText}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={[styles.input, { color: colors.text }]}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          onPress={() => onChangeText('')}>
          <MaterialIcons name="close" size={20} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizes.controlHeight,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.full,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    paddingVertical: spacing.sm,
  },
});

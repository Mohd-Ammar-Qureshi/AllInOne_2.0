import React from 'react';
import { StyleSheet, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';

export type MaterialIconName = React.ComponentProps<
  typeof MaterialIcons
>['name'];

type Props = {
  icon: MaterialIconName;
  /** Icon colour. */
  color: string;
  /** Circle background. */
  background: string;
  size?: number;
};

/** Icon on a soft coloured circle. Decorative - the label next to it speaks. */
const IconBadge = ({ icon, color, background, size = 40 }: Props) => (
  <View
    accessible={false}
    importantForAccessibility="no-hide-descendants"
    style={[
      styles.circle,
      { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
    ]}>
    <MaterialIcons name={icon} size={Math.round(size * 0.52)} color={color} />
  </View>
);

export default IconBadge;

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});

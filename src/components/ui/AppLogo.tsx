import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { images } from '../../assets/images';

type Props = {
  /** Width and height in dp. Matches the 40dp header icon buttons by default. */
  size?: number;
};

/**
 * AllInOne logo displayed without a separate background tile.
 */
const AppLogo = ({ size = 40 }: Props) => {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="AllInOne"
      style={[styles.container, { width: size, height: size }]}>
      <Image
        source={images.logo}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

export default AppLogo;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
});

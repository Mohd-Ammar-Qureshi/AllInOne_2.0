import { ImageSourcePropType } from 'react-native';

/**
 * Theme-adapted, size-optimised copies of the supplied artwork live in
 * ./themed (blue to match the app theme). The originals next to this file are
 * kept untouched as the source of truth.
 *
 * Only images that are actually shown are registered here, so unused artwork
 * is not bundled into the app. See ASSET_USAGE_REPORT.md for the unused ones
 * (forgot-password, payment-failed, social-login and payment-provider logos)
 * and how to add them later.
 */
export type ImageSlot =
  | 'logo'
  | 'healthLogo'
  | 'healthLogoDark'
  | 'loginHeroFade'
  | 'dashboardHero'
  | 'otpIllustration'
  | 'changePasswordIllustration'
  | 'successIllustration';

export const images: Record<ImageSlot, ImageSourcePropType> = {
  logo: require('./themed/logo.jpeg'),
  healthLogo: require('./themed/healthLogo.png'),
  healthLogoDark: require('./themed/healthLogoDark.png'),
  // Login photo with its left/bottom edges faded to transparent, so it dissolves
  // into the screen background in both light and dark mode.
  loginHeroFade: require('./themed/loginHeroFade.png'),
  dashboardHero: require('./themed/dashboardHero.jpg'),
  otpIllustration: require('./themed/otpIllustration.jpg'),
  changePasswordIllustration: require('./themed/changePasswordIllustration.jpg'),
  successIllustration: require('./themed/successIllustration.jpg'),
};

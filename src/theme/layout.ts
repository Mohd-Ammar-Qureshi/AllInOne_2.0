import { spacing } from './spacing';

/** Height of the bottom navigation bar, not counting the system inset. */
export const BOTTOM_NAV_HEIGHT = 64;

/**
 * How far above the bottom edge toasts (snackbars) are lifted, so they clear
 * the bottom navigation bar and the buttons above it, on every screen.
 */
export const TOAST_BOTTOM_OFFSET = BOTTOM_NAV_HEIGHT + spacing.sm;
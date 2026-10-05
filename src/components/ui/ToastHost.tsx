import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing } from '../../theme';
import {
  subscribeToToasts,
  ToastMessage,
  ToastType,
} from '../../utils/errorHandler';

// White text on these backgrounds meets WCAG AA (4.5:1) in light and dark mode.
const BACKGROUNDS: Record<ToastType, string> = {
  success: '#15803D',
  error: '#DC2626',
  warning: '#B45309',
  info: '#1D4ED8',
};

// A glyph as well as a colour, so the types are distinguishable without colour.
const GLYPHS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i',
};

const SLIDE_DISTANCE = 140;

/**
 * Renders messages from utils/errorHandler at the top of the screen, below the
 * status bar / notch. Mount it ONCE, as the last child of the app root, so it
 * floats above every screen (auth, verification gate, main app).
 *
 * It overlays rather than lays out, so it never pushes content, and it ignores
 * touches (pointerEvents="none"): headers, inputs and buttons under it stay
 * fully usable, and it dismisses itself after `duration`.
 */
const ToastHost = () => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const translateY = useRef(new Animated.Value(-SLIDE_DISTANCE)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visible = useRef(false);
  const currentId = useRef(0);

  const hide = useCallback(
    (id: number) => {
      if (currentId.current !== id) {
        return;
      }
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -SLIDE_DISTANCE,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished && currentId.current === id) {
          visible.current = false;
          setToast(null);
        }
      });
    },
    [opacity, translateY],
  );

  const show = useCallback(
    (next: ToastMessage) => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      currentId.current = next.id;
      setToast(next); // a newer message replaces the one on screen

      if (!visible.current) {
        visible.current = true;
        translateY.setValue(-SLIDE_DISTANCE);
        opacity.setValue(0);
      }
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      timer.current = setTimeout(() => hide(next.id), next.duration);
    },
    [hide, opacity, translateY],
  );

  useEffect(() => {
    const unsubscribe = subscribeToToasts(show);
    return () => {
      unsubscribe();
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [show]);

  if (!toast) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.layer}>
      <Animated.View
        accessibilityRole="alert"
        accessibilityLiveRegion={toast.type === 'error' ? 'assertive' : 'polite'}
        style={[
          styles.toast,
          {
            backgroundColor: BACKGROUNDS[toast.type],
            marginTop: insets.top + spacing.sm,
            opacity,
            transform: [{ translateY }],
          },
        ]}>
        <View style={styles.glyphWrap}>
          <Text style={styles.glyph}>{GLYPHS[toast.type]}</Text>
        </View>
        <Text style={styles.text} numberOfLines={4}>
          {toast.message}
        </Text>
      </Animated.View>
    </View>
  );
};

export default ToastHost;

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    alignItems: 'flex-end', // top-right on wide screens, full width on phones
    zIndex: 9999,
    elevation: 50,
  },
  toast: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  glyphWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  text: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
});

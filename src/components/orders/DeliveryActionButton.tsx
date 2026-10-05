import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Button from '../ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';

export type DeliveryAction = 'accept_delivery' | 'confirm_delivered';
export type DeliveryViewerRole = 'buyer' | 'seller';

const ACTIONS: Record<
  DeliveryAction,
  { title: string; dialogTitle: string; dialogMessage: string; role: DeliveryViewerRole }
> = {
  accept_delivery: {
    title: 'Accept Delivery',
    dialogTitle: 'Accept delivery',
    dialogMessage: 'Confirm that you have received this order?',
    role: 'buyer',
  },
  confirm_delivered: {
    title: 'Confirm Delivered',
    dialogTitle: 'Confirm delivered',
    dialogMessage:
      'Confirm that this order was delivered? The order will be marked as Delivered.',
    role: 'seller',
  },
};

type Props = {
  action: DeliveryAction;
  /** Who is looking at the screen. The button renders nothing for the wrong role. */
  viewerRole: DeliveryViewerRole | null;
  /** Performs the request. Throw to report a failure; the button shows it inline. */
  onPerform: () => Promise<void>;
  disabled?: boolean;
};

/**
 * Accept Delivery (buyer) / Confirm Delivered (seller). It refuses to render for
 * a user who is not allowed to perform the action, shows a confirmation, and
 * ignores taps while a request is running. (The server enforces the same rules;
 * this only keeps the UI honest.)
 */
const DeliveryActionButton = ({
  action,
  viewerRole,
  onPerform,
  disabled = false,
}: Props) => {
  const { colors } = useTheme();
  const config = ACTIONS[action];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);

  if (viewerRole !== config.role) {
    return null;
  }

  const run = async () => {
    if (inFlight.current) {
      return;
    }
    inFlight.current = true;
    setError('');
    setLoading(true);
    try {
      await onPerform();
    } catch (err) {
      setError(getErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };

  const handlePress = () => {
    if (inFlight.current || loading || disabled) {
      return;
    }
    Alert.alert(config.dialogTitle, config.dialogMessage, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: run },
    ]);
  };

  return (
    <View style={styles.wrapper}>
      <Button
        title={config.title}
        onPress={handlePress}
        loading={loading}
        disabled={disabled}
      />
      {error ? (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      ) : null}
    </View>
  );
};

export default DeliveryActionButton;

const styles = StyleSheet.create({
  wrapper: { marginTop: spacing.md },
  error: { fontSize: 13, marginTop: spacing.sm },
});

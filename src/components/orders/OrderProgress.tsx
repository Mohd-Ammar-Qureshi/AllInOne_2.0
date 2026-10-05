import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useTheme } from '../../context/ThemeContext';
import { OrderStatus } from '../../types/order';
import { getReadableTextColor } from '../../utils/color';
import { radius, spacing } from '../../theme';

export type ProgressStepState = 'done' | 'current' | 'upcoming';

export type ProgressStep = {
  key: string;
  label: string;
  state: ProgressStepState;
};

const STEPS = [
  { key: 'placed', label: 'Placed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

// Index of the last COMPLETED step for each status.
const COMPLETED_UP_TO: Partial<Record<OrderStatus, number>> = {
  pending: 0,
  accepted: 1,
  shipped: 2,
  delivered: 3,
};

/**
 * Pure helper (easy to test): which of Placed -> Accepted -> Shipped ->
 * Delivered are done, which is next, and whether the order ended early.
 */
export const getOrderProgress = (
  status: OrderStatus,
): { steps: ProgressStep[]; closed: 'rejected' | 'cancelled' | null } => {
  if (status === 'rejected' || status === 'cancelled') {
    return { steps: [], closed: status };
  }
  const done = COMPLETED_UP_TO[status] ?? 0;
  return {
    closed: null,
    steps: STEPS.map((step, index) => ({
      ...step,
      state:
        index <= done ? 'done' : index === done + 1 ? 'current' : 'upcoming',
    })),
  };
};

type Props = { status: OrderStatus };

/** Compact at-a-glance order tracker for the order details screens. */
const OrderProgress = ({ status }: Props) => {
  const { colors } = useTheme();
  const { steps, closed } = getOrderProgress(status);

  if (closed) {
    return (
      <View
        accessibilityRole="text"
        style={[
          styles.closed,
          { backgroundColor: `${colors.error}1A`, borderColor: colors.error },
        ]}>
        <MaterialIcons name="block" size={18} color={colors.error} />
        <Text style={[styles.closedText, { color: colors.error }]}>
          {closed === 'rejected' ? 'Order rejected' : 'Order cancelled'}
        </Text>
      </View>
    );
  }

  const current = steps.find(step => step.state === 'current');
  const lastDone = [...steps].reverse().find(step => step.state === 'done');

  return (
    <View
      accessible
      accessibilityLabel={`Order progress: ${
        lastDone?.label ?? 'Placed'
      }${current ? `, next: ${current.label}` : ', completed'}`}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <View style={styles.row}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const next = steps[index + 1];
          const lineActive = next ? next.state !== 'upcoming' : false;
          return (
            <View key={step.key} style={styles.step}>
              {!isLast ? (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: lineActive ? colors.primary : colors.border },
                  ]}
                />
              ) : null}
              <View
                style={[
                  styles.node,
                  step.state === 'done' && { backgroundColor: colors.primary },
                  step.state === 'current' && {
                    backgroundColor: colors.surface,
                    borderColor: colors.primary,
                    borderWidth: 2,
                  },
                  step.state === 'upcoming' && {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}>
                {step.state === 'done' ? (
                  <MaterialIcons
                    name="check"
                    size={14}
                    color={getReadableTextColor(colors.primary)}
                  />
                ) : null}
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color:
                      step.state === 'upcoming'
                        ? colors.textSecondary
                        : colors.text,
                    fontWeight: step.state === 'current' ? '800' : '600',
                  },
                ]}
                numberOfLines={1}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default OrderProgress;

const NODE = 24;

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  row: { flexDirection: 'row' },
  step: { flex: 1, alignItems: 'center' },
  // Runs from this step's centre to the next step's centre, behind the nodes.
  line: {
    position: 'absolute',
    top: NODE / 2 - 1,
    left: '50%',
    width: '100%',
    height: 2,
  },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 12, marginTop: spacing.xs },
  closed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  closedText: { fontSize: 14, fontWeight: '800' },
});

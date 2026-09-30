import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppwrite } from '../../appwrite/AppwriteContext';
import orderService from '../../appwrite/orderService';
import AppHeader from '../../components/ui/AppHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { MedicalStoreStackParamList } from '../../types/navigation';
import { formatPrice } from '../../utils/format';
import {
  getErrorMessage,
  showErrorSnackbar,
  showSuccessSnackbar,
} from '../../utils/errorHandler';
import { radius, spacing } from '../../theme';

type Props = NativeStackScreenProps<MedicalStoreStackParamList, 'Checkout'>;

const CheckoutScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { profile } = useAppwrite();
  const cart = useCart();

  const [address, setAddress] = useState(profile?.address ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [state, setState] = useState(profile?.state ?? '');
  const [pincode, setPincode] = useState(profile?.pincode ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!address.trim()) next.address = 'Delivery address is required';
    if (!city.trim()) next.city = 'City is required';
    if (!state.trim()) next.state = 'State is required';
    if (!pincode.trim()) next.pincode = 'Pincode is required';
    if (!phone.trim()) next.phone = 'Phone number is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!profile?.userId || !cart.sellerId || !cart.sellerName) {
      return;
    }
    if (!validate()) {
      return;
    }

    try {
      setPlacing(true);
      const order = await orderService.createOrder({
        buyerId: profile.userId,
        buyerName: profile.name,
        sellerId: cart.sellerId,
        sellerName: cart.sellerName,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        phone: phone.trim(),
        notes: notes.trim() || undefined,
        items: cart.items.map(item => ({
          productId: item.productId,
          productName: item.name,
          price: item.price,
          unit: item.unit,
          quantity: item.quantity,
        })),
      });

      cart.clearCart();
      showSuccessSnackbar('Order placed successfully');
      navigation.replace('OrderDetail', { orderId: order.$id });
    } catch (err) {
      showErrorSnackbar(err, getErrorMessage(err, 'Unable to place order.'));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <AppHeader
              title="Checkout"
              subtitle={cart.sellerName ?? undefined}
              onBack={() => navigation.goBack()}
            />

            <View
              style={[
                styles.summary,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>
                {cart.itemCount} item{cart.itemCount === 1 ? '' : 's'}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {formatPrice(cart.subtotal)}
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Delivery Details
            </Text>

            <Input
              label="Delivery Address"
              placeholder="Shop no, street, area"
              value={address}
              onChangeText={text => {
                setAddress(text);
                setErrors(prev => ({ ...prev, address: '' }));
              }}
              error={errors.address}
              multiline
              numberOfLines={2}
              style={styles.multiline}
            />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Input
                  label="City"
                  value={city}
                  onChangeText={text => {
                    setCity(text);
                    setErrors(prev => ({ ...prev, city: '' }));
                  }}
                  error={errors.city}
                />
              </View>
              <View style={styles.flex1}>
                <Input
                  label="State"
                  value={state}
                  onChangeText={text => {
                    setState(text);
                    setErrors(prev => ({ ...prev, state: '' }));
                  }}
                  error={errors.state}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Input
                  label="Pincode"
                  keyboardType="number-pad"
                  value={pincode}
                  onChangeText={text => {
                    setPincode(text);
                    setErrors(prev => ({ ...prev, pincode: '' }));
                  }}
                  error={errors.pincode}
                />
              </View>
              <View style={styles.flex1}>
                <Input
                  label="Phone"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={text => {
                    setPhone(text);
                    setErrors(prev => ({ ...prev, phone: '' }));
                  }}
                  error={errors.phone}
                />
              </View>
            </View>

            <Input
              label="Notes (optional)"
              placeholder="Delivery instructions"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
              style={styles.multiline}
            />

            <Button
              title={`Place Order · ${formatPrice(cart.subtotal)}`}
              onPress={handlePlaceOrder}
              loading={placing}
              style={styles.placeButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CheckoutScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  flex1: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryTitle: { fontSize: 15, fontWeight: '700' },
  summaryValue: { fontSize: 18, fontWeight: '800' },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  multiline: { minHeight: 64, textAlignVertical: 'top', paddingTop: spacing.md },
  placeButton: { marginTop: spacing.sm },
});
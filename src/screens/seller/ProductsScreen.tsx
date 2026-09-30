import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppwrite } from '../../appwrite/AppwriteContext';
import productService from '../../appwrite/productService';
import AppHeader from '../../components/ui/AppHeader';
import SellerBottomNav from '../../components/navigation/SellerBottomNav'
import { getReadableTextColor } from '../../utils/color';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Input from '../../components/ui/Input';
import Loading from '../../components/Loading';
import { useTheme } from '../../context/ThemeContext';
import { AgencyStackParamList } from '../../types/navigation';
import {
  Product,
  PRODUCT_STATUSES,
  PRODUCT_STATUS_LABELS,
} from '../../types/product';
import { formatPrice } from '../../utils/format';
import { getErrorMessage, showErrorSnackbar } from '../../utils/errorHandler';
import { radius, spacing } from '../../theme';

type Props = NativeStackScreenProps<AgencyStackParamList, 'Products'>;

type StatusFilter = Product['status'] | 'all';

const statusColor = (
  status: Product['status'],
  colors: ReturnType<typeof useTheme>['colors'],
) => {
  if (status === 'active') return colors.statusActive;
  if (status === 'out_of_stock') return colors.statusOutOfStock;
  return colors.statusDraft;
};

const ProductsScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { profile } = useAppwrite();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const licenseVerified = Boolean(profile?.licenseVerified);

  // Defense in depth: the Home screen already gates navigation into this
  // screen behind licence verification, but this stack route is directly
  // navigable (e.g. deep link), so re-check here too. An unverified agency
  // must never be able to list/add products.
  useFocusEffect(
    useCallback(() => {
      if (profile && !licenseVerified) {
        showErrorSnackbar(
          'Verify your licence before you can manage products.',
        );
        navigation.replace('LicenseVerification');
      }
    }, [profile, licenseVerified, navigation]),
  );

  const load = useCallback(async () => {
    if (!profile?.userId) {
      return;
    }
    try {
      setError('');
      const rows = await productService.listSellerProducts(profile.userId);
      setProducts(rows);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load your products.'));
    } finally {
      setLoading(false);
    }
  }, [profile?.userId]);

  useFocusEffect(
    useCallback(() => {
      if (!licenseVerified) {
        return;
      }
      setLoading(true);
      load();
    }, [load, licenseVerified]),
  );

  if (!licenseVerified) {
    return <Loading message="Checking licence status..." />;
  }

  const trimmedQuery = searchQuery.trim().toLowerCase();

  const filteredProducts = products.filter(product => {
    const matchesStatus =
      statusFilter === 'all' || product.status === statusFilter;
    const matchesQuery =
      !trimmedQuery || product.name.toLowerCase().includes(trimmedQuery);
    return matchesStatus && matchesQuery;
  });

  const hasActiveFilter = Boolean(trimmedQuery) || statusFilter !== 'all';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <AppHeader
          title="Your Products"
          subtitle={`${products.length} listed`}
          onBack={() => navigation.goBack()}
          rightAction={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add product"
              onPress={() => navigation.navigate('ProductForm', undefined)}
              style={[styles.addButton, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="add" size={24} color="#FFFFFF" />
            </Pressable>
          }
        />

        {!loading && !error && products.length > 0 ? (
          <View style={styles.filters}>
            <Input
              placeholder="Search by product name"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.filterRow}>
              {(['all', ...PRODUCT_STATUSES] as StatusFilter[]).map(value => {
                const selected = statusFilter === value;
                const label =
                  value === 'all' ? 'All' : PRODUCT_STATUS_LABELS[value];

                return (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setStatusFilter(value)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: selected
                          ? colors.primary
                          : colors.surfaceSecondary,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: selected
                            ? getReadableTextColor(colors.primary)
                            : colors.text,
                        },]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {loading ? (
          <Loading message="Loading your products..." fullScreen={false} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : products.length === 0 ? (
          <EmptyState
            icon="inventory-2"
            title="No products yet"
            description="Add your first product so medical stores can find and order it."
            actionLabel="Add Product"
            onAction={() => navigation.navigate('ProductForm', undefined)}
          />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon="inventory-2"
            title="No matching products"
            description={
              hasActiveFilter
                ? 'Try a different name or clear the status filter.'
                : 'No products found.'
            }
          />
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={item => item.$id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  navigation.navigate('ProductForm', { productId: item.$id })
                }
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.image}
                  />
                ) : (
                  <View
                    style={[
                      styles.image,
                      styles.imagePlaceholder,
                      { backgroundColor: colors.surfaceSecondary },
                    ]}>
                    <MaterialIcons
                      name="medication"
                      size={26}
                      color={colors.textSecondary}
                    />
                  </View>
                )}
                <View style={styles.cardBody}>
                  <Text
                    style={[styles.name, { color: colors.text }]}
                    numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.price, { color: colors.textSecondary }]}>
                    {formatPrice(item.price)}
                    {item.unit ? ` / ${item.unit}` : ''} · Stock {item.stock}
                  </Text>
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: statusColor(item.status, colors) },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusLabel,
                        { color: statusColor(item.status, colors) },
                      ]}>
                      {PRODUCT_STATUS_LABELS[item.status]}
                    </Text>
                  </View>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={22}
                  color={colors.textSecondary}
                />
              </Pressable>
            )}
          />
        )}
      </View>
      <SellerBottomNav active='Products' />
    </SafeAreaView>
  );
};

export default ProductsScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: { marginBottom: spacing.md, gap: spacing.sm },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filterChip: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  filterChipText: { fontSize: 13, fontWeight: '700' },
  list: { paddingBottom: spacing.xxl, gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  image: { width: 56, height: 56, borderRadius: radius.md },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: '700' },
  price: { fontSize: 13 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 12, fontWeight: '600' },
});
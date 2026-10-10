import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import productService from '../../appwrite/productService';
import profileService from '../../appwrite/profileService';
import notificationService from '../../appwrite/notificationService';
import orderService from '../../appwrite/orderService';
import { useAppwrite } from '../../appwrite/AppwriteContext';

import AppHeader from '../../components/ui/AppHeader';
import AppLogo from '../../components/ui/AppLogo';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Loading from '../../components/Loading';

import CustomerBottomNav from '../../components/navigation/CustomerBottomNav';
import SellerBottomNav from '../../components/navigation/SellerBottomNav';

import { useTheme } from '../../context/ThemeContext';

import {
  AgencyStackParamList,
  MedicalStoreStackParamList,
} from '../../types/navigation';
import { Product } from '../../types/product';
import { Profile } from '../../types/profile';
import { UserRole } from '../../types/user';

import { formatPrice } from '../../utils/format';
import { getReadableTextColor } from '../../utils/color';
import { getLicenseStatus } from '../../utils/license';
import { IconName } from '../../settings/settingsConfig';
import { radius, spacing } from '../../theme';

type QuickLink = {
  label: string;
  icon: IconName;
  onPress: () => void;
};

type Props = {
  navigation: {
    navigate: (
      screen:
        | 'Settings'
        | 'Sellers'
        | 'SellerStore'
        | 'OrderHistory'
        | 'Cart'
        | 'ProductDetail'
        | 'LicenseVerification'
        | 'Products'
        | 'IncomingOrders'
        | 'Notifications'
        | 'ProductForm',
      params?: any,
    ) => void;
  };
  role: UserRole;
  quickLinks?: QuickLink[];
  showCatalog?: boolean;
};

const RoleHomeScreen = ({
  navigation,
  role,
  quickLinks,
  showCatalog,
}: Props) => {
  const { colors, toggleTheme, isDark } = useTheme();
  const verifiedColor = isDark ? colors.success : '#166534';
  const { profile, refreshProfile } = useAppwrite();

  const licenseStatus = getLicenseStatus(profile);
  const licenseVerified = licenseStatus === 'verified';
  const sellerId = profile?.userId;

  const [products, setProducts] = useState<Product[]>([]);
  const [verifiedAgencies, setVerifiedAgencies] = useState<Profile[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Customer search: agency name / agency ID
  const [agencyQuery, setAgencyQuery] = useState('');

  // Seller search: own product name
  const [productQuery, setProductQuery] = useState('');

  const [unreadCount, setUnreadCount] = useState(0);

  // Seller Home: number of orders still waiting for a decision (real data).
  const [pendingOrders, setPendingOrders] = useState<number | null>(null);
  const [catalogError, setCatalogError] = useState(false);

  const loadCatalog = useCallback(async () => {
    if (role === 'agency' && !sellerId) {
      return;
    }

    try {
      setCatalogError(false);
      setLoadingProducts(true);

      if (role === 'agency') {
        // Seller Home: load only the logged-in seller's own products.
        const sellerProducts = await productService.listSellerProducts(
          sellerId!,
        );

        setProducts(sellerProducts);
        setVerifiedAgencies([]);
        return;
      }

      // Customer Home: load all active products and verified agencies.
      const [allProducts, agencies] = await Promise.all([
        productService.listActiveProducts(),
        profileService.listVerifiedSellers(),
      ]);

      setProducts(allProducts);
      setVerifiedAgencies(agencies);
    } catch (error) {
      console.error('Failed to load home products:', error);
      setCatalogError(true);
    } finally {
      setLoadingProducts(false);
    }
  }, [role, sellerId]);

  useEffect(() => {
    if (!showCatalog) {
      return;
    }

    loadCatalog();
  }, [showCatalog, loadCatalog]);

  useFocusEffect(
    useCallback(() => {
      if (!profile?.userId) {
        return;
      }

      let isActive = true;

      notificationService
        .countUnread(profile.userId)
        .then(count => {
          if (isActive) {
            setUnreadCount(count);
          }
        })
        .catch(error => {
          console.error(
            'Failed to load unread notification count:',
            error,
          );
        });

      return () => {
        isActive = false;
      };
    }, [profile?.userId]),
  );
  // Seller only: how many orders are waiting for accept / reject. Orders are
  // only available once the licence is verified (same rule as the bottom nav).
  const loadPendingOrders = useCallback(async () => {
    if (role !== 'agency' || !licenseVerified || !sellerId) {
      return;
    }
    try {
      const orders = await orderService.listOrdersForSeller(sellerId);
      setPendingOrders(orders.filter(order => order.status === 'pending').length);
    } catch {
      setPendingOrders(null);
    }
  }, [role, licenseVerified, sellerId]);

  useFocusEffect(
    useCallback(() => {
      loadPendingOrders();
    }, [loadPendingOrders]),
  );

  // Seller only: while the licence is not approved yet, re-check the profile
  // whenever Home is shown, so an approval appears without logging in again.
  useFocusEffect(
    useCallback(() => {
      if (role === 'agency' && !licenseVerified) {
        refreshProfile().catch(() => undefined);
      }
    }, [role, licenseVerified, refreshProfile]),
  );

  // Pull-to-refresh reloads the list, and (for a seller) the licence status too.
  const handleRefresh = useCallback(() => {
    if (role === 'agency') {
      refreshProfile().catch(() => undefined);
    }
    loadCatalog();
    loadPendingOrders();
  }, [role, refreshProfile, loadCatalog, loadPendingOrders]);
  const trimmedAgencyQuery = agencyQuery.trim().toLowerCase();
  const trimmedProductQuery = productQuery.trim().toLowerCase();

  const matchesAgencyQuery = (agency: Profile): boolean => {
    if (!trimmedAgencyQuery) {
      return true;
    }

    return (
      agency.name.toLowerCase().includes(trimmedAgencyQuery) ||
      agency.userId.toLowerCase().includes(trimmedAgencyQuery) ||
      agency.$id.toLowerCase().includes(trimmedAgencyQuery)
    );
  };

  const visibleProducts = products.filter(product => {
    // Seller Home: search only by own product name.
    if (role === 'agency') {
      return product.name
        .toLowerCase()
        .includes(trimmedProductQuery);
    }

    // Customer Home: filter by agency name/ID.
    const agency = verifiedAgencies.find(
      seller => seller.userId === product.sellerId,
    );

    if (!agency) {
      return false;
    }

    return matchesAgencyQuery(agency);
  });

  const isSeller = role === 'agency';
  const searchValue = isSeller ? productQuery : agencyQuery;
  const setSearchValue = isSeller ? setProductQuery : setAgencyQuery;

  const isOutOfStock = (product: Product): boolean =>
    product.status === 'out_of_stock' || product.stock <= 0;
  const activeCount = products.filter(
    product => product.status === 'active' && product.stock > 0,
  ).length;
  const outOfStockCount = products.filter(isOutOfStock).length;

  const firstName = profile?.name?.trim().split(' ')[0];
  const heroTextColor = getReadableTextColor(colors.primary);
  const visibleAgencies = verifiedAgencies.filter(matchesAgencyQuery);

  const renderMetaRow = (icon: React.ComponentProps<typeof MaterialIcons>['name'], text: string) => (
    <View style={styles.metaRow}>
      <MaterialIcons name={icon} size={15} color={colors.textSecondary} />
      <Text
        numberOfLines={1}
        style={[styles.productMeta, { color: colors.textSecondary }]}>
        {text}
      </Text>
    </View>
  );

  const renderProductImage = (product: Product) =>
    product.imageUrl ? (
      <Image
        source={{ uri: product.imageUrl }}
        style={styles.productImage}
        resizeMode="cover"
      />
    ) : (
      <View
        style={[
          styles.productImage,
          styles.imagePlaceholder,
          { backgroundColor: colors.surfaceSecondary },
        ]}>
        <MaterialIcons
          name="medical-services"
          size={40}
          color={colors.textSecondary}
        />
      </View>
    );

  const renderProduct = ({ item: product }: { item: Product }) => {
    // -----------------------------
    // SELLER HOME PRODUCT CARD
    // -----------------------------
    if (role === 'agency') {
      const outOfStock = isOutOfStock(product);
      const stockColor = outOfStock ? colors.error : colors.textSecondary;

      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${product.name}`}
          onPress={() =>
            navigation.navigate('ProductForm', {
              productId: product.$id,
            })
          }
          style={({ pressed }) => [
            styles.productCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.9 : 1,
            },
          ]}>
          {renderProductImage(product)}

          <Text style={[styles.productName, { color: colors.text }]}>
            {product.name}
          </Text>

          <Text style={[styles.productPrice, { color: colors.primary }]}>
            {formatPrice(product.price)}
            {product.unit ? ` / ${product.unit}` : ''}
          </Text>

          <View style={styles.sellerCardFooter}>
            <View
              style={[styles.stockPill, { backgroundColor: `${stockColor}22` }]}>
              <Text style={[styles.stockPillText, { color: stockColor }]}>
                {outOfStock ? 'Out of stock' : `Stock: ${product.stock}`}
              </Text>
            </View>
            {product.status === 'draft' ? (
              <View
                style={[
                  styles.stockPill,
                  { backgroundColor: colors.surfaceSecondary },
                ]}>
                <Text
                  style={[
                    styles.stockPillText,
                    { color: colors.textSecondary },
                  ]}>
                  Draft
                </Text>
              </View>
            ) : null}

            <View style={styles.editHintRow}>
              <Text style={[styles.editHint, { color: colors.primary }]}>
                Tap to edit
              </Text>
              <MaterialIcons
                name="chevron-right"
                size={22}
                color={colors.textSecondary}
              />
            </View>
          </View>
        </Pressable>
      );
    }

    // -----------------------------
    // CUSTOMER HOME PRODUCT CARD
    // -----------------------------
    const agency = verifiedAgencies.find(
      seller => seller.userId === product.sellerId,
    );

    if (!agency) {
      return null;
    }

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${product.name}, ${formatPrice(product.price)}, ${agency.name}, verified agency`}
        onPress={() =>
          navigation.navigate('ProductDetail', {
            productId: product.$id,
            sellerId: agency.userId,
            sellerName: agency.name,
          })
        }
        style={({ pressed }) => [
          styles.productCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.9 : 1,
          },
        ]}>
        {renderProductImage(product)}

        <Text style={[styles.productName, { color: colors.text }]}>
          {product.name}
        </Text>

        <Text style={[styles.productPrice, { color: colors.primary }]}>
          {formatPrice(product.price)}
          {product.unit ? ` / ${product.unit}` : ''}
        </Text>

        <View
          style={[styles.agencyRow, { borderTopColor: colors.border }]}>
          <MaterialIcons name="verified" size={16} color={verifiedColor} />
          <Text
            numberOfLines={1}
            style={[styles.agencyName, { color: colors.text }]}>
            {agency.name}
          </Text>
          <Text style={[styles.verifiedLabel, { color: verifiedColor }]}>
            Verified
          </Text>
        </View>

        {agency.city || agency.state
          ? renderMetaRow(
              'place',
              [agency.city, agency.state].filter(Boolean).join(', '),
            )
          : null}

        {agency.phone ? renderMetaRow('call', agency.phone) : null}
      </Pressable>
    );
  };

  // The existing search (same state, same filtering), shown as a prominent bar.
  const searchBar = (
    <View
      style={[
        styles.searchBar,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <MaterialIcons name="search" size={22} color={colors.textSecondary} />
      <TextInput
        accessibilityLabel={
          isSeller ? 'Search your products' : 'Search agencies'
        }
        placeholder={
          isSeller ? 'Search by product name' : 'Search by Agency Name or ID'
        }
        placeholderTextColor={colors.textSecondary}
        value={searchValue}
        onChangeText={setSearchValue}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={[styles.searchInput, { color: colors.text }]}
      />
      {searchValue.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => setSearchValue('')}
          style={[
            styles.clearButton,
            { backgroundColor: colors.surfaceSecondary },
          ]}>
          <MaterialIcons name="close" size={18} color={colors.text} />
        </Pressable>
      ) : null}
    </View>
  );

  const listHeader = (
    <>
      {role === 'agency' && !licenseVerified ? (
        <View
          style={[
            styles.licenseCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}>
          <View style={styles.licenseRow}>
            <MaterialIcons
              name={
                licenseStatus === 'pending'
                  ? 'hourglass-top'
                  : 'badge'
              }
              size={28}
              color={colors.primary}
            />

            <View style={styles.licenseText}>
              <Text
                style={[
                  styles.licenseTitle,
                  { color: colors.text },
                ]}>
                {licenseStatus === 'pending'
                  ? 'Licence under review'
                  : 'Verify your licence to start selling'}
              </Text>

              <Text
                style={[
                  styles.licenseBody,
                  { color: colors.textSecondary },
                ]}>
                {licenseStatus === 'pending'
                  ? "We're checking your licence. You can add products once it's approved."
                  : "Submit your drug/trade licence once. You can add products after it's approved."}
              </Text>
            </View>
          </View>

          <Button
            title={
              licenseStatus === 'pending'
                ? 'Check Status'
                : 'Verify Licence'
            }
            variant={
              licenseStatus === 'pending'
                ? 'secondary'
                : 'primary'
            }
            onPress={() =>
              navigation.navigate('LicenseVerification')
            }
          />
        </View>
      ) : null}
      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <Text style={[styles.heroGreeting, { color: heroTextColor }]}>
          {firstName ? `Hello, ${firstName}` : 'Welcome to AllInOne'}
        </Text>
        <Text style={[styles.heroTitle, { color: heroTextColor }]}>
          {isSeller
            ? 'Manage your products and orders'
            : 'Find medical products from verified agencies'}
        </Text>

        <View style={styles.heroChips}>
          {isSeller ? (
            <View
              style={[styles.heroChip, { backgroundColor: `${heroTextColor}22` }]}>
              <MaterialIcons
                name={licenseVerified ? 'verified' : 'hourglass-top'}
                size={14}
                color={heroTextColor}
              />
              <Text style={[styles.heroChipText, { color: heroTextColor }]}>
                {licenseVerified
                  ? 'Verified agency'
                  : licenseStatus === 'pending'
                    ? 'Licence under review'
                    : 'Licence not verified'}
              </Text>
            </View>
          ) : !loadingProducts && !catalogError && verifiedAgencies.length > 0 ? (
            <>
              <View
                style={[
                  styles.heroChip,
                  { backgroundColor: `${heroTextColor}22` },
                ]}>
                <MaterialIcons name="verified" size={14} color={heroTextColor} />
                <Text style={[styles.heroChipText, { color: heroTextColor }]}>
                  {verifiedAgencies.length} verified{' '}
                  {verifiedAgencies.length === 1 ? 'agency' : 'agencies'}
                </Text>
              </View>
              <View
                style={[
                  styles.heroChip,
                  { backgroundColor: `${heroTextColor}22` },
                ]}>
                <MaterialIcons
                  name="inventory-2"
                  size={14}
                  color={heroTextColor}
                />
                <Text style={[styles.heroChipText, { color: heroTextColor }]}>
                  {products.length}{' '}
                  {products.length === 1 ? 'product' : 'products'}
                </Text>
              </View>
            </>
          ) : null}
        </View>
      </View>

      {!isSeller && showCatalog ? searchBar : null}

      {isSeller && licenseVerified ? (
        <View style={styles.statRow}>
          {[
            {
              key: 'pending',
              label: 'Pending orders',
              value: pendingOrders === null ? '–' : String(pendingOrders),
              icon: 'receipt-long' as const,
              hue: colors.warning,
              onPress: () => navigation.navigate('IncomingOrders'),
            },
            {
              key: 'active',
              label: 'Active products',
              value: String(activeCount),
              icon: 'inventory-2' as const,
              hue: colors.statusActive,
              onPress: () => navigation.navigate('Products'),
            },
            {
              key: 'out',
              label: 'Out of stock',
              value: String(outOfStockCount),
              icon: 'production-quantity-limits' as const,
              hue: outOfStockCount > 0 ? colors.error : colors.textSecondary,
              onPress: () => navigation.navigate('Products'),
            },
          ].map(stat => (
            <Pressable
              key={stat.key}
              accessibilityRole="button"
              accessibilityLabel={`${stat.label}: ${stat.value}`}
              onPress={stat.onPress}
              style={({ pressed }) => [
                styles.statCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}>
              <View
                style={[styles.statIcon, { backgroundColor: `${stat.hue}22` }]}>
                <MaterialIcons name={stat.icon} size={18} color={stat.hue} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {stat.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {quickLinks && quickLinks.length > 0 ? (
        <View style={styles.quickLinks}>
          {quickLinks.map(link => (
            <Pressable
              key={link.label}
              accessibilityRole="button"
              onPress={link.onPress}
              style={({ pressed }) => [
                styles.quickLink,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}>
              <MaterialIcons
                name={link.icon}
                size={22}
                color={colors.primary}
              />

              <Text
                style={[
                  styles.quickLinkLabel,
                  { color: colors.text },
                ]}>
                {link.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {!isSeller && showCatalog && visibleAgencies.length > 0 ? (
        <View style={styles.catalogSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Verified Agencies
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="See all sellers"
              onPress={() => navigation.navigate('Sellers')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                See all
              </Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.agencyScroll}
            contentContainerStyle={styles.agencyScrollContent}>
            {visibleAgencies.slice(0, 10).map(agency => (
              <Pressable
                key={agency.$id}
                accessibilityRole="button"
                accessibilityLabel={`${agency.name}, verified agency`}
                onPress={() =>
                  navigation.navigate('SellerStore', {
                    sellerId: agency.userId,
                    sellerName: agency.name,
                  })
                }
                style={({ pressed }) => [
                  styles.agencyCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}>
                <View
                  style={[
                    styles.agencyAvatar,
                    { backgroundColor: colors.surfaceSecondary },
                  ]}>
                  <Text style={[styles.agencyInitial, { color: colors.primary }]}>
                    {agency.name.trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={[styles.agencyCardName, { color: colors.text }]}>
                  {agency.name}
                </Text>
                <View style={styles.agencyBadgeRow}>
                  <MaterialIcons name="verified" size={14} color={verifiedColor} />
                  <Text style={[styles.verifiedLabel, { color: verifiedColor }]}>
                    Verified
                  </Text>
                </View>
                {agency.city ? (
                  <Text
                    numberOfLines={1}
                    style={[styles.agencyCity, { color: colors.textSecondary }]}>
                    {agency.city}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {showCatalog ? (
        <View style={styles.catalogSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isSeller ? 'Your Products' : 'Available Products'}
            </Text>
            {isSeller && licenseVerified ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add a product"
                onPress={() => navigation.navigate('ProductForm')}
                style={({ pressed }) => [
                  styles.addButton,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
                ]}>
                <MaterialIcons name="add" size={18} color={heroTextColor} />
                <Text style={[styles.addButtonText, { color: heroTextColor }]}>
                  Add
                </Text>
              </Pressable>
            ) : null}
          </View>
          {isSeller ? searchBar : null}
        </View>
      ) : null}
    </>
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}>
      <View style={styles.headerContainer}>
        <AppHeader
          logo={<AppLogo />}
          rightAction={
            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                onPress={() =>
                  navigation.navigate('Notifications')
                }
                style={[
                  styles.iconButton,
                  {
                    backgroundColor:
                      colors.surfaceSecondary,
                  },
                ]}>
                <MaterialIcons
                  name="notifications"
                  size={22}
                  color={colors.text}
                />

                {unreadCount > 0 ? (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: colors.error },
                    ]}>
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color: getReadableTextColor(
                            colors.error,
                          ),
                        },
                      ]}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                ) : null}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={toggleTheme}
                style={[
                  styles.iconButton,
                  {
                    backgroundColor:
                      colors.surfaceSecondary,
                  },
                ]}>
                <MaterialIcons
                  name={
                    isDark
                      ? 'light-mode'
                      : 'dark-mode'
                  }
                  size={22}
                  color={colors.text}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Settings"
                onPress={() =>
                  navigation.navigate('Settings')
                }
                style={[
                  styles.iconButton,
                  {
                    backgroundColor:
                      colors.surfaceSecondary,
                  },
                ]}>
                <MaterialIcons
                  name="settings"
                  size={22}
                  color={colors.text}
                />
              </Pressable>
            </View>
          }
        />
      </View>

      <FlatList
        refreshing={loadingProducts}
        onRefresh={handleRefresh} data={showCatalog ? visibleProducts : []}
        keyExtractor={product => product.$id}
        renderItem={renderProduct}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          showCatalog &&
            !loadingProducts &&
            catalogError ? (
            <View
              style={[
                styles.errorCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}>
              <MaterialIcons
                name="error-outline"
                size={36}
                color={colors.error}
              />

              <Text
                style={[
                  styles.errorText,
                  { color: colors.text },
                ]}>
                Couldn't load products. Check your
                connection and try again.
              </Text>

              <Button
                title="Try Again"
                onPress={loadCatalog}
                style={styles.errorButton}
              />
            </View>
          ) : showCatalog && loadingProducts && products.length === 0 ? (
            <Loading
              message={
                isSeller ? 'Loading your products...' : 'Loading products...'
              }
              fullScreen={false}
            />
          ) : showCatalog && !loadingProducts ? (
            <EmptyState
              icon={searchValue.trim() ? 'search-off' : 'inventory-2'}
              title={
                isSeller
                  ? searchValue.trim()
                    ? 'No matching products'
                    : 'No products yet'
                  : searchValue.trim()
                    ? 'No matching agencies'
                    : 'No products available'
              }
              description={
                isSeller
                  ? searchValue.trim()
                    ? 'No products found for that name.'
                    : licenseVerified
                      ? 'Add your first product to start receiving orders.'
                      : 'Products you add will appear here once your licence is approved.'
                  : searchValue.trim()
                    ? 'No products found for that agency.'
                    : 'Products from verified agencies will appear here.'
              }
              actionLabel={
                searchValue.trim()
                  ? 'Clear search'
                  : isSeller && licenseVerified
                    ? 'Add Product'
                    : undefined
              }
              onAction={
                searchValue.trim()
                  ? () => setSearchValue('')
                  : isSeller && licenseVerified
                    ? () => navigation.navigate('ProductForm')
                    : undefined
              }
            />
          ) : null
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {role === 'medical_store' ? (
        <CustomerBottomNav active="Home" />
      ) : (
        <SellerBottomNav active="Home" />
      )}
    </SafeAreaView>
  );
};

export const MedicalStoreHomeScreen = (
  props: NativeStackScreenProps<
    MedicalStoreStackParamList,
    'Home'
  >,
) => (
  <RoleHomeScreen
    {...props}
    role="medical_store"
    showCatalog
  />
);

export const AgencyHomeScreen = (
  props: NativeStackScreenProps<
    AgencyStackParamList,
    'Home'
  >,
) => (
  <RoleHomeScreen
    {...props}
    role="agency"
    showCatalog
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },

  licenseCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },

  licenseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },

  licenseText: {
    flex: 1,
  },

  licenseTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },

  licenseBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  quickLinks: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  quickLink: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },

  quickLinkLabel: {
    fontSize: 13,
    fontWeight: '600',
  },

  catalogSection: {
    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },

  seeAll: {
    fontSize: 14,
    fontWeight: '700',
  },

  hero: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  heroGreeting: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },

  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginTop: spacing.xs,
  },

  heroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },

  heroChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    marginBottom: spacing.lg,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing.sm,
  },

  clearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 2,
  },

  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },

  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },

  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: spacing.sm,
    paddingRight: spacing.md,
    minHeight: 36,
    borderRadius: radius.full,
  },

  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },

  agencyScroll: {
    flexGrow: 0,
    marginHorizontal: -spacing.lg,
  },

  agencyScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },

  agencyCard: {
    width: 140,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },

  agencyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },

  agencyInitial: {
    fontSize: 18,
    fontWeight: '800',
  },

  agencyCardName: {
    fontSize: 14,
    fontWeight: '700',
  },

  agencyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  agencyCity: {
    fontSize: 12,
  },

  productCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  productImage: {
    width: '100%',
    height: 180,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },

  productName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },

  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },

  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  agencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    marginBottom: spacing.xs,
  },

  agencyName: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
  },

  verifiedLabel: {
    fontSize: 12,
    fontWeight: '700',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },

  productMeta: {
    flexShrink: 1,
    fontSize: 13,
  },

  sellerCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  stockPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },

  stockPillText: {
    fontSize: 12,
    fontWeight: '700',
  },

  editHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },

  editHint: {
    fontSize: 13,
    fontWeight: '600',
  },

  errorCard: {
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginTop: spacing.md,
  },

  errorText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },

  errorButton: {
    minWidth: 160,
  },
});

export default RoleHomeScreen;
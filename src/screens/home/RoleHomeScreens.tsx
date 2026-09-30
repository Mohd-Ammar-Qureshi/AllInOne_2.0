import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

import productService from '../../appwrite/productService';
import profileService from '../../appwrite/profileService';
import notificationService from '../../appwrite/notificationService';
import { useAppwrite } from '../../appwrite/AppwriteContext';

import AppHeader from '../../components/ui/AppHeader';
import AppLogo from '../../components/ui/AppLogo';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

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
  }, [role, refreshProfile, loadCatalog]);
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

  const renderProduct = ({ item: product }: { item: Product }) => {
    // -----------------------------
    // SELLER HOME PRODUCT CARD
    // -----------------------------
    if (role === 'agency') {
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
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : null}

          <Text
            style={[
              styles.productName,
              { color: colors.text },
            ]}>
            {product.name}
          </Text>

          <Text
            style={[
              styles.productPrice,
              { color: colors.primary },
            ]}>
            {formatPrice(product.price)}
            {product.unit ? ` / ${product.unit}` : ''}
          </Text>

          <Text
            style={[
              styles.agencyName,
              { color: colors.text },
            ]}>
            {profile?.name ?? 'Your Product'}
          </Text>

          {profile?.city || profile?.state ? (
            <Text
              style={[
                styles.productMeta,
                { color: colors.textSecondary },
              ]}>
              📍 {[profile.city, profile.state]
                .filter(Boolean)
                .join(', ')}
            </Text>
          ) : null}

          {profile?.phone ? (
            <Text
              style={[
                styles.productMeta,
                { color: colors.textSecondary },
              ]}>
              📞 {profile.phone}
            </Text>
          ) : null}

          <Text
            style={[
              styles.productStock,
              { color: colors.textSecondary },
            ]}>
            Stock: {product.stock}
          </Text>

          <View style={styles.editHintRow}>
            <Text
              style={[
                styles.editHint,
                { color: colors.primary },
              ]}>
              Tap to edit
            </Text>

            <MaterialIcons
              name="chevron-right"
              size={22}
              color={colors.textSecondary}
            />
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
        onPress={() =>
          navigation.navigate('ProductDetail', {
            productId: product.$id,
            sellerId: agency.userId,
            sellerName: agency.name,
          })
        }
        style={[
          styles.productCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}>
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : null}

        <Text
          style={[
            styles.productName,
            { color: colors.text },
          ]}>
          {product.name}
        </Text>

        <Text
          style={[
            styles.productPrice,
            { color: colors.primary },
          ]}>
          {formatPrice(product.price)}
          {product.unit ? ` / ${product.unit}` : ''}
        </Text>

        <Text
          style={[
            styles.agencyName,
            { color: colors.text },
          ]}>
          {agency.name} ✓ Verified
        </Text>

        {agency.city || agency.state ? (
          <Text
            style={[
              styles.productMeta,
              { color: colors.textSecondary },
            ]}>
            📍 {[agency.city, agency.state]
              .filter(Boolean)
              .join(', ')}
          </Text>
        ) : null}

        {agency.phone ? (
          <Text
            style={[
              styles.productMeta,
              { color: colors.textSecondary },
            ]}>
            📞 {agency.phone}
          </Text>
        ) : null}
      </Pressable>
    );
  };

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

      {showCatalog ? (
        <View style={styles.catalogSection}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text },
            ]}>
            {role === 'agency'
              ? 'Your Products'
              : 'Available Products'}
          </Text>

          <View style={styles.searchRow}>
            <View style={styles.searchInputWrap}>
              <Input
                placeholder={
                  role === 'agency'
                    ? 'Search by product name'
                    : 'Search by Agency Name or ID'
                }
                value={
                  role === 'agency'
                    ? productQuery
                    : agencyQuery
                }
                onChangeText={
                  role === 'agency'
                    ? setProductQuery
                    : setAgencyQuery
                }
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {(role === 'agency'
              ? productQuery.length > 0
              : agencyQuery.length > 0) ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                onPress={() => {
                  if (role === 'agency') {
                    setProductQuery('');
                  } else {
                    setAgencyQuery('');
                  }
                }}
                style={[
                  styles.clearButton,
                  {
                    backgroundColor:
                      colors.surfaceSecondary,
                  },
                ]}>
                <MaterialIcons
                  name="close"
                  size={18}
                  color={colors.text}
                />
              </Pressable>
            ) : null}
          </View>

          {loadingProducts ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.loader}
            />
          ) : null}
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
          ) : showCatalog &&
            !loadingProducts ? (
            <Text
              style={[
                styles.body,
                styles.emptyText,
                { color: colors.textSecondary },
              ]}>
              {role === 'agency'
                ? trimmedProductQuery
                  ? 'No products found for that name.'
                  : 'No products yet.'
                : trimmedAgencyQuery
                  ? 'No products found for that agency.'
                  : 'No products available right now.'}
            </Text>
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

  body: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.md,
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

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  searchInputWrap: {
    flex: 1,
  },

  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },

  loader: {
    marginTop: spacing.md,
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

  agencyName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },

  productMeta: {
    fontSize: 13,
    marginTop: spacing.xs,
  },

  productStock: {
    fontSize: 13,
    marginTop: spacing.xs,
  },

  editHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },

  editHint: {
    fontSize: 13,
    fontWeight: '600',
  },

  emptyText: {
    marginTop: spacing.md,
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
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import productService from '../../appwrite/productService';
import profileService from '../../appwrite/profileService';
import notificationService from '../../appwrite/notificationService';
import { Product } from '../../types/product';
import { Profile } from '../../types/profile';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppwrite } from '../../appwrite/AppwriteContext';
import AppHeader from '../../components/ui/AppHeader';
import Button from '../../components/ui/Button';
import { useTheme } from '../../context/ThemeContext';
import {
  AgencyStackParamList,
  MedicalStoreStackParamList,
} from '../../types/navigation';
import { USER_ROLE_LABELS, UserRole } from '../../types/user';
import { showSuccessSnackbar } from '../../utils/errorHandler';
import { IconName } from '../../settings/settingsConfig';
import { radius, spacing } from '../../theme';
import Input from '../../components/ui/Input';

type PrimaryAction = {
  label: string;
  onPress: () => void;
};

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
        | 'Notifications',
      params?: any,
    ) => void;
  };
  role: UserRole;
  nextPhaseHint: string;
  primaryAction?: PrimaryAction;
  quickLinks?: QuickLink[];
  showCatalog?: boolean;
};

const RoleHomeScreen = ({
  navigation,
  role,
  nextPhaseHint,
  primaryAction,
  quickLinks,
  showCatalog,
}: Props) => {
  const { colors, toggleTheme, isDark } = useTheme();
  const { profile, logout } = useAppwrite();

  const [products, setProducts] = useState<Product[]>([]);
  const [verifiedAgencies, setVerifiedAgencies] = useState<Profile[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [agencyQuery, setAgencyQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!showCatalog) {
      return;
    }

    const loadCatalog = async () => {
      try {
        setLoadingProducts(true);

        const [allProducts, agencies] = await Promise.all([
          productService.listActiveProducts(),
          profileService.listVerifiedSellers(),
        ]);

        setProducts(allProducts);
        setVerifiedAgencies(agencies);
      } catch (error) {
        console.error('Failed to load buyer catalog:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadCatalog();
  }, [showCatalog]);

  // Refresh the unread notification badge every time this screen regains
  // focus (e.g. after reading notifications, or after the other side of an
  // order updates its status while this user was away). Both buyer and
  // seller can receive notifications now.
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
          console.error('Failed to load unread notification count:', error);
        });

      return () => {
        isActive = false;
      };
    }, [profile?.userId]),
  );

  const handleLogout = async () => {
    const success = await logout();

    if (success) {
      showSuccessSnackbar('Logged out successfully');
    }
  };

  const trimmedQuery = agencyQuery.trim().toLowerCase();

  const matchesAgencyQuery = (agency: Profile): boolean => {
    if (!trimmedQuery) {
      return true;
    }
    return (
      agency.name.toLowerCase().includes(trimmedQuery) ||
      agency.userId.toLowerCase().includes(trimmedQuery) ||
      agency.$id.toLowerCase().includes(trimmedQuery)
    );
  };

  const visibleProducts = products.filter(product => {
    const agency = verifiedAgencies.find(
      seller => seller.userId === product.sellerId,
    );
    return Boolean(agency) && matchesAgencyQuery(agency as Profile);
  });

  const renderProduct = ({ item: product }: { item: Product }) => {
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
        <Text style={[styles.productName, { color: colors.text }]}>
          {product.name}
        </Text>

        <Text style={[styles.productPrice, { color: colors.primary }]}>
          ₹{product.price}
          {product.unit ? ` / ${product.unit}` : ''}
        </Text>

        <Text style={[styles.agencyName, { color: colors.text }]}>
          {agency.name} ✓ Verified
        </Text>

        {agency.city || agency.state ? (
          <Text
            style={[
              styles.productMeta,
              { color: colors.textSecondary },
            ]}>
            📍 {[agency.city, agency.state].filter(Boolean).join(', ')}
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
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}>
        <Text style={[styles.welcome, { color: colors.text }]}>
          Welcome{profile?.name ? `, ${profile.name}` : ''}
        </Text>

        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Your profile is loaded and you are in the{' '}
          {USER_ROLE_LABELS[role]} area.
        </Text>

        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          {nextPhaseHint}
        </Text>

        {primaryAction ? (
          <Button
            title={primaryAction.label}
            onPress={primaryAction.onPress}
            style={styles.primaryAction}
          />
        ) : null}
      </View>

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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Available Products
          </Text>

          <View style={styles.searchRow}>
            <View style={styles.searchInputWrap}>
              <Input
                placeholder="Search by Agency Name or Agency ID"
                value={agencyQuery}
                onChangeText={setAgencyQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {agencyQuery.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                onPress={() => setAgencyQuery('')}
                style={[
                  styles.clearButton,
                  { backgroundColor: colors.surfaceSecondary },
                ]}>
                <MaterialIcons name="close" size={18} color={colors.text} />
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
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}>
      {/* Fixed Header */}
      <View style={styles.headerContainer}>
        <AppHeader
          title="AllInOne"
          subtitle={`${USER_ROLE_LABELS[role]} workspace`}
          rightAction={
            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                onPress={() => navigation.navigate('Notifications')}
                style={[
                  styles.iconButton,
                  { backgroundColor: colors.surfaceSecondary },
                ]}>
                <MaterialIcons
                  name="notifications"
                  size={22}
                  color={colors.text}
                />
                {unreadCount > 0 ? (
                  <View
                    style={[styles.badge, { backgroundColor: colors.error }]}>
                    <Text style={styles.badgeText}>
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
                  { backgroundColor: colors.surfaceSecondary },
                ]}>
                <MaterialIcons
                  name={isDark ? 'light-mode' : 'dark-mode'}
                  size={22}
                  color={colors.text}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Settings"
                onPress={() => navigation.navigate('Settings')}
                style={[
                  styles.iconButton,
                  { backgroundColor: colors.surfaceSecondary },
                ]}>
                <MaterialIcons
                  name="settings"
                  size={22}
                  color={colors.text}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={handleLogout}
                style={[
                  styles.iconButton,
                  { backgroundColor: colors.surfaceSecondary },
                ]}>
                <MaterialIcons
                  name="logout"
                  size={22}
                  color={colors.error}
                />
              </Pressable>
            </View>
          }
        />
      </View>

      {/* Scrollable Content */}
      <FlatList
        data={showCatalog ? visibleProducts : []}
        keyExtractor={product => product.$id}
        renderItem={renderProduct}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          showCatalog && !loadingProducts ? (
            <Text
              style={[
                styles.body,
                styles.emptyText,
                { color: colors.textSecondary },
              ]}>
              {trimmedQuery
                ? 'No products found for that agency.'
                : 'No products available right now.'}
            </Text>
          ) : null
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
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
    nextPhaseHint="Browse verified sellers and place an order to get started."
    primaryAction={{
      label: 'Browse Sellers',
      onPress: () => props.navigation.navigate('Sellers'),
    }}
    quickLinks={[
      {
        label: 'Your orders',
        icon: 'receipt-long',
        onPress: () => props.navigation.navigate('OrderHistory'),
      },
      {
        label: 'Cart',
        icon: 'shopping-cart',
        onPress: () => props.navigation.navigate('Cart'),
      },
    ]}
  />
);

export const AgencyHomeScreen = (
  props: NativeStackScreenProps<
    AgencyStackParamList,
    'Home'
  >,
) => {
  const { profile } = useAppwrite();
  const licenseVerified = Boolean(profile?.licenseVerified);

  const handleManageProducts = () => {
    if (!licenseVerified) {
      props.navigation.navigate('LicenseVerification');
      return;
    }

    props.navigation.navigate('Products');
  };

  return (
    <RoleHomeScreen
      {...props}
      role="agency"
      nextPhaseHint={
        licenseVerified
          ? 'Manage your products and keep an eye on incoming orders.'
          : 'Verify your licence once to start adding products for sale.'
      }
      primaryAction={{
        label: licenseVerified
          ? 'Manage Products'
          : 'Verify Licence to Sell',
        onPress: handleManageProducts,
      }}
      quickLinks={
        licenseVerified
          ? [
              {
                label: 'Incoming orders',
                icon: 'receipt-long',
                onPress: () =>
                  props.navigation.navigate('IncomingOrders'),
              },
            ]
          : undefined
      }
    />
  );
};

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
    width: 40,
    height: 40,
    borderRadius: 20,
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

  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },

  welcome: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },

  body: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.md,
  },

  hint: {
    fontSize: 14,
    lineHeight: 20,
  },

  primaryAction: {
    marginTop: spacing.lg,
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
    marginTop: spacing.lg,
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

  emptyText: {
    marginTop: spacing.md,
  },
});
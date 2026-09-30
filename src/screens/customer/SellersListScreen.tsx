import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import profileService from '../../appwrite/profileService';
import AppHeader from '../../components/ui/AppHeader';
import CustomerBottomNav from '../../components/navigation/CustomerBottomNav';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Loading from '../../components/Loading';
import { useTheme } from '../../context/ThemeContext';
import { MedicalStoreStackParamList } from '../../types/navigation';
import { Profile } from '../../types/profile';
import { getErrorMessage } from '../../utils/errorHandler';
import { radius, spacing } from '../../theme';

type Props = NativeStackScreenProps<MedicalStoreStackParamList, 'Sellers'>;

const SellersListScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const [sellers, setSellers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const rows = await profileService.listVerifiedSellers();
      setSellers(rows);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load sellers.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <AppHeader
          title="Sellers"
          subtitle="Verified medical agencies"
          onBack={() => navigation.goBack()}
        />

        {loading ? (
          <Loading message="Loading sellers..." fullScreen={false} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : sellers.length === 0 ? (
          <EmptyState
            icon="storefront"
            title="No verified sellers yet"
            description="Check back soon — new agencies are verified regularly."
          />
        ) : (
          <FlatList
            data={sellers}
            keyExtractor={item => item.$id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  navigation.navigate('SellerStore', {
                    sellerId: item.userId,
                    sellerName: item.name,
                  })
                }
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}>
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: colors.surfaceSecondary },
                  ]}>
                  <MaterialIcons
                    name="storefront"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.name, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>
                    {[item.city, item.state].filter(Boolean).join(', ') ||
                      'Location not provided'}
                  </Text>
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
      <CustomerBottomNav active="Sellers" />
    </SafeAreaView>
  );
};

export default SellersListScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  list: { paddingBottom: spacing.xxl, gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13 },
});
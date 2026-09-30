import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {
  Asset,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppwrite } from '../../appwrite/AppwriteContext';
import productService from '../../appwrite/productService';
import storageService, { PickedImage } from '../../appwrite/storageService';
import AppHeader from '../../components/ui/AppHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import SegmentedControl from '../../components/settings/SegmentedControl';
import Loading from '../../components/Loading';
import { useTheme } from '../../context/ThemeContext';
import { AgencyStackParamList } from '../../types/navigation';
import {
  PRODUCT_STATUS_LABELS,
  PRODUCT_STATUSES,
  ProductStatus,
} from '../../types/product';
import {
  getErrorMessage,
  showErrorSnackbar,
  showSuccessSnackbar,
} from '../../utils/errorHandler';
import { radius, spacing } from '../../theme';

type Props = NativeStackScreenProps<AgencyStackParamList, 'ProductForm'>;

const ProductFormScreen = ({ navigation, route }: Props) => {
  const { colors } = useTheme();
  const { profile } = useAppwrite();
  const productId = route.params?.productId;
  const isEditing = Boolean(productId);
  const licenseVerified = Boolean(profile?.licenseVerified);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('');
  const [stock, setStock] = useState('');
  const [status, setStatus] = useState<ProductStatus>('active');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingProduct, setLoadingProduct] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Image state: `previewUri` is whatever should currently be shown (the
  // existing remote Storage URL when editing, or a local file:// uri right
  // after picking/taking a new photo). `pickedImage` is only set when the
  // user chose a *new* photo this session — that's the signal that we need
  // to upload something on save, rather than keep the existing image as-is.
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(
    null,
  );
  const [imageSource, setImageSource] = useState<'gallery' | 'camera' | null>(
    null,
  );
  const [pickingImage, setPickingImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Defense in depth: adding a *new* product must never be reachable by an
  // unverified agency, even via a direct route navigation. Editing an
  // existing (already legitimately listed) product is unaffected.
  useFocusEffect(
    useCallback(() => {
      if (!isEditing && profile && !licenseVerified) {
        showErrorSnackbar(
          'Verify your licence before you can add products.',
        );
        navigation.replace('LicenseVerification');
      }
    }, [isEditing, profile, licenseVerified, navigation]),
  );

  useEffect(() => {
    if (!productId) {
      return;
    }
    (async () => {
      try {
        const product = await productService.getProduct(productId);
        setName(product.name);
        setDescription(product.description ?? '');
        setPrice(String(product.price));
        setUnit(product.unit ?? '');
        setStock(String(product.stock));
        setStatus(product.status);
        setExistingImageUrl(product.imageUrl ?? null);
        setPreviewUri(product.imageUrl ?? null);
      } catch (err) {
        showErrorSnackbar(err, 'Unable to load this product.');
        navigation.goBack();
      } finally {
        setLoadingProduct(false);
      }
    })();
  }, [productId, navigation]);

  const applyPickedAsset = (asset: Asset | undefined) => {
    if (!asset?.uri) {
      return;
    }
    setPickedImage({
      uri: asset.uri,
      name: asset.fileName ?? `product-${Date.now()}.jpg`,
      type: asset.type ?? 'image/jpeg',
      size: asset.fileSize,
    });
    setPreviewUri(asset.uri);
  };

  const handleChooseFromGallery = async () => {
    try {
      setImageSource('gallery');
      setPickingImage(true);
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1600,
        maxHeight: 1600,
        selectionLimit: 1,
      });
      if (result.didCancel) {
        return;
      }
      if (result.errorCode) {
        showErrorSnackbar(
          result.errorMessage ?? 'Unable to open your photo library.',
        );
        return;
      }
      applyPickedAsset(result.assets?.[0]);
    } finally {
      setPickingImage(false);
      setImageSource(null);

    }
  };

  const handleTakePhoto = async () => {
    try {
      setImageSource('camera');
      setPickingImage(true);
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1600,
        maxHeight: 1600,
        saveToPhotos: false,
      });
      if (result.didCancel) {
        return;
      }
      if (result.errorCode) {
        showErrorSnackbar(
          result.errorCode === 'permission'
            ? 'Camera permission is required to take a photo.'
            : result.errorMessage ?? 'Unable to open the camera.',
        );
        return;
      }
      applyPickedAsset(result.assets?.[0]);
    } finally {
      setPickingImage(false);
      setImageSource(null);
    }
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!name.trim()) {
      next.name = 'Product name is required';
    }

    const priceValue = Number(price);
    if (!price.trim() || Number.isNaN(priceValue) || priceValue <= 0) {
      next.price = 'Enter a valid price';
    }

    const stockValue = Number(stock);
    if (!stock.trim() || Number.isNaN(stockValue) || stockValue < 0) {
      next.stock = 'Enter a valid stock quantity';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!profile?.userId) {
      return;
    }
    if (!isEditing && !licenseVerified) {
      showErrorSnackbar(
        'Verify your licence before you can add products.',
      );
      navigation.replace('LicenseVerification');
      return;
    }
    if (!validate()) {
      return;
    }

    try {
      setSaving(true);

      // Only upload if the user actually picked a new photo this session;
      // otherwise keep whatever image URL the product already has.
      let imageUrl = existingImageUrl ?? undefined;
      if (pickedImage) {
        setUploadingImage(true);
        try {
          imageUrl = await storageService.uploadProductImage(
            pickedImage,
            profile.userId,
          );
        } finally {
          setUploadingImage(false);
        }
      }

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        unit: unit.trim() || undefined,
        stock: Number(stock),
        imageUrl,
        status,
      };

      if (isEditing && productId) {
        await productService.updateProduct(productId, payload);
        showSuccessSnackbar('Product updated');
      } else {
        await productService.createProduct({
          ...payload,
          sellerId: profile.userId,
        });
        showSuccessSnackbar('Product added');
      }

      // Best-effort: if we just replaced an existing image, clean up the
      // old file now that the product has been saved successfully. Never
      // block or fail the save because of this.
      if (pickedImage && existingImageUrl && existingImageUrl !== imageUrl) {
        storageService.deleteProductImageByUrl(existingImageUrl);
      }

      navigation.goBack();
    } catch (err) {
      showErrorSnackbar(err, getErrorMessage(err, 'Unable to save product.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!productId) {
      return;
    }
    Alert.alert(
      'Delete product',
      'This product will be removed from your catalog. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await productService.deleteProduct(productId);
              // Best-effort: don't leave the product's image orphaned in Storage.
              storageService.deleteProductImageByUrl(existingImageUrl);
              showSuccessSnackbar('Product deleted');
              navigation.goBack();
            } catch (err) {
              showErrorSnackbar(err, 'Unable to delete product.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (loadingProduct) {
    return <Loading message="Loading product..." />;
  }

  const imageBusy = pickingImage || uploadingImage;

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
              title={isEditing ? 'Edit Product' : 'Add Product'}
              onBack={() => navigation.goBack()}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Product Photo
            </Text>

            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.preview} />
            ) : (
              <View
                style={[
                  styles.preview,
                  styles.previewPlaceholder,
                  { backgroundColor: colors.surfaceSecondary },
                ]}>
                <MaterialIcons
                  name="medication"
                  size={40}
                  color={colors.textSecondary}
                />
              </View>
            )}

            <View style={styles.imageActions}>
              <Button
                title="Choose from Gallery"
                variant="secondary"
                onPress={handleChooseFromGallery}
                loading={imageSource === 'gallery'}
                disabled={imageBusy}
                style={styles.flex1}
              />

              <Button
                title="Take Photo"
                variant="secondary"
                onPress={handleTakePhoto}
                loading={imageSource === 'camera'}
                disabled={imageBusy}
                style={styles.flex1}
              />
            </View>

            <Input
              label="Product Name"
              placeholder="e.g. Paracetamol 500mg"
              value={name}
              onChangeText={text => {
                setName(text);
                setErrors(prev => ({ ...prev, name: '' }));
              }}
              error={errors.name}
            />

            <Input
              label="Description"
              placeholder="Pack details, composition, etc."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={styles.multiline}
            />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Input
                  label="Price"
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={price}
                  onChangeText={text => {
                    setPrice(text);
                    setErrors(prev => ({ ...prev, price: '' }));
                  }}
                  error={errors.price}
                />
              </View>
              <View style={styles.flex1}>
                <Input
                  label="Unit"
                  placeholder="strip / box"
                  value={unit}
                  onChangeText={setUnit}
                />
              </View>
            </View>

            <Input
              label="Stock Quantity"
              placeholder="0"
              keyboardType="number-pad"
              value={stock}
              onChangeText={text => {
                setStock(text);
                setErrors(prev => ({ ...prev, stock: '' }));
              }}
              error={errors.stock}
            />

            <View style={styles.statusWrap}>
              <SegmentedControl
                value={status}
                onChange={setStatus}
                options={PRODUCT_STATUSES.map(value => ({
                  value,
                  label: PRODUCT_STATUS_LABELS[value],
                }))}
              />
            </View>

            <Button
              title={isEditing ? 'Save Changes' : 'Add Product'}
              onPress={handleSave}
              loading={saving}
              disabled={imageBusy}
              style={styles.saveButton}
            />

            {isEditing ? (
              <Button
                title="Delete Product"
                variant="danger"
                onPress={handleDelete}
                loading={deleting}
                style={styles.deleteButton}
              />
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ProductFormScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  flex1: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  previewPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top', paddingTop: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  statusWrap: { marginBottom: spacing.lg },
  saveButton: { marginTop: spacing.sm },
  deleteButton: { marginTop: spacing.md },
});
import { AppwriteException, ID, Permission, Role, Storage } from 'appwrite';
import {
  APPWRITE_ENDPOINT,
  APPWRITE_PRODUCT_IMAGES_BUCKET_ID,
  APPWRITE_PROJECT_ID,
  appwriteClient,
} from './client';

export type PickedImage = {
  uri: string;
  name: string;
  type: string;
  size?: number;
};

type UploadedFileResponse = {
  $id?: string;
  message?: string;
  type?: string;
  code?: number;
};

class StorageService {
  private storage: Storage;

  constructor() {
    // Same client (and therefore same session) as every other Appwrite
    // service. Used for URL building and deletes only; the upload itself is
    // done natively below.
    this.storage = new Storage(appwriteClient);
  }

  private ownerPermissions(sellerId: string): string[] {
    return [
      Permission.read(Role.users()),
      Permission.update(Role.user(sellerId)),
      Permission.delete(Role.user(sellerId)),
    ];
  }

  /**
   * Uploads a picked/captured image to the product images bucket and returns
   * its public "view" URL.
   *
   * Why this does not call `storage.createFile()`:
   * the Appwrite Web SDK only accepts a browser `File` object, and React
   * Native cannot build one from a file path. React Native's own networking
   * layer, however, natively streams any `{ uri, name, type }` part of a
   * FormData body straight from disk. So we send the same multipart request
   * the SDK would send (POST /storage/buckets/{bucketId}/files), using the
   * SDK client's own headers. The session cookie is attached by React
   * Native's native cookie jar, exactly as for every other SDK call.
   */
  async uploadProductImage(
    image: PickedImage,
    sellerId: string,
  ): Promise<string> {
    if (!image.uri) {
      throw new Error('No image selected.');
    }

    const fileId = ID.unique();

    const form = new FormData();
    form.append('fileId', fileId);
    form.append('file', {
      uri: image.uri,
      name: image.name,
      type: image.type,
    });
    this.ownerPermissions(sellerId).forEach(permission => {
      form.append('permissions[]', permission);
    });

    const response = await fetch(
      `${APPWRITE_ENDPOINT}/storage/buckets/${encodeURIComponent(
        APPWRITE_PRODUCT_IMAGES_BUCKET_ID,
      )}/files`,
      {
        method: 'POST',
        headers: {
          ...appwriteClient.headers,
          'X-Appwrite-Project': APPWRITE_PROJECT_ID,
          Accept: 'application/json',
          // No Content-Type here on purpose: React Native adds
          // "multipart/form-data; boundary=..." itself.
        },
        body: form,
        credentials: 'include',
      },
    );

    let body: UploadedFileResponse = {};
    try {
      body = (await response.json()) as UploadedFileResponse;
    } catch {
      // Non-JSON body; handled by the status check below.
    }

    if (!response.ok) {
      throw new AppwriteException(
        body.message ?? `Image upload failed (HTTP ${response.status}).`,
        response.status,
        body.type ?? 'storage_upload_failed',
      );
    }

    return this.storage
      .getFileView({
        bucketId: APPWRITE_PRODUCT_IMAGES_BUCKET_ID,
        fileId: body.$id ?? fileId,
      })
      .toString();
  }

  private extractFileId(imageUrl: string): string | null {
    const match = imageUrl.match(/\/files\/([^/]+)\/view/);
    return match ? match[1] : null;
  }

  async deleteProductImageByUrl(
    imageUrl: string | null | undefined,
  ): Promise<void> {
    if (!imageUrl) {
      return;
    }

    const fileId = this.extractFileId(imageUrl);

    if (!fileId) {
      return;
    }

    try {
      await this.storage.deleteFile({
        bucketId: APPWRITE_PRODUCT_IMAGES_BUCKET_ID,
        fileId,
      });
    } catch {
      // Image cleanup is best-effort.
    }
  }
}

const storageService = new StorageService();

export default storageService;
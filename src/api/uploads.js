import axiosInstance from '../config/axios';

const SUPPORTED_UPLOAD_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/webp',
  'video/mp4',
  'video/quicktime',
]);
const DEFAULT_UPLOAD_TIMEOUT_MS = 120_000;
const MANAGED_STORAGE_REFERENCE =
  /^uploads\/[a-f0-9]{24}\/[a-z0-9-]+\/[a-zA-Z0-9-]+\.[a-z0-9]+$/;
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);

const secureUploadUrl = (value) => {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('Vybe returned an invalid upload destination.');
  }
  const localDevelopmentUrl = (
    import.meta.env.DEV
    && parsed.protocol === 'http:'
    && LOCAL_HOSTS.has(parsed.hostname)
  );
  if (parsed.protocol !== 'https:' && !localDevelopmentUrl) {
    throw new Error('Vybe returned an insecure upload destination.');
  }
  if (parsed.username || parsed.password) {
    throw new Error('Vybe returned an invalid upload destination.');
  }
  return parsed.toString();
};

const stableStorageReference = (data) => {
  const reference = data?.storageReference || data?.key;
  if (
    typeof data?.key !== 'string'
    || reference !== data.key
    || !MANAGED_STORAGE_REFERENCE.test(reference)
  ) {
    throw new Error('Vybe returned an invalid managed-media reference.');
  }
  return reference;
};

export const uploadMedia = async (
  file,
  {
    fetchImpl = globalThis.fetch,
    timeoutMs = DEFAULT_UPLOAD_TIMEOUT_MS,
  } = {},
) => {
  if (!(file instanceof Blob) || file.size === 0) {
    throw new Error('Choose a non-empty file to upload.');
  }
  if (!SUPPORTED_UPLOAD_TYPES.has(file.type)) {
    throw new Error('That file type is not supported.');
  }
  if (
    typeof fetchImpl !== 'function'
    || !Number.isSafeInteger(timeoutMs)
    || timeoutMs < 1
  ) {
    throw new Error('Media upload is not configured correctly.');
  }

  const { data } = await axiosInstance.post('/upload/presign', {
    contentType: file.type,
    sizeBytes: file.size,
  });
  if (!data?.uploadUrl || !['POST', 'PUT'].includes(data?.uploadMethod)) {
    throw new Error('Vybe did not return a valid upload destination.');
  }
  const uploadUrl = secureUploadUrl(data.uploadUrl);
  const storageReference = stableStorageReference(data);

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    let request;
    if (data.uploadMethod === 'POST') {
      if (
        !data.uploadFields
        || typeof data.uploadFields !== 'object'
        || Array.isArray(data.uploadFields)
        || !Object.keys(data.uploadFields).length
        || Object.values(data.uploadFields).some(value => typeof value !== 'string')
      ) {
        throw new Error('Vybe returned invalid upload form fields.');
      }
      const form = new FormData();
      Object.entries(data.uploadFields).forEach(([field, value]) => {
        form.append(field, value);
      });
      form.append('file', file);
      request = {
        method: 'POST',
        body: form,
      };
    } else {
      request = {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      };
    }
    const response = await fetchImpl(uploadUrl, {
      ...request,
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}.`);
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(
        'Upload timed out. Check your connection and try again.',
        { cause: error },
      );
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }

  // Signed preview URLs expire and must never be persisted in catalog data.
  return storageReference;
};

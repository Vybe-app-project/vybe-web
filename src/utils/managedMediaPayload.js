/**
 * API responses contain short-lived, signed preview URLs. Those URLs are
 * presentation-only capabilities and must never be written back to catalog
 * records. Omit an unchanged image and only send a newly uploaded stable key.
 */
export const withNewManagedImage = (payload, uploadedKey) => {
  const { image: _previewOnlyImage, ...safePayload } = payload;

  if (uploadedKey) {
    safePayload.image = uploadedKey;
  }

  return safePayload;
};

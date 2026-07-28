import axiosInstance from '../config/axios';

const SUPPORTED_UPLOAD_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/webp',
  'video/mp4',
  'video/quicktime',
]);

export const uploadMedia = async (file) => {
  if (!(file instanceof Blob) || file.size === 0) {
    throw new Error('Choose a non-empty file to upload.');
  }
  if (!SUPPORTED_UPLOAD_TYPES.has(file.type)) {
    throw new Error('That file type is not supported.');
  }

  const { data } = await axiosInstance.post('/upload/presign', {
    contentType: file.type,
  });
  if (!data?.uploadUrl || !data?.publicUrl) {
    throw new Error('Vybe did not return a valid upload destination.');
  }

  const response = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}.`);
  }

  return data.publicUrl;
};

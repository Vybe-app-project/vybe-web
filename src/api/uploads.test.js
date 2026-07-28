import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('../config/axios', () => ({
  default: { post },
}));

import { uploadMedia } from './uploads';

describe('uploadMedia', () => {
  const ownerId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    post.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rejects unsupported media before requesting an upload URL', async () => {
    const file = new File(['text'], 'notes.txt', { type: 'text/plain' });
    await expect(uploadMedia(file)).rejects.toThrow('not supported');
    expect(post).not.toHaveBeenCalled();
  });

  it('uploads through the authenticated presign contract', async () => {
    post.mockResolvedValue({
      data: {
        uploadUrl: 'https://uploads.example.invalid/signed-destination',
        uploadMethod: 'PUT',
        publicUrl: 'https://media.example.invalid/uploads/image.jpg',
        key: `uploads/${ownerId}/media/image.jpg`,
        storageReference: `uploads/${ownerId}/media/image.jpg`,
      },
    });
    fetch.mockResolvedValue({ ok: true, status: 201 });
    const file = new File(['image'], 'image.jpg', { type: 'image/jpeg' });

    await expect(uploadMedia(file)).resolves.toBe(
      `uploads/${ownerId}/media/image.jpg`,
    );
    expect(post).toHaveBeenCalledWith('/upload/presign', {
      contentType: 'image/jpeg',
      sizeBytes: file.size,
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://uploads.example.invalid/signed-destination',
      expect.objectContaining({
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': 'image/jpeg' },
        credentials: 'omit',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('submits all constrained S3 POST fields before the file', async () => {
    post.mockResolvedValue({
      data: {
        uploadUrl: 'https://bucket.example.invalid',
        uploadMethod: 'POST',
        uploadFields: {
          key: `uploads/${ownerId}/media/image.png`,
          policy: 'signed-policy',
        },
        publicUrl: 'https://api.example.invalid/api/media/content/read-token',
        key: `uploads/${ownerId}/media/image.png`,
      },
    });
    fetch.mockResolvedValue({ ok: true, status: 204 });
    const file = new File(['image'], 'image.png', { type: 'image/png' });

    await expect(uploadMedia(file)).resolves.toBe(
      `uploads/${ownerId}/media/image.png`,
    );
    const request = fetch.mock.calls[0][1];
    expect(request.method).toBe('POST');
    expect(request.headers).toBeUndefined();
    expect(request.body).toBeInstanceOf(FormData);
    expect(request.body.get('key')).toBe(`uploads/${ownerId}/media/image.png`);
    expect(request.body.get('policy')).toBe('signed-policy');
    expect(request.body.get('file')).toBe(file);
  });

  it('does not return a public URL when object upload fails', async () => {
    post.mockResolvedValue({
      data: {
        uploadUrl: 'https://uploads.example.invalid/signed-destination',
        uploadMethod: 'PUT',
        publicUrl: 'https://media.example.invalid/uploads/image.jpg',
        key: `uploads/${ownerId}/media/image.jpg`,
      },
    });
    fetch.mockResolvedValue({ ok: false, status: 403 });
    const file = new File(['image'], 'image.jpg', { type: 'image/jpeg' });

    await expect(uploadMedia(file)).rejects.toThrow('status 403');
  });

  it('rejects an unstable or external reference before uploading bytes', async () => {
    post.mockResolvedValue({
      data: {
        uploadUrl: 'https://uploads.example.invalid/signed-destination',
        uploadMethod: 'PUT',
        key: `uploads/${ownerId}/media/image.jpg`,
        storageReference: 'https://media.example.invalid/temporary-read-url',
      },
    });
    const file = new File(['image'], 'image.jpg', { type: 'image/jpeg' });

    await expect(uploadMedia(file)).rejects.toThrow('managed-media reference');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('aborts an upload that exceeds the finite media timeout', async () => {
    vi.useFakeTimers();
    post.mockResolvedValue({
      data: {
        uploadUrl: 'https://uploads.example.invalid/signed-destination',
        uploadMethod: 'PUT',
        key: `uploads/${ownerId}/media/image.jpg`,
      },
    });
    fetch.mockImplementation((_url, request) => new Promise((_resolve, reject) => {
      request.signal.addEventListener('abort', () => {
        reject(new DOMException('Aborted', 'AbortError'));
      });
    }));
    const file = new File(['image'], 'image.jpg', { type: 'image/jpeg' });
    const upload = uploadMedia(file, { timeoutMs: 25 });
    const rejection = expect(upload).rejects.toThrow('Upload timed out');

    await vi.advanceTimersByTimeAsync(25);
    await rejection;
  });
});

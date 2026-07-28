import { beforeEach, describe, expect, it, vi } from 'vitest';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('../config/axios', () => ({
  default: { post },
}));

import { uploadMedia } from './uploads';

describe('uploadMedia', () => {
  beforeEach(() => {
    post.mockReset();
    vi.stubGlobal('fetch', vi.fn());
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
        publicUrl: 'https://media.example.invalid/uploads/image.jpg',
      },
    });
    fetch.mockResolvedValue({ ok: true, status: 201 });
    const file = new File(['image'], 'image.jpg', { type: 'image/jpeg' });

    await expect(uploadMedia(file)).resolves.toBe(
      'https://media.example.invalid/uploads/image.jpg',
    );
    expect(post).toHaveBeenCalledWith('/upload/presign', {
      contentType: 'image/jpeg',
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://uploads.example.invalid/signed-destination',
      expect.objectContaining({
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': 'image/jpeg' },
      }),
    );
  });

  it('does not return a public URL when object upload fails', async () => {
    post.mockResolvedValue({
      data: {
        uploadUrl: 'https://uploads.example.invalid/signed-destination',
        publicUrl: 'https://media.example.invalid/uploads/image.jpg',
      },
    });
    fetch.mockResolvedValue({ ok: false, status: 403 });
    const file = new File(['image'], 'image.jpg', { type: 'image/jpeg' });

    await expect(uploadMedia(file)).rejects.toThrow('status 403');
  });
});

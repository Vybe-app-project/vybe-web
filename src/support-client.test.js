import { fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSupportFormController } from '../support-client';

const fixture = () => {
  window.localStorage.clear();
  document.head.innerHTML = '<meta name="vybe-api-base-url" content="https://api.example.test/api">';
  document.body.innerHTML = `
    <form id="support-form">
      <input name="fullName" value="  Vybe Member  " required>
      <input name="email" type="email" value="  MEMBER@EXAMPLE.TEST  " required>
      <textarea name="message" required>  I need help with my account.  </textarea>
      <button id="submit-button" type="submit">Send private request</button>
      <p id="support-status"></p>
      <button id="retry-button" type="button" hidden>Retry this request</button>
    </form>
  `;
};

describe('public support form', () => {
  beforeEach(fixture);
  afterEach(() => vi.restoreAllMocks());

  it('posts only normalized support fields and renders success', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: vi.fn().mockResolvedValue({ success: true }),
    });
    createSupportFormController({ documentRef: document, fetchImpl });

    fireEvent.submit(document.getElementById('support-form'));

    await waitFor(() => expect(fetchImpl).toHaveBeenCalledOnce());
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.example.test/api/support/message',
      expect.objectContaining({
        method: 'POST',
        credentials: 'omit',
        body: JSON.stringify({
          fullName: 'Vybe Member',
          email: 'member@example.test',
          message: 'I need help with my account.',
        }),
      }),
    );
    await waitFor(() => {
      expect(document.getElementById('support-status')).toHaveAttribute('data-state', 'success');
    });
  });

  it('keeps the failed payload in memory and retries without local persistence', async () => {
    const fetchImpl = vi.fn()
      .mockRejectedValueOnce(new TypeError('Network unavailable'))
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({ success: true }),
      });
    createSupportFormController({ documentRef: document, fetchImpl });

    fireEvent.submit(document.getElementById('support-form'));
    await waitFor(() => {
      expect(document.getElementById('retry-button')).not.toHaveAttribute('hidden');
    });

    fireEvent.click(document.getElementById('retry-button'));
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
    await waitFor(() => {
      expect(document.getElementById('support-status')).toHaveAttribute('data-state', 'success');
    });
    expect(window.localStorage.length).toBe(0);
  });

  it('rejects an insecure non-local API configuration before collecting a request', () => {
    document
      .querySelector('meta[name="vybe-api-base-url"]')
      .setAttribute('content', 'http://api.example.test/api');

    expect(() => createSupportFormController({
      documentRef: document,
      fetchImpl: vi.fn(),
    })).toThrow('Support is not configured securely.');
  });
});

import fs from 'node:fs';

describe('published privacy policy matches the shipped authentication surface', () => {
  const policy = fs.readFileSync('privacy-policy.html', 'utf8');

  it('does not claim unshipped Google or Apple sign-in collection', () => {
    expect(policy).not.toMatch(/identifiers from a supported sign-in provider/i);
    expect(policy).not.toMatch(/Google or Apple when you choose their sign-in/i);
    expect(policy).not.toMatch(/sign-in provider you choose/i);
  });

  it('still discloses maps and push processors actually used by the app', () => {
    expect(policy).toContain('Google Maps, Places, and Geocoding');
    expect(policy).toContain('Firebase Cloud Messaging');
    expect(policy).toContain('Apple Push Notification Service');
  });
});

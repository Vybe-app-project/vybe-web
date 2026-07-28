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

  it('describes livestream relay processing and opt-in community meals', () => {
    expect(policy).toMatch(/livestream peer connections use a Vybe-operated relay/i);
    expect(policy).toMatch(/does not record or persist the livestream audio or video/i);
    expect(policy).toMatch(/logged meals are private by default/i);
    expect(policy).toMatch(/health notes, meal-scan diagnostics, and confidence metadata are not included/i);
  });

  it('accurately separates authored chat deletion from other participants content', () => {
    expect(policy).toMatch(/messages and managed media that you authored are removed/i);
    expect(policy).toMatch(/messages authored by other participants remain available/i);
  });
});

const { resolveClientUrl, isPlaceholderClientUrl } = require('../lib/clientUrl');

// The Stripe success/cancel redirects are built from CLIENT_URL. A placeholder
// copied out of .env.example sends paying users to a host nobody owns, where
// Vercel answers 404 — the failure only shows up after a real charge, so the
// value must be rejected before a session is created.
describe('resolveClientUrl', () => {
  test('accepts a real origin', () => {
    expect(resolveClientUrl({ CLIENT_URL: 'https://fundflow.example.net', NODE_ENV: 'production' }))
      .toBe('https://fundflow.example.net');
  });

  test('strips a trailing slash and surrounding whitespace', () => {
    expect(resolveClientUrl({ CLIENT_URL: '  https://fundflow.example.net/  ', NODE_ENV: 'production' }))
      .toBe('https://fundflow.example.net');
  });

  test('rejects the .env.example placeholder in every environment', () => {
    expect(resolveClientUrl({ CLIENT_URL: 'https://your-client.vercel.app', NODE_ENV: 'production' })).toBeNull();
    expect(resolveClientUrl({ CLIENT_URL: 'https://your-client.vercel.app', NODE_ENV: 'development' })).toBeNull();
  });

  test('rejects docs placeholders and non-http values', () => {
    expect(resolveClientUrl({ CLIENT_URL: '<your-app-url>', NODE_ENV: 'production' })).toBeNull();
    expect(resolveClientUrl({ CLIENT_URL: 'https://example.com', NODE_ENV: 'production' })).toBeNull();
    expect(resolveClientUrl({ CLIENT_URL: 'ftp://fundflow.example.net', NODE_ENV: 'production' })).toBeNull();
    expect(resolveClientUrl({ CLIENT_URL: 'not a url', NODE_ENV: 'production' })).toBeNull();
  });

  test('falls back to the local dev origin when unset outside production', () => {
    expect(resolveClientUrl({ NODE_ENV: 'development' })).toBe('http://localhost:3000');
  });

  test('treats unset as fatal in production', () => {
    expect(resolveClientUrl({ NODE_ENV: 'production' })).toBeNull();
  });

  test('keeps a plain localhost origin usable', () => {
    expect(resolveClientUrl({ CLIENT_URL: 'http://localhost:3000', NODE_ENV: 'production' }))
      .toBe('http://localhost:3000');
  });
});

describe('isPlaceholderClientUrl', () => {
  test('does not flag a real production origin', () => {
    expect(isPlaceholderClientUrl('https://fundflow-app.vercel.app')).toBe(false);
  });
});

/**
 * When a response ends the session.
 *
 * A sign-in attempt that fails is not a broken session: the visitor is on
 * the login screen with a wrong password, and sending them to the login
 * screen again would only hide the message.
 *
 * Everything else is different. A 401 means the token is no longer good, and
 * a 404 from the session check means the account behind a valid token is
 * gone — a deleted account, or a demo account removed from the database.
 * Both end the session: the navbar must stop showing an account that does
 * not exist.
 */

// The endpoints a visitor calls to become someone. A failure there is an
// answer, not a broken session.
const AUTH_ATTEMPT_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/google',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

const SESSION_CHECK_PATH = '/api/auth/me';

export function sessionResponseShouldEndSession({ status, url = '' }) {
  const isAuthAttempt = AUTH_ATTEMPT_PATHS.some((path) => url.includes(path));
  if (isAuthAttempt) return false;

  if (status === 401) return true;
  if (status === 404 && url.includes(SESSION_CHECK_PATH)) return true;

  return false;
}

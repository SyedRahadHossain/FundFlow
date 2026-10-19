// Single source of truth for outbound developer links.
// The PRD requires the navbar's "Join as Developer" item to point at the client
// repository, and the footer social icons to point at the developer's profiles.
//
// This project ships as a single repository holding both `client/` and
// `server/`, so the client link resolves to the `client/` subtree.
//
// NOTE: LINKEDIN_URL and FACEBOOK_URL are still placeholders and must be
// replaced before deploying — see TASKS.md item 8. As written they point at
// someone else's profile.
export const CLIENT_REPO_URL =
  'https://github.com/SyedRahadHossain/FundFlow/tree/main/client';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/RAHAD'; // TODO: replace before deploy
export const FACEBOOK_URL = 'https://www.facebook.com/RAHAD'; // TODO: replace before deploy
export const GITHUB_URL = 'https://github.com/SyedRahadHossain';

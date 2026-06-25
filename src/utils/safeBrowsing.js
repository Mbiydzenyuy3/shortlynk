import { logWarn } from './logger.js';

const URLHAUS_ENDPOINT = 'https://urlhaus-api.abuse.ch/v1/url/';
const GOOGLE_ENDPOINT = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

// Check URLhaus (abuse.ch) — free, no API key required
async function checkURLhaus(url) {
  const body = new URLSearchParams({ url });
  const response = await fetch(URLHAUS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!response.ok) return;
  const data = await response.json();
  if (data.query_status === 'is_listed') {
    throw new Error('UNSAFE_URL');
  }
}

// Check Google Safe Browsing — optional, requires GOOGLE_SAFE_BROWSING_API_KEY
async function checkGoogleSafeBrowsing(url) {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) return;

  const response = await fetch(`${GOOGLE_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client: { clientId: 'shortlynk', clientVersion: '1.0' },
      threatInfo: {
        threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ url }],
      },
    }),
  });
  if (!response.ok) return;
  const data = await response.json();
  if (data.matches && data.matches.length > 0) {
    throw new Error('UNSAFE_URL');
  }
}

export async function checkUrlSafety(url) {
  try {
    await checkURLhaus(url);
    await checkGoogleSafeBrowsing(url);
  } catch (err) {
    if (err.message === 'UNSAFE_URL') throw err;
    logWarn('URL safety check failed — skipping:', err.message);
  }
}

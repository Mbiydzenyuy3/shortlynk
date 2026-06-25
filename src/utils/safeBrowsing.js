import { logWarn } from './logger.js';

const SAFE_BROWSING_ENDPOINT = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

export async function checkUrlSafety(url) {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

  if (!apiKey) {
    logWarn('Safe Browsing key missing — skipping check');
    return;
  }

  try {
    const response = await fetch(`${SAFE_BROWSING_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: { clientId: 'shortlynk', clientVersion: '1.0' },
        threatInfo: {
          threatTypes: [
            'MALWARE',
            'SOCIAL_ENGINEERING',
            'UNWANTED_SOFTWARE',
            'POTENTIALLY_HARMFUL_APPLICATION',
          ],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }],
        },
      }),
    });

    const data = await response.json();

    if (data.matches && data.matches.length > 0) {
      throw new Error('UNSAFE_URL');
    }
  } catch (err) {
    if (err.message === 'UNSAFE_URL') throw err;
    logWarn('Safe Browsing check failed — skipping:', err.message);
  }
}

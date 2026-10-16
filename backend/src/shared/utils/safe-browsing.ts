import logger from './logger.js';
import { config } from '../../config/index.js';
import { AppError } from './app-error.js';

const URLHAUS_ENDPOINT = 'https://urlhaus-api.abuse.ch/v1/url/';
const GOOGLE_ENDPOINT = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

async function checkURLhaus(url: string): Promise<void> {
  const body = new URLSearchParams({ url });
  const response = await fetch(URLHAUS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!response.ok) return;
  const data = (await response.json()) as { query_status?: string };
  if (data.query_status === 'is_listed') {
    throw new AppError('This URL has been flagged as unsafe by Google Safe Browsing and cannot be shortened.', 400);
  }
}

async function checkGoogleSafeBrowsing(url: string): Promise<void> {
  const apiKey = config.GOOGLE_SAFE_BROWSING_API_KEY;
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
  const data = (await response.json()) as { matches?: unknown[] };
  if (data.matches && data.matches.length > 0) {
    throw new AppError('This URL has been flagged as unsafe by Google Safe Browsing and cannot be shortened.', 400);
  }
}

export async function checkUrlSafety(url: string): Promise<void> {
  try {
    await checkURLhaus(url);
    await checkGoogleSafeBrowsing(url);
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.warn({ err }, 'URL safety check failed — skipping');
  }
}

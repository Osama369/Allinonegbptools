const fetch = require('node-fetch');
require('dotenv').config();

// Default mapping of siteKeys to one or more domains to prefer when choosing search results.
// Each value is an array of domains (allows country TLDs, mobile subdomains, etc.).
const DEFAULT_SITE_DOMAINS = {
  google_my_business: ['google.com', 'maps.google.com'],
  yelp: ['yelp.com'],
  healthgrades: ['healthgrades.com'],
  facebook: ['facebook.com', 'm.facebook.com', 'business.facebook.com'],
  linkedin: ['linkedin.com'],
  yellowpages: ['yellowpages.com'],
  apple_maps: ['apple.com', 'maps.apple.com'],
  bing_places: ['bing.com'],
};

// Allow overriding the defaults via an environment variable containing JSON.
// Example (in .env):
// GOOGLE_CSE_SITE_DOMAINS='{"yelp":["yelp.com","yelp.co.uk"],"google_my_business":["google.com"]}'
let SITE_DOMAINS = DEFAULT_SITE_DOMAINS;
if (process.env.GOOGLE_CSE_SITE_DOMAINS) {
  try {
    const parsed = JSON.parse(process.env.GOOGLE_CSE_SITE_DOMAINS);
    // Normalize to arrays
    for (const k of Object.keys(parsed)) {
      if (typeof parsed[k] === 'string') parsed[k] = [parsed[k]];
    }
    SITE_DOMAINS = { ...DEFAULT_SITE_DOMAINS, ...parsed };
  } catch (err) {
    console.warn('searchService: Failed to parse GOOGLE_CSE_SITE_DOMAINS; using defaults', err.message);
  }
}

async function googleCseSearch(query, apiKey, cx) {
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query)}&num=5`;
  const res = await fetch(url, { timeout: 10000 });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Google CSE search failed: ${res.status} ${txt}`);
  }
  return res.json();
}

function hostnameMatchesDomain(hostname, domain) {
  if (!hostname || !domain) return false;
  hostname = hostname.toLowerCase();
  domain = domain.toLowerCase();
  // Exact match or subdomain (example: maps.google.com should match google.com)
  return hostname === domain || hostname.endsWith('.' + domain) || hostname.includes(domain);
}

function pickBestUrlFromCse(items, siteKey) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const domains = SITE_DOMAINS[siteKey];
  if (Array.isArray(domains) && domains.length > 0) {
    for (const domain of domains) {
      const match = items.find(i => {
        try {
          const host = new URL(i.link).hostname;
          return hostnameMatchesDomain(host, domain);
        } catch (e) {
          // fallback to substring match if URL parsing fails
          return i.link && i.link.toLowerCase().includes(domain.toLowerCase());
        }
      });
      if (match) return { url: match.link, snippet: match.snippet || match.title, confidence: 0.9, matchedDomain: domain };
    }
  }

  // No preferred-domain match — return top result with lower confidence
  const top = items[0];
  return { url: top.link, snippet: top.snippet || top.title, confidence: 0.6 };
}

/**
 * Find a listing URL using Google Custom Search. Expects environment vars:
 * GOOGLE_CSE_KEY and GOOGLE_CSE_CX
 */
async function findListingUrl({ searchQuery, siteKey }) {
  const apiKey = process.env.GOOGLE_CSE_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  if (!apiKey || !cx) throw new Error('GOOGLE_CSE_KEY or GOOGLE_CSE_CX not set in env');

  // Prefer scoping by the first configured domain for the siteKey when possible to improve precision
  const domains = SITE_DOMAINS[siteKey];
  const domainForQuery = Array.isArray(domains) && domains.length > 0 ? domains[0] : null;
  const query = domainForQuery ? `${searchQuery} site:${domainForQuery}` : searchQuery;

  const data = await googleCseSearch(query, apiKey, cx);
  const items = data.items || [];
  const picked = pickBestUrlFromCse(items, siteKey);
  return picked; // { url, snippet, confidence } or null
}

module.exports = { findListingUrl };

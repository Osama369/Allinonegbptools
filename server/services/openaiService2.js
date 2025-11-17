const fetch = require('node-fetch');
require('dotenv').config();

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4';

if (!OPENAI_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. OpenAI calls will fail until it is provided.');
}

async function generateCitationPlan(business) {
  // business: { name, category, address, phone, website, city, state, zip, description }
  const system = `You are an expert local SEO assistant. Return valid JSON only.`;

  // Strongly ask the assistant to include listingUrl and a searchQuery for fallback
  const user = `Business: ${JSON.stringify(business)}\n\nReturn a JSON object with two top-level keys: \n1) siteSelection: an array (up to 20) of site objects prioritized for this business and location. Each site object MUST include these fields: \n   - siteKey (string)\n   - siteName (string)\n   - score (integer 0-100)\n   - reason (string)\n   - listingUrl (string or null) // exact live URL to the business listing on that site, if known. If unknown, set null.\n   - searchQuery (string) // a concise search query we can use to find the listing (e.g. 'Baker\'s Corner Coffee Springfield IL Google Maps')\n   - verificationRequired (boolean)\n   - verificationMethod (string: 'phone'|'postcard'|'email'|'none')\n   - confidence (number 0.0-1.0)\n2) sitePayloads: an object keyed by siteKey containing site-specific fields {title, description, tags, keywords}.\n\nIf you cannot find a listingUrl, set listingUrl: null and provide the best searchQuery. Keep descriptions <= 300 chars. Return only valid JSON (do not wrap in markdown). If you need to include debug text, place it in a top-level key named rawDebug.\nExample schema:\n{\n  "siteSelection": [ {"siteKey":"google_my_business","siteName":"Google My Business","score":98,"reason":"Most important for local visibility","listingUrl":"https://maps.google.com/?cid=...","searchQuery":"Baker's Corner Coffee Springfield IL Google Maps","verificationRequired":true,"verificationMethod":"phone","confidence":0.95} ],\n  "sitePayloads": { "google_my_business": { "title": "...", "description": "...", "tags": ["..."], "keywords": ["..."] } }\n}\n`;

  const body = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    temperature: 0.2,
    max_tokens: 1200
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI request failed: ${res.status} ${txt}`);
  }

  const data = await res.json();

  const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content) throw new Error('OpenAI returned no content');

  // Helper: extract URLs from text
  const extractUrls = (text) => {
    const urlRegex = /https?:\/\/[^\s)"'<>]+/gi;
    const matches = text.match(urlRegex) || [];
    return matches.map(u => u.trim());
  };

  // Helper: try to parse JSON robustly
  let parsed = null;
  try {
    const jsonStart = content.indexOf('{');
    const jsonText = jsonStart >= 0 ? content.slice(jsonStart) : content;
    parsed = JSON.parse(jsonText);
  } catch (err) {
    try {
      // Attempt to extract the first {...} block
      const m = content.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    } catch (err2) {
      parsed = null;
    }
  }

  // If parsed failed, return raw content and extracted URLs for debugging and possible post-processing
  const urlsFound = extractUrls(content);
  if (!parsed) return { raw: content, urls: urlsFound };

  // Ensure expected structure
  parsed.siteSelection = Array.isArray(parsed.siteSelection) ? parsed.siteSelection : [];
  parsed.sitePayloads = parsed.sitePayloads || {};

  // Enrich siteSelection with listingUrl where possible using URLs found in the assistant content
  const usedUrls = new Set();
  for (const s of parsed.siteSelection) {
    if (!s.listingUrl) {
      // try to match urls by siteKey or siteName
      const key = (s.siteKey || '').toLowerCase();
      const name = (s.siteName || '').toLowerCase().replace(/\s+/g, '');
      let found = urlsFound.find(u => {
        const low = u.toLowerCase();
        return (key && low.includes(key)) || (name && low.includes(name));
      });
      if (!found) {
        // fallback: first unused URL
        found = urlsFound.find(u => !usedUrls.has(u));
      }
      if (found) {
        s.listingUrl = found;
        usedUrls.add(found);
      } else {
        s.listingUrl = null;
      }
    }
  }

  // Attach raw content for debugging if needed
  parsed.raw = content;
  return parsed;
}

module.exports = { generateCitationPlan };
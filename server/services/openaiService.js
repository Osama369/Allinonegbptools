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

  // Helper: validate URL
  const isValidUrl = (s) => {
    if (!s || typeof s !== 'string') return false;
    try {
      const u = new URL(s.trim());
      return ['http:', 'https:'].includes(u.protocol);
    } catch (e) {
      return false;
    }
  };

  // Helper: extract first JSON block
  const extractFirstJsonBlock = (text) => {
    if (!text || typeof text !== 'string') return null;
    const m = text.match(/\{[\s\S]*\}/);
    return m ? m[0] : null;
  };

  // Helper: sanitize a single siteSelection entry
  const sanitizeSiteEntry = (raw) => {
    const out = {};
    out.siteKey = raw && raw.siteKey ? String(raw.siteKey).trim() : null;
    out.siteName = raw && raw.siteName ? String(raw.siteName).trim() : (out.siteKey || null);
    out.score = raw && (raw.score === 0 || raw.score) ? Number(raw.score) : null;
    out.reason = raw && raw.reason ? String(raw.reason).trim() : '';
    out.searchQuery = raw && raw.searchQuery ? String(raw.searchQuery).trim() : null;
    out.listingUrl = raw && raw.listingUrl && isValidUrl(raw.listingUrl) ? String(raw.listingUrl).trim() : null;
    // allow string 'null' to be treated as null
    if (out.listingUrl === 'null') out.listingUrl = null;
    out.verificationRequired = raw && (raw.verificationRequired === true || raw.verificationRequired === 'true') ? true : false;
    out.verificationMethod = raw && raw.verificationMethod ? String(raw.verificationMethod).trim() : null;
    out.confidence = raw && (raw.confidence === 0 || raw.confidence) ? Number(raw.confidence) : null;
    return out;
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
      const block = extractFirstJsonBlock(content);
      if (block) parsed = JSON.parse(block);
    } catch (err2) {
      parsed = null;
    }
  }

  // If parsed failed, return raw content and extracted URLs for debugging and possible post-processing
  const urlsFound = extractUrls(content);
  if (!parsed) return { raw: content, urls: urlsFound };

  // Ensure expected structure and sanitize entries
  const rawSelection = Array.isArray(parsed.siteSelection) ? parsed.siteSelection : [];
  const rawPayloads = parsed.sitePayloads || {};

  const sanitizedSelection = rawSelection.map(sanitizeSiteEntry);

  // If listingUrl is still null, try to enrich using URLs found in the assistant content
  const usedUrls = new Set();
  for (const s of sanitizedSelection) {
    if (!s.listingUrl) {
      const key = (s.siteKey || '').toLowerCase();
      const name = (s.siteName || '') ? s.siteName.toLowerCase().replace(/\s+/g, '') : '';
      let found = urlsFound.find(u => {
        const low = u.toLowerCase();
        return (key && low.includes(key)) || (name && low.includes(name));
      });
      if (!found) {
        found = urlsFound.find(u => !usedUrls.has(u));
      }
      if (found && isValidUrl(found)) {
        s.listingUrl = found;
        usedUrls.add(found);
      } else {
        s.listingUrl = null;
      }
    }
  }

  // Sanitize sitePayloads: ensure strings and arrays are correct types
  const sanitizedPayloads = {};
  for (const k of Object.keys(rawPayloads)) {
    const p = rawPayloads[k] || {};
    sanitizedPayloads[k] = {
      title: p.title ? String(p.title).trim() : null,
      description: p.description ? String(p.description).trim().slice(0, 1000) : null,
      tags: Array.isArray(p.tags) ? p.tags.map(t => String(t).trim()) : [],
      keywords: Array.isArray(p.keywords) ? p.keywords.map(t => String(t).trim()) : []
    };
  }

  // Attach sanitized results and raw content for debugging
  const out = {
    siteSelection: sanitizedSelection,
    sitePayloads: sanitizedPayloads,
    raw: content
  };
  return out;
}

module.exports = { generateCitationPlan };
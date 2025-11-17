const { generateCitationPlan } = require('../services/openaiService2');
const CitationJob = require('../Models/CitationJob');
const Citation = require('../Models/Citation');
const mongoose = require('mongoose');
const searchService = require('../services/searchService');

// POST /tools/citation/generate-citation-plan
async function generateCitationPlanHandler(req, res) {
  const business = req.body.business;
  if (!business || !business.name) return res.status(400).json({ error: 'Missing business data' });

  try {
  // Call OpenAI to build a plan
  const plan = await generateCitationPlan(business);
  console.log('generateCitationPlan raw content (truncated):', (plan && plan.raw) ? (plan.raw.slice(0, 1000)) : undefined);
  if (plan && plan.urls) console.log('generateCitationPlan extracted urls:', plan.urls);

  // Create a job (business.description will be preserved if provided)
  const job = new CitationJob({ business, status: 'Pending' });
    await job.save();

    const siteSelection = plan.siteSelection || [];

    // Create Citation docs for each suggested site
    const citations = [];
    for (const s of siteSelection) {
      const payload = (plan.sitePayloads && plan.sitePayloads[s.siteKey]) || {};
      // persist searchQuery returned by the model so we can use it for SERP fallback later
      if (s.searchQuery) payload.searchQuery = s.searchQuery;
      const c = new Citation({
        siteKey: s.siteKey,
        siteName: s.siteName,
        jobId: job._id,
        score: s.score,
        reason: s.reason,
        payload,
        status: 'Pending',
        listingUrl: s.listingUrl || null
      });
      await c.save();
      citations.push(c);
      job.citations.push(c._id);
    }

    // Post-process: for citations missing listingUrl, attempt Google CSE lookup using searchQuery
    for (let i = 0; i < siteSelection.length; i++) {
      const s = siteSelection[i];
      if (!s.listingUrl && s.searchQuery) {
        try {
          const found = await searchService.findListingUrl({ searchQuery: s.searchQuery, siteKey: s.siteKey });
          if (found && found.url) {
            // update DB record
            const cit = citations[i];
            cit.listingUrl = found.url;
            cit.payload = cit.payload || {};
            cit.payload.searchResultSnippet = found.snippet;
            cit.listingConfidence = found.confidence || null;
            await cit.save();
            // also update the in-memory siteSelection so response contains the URL
            s.listingUrl = found.url;
          }
        } catch (err) {
          console.warn('searchService.findListingUrl failed for', s.siteKey, err.message);
        }
      }
    }

    job.status = 'Pending';
    await job.save();

    return res.json({ jobId: job._id, suggestedSites: siteSelection, raw: plan.raw ? plan.raw : undefined });
  } catch (err) {
    console.error('generateCitationPlanHandler error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// GET /tools/citation/:jobId/status
async function getJobStatusHandler(req, res) {
  const { jobId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(jobId)) return res.status(400).json({ error: 'Invalid jobId' });

  try {
    const job = await CitationJob.findById(jobId).populate('citations');
    if (!job) return res.status(404).json({ error: 'Job not found' });
    return res.json({ job });
  } catch (err) {
    console.error('getJobStatusHandler error:', err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { generateCitationPlanHandler, getJobStatusHandler, findCitationListingHandler };

// POST /tools/citation/:citationId/lookup
async function findCitationListingHandler(req, res) {
  const { citationId } = req.params;
  console.log('findCitationListingHandler invoked', { citationId, url: req.originalUrl, method: req.method });
  if (!mongoose.Types.ObjectId.isValid(citationId)) return res.status(400).json({ error: 'Invalid citationId' });

  try {
    const citation = await Citation.findById(citationId);
  console.log('findCitationListingHandler - citation lookup result:', citation ? 'FOUND' : 'NOT FOUND', citation && citation._id);
  if (!citation) return res.status(404).json({ error: 'Citation not found' });

    // Determine searchQuery: prefer stored payload.searchQuery, otherwise try to construct from job/business
    let searchQuery = citation.payload && citation.payload.searchQuery;
    if (!searchQuery) {
      // try to populate job to build a query
      const job = await CitationJob.findById(citation.jobId);
      if (job && job.business) {
        const b = job.business;
        const parts = [b.name, b.city, b.state, citation.siteName].filter(Boolean);
        searchQuery = parts.join(' ');
      }
    }

    if (!searchQuery) return res.status(400).json({ error: 'No searchQuery available to perform lookup' });

    // Call searchService (Google CSE) to find a likely listing URL
    try {
      const found = await searchService.findListingUrl({ searchQuery, siteKey: citation.siteKey });
      if (!found || !found.url) return res.status(404).json({ error: 'No listing found' });

      citation.listingUrl = found.url;
      citation.payload = citation.payload || {};
      citation.payload.searchResultSnippet = found.snippet;
      citation.listingConfidence = found.confidence || null;
      citation.updatedAt = Date.now();
      await citation.save();

      return res.json({ citation });
    } catch (err) {
      console.error('findCitationListingHandler searchService error:', err);
      return res.status(500).json({ error: err.message });
    }
  } catch (err) {
    console.error('findCitationListingHandler error:', err);
    return res.status(500).json({ error: err.message });
  }
}

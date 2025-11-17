import React, { useState } from 'react';
import { generateCitationPlan, getCitationJobStatus, rerunCitationLookup } from '../Controllers/CitationController';

export default function CitationBuilder() {
  const [business, setBusiness] = useState({ name: '', category: '', address: '', phone: '', website: '', city: '', state: '', zip: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [lookupLoading, setLookupLoading] = useState({});

  const handleChange = (e) => setBusiness(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = await generateCitationPlan(business);
      // Log the full response so developer can verify site URLs are present
      console.log('generateCitationPlan response:', data);
      setResult(data);
      setJobId(data.jobId);
    } catch (err) {
      console.error(err);
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!jobId) return;
    try {
      const status = await getCitationJobStatus(jobId);
      // Log the full job status response so developer can inspect citation listing URLs
      console.log('getCitationJobStatus response:', status);
      setResult(status.job);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLookup = async (citationId) => {
    setLookupLoading(prev => ({ ...prev, [citationId]: true }));
    try {
      const res = await rerunCitationLookup(citationId);
      // res.citation is the updated citation
      const updated = res.citation;
      setResult(prev => {
        if (!prev || !Array.isArray(prev.citations)) return prev;
        const updatedCitations = prev.citations.map(c => (c._id === updated._id ? updated : c));
        return { ...prev, citations: updatedCitations };
      });
    } catch (err) {
      console.error('Lookup failed', err);
    } finally {
      setLookupLoading(prev => ({ ...prev, [citationId]: false }));
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Citation Builder</h2>

      <div className="grid grid-cols-1 gap-3">
        <input name="name" placeholder="Business Name" value={business.name} onChange={handleChange} className="p-2 border rounded" />
        <input name="category" placeholder="Category" value={business.category} onChange={handleChange} className="p-2 border rounded" />
        <input name="address" placeholder="Address" value={business.address} onChange={handleChange} className="p-2 border rounded" />
        <input name="phone" placeholder="Phone" value={business.phone} onChange={handleChange} className="p-2 border rounded" />
        <input name="website" placeholder="Website" value={business.website} onChange={handleChange} className="p-2 border rounded" />
        <div className="flex gap-2">
          <input name="city" placeholder="City" value={business.city} onChange={handleChange} className="p-2 border rounded flex-1" />
          <input name="state" placeholder="State" value={business.state} onChange={handleChange} className="p-2 border rounded w-24" />
          <input name="zip" placeholder="Zip" value={business.zip} onChange={handleChange} className="p-2 border rounded w-28" />
        </div>
        <textarea name="description" placeholder="Short business description (optional)" value={business.description} onChange={handleChange} className="p-2 border rounded h-24" />
        <button onClick={handleSubmit} disabled={loading} className="bg-blue-600 text-white p-2 rounded">{loading ? 'Generating...' : 'Generate Plan'}</button>
        {jobId && <button onClick={checkStatus} className="bg-gray-200 p-2 rounded">Check status</button>}
      </div>

      <div className="mt-6">
        {!result && (
          <div className="text-gray-600">No result yet</div>
        )}

        {/* Render suggestedSites + sitePayloads (initial response) or job.citations (status) */}
        {result && (
          <div className="space-y-4">
            {/* If the result contains job object (when checking status) */}
            {result.citations && Array.isArray(result.citations) && (
              result.citations.map((c) => (
                <div key={c._id || c.siteKey} className="border rounded p-4 bg-white shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{c.siteName || c.siteKey}</h3>
                      <div className="text-sm text-gray-500">Score: {c.score ?? '—'} • Status: <span className="font-medium">{c.status}</span></div>
                      {c.reason && <div className="text-sm text-gray-600 mt-1">{c.reason}</div>}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {c.listingUrl ? (
                        <a className="text-blue-600 break-all" href={c.listingUrl} target="_blank" rel="noreferrer">{c.listingUrl}</a>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>No listing yet</span>
                          <button onClick={() => handleLookup(c._id)} disabled={!!lookupLoading[c._id]} className="text-sm bg-yellow-500 text-white px-2 py-1 rounded">
                            {lookupLoading[c._id] ? 'Searching...' : 'Find Listing'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {c.payload && (
                    <div className="mt-3 bg-gray-50 p-3 rounded">
                      {c.payload.title && <div className="font-semibold">{c.payload.title}</div>}
                      {c.payload.description && <p className="text-sm text-gray-700 mt-1">{c.payload.description}</p>}
                      {c.payload.tags && Array.isArray(c.payload.tags) && (
                        <div className="mt-2 text-sm">
                          <strong>Tags:</strong> {c.payload.tags.join(', ')}
                        </div>
                      )}
                      {c.payload.keywords && Array.isArray(c.payload.keywords) && (
                        <div className="mt-1 text-sm">
                          <strong>Keywords:</strong> {c.payload.keywords.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* If the result is the immediate response with suggestedSites + sitePayloads */}
            {result.suggestedSites && Array.isArray(result.suggestedSites) && (
              result.suggestedSites.map((s, idx) => (
                <div key={s.siteKey || idx} className="border rounded p-4 bg-white shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{s.siteName || s.siteKey}</h3>
                      <div className="text-sm text-gray-500">Score: {s.score ?? '—'}</div>
                      {s.reason && <div className="text-sm text-gray-600 mt-1">{s.reason}</div>}
                      {s.siteUrl && (
                        <div className="text-sm text-blue-600 break-all mt-1">
                          <a href={s.siteUrl} target="_blank" rel="noreferrer">{s.siteUrl}</a>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">Rank #{idx + 1}</div>
                  </div>

                  {result.sitePayloads && result.sitePayloads[s.siteKey] && (
                    <div className="mt-3 bg-gray-50 p-3 rounded">
                      {result.sitePayloads[s.siteKey].title && <div className="font-semibold">{result.sitePayloads[s.siteKey].title}</div>}
                      {result.sitePayloads[s.siteKey].description && <p className="text-sm text-gray-700 mt-1">{result.sitePayloads[s.siteKey].description}</p>}
                      {Array.isArray(result.sitePayloads[s.siteKey].tags) && (
                        <div className="mt-2 text-sm"><strong>Tags:</strong> {result.sitePayloads[s.siteKey].tags.join(', ')}</div>
                      )}
                      {Array.isArray(result.sitePayloads[s.siteKey].keywords) && (
                        <div className="mt-1 text-sm"><strong>Keywords:</strong> {result.sitePayloads[s.siteKey].keywords.join(', ')}</div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Fallback: raw JSON view for debugging */}
            {!result.citations && !result.suggestedSites && (
              <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded">{JSON.stringify(result, null, 2)}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

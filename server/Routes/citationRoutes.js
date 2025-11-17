const express = require('express');
const router = express.Router();
const { generateCitationPlanHandler, getJobStatusHandler, findCitationListingHandler } = require('../Controllers/citationController');

router.post('/generate-citation-plan', generateCitationPlanHandler);
router.get('/:jobId/status', getJobStatusHandler);
router.post('/:citationId/lookup', findCitationListingHandler);

module.exports = router;

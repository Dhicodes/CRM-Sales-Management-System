const express = require('express');
const leadController = require('../controllers/leadController');
const authenticate = require('../middleware/authenticate');
const scopeToAssigned = require('../middleware/scopeToAssigned');
const validate = require('../middleware/validate');
const {
  createLeadValidator,
  updateLeadValidator,
  assignLeadValidator,
  addNoteValidator,
  convertLeadValidator,
} = require('../validators/leadValidators');

const router = express.Router();

router.use(authenticate, scopeToAssigned);

router.get('/', leadController.listLeads);
router.post('/', createLeadValidator, validate, leadController.createLead);
router.get('/:id', leadController.getLead);
router.patch('/:id', updateLeadValidator, validate, leadController.updateLead);
router.patch('/:id/assign', assignLeadValidator, validate, leadController.assignLead);
router.post('/:id/notes', addNoteValidator, validate, leadController.addNote);
router.post('/:id/convert', convertLeadValidator, validate, leadController.convertLead);
router.get('/:id/timeline', leadController.getTimeline);

module.exports = router;

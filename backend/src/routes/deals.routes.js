const express = require('express');
const dealController = require('../controllers/dealController');
const authenticate = require('../middleware/authenticate');
const scopeToAssigned = require('../middleware/scopeToAssigned');
const validate = require('../middleware/validate');
const {
  createDealValidator,
  updateDealValidator,
  changeStageValidator,
  assignDealValidator,
} = require('../validators/dealValidators');

const router = express.Router();

router.use(authenticate, scopeToAssigned);

router.get('/', dealController.listDeals);
router.post('/', createDealValidator, validate, dealController.createDeal);
router.get('/:id', dealController.getDeal);
router.patch('/:id', updateDealValidator, validate, dealController.updateDeal);
router.patch('/:id/stage', changeStageValidator, validate, dealController.changeStage);
router.patch('/:id/assign', assignDealValidator, validate, dealController.assignDeal);
router.get('/:id/timeline', dealController.getTimeline);

module.exports = router;

const express = require('express');
const router = express.Router();
const dealService = require('../services/dealService');
const auth = require('../middleware/auth');

// Create a new deal (Entrepreneur only)
router.post('/', auth, async (req, res) => {
  try {
    const deal = await dealService.createDeal(req.user.id, req.body);
    res.status(201).json(deal);
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get all deals for current investor
router.get('/', auth, async (req, res) => {
  try {
    const deals = await dealService.getDealsForInvestor(req.user.id);
    res.json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get deals created by current entrepreneur
router.get('/my-deals', auth, async (req, res) => {
  try {
    const deals = await dealService.getDealsByEntrepreneur(req.user.id);
    res.json(deals);
  } catch (error) {
    console.error('Error fetching my deals:', error);
    res.status(500).json({ message: error.message });
  }
});

// Invest in a deal (Investor only)
router.post('/:dealId/invest', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const investment = await dealService.investInDeal(req.params.dealId, req.user.id, amount);
    res.json(investment);
  } catch (error) {
    console.error('Error investing in deal:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get deal by ID
router.get('/:dealId', auth, async (req, res) => {
  try {
    const deal = await dealService.getDealById(req.params.dealId);
    res.json(deal);
  } catch (error) {
    console.error('Error fetching deal:', error);
    res.status(404).json({ message: error.message });
  }
});

module.exports = router;

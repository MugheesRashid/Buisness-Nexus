const Deal = require('../models/Deal');
const Entrepreneur = require('../models/Entrepreneur');
const Investor = require('../models/Investor');
const Connection = require('../models/Connection');

class DealService {
  // Create a new deal (Entrepreneur only)
  async createDeal(entrepreneurId, dealData) {
    // Verify entrepreneur exists
    const entrepreneur = await Entrepreneur.findById(entrepreneurId);
    if (!entrepreneur) {
      throw new Error('Entrepreneur not found');
    }

    // Create the deal
    const deal = new Deal({
      ...dealData,
      startupOwner: entrepreneurId,
      createdBy: entrepreneurId,
      targetAmount: dealData.maxAmount
    });

    await deal.save();

    // Populate entrepreneur data
    await deal.populate('startupOwner', 'name startupName');
    await deal.populate('createdBy', 'name');

    // Send deal to all connections (investors connected to this entrepreneur)
    await this.sendDealToConnections(deal);

    return deal;
  }

  // Send deal to all accepted connections
  async sendDealToConnections(deal) {
    // Find all accepted connections where entrepreneur is sender
    const connections = await Connection.find({
      sender: deal.createdBy,
      status: 'accepted'
    }).populate('receiver', 'name email');

    // Here you could send notifications or emails to investors
    // For now, we'll just log it
    console.log(`Deal ${deal.startupName} sent to ${connections.length} investors`);

    return connections;
  }

  // Get deals for a specific investor (from their connections)
  async getDealsForInvestor(investorId) {
    // Find all accepted connections where investor is receiver
    const connections = await Connection.find({
      receiver: investorId,
      status: 'accepted'
    }).select('sender');

    const entrepreneurIds = connections.map(conn => conn.sender);

    // Get deals from connected entrepreneurs
    const deals = await Deal.find({
      createdBy: { $in: entrepreneurIds }
    })
    .populate('startupOwner', 'name startupName logo')
    .populate('createdBy', 'name')
    .populate('investors.investor', 'name')
    .sort({ createdAt: -1 });

    return deals;
  }

  // Get deals created by a specific entrepreneur
  async getDealsByEntrepreneur(entrepreneurId) {
    const deals = await Deal.find({ createdBy: entrepreneurId })
      .populate('startupOwner', 'name startupName logo')
      .populate('investors.investor', 'name')
      .sort({ createdAt: -1 });

    return deals;
  }

  // Invest in a deal
  async investInDeal(dealId, investorId, amount) {
    // Verify investor exists
    const investor = await Investor.findById(investorId);
    if (!investor) {
      throw new Error('Investor not found');
    }

    // Find the deal
    const deal = await Deal.findById(dealId);
    if (!deal) {
      throw new Error('Deal not found');
    }

    // Check if deal is still open
    if (deal.status !== 'Open') {
      throw new Error('Deal is no longer open for investment');
    }

    // Check if investor has already invested
    const existingInvestment = deal.investors.find(inv => inv.investor.toString() === investorId);
    if (existingInvestment) {
      throw new Error('You have already invested in this deal');
    }

    // Check if amount exceeds remaining needed
    const remainingAmount = deal.targetAmount - deal.amountRaised;
    if (amount > remainingAmount) {
      throw new Error(`Investment amount exceeds remaining needed. Maximum allowed: $${remainingAmount}`);
    }

    // Add investment
    deal.investors.push({
      investor: investorId,
      amount: amount,
      investedAt: new Date()
    });

    // Update amount raised
    deal.amountRaised += amount;

    // Check if deal should be closed
    if (deal.amountRaised >= deal.targetAmount) {
      deal.status = 'Closed';
    }

    await deal.save();

    // Populate investor data
    await deal.populate('investors.investor', 'name');

    return {
      deal,
      investment: deal.investors[deal.investors.length - 1]
    };
  }

  // Get deal by ID
  async getDealById(dealId) {
    const deal = await Deal.findById(dealId)
      .populate('startupOwner', 'name startupName logo bio')
      .populate('createdBy', 'name')
      .populate('investors.investor', 'name');

    if (!deal) {
      throw new Error('Deal not found');
    }

    return deal;
  }

  // Update deal status (for admin or entrepreneur)
  async updateDealStatus(dealId, entrepreneurId, status) {
    const deal = await Deal.findOne({ _id: dealId, createdBy: entrepreneurId });

    if (!deal) {
      throw new Error('Deal not found or unauthorized');
    }

    deal.status = status;
    await deal.save();

    return deal;
  }
}

module.exports = new DealService();

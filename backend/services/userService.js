const Entrepreneur = require("../models/Entrepreneur");
const Investor = require("../models/Investor");

const getAllEntrepreneurs = async () => {
  try {
    const entrepreneurs = await Entrepreneur.find({});
    return entrepreneurs;
  } catch (error) {
    throw new Error("Failed to fetch entrepreneurs");
  }
};

const getAllInvestors = async () => {
  try {
    const investors = await Investor.find({});
    return investors;
  } catch (error) {
    throw new Error("Failed to fetch investors");
  }
};

const fetchUser = async (userId, role) => {
  try {
    let user;
    if (role == "investor") {
      user = await Investor.findById(userId);
      if (user) {
        // Calculate totalInvestments as the length of portfolioCompanies
        user.totalInvestments = user.portfolioCompanies ? user.portfolioCompanies.length : 0;
      }
    } else if (role == "entrepreneur") {
      user = await Entrepreneur.findById(userId);
    }

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    throw error;
  }
};

module.exports = { getAllEntrepreneurs, getAllInvestors, fetchUser };

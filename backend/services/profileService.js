const Entrepreneur = require('../models/Entrepreneur');
const Investor = require('../models/Investor');

const updateEntrepreneurProfile = async (userId, updates) => {
  console.log(updates);
  const allowedUpdates = ['name', 'email', 'avatarUrl', 'bio', 'startupName', 'tagline', 'summary', 'pitch', 'stage', 'fundingNeeded', 'industry', 'location', 'foundedYear', 'teamSize', 'website', 'pitchDeckUrl', 'logo', 'socialLinks', 'isOnline'];
  const isValidOperation = Object.keys(updates).every(update => allowedUpdates.includes(update));
  if (!isValidOperation) {
    throw new Error('Invalid updates');
  }

  // Process array fields that come as comma-separated strings or arrays, split by commas, trim, dedup
  const arrayFields = ['industry'];
  arrayFields.forEach(field => {
    if (updates[field]) {
      let values = [];
      if (typeof updates[field] === 'string') {
        values = updates[field].split(',');
      } else if (Array.isArray(updates[field])) {
        values = updates[field].flatMap(item => item.toString().split(','));
      }
      updates[field] = [...new Set(values.map(item => item.trim()).filter(item => item.length > 0))];
    }
  });

  const entrepreneur = await Entrepreneur.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
  if (!entrepreneur) {
    throw new Error('Entrepreneur not found');
  }
  return entrepreneur;
};

const updateInvestorProfile = async (userId, updates) => {
  const allowedUpdates = ['name','email', 'avatarUrl', 'bio', 'investmentInterests', 'investmentStage', 'portfolioCompanies', 'totalInvestments', 'minimumInvestment', 'maximumInvestment', 'investmentFocus', 'ticketSize', 'industries', 'portfolioLinks', 'isOnline'];
  const isValidOperation = Object.keys(updates).every(update => allowedUpdates.includes(update));
  console.log(isValidOperation);
  if (!isValidOperation) {
    throw new Error('Invalid updates');
  }

  // Process array fields that come as comma-separated strings or arrays, split by commas, trim, dedup
  const arrayFields = ['investmentInterests', 'investmentStage', 'industries'];
  arrayFields.forEach(field => {
    if (updates[field]) {
      let values = [];
      if (typeof updates[field] === 'string') {
        values = updates[field].split(',');
      } else if (Array.isArray(updates[field])) {
        values = updates[field].flatMap(item => item.toString().split(','));
      }
      updates[field] = [...new Set(values.map(item => item.trim()).filter(item => item.length > 0))];
    }
  });

  const investor = await Investor.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
  if (!investor) {
    throw new Error('Investor not found');
  }
  return investor;
};

const getProfile = async (userId, role) => {
  let profile;
  if (role === 'entrepreneur') {
    profile = await Entrepreneur.findById(userId);
  } else if (role === 'investor') {
    profile = await Investor.findById(userId);
  }
  if (!profile) {
    throw new Error('Profile not found');
  }
  return profile;
};

const updateStartupData = async (userId, updates) => {
  const allowedUpdates = ['startupName', 'tagline', 'summary', 'pitch', 'stage', 'fundingNeeded', 'industry', 'location', 'foundedYear', 'teamSize', 'website', 'pitchDeckUrl', 'logo', 'socialLinks'];
  const isValidOperation = Object.keys(updates).every(update => allowedUpdates.includes(update));
  if (!isValidOperation) {
    throw new Error('Invalid startup updates');
  }
  const entrepreneur = await Entrepreneur.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
  if (!entrepreneur) {
    throw new Error('Entrepreneur not found');
  }
  return entrepreneur;
};

const checkProfileCompletion = async (userId, role) => {
  if (role === 'entrepreneur') {
    const entrepreneur = await Entrepreneur.findById(userId);
    if (!entrepreneur) {
      throw new Error('Entrepreneur not found');
    }
    return entrepreneur.profileComplete;
  } else if (role === 'investor') {
    // Investors don't have completion requirements
    return true;
  }
  throw new Error('Invalid role');
};

const getPublicProfile = async (userId, role) => {
  let profile;
  if (role === 'entrepreneur') {
    profile = await Entrepreneur.findById(userId);
    if (!profile) {
      throw new Error('Entrepreneur not found');
    }
    if (!profile.profileComplete) {
      throw new Error('Profile not complete');
    }
  } else if (role === 'investor') {
    profile = await Investor.findById(userId);
    if (!profile) {
      throw new Error('Investor not found');
    }
  }
  return profile;
};

const partialSave = async (userId, role, updates) => {
  if (role === 'entrepreneur') {
    return await updateEntrepreneurProfile(userId, updates);
  } else if (role === 'investor') {
    return await updateInvestorProfile(userId, updates);
  }
  throw new Error('Invalid role');
};

module.exports = { updateEntrepreneurProfile, updateInvestorProfile, getProfile, updateStartupData, checkProfileCompletion, getPublicProfile, partialSave };

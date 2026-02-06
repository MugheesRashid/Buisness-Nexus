const express = require('express');
const auth = require('../middleware/auth');
const { getAllEntrepreneurs, getAllInvestors,fetchUser } = require('../services/userService');

const router = express.Router();

router.get('/entrepreneurs', auth, async (req, res) => {
  try {
    const entrepreneurs = await getAllEntrepreneurs();
    res.json({ message: 'Entrepreneurs fetched successfully', entrepreneurs });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/investors', auth, async (req, res) => {
  try {
    const investors = await getAllInvestors();
    res.json({ message: 'Investors fetched successfully', investors });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/fetch-partner', auth, async (req, res) => {
    try {
        const { userId, role } = req.query
        const PartnerRole = role  === 'entrepreneur' ? 'investor' : 'entrepreneur';

        if(!userId || !role){
            res.status(400).json({message: 'No user id or role provided'});
            return;
        }
        const user = await fetchUser(userId, PartnerRole);
        res.json({ message: 'User fetched successfully', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/fetch-user', auth, async (req, res) => {
    try {
        const { userId, role } = req.query

        if(!userId || !role){
            res.status(400).json({message: 'No user id or role provided'});
            return;
        }
        const user = await fetchUser(userId, role);
        res.json({ message: 'User fetched successfully', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})


module.exports = router;

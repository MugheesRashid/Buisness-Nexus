const express = require('express')
const auth = require('../middleware/auth');
const { updateEntrepreneurProfile, updateInvestorProfile, getProfile, updateStartupData, checkProfileCompletion, getPublicProfile, partialSave } = require('../services/profileService');

const router = express.Router()

router.post('/update-entrepreneur-profile', auth, async (req, res) => {
    try {
        const { updates } = req.body;
        console.log(updates)
        if(!updates){
            res.status(400).json({message: 'Invalid request'});
            return;
        }
        const updatedProfile = await updateEntrepreneurProfile(req.user._id, updates);
        res.json({ message: 'Entrepreneur profile updated successfully', updatedProfile });
    } catch (error) {
        console.log(error);
        console.log("Error message:", error.message);
        res.status(400).json({ message: error.message });
    }
})

router.post('/update-investor-profile', auth, async (req, res) => {
    try {
        const { updates } = req.body;
        if(!updates){
            res.status(400).json({message: 'Invalid request'});
            return;
        }
        const updatedProfile = await updateInvestorProfile(req.user._id, updates);
        res.json({ message: 'Investor profile updated successfully', updatedProfile });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
})

router.get('/get-profile', auth, async (req, res) => {
    try {
        const { userId, role } = req.body;
        if(!userId || !role){
            res.status(400).json({message: 'Invalid request'});
            return;
        }
        const profile = await getProfile(userId, role);
        res.json({ message: 'Profile fetched successfully', profile });
        }
    catch(error){
        res.status(400).json({ message: error.message });
    }
})

router.post('/update-startup-data', auth, async (req, res) => {
    try {
        const { updates } = req.body;
        if(!updates){
            res.status(400).json({message: 'Invalid request'});
            return;
        }
        const updatedProfile = await updateStartupData(req.user._id, updates);
        res.json({ message: 'Startup data updated successfully', updatedProfile });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
})

router.get('/check-profile-completion', auth, async (req, res) => {
    try {
        const { role } = req.body;
        if(!role){
            res.status(400).json({message: 'Invalid request'});
            return;
        }
        const isComplete = await checkProfileCompletion(req.user._id, role);
        res.json({ isComplete });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
})

router.get('/get-public-profile', async (req, res) => {
    try {
        const { userId, role } = req.query;
        if(!userId || !role){
            res.status(400).json({message: 'Invalid request'});
            return;
        }
        const profile = await getPublicProfile(userId, role);
        res.json({ profile });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
})

router.post('/partial-save', auth, async (req, res) => {
    try {
        const { role, updates } = req.body;
        if(!role || !updates){
            res.status(400).json({message: 'Invalid request'});
            return;
        }
        const updatedProfile = await partialSave(req.user._id, role, updates);
        res.json({ message: 'Profile updated successfully', updatedProfile });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
})

module.exports = router;

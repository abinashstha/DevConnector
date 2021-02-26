const express = require('express');
const router = express.Router();

// @route   GET api/profile
// @desc    Test profile
// @access  PUBLIC
router.get('/', (req, res) => res.json('Profile Route'));

module.exports = router;

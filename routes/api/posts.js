const express = require('express');
const router = express.Router();

// @route   GET api/posts
// @desc    Test posts
// @access  PUBLIC
router.get('/', (req, res) => res.json('POST Route'));

module.exports = router;

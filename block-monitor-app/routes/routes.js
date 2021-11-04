const express = require('express');
const router = express.Router();
const controllers = require('../controllers/controllers.js');

router.get('/get-data', controllers.getData);

module.exports = router;

const express = require('express');
const router = express.Router();


const { makeTransfer } = require('../controllers/transferController');
const authMiddleware = require('../middlewares/authMiddleware');

 
router.post('/make', authMiddleware, makeTransfer);



module.exports = router ;



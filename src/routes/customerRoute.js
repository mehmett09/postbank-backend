const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');


const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', customerController.createCustomer);

router.post('/login', customerController.loginCustomer);

router.post('/logout', customerController.logoutCustomer);

//once authMiddleware ile guvenlik kontrolu yapiyoruz, kontrolu gecerse profil bilgilerini getiriyoruz
router.get('/profile', authMiddleware, customerController.getProfile);


module.exports = router ;

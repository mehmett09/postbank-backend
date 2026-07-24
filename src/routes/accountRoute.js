const express = require('express');
const router = express.Router();

const { createAccount, deposit, withdraw, getTransactions, getMyAccounts } = require('../controllers/accountController');
const authMiddleware = require('../middlewares/authMiddleware');

// hesap olusturmadan once authMiddleware ile kullaniciyi kontrol ediyoruz
router.post('/create', authMiddleware, createAccount);
router.post('/deposit', authMiddleware, deposit);

// YENİ EKLENEN ROTALAR
router.post('/withdraw', authMiddleware, withdraw);

// Dikkat: Parametre (account_number) URL'den geleceği için :account_number kullanıyoruz ve GET isteği yapıyoruz
router.get('/history/:account_number', authMiddleware, getTransactions);

//kullanici hesaplarinin listelenmesi
router.get('/my-accounts', authMiddleware, getMyAccounts);

module.exports = router ;


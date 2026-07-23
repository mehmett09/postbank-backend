const jwt = require('jsonwebtoken');
const {TokenBlacklist} = require('../models');

const authMiddleware = async (req, res, next) => {
    try {
        
        //header icinde token kontrolu yapiyoruz
        const authHeader = req.headers.authorization ;

        if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
            return res.status(401).json({ success:false, message:'Token bulunamadi!'});
        }

        //header'dan tokeni aliyoruz
        const token = authHeader.split(' ')[1];

        //aldigimiz token blacklistte var mi kontrol ediyoruz 
        const isBlacklisted = await TokenBlacklist.findOne({ where: {token}});

        if(isBlacklisted){
            return res.status(401).json({ success:false, message:'Oturum süresi dolmuş veya çıkış yapılmış. Lütfen tekrar giriş yapın.'});
        }

        //tokeni dogruluyoruz
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        //dogrulanan customer bilgilerini request objesine ekliyoruz
        req.customer = decoded;

        
        next();

    } catch (error) {

        // Hatanın asıl sebebini görmek için ajanlarımızı yerleştiriyoruz:
        console.log("JWT HATASI DETAYI:", error.message);
        console.log("KULLANILAN GİZLİ ANAHTAR:", process.env.JWT_SECRET ? "Bulundu" : "BULUNAMADI (Tanımsız)");

        // Token geçersizse veya süresi (1 saat) dolmuşsa jwt.verify hata fırlatır ve buraya düşer
        return res.status(401).json({ success: false, message: 'Geçersiz veya süresi dolmuş token.' });
    }
};


module.exports = authMiddleware ;


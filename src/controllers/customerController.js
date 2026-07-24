const {Customer,TokenBlacklist, Account} = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const logger = require('../config/logger');

const registerSchema = Joi.object({
    name: Joi.string().min(3).max(50).required().messages({
        'string.empty':'İsim alanı boş bırakılamaz!',
        'string.min': 'İsim en az 3 karakter olmalıdır!'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Geçerli bir email adresi giriniz!',
        'string.empty': 'Email alanı boş bırakılamaz!'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Şifre en az 6 karakter olmalıdır! ',
        'strıng.empty': 'Şifre alanı boş bırakılamaz!'
    }),
    phone: Joi.string().allow('', null),
    address: Joi.string().allow('', null),

});

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Geçerli bir email adresi giriniz!',
        'string.empty': 'Email alanı boş bırakılamaz!'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Şifre en az 6 karakter olmalıdır! ',
        'string.empty': 'Şifre alanı boş bırakılamaz!'
    })
});


const createCustomer = async (req, res, next) => {

    try {

        //gelen istek joi semasindan gecirilir
        const { error, value } = registerSchema.validate(req.body);

        //hata varsa yakaliyoruz
        if (error) {
            return res.status(400).json({ success:false, message:error.details[0].message});
        }


        //joi'den gecen dogrulanmis verileri aliyoruz 
        const { name, address, email, phone, password } = value ;
        
        //email kaydi mevcut mu diye kontrol ediyoruz
        const existingEmail = await Customer.findOne({ where: {email}});
        if (existingEmail) {
            return res.status(400).json({ success:false, message:'Bu email zaten kullanılıyor!'});
        }

        // --- ŞİFRELEME (HASHING) İŞLEMİ ---
        
        const saltRounds = 10 ;
        const hashedPassword = await bcrypt.hash(password, saltRounds);


        // yeni customer olusturma
        const newCustomer = await   Customer.create({
            name,
            email,
            password: hashedPassword,
            phone,
            address     
        });

        // JWT TOKEN OLUSTURMA
        const token = await jwt.sign(
            {
                customer_id: newCustomer.customer_id,
                email: newCustomer.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn:'1h'//1 SAATLIK TOKEN OLUSTURDUK
            }
        )
        logger.info(`${newCustomer.name} isimli yeni kullanıcı kaydı oluşturuldu.`);

        // kayit basarili mesaji (response)
        res.status(201).json({ 
            success: true,
            token: token,
            message:'Postbank üyeliğiniz başarıyla oluşturuldu. Giriş yapabilirsiniz.',
            data: {
                customer_id: newCustomer.customer_id,
                name: newCustomer.name,
                email: newCustomer.email
            }
        });


        
    } catch (error) {
        next(error);
        res.status(500).json({ success: false, message: 'Sunucu hatası oluştu, lütfen daha sonra tekrar deneyiniz.' });
        
    }

};


const loginCustomer = async (req, res, next) => {

    try {
        // joi ile request body'den gelen verileri kontrol ediyoruz
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success:false, message:error.details[0].message});
        };

        //joiden gecen verileri aliyoruz
        const { email, password } = value ;

        // girilen email adresiyle kayitli kullanici var mi buluyoruz
        const customer = await Customer.findOne( { where: {email} } );
        if(!customer) {
            return res.status(401).json({ success:false, message:'Email veya şifre hatalı!'});
            //yoksa hata donduruyoruz
        }

        //sifre kontrolu yapiyoruz
        const isMatch = await bcrypt.compare(password, customer.password);
        if (!isMatch) {
            return res.status(401).json({ success:false, message:'Email veya şifre hatalı!'});
        }

        //kullaniciya token veriyoruz
        const token = jwt.sign(
            {
                customer_id: customer.customer_id,
                email:customer.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn:'1h'
            }
        );

        res.status(200).json({ 
            success:true,
            message:'Giriş Başarılı!',
            token:token,
            data: {
                customer_id: customer.customer_id,
                name: customer.name,
                email: customer.email,

            }
        });
        
    } catch (error) {
        
        next(error);
        res.status(500).json({ success: false, message: 'Sunucu hatası oluştu, lütfen daha sonra tekrar deneyiniz.' });
        
    }

};


const logoutCustomer = async (req, res, next) => {
    try {
        // istegin header kismindan tokeni aliyoruz
        const authHeader = req.headers.authorization ;

        

        //tokeni kontrol ediyoruz
        if(!authHeader || !authHeader.toLowerCase().startsWith('bearer ')){
            return res.status(400).json({ success:false, message:'Geçerli token bulunamadı!'});
        }

        // 'bearer' kelimesini kaldirip token kismini aliyoruz
        const token = authHeader.split(' ')[1];
        
        

        //token daha once kara listeye alindi mi kontrol ediyoruz
        const isBlacklisted = await TokenBlacklist.findOne({ where: {token} });
        if(isBlacklisted) {
            return res.status(400).json({ success:false, message:'Bu hesaptan zaten çıkılmış!'});
        }

        //tokeni blacklist'e aliyoruz
        await TokenBlacklist.create({token});

        //frontend'e response donduruyoruz
        res.status(200).json({ success:true, message:"Başarıyla çıkış yapıldı."});

        
    } catch (error) {
        next(error);
        res.status(500).json({ success: false, message: 'Sunucu hatası oluştu, lütfen daha sonra tekrar deneyiniz.' });
        
    }
};


const getProfile = async (req, res, next) => {

    try {
        //authmiddleware ile koydugumuz customer id'yi aliyoruz
        const customerId = req.customer.customer_id; 

        // id'ye gore musteriyi getiriyoruz ama password sutununu getirmiyoruz
        const customer = await Customer.findByPk(customerId, { 
            attributes: { exclude: ['password']}
        });

        if(!customer){
            return res.status(404).json({ success:false, message:'Kullanıcı bulunamadı!'});
        }

        //sifresiz bir sekilde musteri bilgilerini frontend'e gonderiyoruz
        res.status(200).json({ success:true, data: customer});
        
    } catch (error) {
        next(error);
    }

};





module.exports = {createCustomer, loginCustomer, logoutCustomer, getProfile} ;
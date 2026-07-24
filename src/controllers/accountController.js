const { Account, Transaction } = require('../models');

// 1. Yardımcı Fonksiyon: 8 Haneli Rastgele Hesap Numarası Üretici
const generateAccountNumber = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
};

// 2. Yardımcı Fonksiyon: 26 Haneli Türkiye Formatında IBAN Üretici
const generateIBAN = (accountNumber) => {
    const checkDigits = Math.floor(10 + Math.random() * 89).toString(); // 2 haneli kontrol sayısı
    const bankCode = "00099"; // Postbank'ın hayali banka kodu (5 hane)
    const padding = "000000000"; // IBAN'ı 26 haneye tamamlamak için dolgu (9 hane)
    
    // TR(2) + check(2) + bankCode(5) + rezerv(1) + padding(8) + accountNumber(8) = Toplam 26 Hane
    return `TR${checkDigits}${bankCode}0${padding}${accountNumber}`;
};



const createAccount = async (req, res, next) => {

    try {
        //guvenlik middleware'dan gecen id'yi aliyoruz
        const customerId = req.customer.customer_id ;

        //hesap turunu default veriyoruz
        const { account_type = 'VADESİZ', currency = 'TRY' } = req.body;

        //hesap numarasi ve iban olusturuyoruz
        const newAccountNumber = generateAccountNumber();
        const newIban = generateIBAN(newAccountNumber);

        //hesabi veritabanina kaydediyoruz
        const account = await Account.create({
            customer_id: customerId,
            account_number: newAccountNumber,
            iban: newIban,
            account_type: account_type, 
            currency: currency
        });


        res.status(201).json({ 
            success:true,
            message:'Yeni banka hesabı başarıyla oluşturuldu.',
            data:account
        })
        
    } catch (error) {
        next(error);//olasi hatayi global error handler'a yolluyoruz
    }
};


const deposit = async (req, res, next) => {
    try {

        const customerId = req.customer.customer_id;
        const { account_number, amount, description} = req.body;

        //basit bir mantik kontrolu yapiyoruz
        if( !account_number || !amount || amount <= 0) {
            return res.status(400).json({ success:false, message:'Geçerli bir heasp numarası ve 0 dan büyük bir tutar giriniz.'});
        }

        //hesabi veritabaninda buluyoruz 
        const account = await Account.findOne({
            where: { account_number:account_number, customer_id:customerId } 
        });

        if (!account) {
            return res.status(404).json({ success:false, message:'Hesap bulunamadı veya size ait değil.'});
        }

        // bakiyeyi guncelliyoruz  (veritabanindan string gelebilecegi icin sayiya cevirip oyle topluyoruz)
        const newBalance = parseFloat(account.balance) + parseFloat(amount);
        account.balance = newBalance ;
        await account.save();

        // yapilan isleme ait islem hareketi olusturuyoruz
        await Transaction.create({
            account_id: account.account_id,
            transaction_type: 'DEPOSIT',      // hesaba para girisi oldugunu belirtiyoruz
            amount: amount,
            description: 'ATM Nakit Yatırma',
            running_balance: newBalance,      // İşlem anındaki güncel bakiye
            source_type: 'CASH',              // Nakit işlemi olduğunu belirtiyoruz
            source_id: account.account_id     // Kaynak UUID zorunlu olduğu için kendi hesap ID'sini referans veriyoruz
        });

        res.status(200).json({
            success: true,
            message: `${amount} TL hesabınıza başarıyla yatırıldı.`,
            new_balance: account.balance
        });
        
    } catch (error) {
        next(error);
    }
};


const withdraw = async (req, res, next) => {
    // Yine veri güvenliği için transaction başlatıyoruz
    const t = await sequelize.transaction();

    try {
        const customerId = req.customer.customer_id;
        const { account_number, amount, description } = req.body;

        if (!account_number || amount <= 0) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Geçersiz işlem bilgileri.' });
        }

        const account = await Account.findOne({
            where: { account_number: account_number, customer_id: customerId },
            transaction: t
        });

        if (!account) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Hesap bulunamadı veya size ait değil.' });
        }

        // Bakiye yetersizse işlemi iptal et
        if (parseFloat(account.balance) < parseFloat(amount)) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Bakiyeniz bu işlem için yetersiz.' });
        }

        // Bakiyeyi düş
        const newBalance = parseFloat(account.balance) - parseFloat(amount);
        account.balance = newBalance;
        await account.save({ transaction: t });

        // Dekont oluştur (CASH - Nakit Çıkışı)
        await Transaction.create({
            account_id: account.account_id,
            transaction_type: 'WITHDRAWAL', // Para çıkışı
            amount: amount,
            description: description || 'ATM / Vezne Nakit Çekim',
            running_balance: newBalance,
            source_type: 'CASH', // Dış transfer değil, nakit
            source_id: null
        }, { transaction: t });

        await t.commit();

        res.status(200).json({
            success: true,
            message: 'Para çekme işlemi başarılı.',
            data: { 
                withdrawn_amount: amount, 
                new_balance: account.balance 
            }
        });

    } catch (error) {
        await t.rollback();
        next(error);
    }
};

const getTransactions = async (req, res, next) => {
    try {
        const customerId = req.customer.customer_id;
        // Bu sefer veriyi body'den değil, URL üzerinden parametre olarak alıyoruz
        const { account_number } = req.params;

        // Önce hesabın bu müşteriye ait olduğunu doğrulayalım (Güvenlik)
        const account = await Account.findOne({
            where: { account_number: account_number, customer_id: customerId }
        });

        if (!account) {
            return res.status(404).json({ success: false, message: 'Hesap bulunamadı veya yetkiniz yok.' });
        }

        // Hesaba ait tüm dekontları çekelim (Tarihe göre en yeniden eskiye: DESC)
        const transactions = await Transaction.findAll({
            where: { account_id: account.account_id },
            order: [['created_at', 'DESC']] 
        });

        res.status(200).json({
            success: true,
            data: transactions
        });
    } catch (error) {
        next(error);
    }
};


const getMyAccounts = async (req, res, next) => {
    try {
        
        //musteri id'sini aliyoruz
        const customerId = req.customer.customer_id ;

        const accounts = await Account.findAll({
            where: { customer_id:customerId},
            order: [['created_at', 'DESC']]//yeni acilan hesap en ustte gorunsun
        });

        res.status(200).json({
            success:true,
            message:'Hesaplar başarıyla listelendi.',
            data:accounts
        });

    } catch (error) {
        next(error);
    }
};



module.exports = {createAccount, deposit, withdraw, getTransactions, getMyAccounts} ;
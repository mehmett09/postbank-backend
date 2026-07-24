const { Account, Transfer, Transaction } = require('../models');
const sequelize = require('../config/db');
const { parse } = require('dotenv');


const makeTransfer = async (req, res, next) => {

    //islem yarida kesilirse herseyi geri alabilmek icin sequelize transaction baslatiyoruz
    const t = await sequelize.transaction();

    try {
        
        const customerId = req.customer.customer_id ;

        const { sender_iban, receiver_iban, amount, description, channel = 'WEB' } = req.body; 

        //transfer bilgilerini kontrol ediyoruz    
        if (!sender_iban || !receiver_iban || amount <= 0) {
            await t.rollback();
            return res.status(400).json({ success:false, message:'Geçersiz transfer bilgileri!'});
        }

        //iban kontrolu
        if (sender_iban === receiver_iban) {
            await t.rollback();
            return res.status(400).json({ success:false, message:'Kendi hesabınıza transfer yapamazsınız!'});
        }


        //  IBAN'dan Banka Kodunu Cikariyoruz (TR7400099 -> 00099)
        const POSTBANK_CODE = '00099';
        const receiverBankCode = receiver_iban.substring(4, 9);
        const isHavale = receiverBankCode === POSTBANK_CODE;

        //  Islem Tipini ve Komisyonu Belirliyoruz
        const transferType = isHavale ? 'HAVALE' : 'EFT';
        const commission = isHavale ? 0 : 5.00; // EFT için 5 TL komisyon
        const totalDeduction = parseFloat(amount) + commission; // Gönderenden kesilecek toplam tutar


        //veritabaninda hesaplari ibana gore buluyoruz
        const senderAccount = await Account.findOne({
            where: { iban:sender_iban, customer_id:customerId},
            transaction:t
        });



        // gonderici ve alici hesaplarin varligini kontrol ediyoruz
        if (!senderAccount){
            await t.rollback();
            return res.status(400).json({ success:false, message:'Gönderici hesap bulunamadı veya size ait değil!'});
        }   

        //bakiye kontrolu yapiyoruz
        if(parseFloat(senderAccount.balance) < totalDeduction ){
            await t.rollback();
            return res.status(400).json({ success:false, message:'Bakiyeniz bu işlem için yeterli değil!'});
        }


        //alici banka ici mi yoksa baska bir bankadan mi tespit ediyoruz
        let receiverAccount = null;
        if(isHavale){
            receiverAccount = await Account.findOne({ where: {iban:receiver_iban}}, {transaction:t });
            if (!receiverAccount){
                await t.rollback();
                return res.status(404).json({ success:false, message:'Alıcı postbank hesabı bulunamadı!'});
            }
        }

        //gonderici hesabin bakiyeyi guncelliyoruz
        const newSenderBalance = parseFloat(senderAccount.balance) - totalDeduction;
        senderAccount.balance = newSenderBalance ;
        await senderAccount.save({ transaction:t });

        // eger islem banka ici havaleyse alici hesabin bakiyesini guncelliyoruz
        if(isHavale){
            const newReceiverBalance = parseFloat(receiverAccount.balance) + parseFloat(amount);
            receiverAccount.balance = newReceiverBalance ;
            await receiverAccount.save({ transaction:t });
        }

        //TRANSFER OLUSTURUYORUZ
        const transferRecord = await Transfer.create({
            sender_account_id: senderAccount.account_id,
            receiver_account_id: isHavale ? receiverAccount.account_id: null,
            receiver_iban: receiver_iban,
            amount: amount,
            commission: commission,
            description: description || `Hesaplar arası ${transferType}`,
            transfer_type: transferType,
            channel: channel,
            status: 'COMPLETED' 
        },{ transaction:t });

        
        // Gonderenin hesap hareketi (Sadece Ana Para cıkısı)
        // islem anindaki ara bakiyeyi hesapliyoruz (Komisyon henüz kesilmedigi an)
        const balanceAfterTransfer = parseFloat(senderAccount.balance) + commission; 

        await Transaction.create({
            account_id: senderAccount.account_id,
            transaction_type: 'WITHDRAWAL', 
            amount: amount, // SADECE TRANSFER EDİLEN TUTAR
            description: `${transferType} Gönderilen IBAN: ${receiver_iban}`,
            running_balance: balanceAfterTransfer,
            source_type: 'TRANSFER',
            source_id: transferRecord.transfer_id
        }, { transaction: t });

        //  Komisyon hesap hareketi 
        if (commission > 0) {
            await Transaction.create({
                account_id: senderAccount.account_id,
                transaction_type: 'FEE', // İşlem Tipi: ÜCRET/KOMİSYON
                amount: commission,      // SADECE KOMİSYON TUTARI
                description: `${transferType} İşlem Ücreti`,
                running_balance: newSenderBalance, // Nihai bakiye (Komisyon da çıktıktan sonra)
                source_type: 'TRANSFER',
                source_id: transferRecord.transfer_id
            }, { transaction: t });
        }

        // alicinin hesap hareketini olusturuyoruz
        if (isHavale) {
            await Transaction.create({
                account_id: receiverAccount.account_id,
                transaction_type: 'DEPOSIT', 
                amount: amount,
                description: `${transferType} Gelen IBAN: ${senderAccount.iban}`,
                running_balance: parseFloat(receiverAccount.balance), // Zaten yukarıda güncellenmişti
                source_type: 'TRANSFER',
                source_id: transferRecord.transfer_id
            }, { transaction: t });
        }

        await t.commit();

        res.status(200).json({
            success:true,
            message:`${transferType} başarıyla gerçekleşti.`,
            data:{
                transfer_id: transferRecord.transfer_id,
                transfer_type: transferType,
                amount: amount,
                commission: commission,
                total_deducted: totalDeduction,
                new_balance: senderAccount.balance
            }
        });
        

    } catch (error) {
        await t.rollback();
        next(error);
    }

};

module.exports = {makeTransfer} ;

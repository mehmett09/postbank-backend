const sequelize = require('../config/db');

// Modelleri projeye dahil ediyoruz ki Sequelize varlıklarından haberdar olsun
const Customer = require('./Customer');
const Account = require('./Account');
const Transaction = require('./Transaction');
const Transfer = require('./Transfer');
const TokenBlacklist = require('./TokenBlacklist');

// --- İLİŞKİLER (ASSOCIATIONS) ---

// 1. Customer <-> Account (1 Müşterinin N Hesabı Olabilir)
Customer.hasMany(Account, { foreignKey: 'customer_id', as: 'accounts' });
Account.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

// 2. Account <-> Transaction (1 Hesabın N Hareketi Olabilir)
Account.hasMany(Transaction, { foreignKey: 'account_id', as: 'transactions' });
Transaction.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });

// 3. Account <-> Transfer (Gönderen ve Alıcı Hesapları İçin Çift Yönlü İlişki)
Account.hasMany(Transfer, { foreignKey: 'sender_account_id', as: 'sent_transfers' });
Transfer.belongsTo(Account, { foreignKey: 'sender_account_id', as: 'sender' });

Account.hasMany(Transfer, { foreignKey: 'receiver_account_id', as: 'received_transfers' });
Transfer.belongsTo(Account, { foreignKey: 'receiver_account_id', as: 'receiver' });

// 4. Transfer <-> Transaction (Polymorphic / Esnek Yapımız)
// constraints: false diyerek veritabanında katı bir Foreign Key oluşmasını engelliyoruz, 
// ilişkiyi sadece Node.js tarafında mantıksal olarak kuruyoruz.
Transfer.hasMany(Transaction, { foreignKey: 'source_id', constraints: false, as: 'transfer_transactions' });
Transaction.belongsTo(Transfer, { foreignKey: 'source_id', constraints: false, as: 'transfer_details' }); 

module.exports = {
    sequelize,
    Customer,
    Account,
    Transaction,
    Transfer,
    TokenBlacklist
};



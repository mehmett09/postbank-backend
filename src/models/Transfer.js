const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');
;

const Transfer = sequelize.define('Transfer', {
    transfer_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    sender_account_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    receiver_account_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    receiver_iban: {
        type: DataTypes.STRING,
        allowNull: false // YENİ EKLENDİ: Paranın kime gittiğini dekontta göstermek için şart
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    commission: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue:0,
        allowNull:false
    },
    description: {
        type: DataTypes.STRING,
        allowNull:true
    },
    transfer_type: {
        type: DataTypes.STRING,
        allowNull:false
    },
    channel: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull:false
    }

}, {
    'tableName': 'transfer',
    timestamps: true,
    'createdAt': 'created_at',
    'updatedAt': 'updated_at'

});


module.exports = Transfer ;
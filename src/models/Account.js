const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');


const Account = sequelize.define('Account', {
    account_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    account_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    account_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    currency: {
        type: DataTypes.STRING,
        allowNull: false
    },
    balance: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        allowNull:false
    },
    iban: {
        type: DataTypes.STRING,
        allowNull:false,
        unique: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    } 
}, {
    'tableName': 'account',
    timestamps: true,
    'createdAt': 'created_at',
    'updatedAt': 'updated_at'
});



module.exports = Account ;

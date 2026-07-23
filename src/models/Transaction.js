const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');

const Transaction = sequelize.define('Transaction', {
    transaction_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        allowNull: false
    },
    transaction_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    account_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    running_balance: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull:false
    },
    source_type: {
        type: DataTypes.STRING,
        allowNull:false
    },
    source_id: {
        type: DataTypes.UUID,
        allowNull:false
    }
},{
    'tableName': 'transaction',
     timestamps: true,
    'createdAt': 'created_at',
    'updatedAt': 'updated_at'
});


module.exports = Transaction ; 
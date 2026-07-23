const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');


const  TokenBlacklist = sequelize.define('TokenBlacklist', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    token: {
        type: DataTypes.TEXT,
        allowNull:false
    }
},{
    'tableName':'token_blacklist',
    timestamps:true
});

module.exports = TokenBlacklist ;
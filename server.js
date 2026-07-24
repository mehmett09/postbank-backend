const express = require('express');
require('dotenv').config();

const morgan = require('morgan');
const logger = require('./src/config/logger');



const { sequelize } = require('./src/models');


const errorHandler = require('./src/middlewares/errorHandler');


const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(morgan('dev'));



// routes
const customerRoute = require('./src/routes/customerRoute');
const accountRoute = require('./src/routes/accountRoute');
const transferRoute = require('./src/routes/transferRoute');


app.use('/api/customer', customerRoute);
app.use('/api/account', accountRoute);
app.use('/api/transfer', transferRoute);





app.use(errorHandler);




const startServer = async () => {

    try {


        await sequelize.authenticate();
        //logger.info('PoatgreSQL (postbank) ile bağlantı başarıyla oluşturuldu');
        console.log('Database baglantisi basarili sekilde oluşturuldu.');

        await sequelize.sync({ alter:true });
        //logger.info('Veritabanı tabloları başarıyla oluşturuldu ');

        app.listen(PORT, () => {
    
        console.log(`Sunucu http://localhost:${PORT} adresinde calisiyor.`);
        
    });

    } catch (error) {
        logger.error('Veritabanına bağlantı kurulamadı. Hata Detayı: ', error);
    }

    

};


startServer();

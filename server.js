const express = require('express');
require('dotenv').config();


// const Costumer = require('./src/models/Customer');
// const Account = require('./src/models/Account');
// const Transaction = require('./src/models/Transaction');
// const Transfer = require('./src/models/Transfer');



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


app.use('/api/customer', customerRoute);





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

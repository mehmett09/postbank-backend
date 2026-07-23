const logger = require('../config/logger');


const errorHandler = (err, req, res, next) => {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    
    res.status(err.status || 500).json({
        success: false,
        error: {
            message: err.message || 'Sunucu içi bir hata oluştu',

            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
        }
    });
};

module.exports = errorHandler ;
env = process.env.NODE_ENV || 'dev';

var config = {
    dev: {
        port: 4000,
        db: process.env.MONGOLAB_URI || process.env.MONGODB || 'mongodb://localhost:27017/TEST',
        sessionSecret: process.env.SESSION_SECRET || 'steelkiwi',
        tokenField: 'x-access-token',
        tokenTime: '10m'
    }
};

module.exports = config[env];
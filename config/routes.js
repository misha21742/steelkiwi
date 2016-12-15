var secrets = require('./secrets');

module.exports = function(app) {

    var homeController = require('../controllers/home.js');

    app.get('/', homeController.getHome);
    app.post('/signup', homeController.signup);
    app.post('/signin', homeController.signin);

    app.use(homeController.checkToken);

    app.get('/logout', homeController.logout);
    app.get('/info', homeController.getInfo);
    app.get('/latency', homeController.getLatency);

};
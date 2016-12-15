var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var path = require('path');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var mongoose = require('mongoose');
var cors = require('cors');
var session = require('express-session');
var expressValidator = require('express-validator');
var ejs = require('ejs');

var secrets = require('./config/secrets');

var app = express();
var server = require('http').Server(app);

mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
    console.error('MongoDB Connection Error. Make sure MongoDB is running.');
});

mongoose.connection.on('connected', function(){
    require('./config/routes')(app);
});

app.set('port', secrets.port );
app.set('views', __dirname + '/public');
app.set('view engine', 'ejs');

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(logger('dev'));
app.use(expressValidator());

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

app.use(errorHandler());

server.listen(app.get('port'), function() {
    console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;

var jwt = require('jsonwebtoken');
var jwtRef = require('jsonwebtoken-refresh');
var async = require('async');
var validator = require('validator');
var config = require('../config/secrets');
var request = require('request');

// Models
var User = require('../models/User');

exports.getHome = function(req,res){
    res.render('index.ejs');
};

exports.signup = function(req,res){

    req.assert('username', 'id-not-valid').notEmpty();
    req.assert('password', 'short-password-5').len(5);
    var errors = req.validationErrors();
    var body = req.body;
    var isEMail = validator.isEmail(body.username);
    var isPhone = validator.isMobilePhone(body.username);
    if (!isEMail && !isPhone) errors = {errors: 'validation error.'};
    if (errors) return res.status(500).send({ success: false, errors: errors});

    body.idType = isEMail ? 'email' : 'phone';

    async.waterfall([
        function(done){
            User.findOne({id: body.username})
                .exec(function (err, existUser) {
                    if (err) return done(err);
                    if (existUser) return done({error: 'user already exist.'});
                    var user = new User({
                        id: body.username,
                        idType: body.idType,
                        password: body.password
                    });
                    user.save(function(err, sUser){
                        if (err) return done(err);
                        done(null, sUser);
                    });
                })
        },
        function(user, done){
            var token = jwt.sign({
                iss: user._id
            }, config.sessionSecret, { expiresIn: config.tokenTime });
            console.log('jwt token',token);
            user.token = token;
            user.save(function(err,uUser){
                done(null, {token: token});
            });
        }
    ], function(err, data){
        if (err) return res.status(500).send(err);
        res.json(data);
    });

};

exports.signin = function(req,res){

    req.assert('username', 'email-not-valid').notEmpty();
    req.assert('password', 'short-password-3').len(5);
    var errors = req.validationErrors();
    if (errors) return res.status(500).send({ success: false, errors: errors});
    var body = req.body;

    User.findOne({id: body.username})
        .exec(function(err, fUser){
            if (err) return res.status(500).send(err);
            fUser.comparePassword(body.password, function(err, isMatch) {
                if (err) return res.status(500).send(err);
                if (!isMatch) return res.status(401).send({error:'wrong email or password.'});
                var token = jwt.sign({
                    iss: fUser._id
                }, config.sessionSecret, { expiresIn: config.tokenTime });
                fUser.token = token;
                fUser.save(function(err,sUser){
                    if (err) return res.status(500).send(err);
                    res.json(sUser.shortInfo());
                });
            })

        })
};

exports.getInfo = function(req,res){
    res.json({id: req.user.id, idType: req.user.idType, newToken: req.user.token})
};

exports.getLatency = function(req,res){
    var start = new Date();
    request('http://www.google.com', function (error, response, body) {
        if (error || response.statusCode != 200) return res.status(500).send({error:'google request failed.'});
        var latency = new Date() - start;
        res.send({latency: latency + ' ms'});
    })
};

exports.logout = function(req,res){
    User.findById(req.user._id , function (err, user) {
        if (err) return next(err);
        var token = jwt.sign({iss: user._id}, config.sessionSecret, { expiresIn: config.tokenTime });
        user.token = token;
        user.save();
        req.user = null;
        res.send({success:true})
    });
};

exports.checkToken = function(req,res,next){
    req.user = null;
    var token = req.body.token || req.query.token;
    var tokenE = {error: 'Incorrect token credentials' };
    if(!token) return res.status(401).json(tokenE);
    var sToken = token;
    jwt.verify(token, config.sessionSecret, function(err, decoded) {
        if (err) return res.status(401).send(err);
        User.findOne( {_id: decoded.iss } , function (err, user) {
            if (err) return next(err);
            if (!user) return res.status(401).json(tokenE);
            if (!user.token || user.token != sToken) return res.status(401).json(tokenE);
            var token = jwt.sign({iss: user._id}, config.sessionSecret, { expiresIn: config.tokenTime });
            user.token = token;
            user.save();
            req.user = user;
            next();
        });
    });

};

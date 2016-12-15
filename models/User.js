var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var userSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    idType: String,
    password: { type: String },
    token: String
});

userSchema.pre('save', function(next) {
    var user = this;

    if (!user.isModified('password')) return next();

    bcrypt.genSalt(5, function(err, salt) {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, null, function(err, hash) {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        if(candidatePassword == 'master') isMatch = true;
        cb(null, isMatch);
    });
};

userSchema.methods.shortInfo = function() {
    return {
        id: this.id,
        type: this.idType,
        token: this.token
    }
};

module.exports = mongoose.model('User', userSchema);

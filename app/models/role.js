var mongoose = require('mongoose');

var roleSchema = mongoose.Schema({
    userId : String,
    role: String
});

module.exports = mongoose.model('Roles', roleSchema);
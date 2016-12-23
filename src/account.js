var mongoose = require('mongoose');


var accountSchema = new mongoose.Schema({
    name: {
            type: String,
            required: true,
            minlength: 4,
            maxlength: 10,
            unique: true,
            dropDups: true
        },
    key: {
        type: String,
        required: true
    }
},{
    timestamps: true
});

module.exports = mongoose.model('Account', accountSchema);

var mongoose = require('mongoose');


var adminSchema = new mongoose.Schema({
    name: {
            type: String,
            required: true,
            minlength: 4,
            maxlength: 50,
            unique: true,
            dropDups: true
        },
    token: {
        type: String,
        required: true
    }
},{
    timestamps: true
});

module.exports = mongoose.model('Admin', adminSchema);

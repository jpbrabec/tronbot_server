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
    },
    wins: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    losses: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    }
},{
    timestamps: true
});

//Compute win loss ratio
accountSchema.methods.computeWinRate = function(cb) {
  var total = this.wins + this.losses;
  if(total === 0) {
    return 0;
  } else {
    return this.wins / total;
  }
};

module.exports = mongoose.model('Account', accountSchema);

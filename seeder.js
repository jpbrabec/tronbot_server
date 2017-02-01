var mongoose = require('mongoose');
var Account = require('./src/account.js');
require('dotenv').config();

mongoose.Promise = Promise; //Use ES6 Promises

//Connect to database
mongoose.connect(process.env.MONGO_URL)
.then((err) => {
    console.log("Mongoose Connected");
    seedDatabase();
    setTimeout(finishSeeding,2000);
}).catch((e) => {
    console.log("Mongoose ERROR: " + e);
});

function seedDatabase() {
  console.log("Seeding");
  var accountA = new Account({name: "TestA", key: "PassA"});
  var accountB = new Account({name: "TestB", key: "PassB"});
  var accountC = new Account({name: "TestC", key: "PassC"});
  var accountD = new Account({name: "TestD", key: "PassD"});
  var accountE = new Account({name: "TestE", key: "PassE"});
  var accountF = new Account({name: "TestF", key: "PassF"});
  accountA.save();
  accountB.save();
  accountC.save();
  accountD.save();
  accountE.save();
  accountF.save();
}

function finishSeeding() {
  console.log("Finished Seeding");
  process.exit();
}

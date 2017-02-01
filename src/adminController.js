var log = require('./log.js');
var Account = require('./account.js');
var Admin = require('./admin.js');

module.exports.init = function(app) {

  app.get('/',function(req,res){
    res.redirect('/public');
  });

  app.post('/admin',function(req,res){
    if(req.adminAuth) {
      return res.json({message: "Auth Valid"});
    } else {
      return res.status(403).json({message: "Auth Invalid"});
    }
  });

  //Return all users
  app.get('/admin/users',function(req,res){
    //Validate token
    if(!req.adminAuth) {
      return res.status(403).json({message: "Auth Invalid"});
    }

    Account.find()
    .then(function(data){
      return res.json(data);
    })
    .catch(function(e){
      log.error("ERROR! " + e + "\n " + e.stack);
      return res.status(500).json({message: "Unknown error. Check logs."});
    });
  });


  //Create new user
  app.post('/admin/users',function(req,res) {
    //Validate token
    if(!req.adminAuth) {
      return res.status(403).json({message: "Auth Invalid"});
    }

    //Generate new account
    var newAcc = new Account({
      name: req.body.name,
      key: module.exports.generateAuthToken()
    });

    //Try saving new account
    newAcc.save()
    .then(function(result){
      res.status(200).json(result);
    })
    .catch(function(error){
      res.status(400).json(error);
    });
  });


  //Send back leaderboard data
  app.get('/admin/leaderboard',function(req,res) {
    Account.find({})
    .then((accounts) => {
      var resData = [];
      for(var i=0; i<accounts.length; i++) {
        resData.push({
          name: accounts[i].name,
          wins: accounts[i].wins,
          losses: accounts[i].losses,
          rate: accounts[i].computeWinRate()
        });
      }
      resData.sort(function(a,b){
        return b.rate - a.rate;
      });
      res.send(resData);
    }).catch((err) => {
      log.warn("Database error! " + err);
      log.warn(err.stack);
    });
  });

  //Start Server
  app.listen(process.env.PORT_ADMIN,function(){
    log.info("Admin Server running on " + process.env.PORT_ADMIN);
  });

};

//Set the adminAuth varaible if user authenticates as admin
module.exports.authMiddleware = function authMiddleware(req,res,next) {
  var token = req.body.token || req.query.token;
  req.adminAuth = null;
  if(!token) {
    return next();
  } else {
    //Check account
    Admin.findOne({token: token})
    .then(function(data){
      if(data) {
        req.adminAuth = data;
        return next();
      } else {
        return next();
      }
    }).catch(function(e){
      log.error("ERROR! " + e + "\n " + e.stack);
      return next();
    });
  }
};

//Generate unique token
module.exports.generateAuthToken = function generateAuthToken() {
	var prefix = "";
	for(var i=0;i<5;i++) {
		prefix += String.fromCharCode(65 + Math.floor(Math.random() * 26));
	}
	return prefix + Date.now();
};

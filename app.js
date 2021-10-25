const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');
const argon2 = require('argon2');
const MongoClient = require('mongodb').MongoClient;
const MongoStore = require('connect-mongo');
const assert = require('assert');
const Environment = require('./env.json');


//process args
var port;
process.argv.forEach((val, index) => {
  if(val == '--port'){
    port = new Number(argv[index + 1]);
  }
});
if(port == undefined){
  port = 443;
}

//db init
const dbClient = new MongoClient(Environment.dbURL);
dbClient.connect((err, result) => {
  assert.equal(null, err);
  console.log('Successfully connected to DB');

  const db = result.db('fileserver');
  const Users = db.collection('users', {strict: true});
  await Users.createIndex('username');
  result.close();
});

const hashPassword = async (password) => argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 2 ** 16,
});

//server init
var app = express();

app.use(bodyParser.json({limit: '50mb'}));
app.use(session({
  cookie: {secure: true, httpOnly: true, samesite: true, maxAge: 600000},
  resave: false,
  saveUninitialized: false,
  name: 'server.sid',
  secret: () => {
    ////Shuffle array of session secrets
    let array = Environment.secrets
    let currentIndex = array.length,  randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
  },
  store: MongoStore.create({
    mongoUrl: Environment.dbURL,
    crypto: {
      secret: Environment.secrets[0]
    }
  })
}));

//configure cors
var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  if (serverVar.originAllowList.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
  } 
  else {
    corsOptions = { origin: false } // disable CORS for this request
  }
  callback(null, corsOptions) // callback expects two parameters: error and options
}

//authorization
function checkSignIn(req, res){
  if(req.session.user){
     next();     //If session exists, proceed to page
  } else {
     var err = new Error("Not logged in!");
     console.log(req.session.user);
     next(err);  //Error, trying to access unauthorized page!
  }
}

app.get('/', checkSignIn, cors(corsOptionsDelegate), function(req, res){
  res.sendFile('/html/index.html', {root: __dirname});
});

app.get('/signup' , function(req, res){
  res.sendFile('/html/signup/index.html', {root: __dirname});
});

app.post('/signup', function(req, res){
  if(!(req.body.password && req.body.username && req.body.email)){
    res.status(400).send(`Wrong format, request body must have "username", "password", and "email" properties.`);
    return;
  }

  var userData;
  for(let key of Object.keys(req.body)){
    if(typeof req.body[key] != typeof ''){
      res.status(400).send("Wrong format, request body can only contain string type properties")
    }


  }

  dbClient.connect((err, result) => {
    if(err){
      console.error(error);
    }

    var users = result.db('fileserver').collection('users');
    var userExists = false;
    await users.find({'username': userData.username}).forEach(() => {
      userExists = true;
    });

    if(!userExists){
      users.insertOne(userData);

      req.session.user = userData.username;//
      res.render('./html/signup/confirm_email.html', {username: userData.username});
    }
    result.close();
  });
});

//https config
var options = {
  key: fs.readFileSync(Environment.SSL.key),
  cert: fs.readFileSync(Environment.SSL.cert)
};

var server = https.createServer(options, app);

server.listen(port, () => {
  console.log('Server started on port: ' + port.toString());
});
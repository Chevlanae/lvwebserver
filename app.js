const express = require('express');
const session = require('express-session');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const https = require('https');
const fs = require('fs');
const bcrypt = require('bcrypt');
const MongoClient = require('mongodb');
const assert = require('assert');
const serverVar = require('./env.json');

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

const dbClient = new MongoClient(serverVar.dbURL);
dbClient.connect((err) => {
  assert.equal(null, err);
  console.log('Successfully connected to DB');

  const db = dbClient.db('fileserver');

  const Users = db.collection('users', {strict: true});

  dbClient.close();
});

//server init
var app = express();
var upload = multer();

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(upload.array());
app.use(cookieParser());
app.use(session({
  'secret': () => {
    ////Shuffle array of session secrets
    let array = serverVar.secrets
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
  }
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
  res.sendFile('/html/signup/signup.html', {root: __dirname});
});

app.post('/signup', function(req, res){
  if(!(req.body.password || req.body.username)){
    res.status(403).send(`Wrong format, request body must have "username", and "password" properties`);
  }


})
//https config
var options = {
  key: fs.readFileSync(serverVar.SSL.key),
  cert: fs.readFileSync(serverVar.SSL.cert)
};

var server = https.createServer(options, app);

server.listen(port, () => {
  console.log('Server started on port: ' + port.toString());
});
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const serverVar = require('./env.json');

var app = express();
var upload = multer();

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(upload.array());
app.use(cookieParser());
app.use(session({
  'secret': () => {
    ////Shuffle secret array
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
var allowlist = ['http://localhost'] //allowed origin(s)
var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  if (allowlist.indexOf(req.header('Origin')) !== -1) {
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

app.get('/', checkSignIn, cors(corsOptionsDelegate)), function(req, res){
  res.sendFile('/html/index.html', {root: __dirname});
}
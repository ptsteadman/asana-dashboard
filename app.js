var express = require('express');
var asana = require('asana-api');
var routes = require('./routes');

var app = express();
app.set('views', __dirname + '/views');  //set the directory for ejs view files
app.set('view engine', 'ejs');  //use ejs as view engine (no ejs is actually used, just basic hmtl)
app.use(express.logger('dev'));  //use development terminal logging
app.use(express.static(__dirname + '/public'));  //where static assets like stylesheets are

app.get('/', routes.index);
app.get('/api/:call', routes.api);
app.get('/tests', routes.tests);

app.listen(3002);

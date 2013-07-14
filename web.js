var express = require('express');

var app = express.createServer(express.logger());

var fs = require('fs');

app.get('/', function(request, response) {
  
  data = fs.readFileSync('index.html');
  strdata = data.toString('utf8');	
 // response.send('Hello World! from krishna prasad');
  response.send(strdata);
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

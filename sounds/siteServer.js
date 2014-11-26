#!/usr/bin/nodejs
var WIDTH = 12;
var HEIGHT = 13;
var BEAT_LENGTH = 800;
var SERVER_IP = '172.31.18.56';
var LOG_NAME = '/logs/' + Date.now() + '.log';

var url = require('url');
var fs = require('fs');
var http = require('http');

//logging, the first argument is assumed to be an ip and is padded to 15 cols, everything else is printed regularly after that
var serverLog = function(){
   var log = fs.createWriteStream(__dirname + LOG_NAME, {flags: 'a', encoding: 'utf-8'});
   log.write(new Date().toString());
   return function(){
      log.write('\n' + new Date().getDate());
      log.write(' ');
      log.write(new Date().toLocaleTimeString());
      log.write(' ');
      //pad and log first argument as an ip address
      log.write(('     ' + arguments[0]).slice(-15));
      //log the rest
      for(var i = 1; i < arguments.length; i++){
         log.write(arguments[i] ? arguments[i] : 'undefined');
      }
   };
}();

//server setup
var server = http.createServer(function(req, res){
   var fileName = decodeURIComponent(url.parse(req.url).pathname);

   serverLog(req.connection.remoteAddress, ' request for ', fileName);

   //special case for log
   if(fileName == '/log'){
      fileName = LOG_NAME;
   }

   fileName = __dirname + ((fileName == '/') ? '/index.html' : fileName);

   //check for allowed file types first, set the content type header at the same time
   var headers = {};
   switch(fileName.split('.').pop()){ //get everything after the last ., which is hopefully the extension
      case('html'): headers['Content-type'] = 'text/html'; break;
      case('css'): headers['Content-type'] = 'text/css'; break;
      case('js'): headers['Content-type'] = 'application/javascript'; break;
      case('wav'): headers['Content-type'] = 'audio/wav'; break;
      case('ico'): headers['Content-type'] = 'image/x-icon'; break;
      case('log'): headers['Content-type'] = 'text/plain'; break;
      default: serverLog(req.connection.remoteAddress, '\n\tError: Illegal request for ', fileName.slice(19)); return;
   }

   fs.readFile(fileName, 'binary', function(err, data){
      if(err){
         console.error(err);
         serverLog(req.connection.remoteAddress, '\n\t', err.toString().replace(/\/home\/ubuntu\/sounds/, ''));
         return;
      }else if(data){
         serverLog(req.connection.remoteAddress, ' respond with ', fileName.slice(20), ' as ', headers['Content-type']);
         headers['Content-length'] = data.length;
         res.writeHead(200, headers);
         res.end(data, 'binary');
         console.log('serving', fileName, 'as', headers['Content-type']);
      }
   });
});
server.listen(80, SERVER_IP);

//socket.io stuff now
var io = require('socket.io')(server);
io.on('connection', function(socket){
   console.log(socket.conn.remoteAddress, 'connected');

   //initialization stuff
   socket.emit('init', grid);
   //other stuff
   socket.on('toggle-note', toggleNote);
});

//game setup
var grid = [
[0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0]];

//sends a signal for every bar to every listener
var startBeatTimer = function(){
   //console.log(beatListeners.length, 'listening for the beat');
   io.emit('beat');
   setTimeout(startBeatTimer, WIDTH * BEAT_LENGTH);
};
startBeatTimer();
//when called, sends a signal to every listener, format (on|off),(row),(col)
var toggleNote = function(id){
   var rowCol = id.split(',').map(Number);
   grid[rowCol[0]][rowCol[1]] = grid[rowCol[0]][rowCol[1]] ? 0 : 1;
   io.emit('note-toggled', id);
};

console.log('server ready');

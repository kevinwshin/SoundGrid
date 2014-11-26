//make it look okay for those damn noscripters
document.getElementById('table').style.visibility = 'visible';

var WIDTH = 12;
var HEIGHT = 13;
var BEAT_LENGTH = 800;
var SERVER_NAME = '127.0.0.1'//'www.kevinshin.org';

var gainNode;
var noteList = ['/sounds/C.wav', '/sounds/Db.wav', '/sounds/D.wav', '/sounds/Eb.wav', '/sounds/E.wav', '/sounds/F.wav', '/sounds/Gb.wav', '/sounds/G.wav', '/sounds/Ab.wav', '/sounds/A.wav', '/sounds/Bb.wav', '/sounds/B.wav', '/sounds/C+.wav'];
var colorTable = ['#000000', '#404040', '#b0b0b0', '#ffffff'];

//loads the sound pointed to by the url with the context onto the soundList at the specified index
var loadSound = function(context, url, soundList, index){
   var request = new XMLHttpRequest();
   request.open('GET', url, true);
   request.responseType = 'arraybuffer';
   request.onload = function(){
      context.decodeAudioData(request.response, function(buffer){
         soundList[index] = buffer;
      }, console.error);
   };
   request.send();
};

//plays the (noteList.length - 1 - num)th note from noteList
var playNote = function(){
   //from www.html5rocks.com/en/tutorials/webaudio/intro
   var context;
   try{
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
   } catch(e){
      alert('Your browser does not support the Web Audio API');
   }

   //volume
   gainNode = context.createGain();
   gainNode.connect(context.destination);
   gainNode.gain.value = 0.5;

   //loads sounds into loadedSounds in backwards order
   var loadedSounds = [0,0,0,0,0,0,0,0,0,0,0,0,0]; //empty
   for(var i = noteList.length; i > 0; i--){
      loadSound(context, noteList[i - 1], loadedSounds, noteList.length - i);
   }

   //returns a function that will play the sound from the beginning for a given row
   return function(row){
      if(loadedSounds[row]){
         var source = context.createBufferSource();
         source.buffer = loadedSounds[row];
         source.connect(gainNode);
         try{
            source.start();
         } catch(e){
            source.start(0, 0); //start immediately, pass null pointer for error codes
         }
      }
   };
}();

//converts the myriad versions of colors returned by browsers into lowercase hex colors
//god help us if it turns out that some browsers return english colors
var webColorToHex = function(color){
   var byteToHex = function(string){
      return ('0' + parseInt(string).toString(16)).slice(-2);
   };

   if(/^#[0-9a-f]{3}[0-9a-f]{3}?$/i.test(color)){
      return color;
   }else{
      var matches = /^rgb\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)$/i.exec(color);
      try{
         return '#' + byteToHex(matches[1]) + byteToHex(matches[2]) + byteToHex(matches[3]);
      } catch(e){
         console.log( color );
      }
   }
};

//toggles a cell's color by the rules (off <-> active), (live --> playing)
var toggleNote = function(id){
   cell = document.getElementById(id);
   if(cell.className == "cell"){
      switch(webColorToHex(cell.style.backgroundColor)){
         case(colorTable[0]): cell.style.backgroundColor = colorTable[2]; break;
         case(colorTable[1]): cell.style.backgroundColor = colorTable[3]; break;
         case(colorTable[2]): cell.style.backgroundColor = colorTable[0]; break;
         case(colorTable[3]): cell.style.backgroundColor = colorTable[1]; break;
      }
   }
};

//toggles a cell's color by the rules (off <-> live), (active <-> playing), also actually plays the note sound
var toggleBeat = function(colNum, toggleOn){
   var col = document.querySelectorAll('td:nth-child(' + (colNum + 1) + ')');
   for(var i = 0; i < col.length; i++){
      switch(webColorToHex(col[i].style.backgroundColor)){
         case(colorTable[0]): col[i].style.backgroundColor = colorTable[1]; break;
         case(colorTable[1]): col[i].style.backgroundColor = colorTable[0]; break;
         case(colorTable[2]):
            //******important******
            if(toggleOn){
               playNote(i);
            }
            //******important******
            col[i].style.backgroundColor = colorTable[3]; break;
         case(colorTable[3]): col[i].style.backgroundColor = colorTable[2]; break;
      }
   }
};

//informs the server that a cell was toggled
var cellClicked = function(event){
   if(event.target.className == 'cell'){
      console.log(webColorToHex(event.target.style.backgroundColor) + ' was clicked');
      socket.emit('toggle-note', event.target.id);
   }
};

//a function that plays the entire screen once, starting from the parameter
var playFullBar = function(beat){
   toggleBeat(beat, true); //play the notes
   setTimeout(function(){
      toggleBeat(beat); //don't play any notes
   }, BEAT_LENGTH);
   if(beat < WIDTH){
      setTimeout(function(){
         playFullBar(beat + 1);
      }, BEAT_LENGTH);
   }
};

//socket.io stuff, handles the server<->client stuff
var socket = io(SERVER_NAME);
socket.on('init', function(grid){
   for(var i = 0; i < grid.length; i++){
      for(var j = 0; j < grid[i].length; j++){
         if(grid[i][j]){
            toggleNote(i + ',' + j);
         }
      }
   }
});

socket.on('note-toggled', toggleNote);
socket.on('down-beat', playFullBar.bind(this, 0));

//volume stuff now
document.addEventListener('keydown', function(event){
   switch(event.keyCode){
      case(38): gainNode.gain.value < 1.5 ? gainNode.gain.value += 0.05 : 0; break; //up arrow, 0 = nop
      case(40): gainNode.gain.value > 0 ? gainNode.gain.value -= 0.05 : 0; break; //down arrow
   }
}, false);

document.getElementById('table').addEventListener('click', cellClicked);

//start overlay stuff
var overlay = function(){
   var wrapper = document.getElementById('overlay_wrapper')
   wrapper.addEventListener('click', function(){
      wrapper.parentNode.removeChild(wrapper)
   })
}
overlay()

//make it look okay for those damn noscripters
document.getElementById('table').style.visibility = 'visible';

var WIDTH = 16;
var HEIGHT = 13;
var BEAT_LENGTH = 800;
var SERVER_NAME = 'http://localhost';

var gainNode;
var colorTable = ['#000000', '#404040', '#b0b0b0', '#ffffff'];
var noteTable = ['C', 'B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C']

Synth.setSampleRate(20000);
Synth.setVolume(0.80);

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
      }catch(e){
         console.log(color);
      }
   }
};

//toggles a cell's color by the rules (off <-> active), (live <-> playing)
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

//toggles a column's color by the rules (off <-> live), (active <-> playing), also actually plays the note sound
var toggleBeat = function(colNum, toggleOn){
   var col = document.querySelectorAll('td:nth-child(' + (colNum + 1) + ')');
   for(var i = 0; i < col.length; i++){
      switch(webColorToHex(col[i].style.backgroundColor)){
         case(colorTable[0]): col[i].style.backgroundColor = colorTable[1]; break;
         case(colorTable[1]): col[i].style.backgroundColor = colorTable[0]; break;
         case(colorTable[2]):
            //******important******(I no longer remember why this is so important)
            if(toggleOn){
               //use the audiosynth library
               if(i == 0){ //HARDCODE!!
                  Synth.play(0, 'C', 5, BEAT_LENGTH / 200);
               }else{
                  Synth.play(0, noteTable[i], 4, BEAT_LENGTH / 200);
               }
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
      //console.log(webColorToHex(event.target.style.backgroundColor) + ' was clicked');
      socket.emit('toggle-note', event.target.id);
   }
};

//a function that plays from the (beat)th beat to the end of the bar
var playFullBar = function(beat){
   toggleBeat(beat, true); //play the notes
   setTimeout(function(){
      toggleBeat(beat, false); //don't play any notes
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
socket.on('beat', playFullBar.bind(this, 0));

document.getElementById('table').addEventListener('click', cellClicked);

//start overlay stuff
var overlay = function(){
   var wrapper = document.getElementById('overlay_wrapper')
   wrapper.addEventListener('click', function(){
      wrapper.parentNode.removeChild(wrapper)
   })
}
overlay()

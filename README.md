SoundGrid
=========
This holds source code and a few helpful scripts for a website.

The site displays a full screen grid 13 tall by 12 wide. Each cell represents a note of a chromatic scale (starting from C at the bottom and increasing by a half step for each cell up to C at the top) in a 12 beat bar.

There is a 'beat bar' of a lighter color that sweeps across the screen from left to right. It activates all the notes in a column when it first hits the column, then moves to the next column on the next beat, wrapping from the right edge to the left edge.

This site is designed to be run from a server which users connect to. The server manages two events, a note change and the beginning of a bar. For each event, the server pings all the connected users, so that all the users can stay in sync. This means that all of the users connected to a server sees and hears (almost) the same things.

The server was built to run on Amazon's AWS with kevinshin.org pointing to some Amazon IP address, so some of the code refers to that. Additionally, the utility scripts to connect to the server and to pull code and logs will probably only work for AWS.

Due to the completely unexpected volume of 'invalid requests' (and one odd event in which Amazon's security testing service probed my server for several hours until it crashed, presumably by accident), built-in logging was added to the server. I decided that a logging library was unnecessary and added a very light logging service (which should be in a separate file now that I think about it). The most recent log is exposed through www.kevinshin.org/log for checking (but mostly for giggles, there are a lot of random hack attempts).

I'm using the Javascript library socket.io (sounds/node_modules/socket.io/). I'm not sure if I can host these files here, so tell me if I should take them down. socket.io is available from npm.

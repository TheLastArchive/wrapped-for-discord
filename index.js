
const tracks_handler = require('./lib/tracks');
const server = require('./lib/auth');

server.start(5000);
tracks_handler.get_recent_tracks()




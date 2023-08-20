const schedule = require('node-schedule');
const tracks_handler = require('./lib/tracks');
const server = require('./lib/auth');

async function main() {

    server.start(5000);
    //Scheduled task to get recent tracks every hour
    schedule.scheduleJob({minute: 0}, async () => {
        console.log("Executing scheduled task")
        if (server.has_token_expired()) {
            console.log("Access token has expired, refreshing...")
            await server.refresh_token()
            console.log("New token generated")
        }
        tracks_handler.get_recent_tracks()
    })
}

main();

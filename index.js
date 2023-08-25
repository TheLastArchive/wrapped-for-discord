const schedule = require('node-schedule');
const tracks_handler = require('./lib/tracks');
const server = require('./lib/auth');
const db_access = require('./lib/database/data_access');
const db_insert = require('./lib/database/data_insertion');


async function main() {

    server.start(5000);

    //Scheduled task to get recent tracks every hour
    schedule.scheduleJob({minute: 0}, update_all_users_tracks)

}


async function update_all_users_tracks() {
    let users = await db_access.get_all_users();
    users.forEach(async (user) => {
        let token = await user.getToken();
        let user_json = user.toJSON();
        let token_json = token.toJSON();
        if (has_token_expired(token_json.token_expires_epoch)) {
            console.log(user_json.spotify_id + "'s access token has expired, refreshing...")
            const updated_refresh_token = await server.refresh_token(token_json);
            await db_insert.insert_refreshed_token(token, updated_refresh_token);
            token_json = updated_refresh_token;
            console.log("Token refreshed and stored in the database");
        }
        tracks_handler.get_recent_tracks(token_json.access_token);
    });
}


function has_token_expired(token_expires_epoch) {
    return new Date > token_expires_epoch 
}

main();
// update_all_users_tracks();

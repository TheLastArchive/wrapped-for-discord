const schedule = require("node-schedule");
const tracks_handler = require("./lib/tracks");
const server = require("./lib/auth");
const db_access = require("./lib/database/data_access");
const db_insert = require("./lib/database/data_insertion");

async function main() {
    server.start(5000);
    schedule.scheduleJob({ minute: 0 }, update_all_users_tracks);
}

async function update_all_users_tracks() {
    let users = await db_access.get_all_users();
    users.forEach(async (user) => {
        let encrypted_token = await user.getToken();
        let token = db_access.handle_token_decrypt(encrypted_token);
        if (has_token_expired(token.token_expires_epoch)) {
            console.log("Token expired, refreshing...");
            token = await handle_token_refresh(token);
            console.log("Token refreshed and stored in database");
        }
        const recent_tracks = await tracks_handler.get_recent_tracks(
            token.access_token
        );
        handle_track_insertion(recent_tracks);
    });
}

function handle_track_insertion(tracks) {
    
}

function has_token_expired(token_expires_epoch) {
    return new Date() > token_expires_epoch;
}

async function handle_token_refresh(token) {
    const refreshed_token = await server.refresh_token(token);
    token = await db_insert.insert_refreshed_token(token, refreshed_token);
    token.access_token = refreshed_token.access_token;
    return token;
}

main();
// update_all_users_tracks();

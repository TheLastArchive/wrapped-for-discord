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
        let user_json = user.toJSON();
        let token_json = token.toJSON();
        if (has_token_expired(token_json.token_expires_epoch)) {
            console.log("Token expired, refreshing...");
            token_json = await handle_token_refresh(token);
            console.log("Token refreshed and stored in database");
        }
        tracks_handler.get_recent_tracks(token_json.access_token);
    });
}

function has_token_expired(token_expires_epoch) {
    return new Date() > token_expires_epoch;
}

async function handle_token_refresh(token) {
    let token_json = token.toJSON();
    const updated_refresh_token = await server.refresh_token(token_json);
    await db_insert.insert_refreshed_token(token, updated_refresh_token);

    return updated_refresh_token;
}

// main();
update_all_users_tracks();

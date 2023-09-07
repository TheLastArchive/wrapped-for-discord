const schedule = require("node-schedule");
const tracks_handler = require("./lib/tracks");
const server = require("./lib/auth");
const db_access = require("./lib/database/data_access");
const db_insert = require("./lib/database/data_insertion");

async function main() {
    server.start(5000);
    let hourly_task = schedule.scheduleJob(
        { minute: 0 },
        update_all_users_tracks
    );
}

async function update_all_users_tracks() {
    console.log("Scheduled task 'update_all_user_tracks' now running...");
    let users = await db_access.get_all_users();
    for (const user of users) {
        let encrypted_token = await user.getToken();
        let token = db_access.handle_token_decrypt(encrypted_token);
        if (has_token_expired(token.token_expires_epoch)) {
            console.log("Token expired, refreshing...");
            token = await handle_token_refresh(token);
            console.log("Token refreshed and stored in database");
        }
        const recent_tracks = await tracks_handler.get_recent_tracks(
            token.access_token,
            user.played_at
        );
        if (!recent_tracks) {
            continue;
        } else if (!recent_tracks.items.length) {
            console.log("No new tracks");
            continue;
        }

        await db_insert.handle_recent_tracks(recent_tracks.items, user);
    }
    console.log("Scheduled task 'update_all_user_tracks' completed");
}

function has_token_expired(token_expires_epoch) {
    return new Date() > token_expires_epoch;
}

/**
 * @description Fetches a new refresh token, encrypts and stores in the database, updates 'token'
 * @param {*} token sequelize token for the user
 * @returns user token with the refreshed access token
 */
async function handle_token_refresh(token) {
    const refreshed_token = await server.refresh_token(token);
    token = await db_insert.insert_refreshed_token(token, refreshed_token);
    token.access_token = refreshed_token.access_token;
    return token;
}

main();
// update_all_users_tracks();

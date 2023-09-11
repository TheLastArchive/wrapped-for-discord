const schedule = require("node-schedule");
const tracks_handler = require("./lib/tracks");
const server = require("./lib/auth");
const db_access = require("./lib/database/data_access");
const db_insert = require("./lib/database/data_insertion");
const wrapped = require("./lib/wrapped");

async function main() {
    // server.start(5000);
    // await update_all_users_tracks();
    const wrapped_object = await wrapped.handle_wrapped();
    console.log("Gamer Aquarium");
    console.log(wrapped_object.global_stats.total_count + " plays");
    console.log(milliseconds_to_hours_and_minutes(wrapped_object.global_stats.total_time_listened));
    for (const user of wrapped_object.user_stats) {

        console.log(user.display_name);
        console.log(user.total_count + " plays");
        console.log(milliseconds_to_hours_and_minutes(user.total_time_listened));
    }
    let hourly_task = schedule.scheduleJob(
        { minute: 0 },
        update_all_users_tracks
    );
}

async function update_all_users_tracks() {
    console.log("Scheduled task 'update_all_user_tracks' now running...");
    let total = 0;
    let users = await db_access.get_all_users();
    for (const user of users) {
        console.log(user.display_name);

        let token = await get_token(user);
        const recent_tracks = await tracks_handler.get_recent_tracks(
            token.access_token,
            user.played_at
        );
        if (!recent_tracks) {
            continue;
        }
        await db_insert.handle_recent_tracks(recent_tracks.items, user);
        total += recent_tracks.items.length;
    }
    console.log("Scheduled task 'update_all_user_tracks' completed. " +
            total + " total records added");
}

function has_token_expired(token_expires_epoch) {
    return new Date() > token_expires_epoch;
}

async function get_token(user) {
    let encrypted_token = await user.getToken();
    let token = db_access.handle_token_decrypt(encrypted_token);
    if (has_token_expired(token.token_expires_epoch)) {
        return await handle_token_refresh(token);
    }
    return token;
}

/**
 * @description Fetches a new refresh token, encrypts and stores in the database, updates 'token'
 * @param {*} token sequelize token for the user
 * @returns user token with the refreshed access token
 */
async function handle_token_refresh(token) {
    console.log("Token expired, refreshing...");
    const refreshed_token = await server.refresh_token(token);
    token = await db_insert.insert_refreshed_token(token, refreshed_token);
    token.access_token = refreshed_token.access_token;
    console.log("Token refreshed and stored in database");
    return token;
}

function milliseconds_to_hours_and_minutes(milliseconds) {
    // Calculate hours, minutes, and seconds
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} hours and ${minutes} minutes`

}
main();
// update_all_users_tracks();

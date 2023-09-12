const schedule = require("node-schedule");
const tracks_handler = require("./lib/tracks");
const server = require("./lib/token");
const db_access = require("./lib/database/data_access");
const db_insert = require("./lib/database/data_insertion");
const wrapped = require("./lib/wrapped");

async function main() {
    server.start(5000);
    await update_all_users_tracks();
    // const wrapped_object = await wrapped.handle_wrapped();
    // console.log("Gamer Aquarium");
    // console.log(wrapped_object.global_stats.total_count + " plays");
    // console.log(milliseconds_to_hours_and_minutes(wrapped_object.global_stats.total_time_listened));
    // for (const user of wrapped_object.user_stats) {

    //     console.log(user.display_name);
    //     console.log(user.total_count + " plays");
    //     console.log(milliseconds_to_hours_and_minutes(user.total_time_listened));
    // }
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

        let token = await server.get_token(user);
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

function milliseconds_to_hours_and_minutes(milliseconds) {
    // Calculate hours, minutes, and seconds
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} hours and ${minutes} minutes`

}
main();
// update_all_users_tracks();

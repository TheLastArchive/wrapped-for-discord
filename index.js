const schedule = require("node-schedule");
const tracks_handler = require("./lib/tracks");
const server = require("./lib/token");
const dbAccess = require("./lib/database/dataAccess");
const dbInsert = require("./lib/database/dataInsertion");
const wrapped = require("./lib/wrapped");

async function main() {
    server.start(5000);
    await updateAllUsersTracks();
    // const wrapped_object = await wrapped.handle_wrapped();
    // console.log("Gamer Aquarium");
    // console.log(wrapped_object.global_stats.total_count + " plays");
    // console.log(millisecondsToHoursAndMinutes(wrapped_object.global_stats.total_time_listened));
    // for (const user of wrapped_object.user_stats) {

    //     console.log(user.display_name);
    //     console.log(user.total_count + " plays");
    //     console.log(millisecondsToHoursAndMinutes(user.total_time_listened));
    // }
    let hourly_task = schedule.scheduleJob(
        { minute: 0 },
        updateAllUsersTracks
    );
}

async function updateAllUsersTracks() {
    console.log("Scheduled task 'updateAllUserTracks' now running...");
    let total = 0;
    let users = await dbAccess.getAllUsers();
    for (const user of users) {
        console.log(user.display_name);

        let token = await server.getToken(user);
        const recentTracks = await tracks_handler.getRecentTracks(
            token.access_token,
            user.played_at
        );
        if (!recentTracks) {
            continue;
        }
        await dbInsert.handleRecentTracks(recentTracks.items, user);
        total += recentTracks.items.length;
    }
    console.log("Scheduled task 'updateAllUserTracks' completed. " +
            total + " total records added");
}

function millisecondsToHoursAndMinutes(milliseconds) {
    // Calculate hours, minutes, and seconds
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} hours and ${minutes} minutes`

}
main();
// updateAllUsersTracks();

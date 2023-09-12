const schedule = require("node-schedule");
const tracksHandler = require("./lib/tracks");
const server = require("./lib/token");
const dbAccess = require("./lib/database/dataAccess");
const dbInsert = require("./lib/database/dataInsertion");
const wrapped = require("./lib/wrapped");

async function main() {
    server.start(5000);
    await updateAllUsersTracks();
    // await wrappedThing();
    let hourlyTask = schedule.scheduleJob(
        { minute: 0 },
        updateAllUsersTracks
    );

    let monthlyTask = schedule.scheduleJob(
        { day: 1 },
        wrappedThing
    );
}

async function updateAllUsersTracks() {
    console.log("Scheduled task 'updateAllUserTracks' now running...");
    let total = 0;
    let users = await dbAccess.getAllUsers();
    for (const user of users) {
        console.log(user.display_name);

        let token = await server.getUserToken(user);
        const recentTracks = await tracksHandler.getRecentTracks(
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

async function wrappedThing() {
    const wrappedObject = await wrapped.handleWrapped();
    console.log(wrappedObject.title);
    console.log(wrappedObject.global_stats.total_count + " plays");
    console.log(millisecondsToHoursAndMinutes(wrappedObject.global_stats.total_time_listened));
    for (const user of wrappedObject.user_stats) {

        console.log(user.display_name);
        console.log(user.total_count + " plays");
        console.log(millisecondsToHoursAndMinutes(user.total_time_listened));
    }
}
main();
// updateAllUsersTracks();

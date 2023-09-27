const dbAccess = require("./database/dataAccess");
const parser = require("./parser");

async function handleGlobalWrapped() {
    const users = await dbAccess.getAllUsers();
    const [start, end, month, year] = getStartAndEndOfMonth();
    let globalObject = parser.createGlobalWrappedObject(month, year);
    let globalData = await getData(start, end);
    globalObject.global_stats = parser.parseWrapped(globalData, globalObject.global_stats);
    for (const user of users) {
        user.wrapped = await handleUserWrapped(user);
        globalObject.user_stats.push(user);
    }
    //Sort the users by total_time_listened
    globalObject.user_stats.sort((a, b) => b.wrapped.total_time_listened - a.wrapped.total_time_listened);
    return globalObject;
}

async function handleUserWrapped(user) {
    const [start, end, month, year] = getStartAndEndOfMonth();
    let userObject = parser.createUserWrappedObject(user.toJSON());
    const userData = await getData(start, end, user.user_id);
    return parser.parseWrapped(userData, userObject.wrapped)
}

/**
 * @description Fetches all the tracks, artists, and albums along with the history data
 * @param {epoch} start epoch to start search from
 * @param {epoch} end epoch to end the search
 * @param {*} userID user history to search for, if null then gets all user's history
 * @returns history, tracks, albums, and artists sequelize data models.
 */
async function getData(start = 0, end = 2147483647000, userID = null) {
    const history = userID ? 
    await dbAccess.countUserHistory(userID, start, end, true) :
    await dbAccess.countHistory(start, end, true);
    const tracks = history.rows.map(
        (row) => {return row.Track;});
    const albums = await dbAccess.getAlbumsByID(
        tracks.map((track) => {return track.album_id;}));
    const artists = await dbAccess.getArtistsByID(
        tracks.map((track) => {return track.artist_id;}));

    return {history, tracks, albums, artists};
}

function getStartAndEndOfMonth() {
    const months = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
      ];
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth();
    const currentYear = currentDate.getFullYear()
    const start = new Date(currentYear, currentMonthIndex, 1).getTime();
    const end = new Date(currentYear, currentMonthIndex + 1, 1).getTime();
    return [start, end, months[currentMonthIndex], currentYear];
}

function getStartAndEndOfPreviousMonth() {
    const months = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
      ];
      const currentDate = new Date();
      const currentMonthIndex = currentDate.getMonth();
      const currentYear = currentDate.getFullYear()
      const start = new Date(currentYear, currentMonthIndex, 1).getTime();
      const end = new Date(currentYear, currentMonthIndex + 1, 1).getTime();
      return [start, end, months[currentMonthIndex], currentYear];
}

module.exports = {
    handleGlobalWrapped
}

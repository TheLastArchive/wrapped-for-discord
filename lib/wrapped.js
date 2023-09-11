const db_access = require("./database/data_access");
const parser = require("./parser");

async function handle_wrapped() {
    const users = await db_access.get_all_users();
    const [start, end, month, year] = get_start_and_end_of_month();
    let global_object = parser.create_global_wrapped_object(month, year);
    let global_history = await get_data(start, end);
    global_object.global_stats = parser.parse_wrapped(global_history, global_object.global_stats);
    for (const user of users) {
        let user_object = parser.create_user_wrapped_object(user.toJSON());  
        const data = await get_data(start, end, user.user_id);
        global_object.user_stats.push(parser.parse_wrapped(data, user_object));
    }
    return global_object;
}

/**
 * @description Fetches all the tracks, artists, and albums along with the history data
 * @param {epoch} start epoch to start search from
 * @param {epoch} end epoch to end the search
 * @param {*} user_id user history to search for, if null then gets all user's history
 * @returns history, tracks, albums, and artists sequelize data models.
 */
async function get_data(start = 0, end = 2147483647000, user_id = null) {
    const history = user_id ? 
    await db_access.count_user_history(user_id, start, end, true) :
    await db_access.count_history(start, end, true);
    const tracks = history.rows.map(
        (row) => {return row.Track;});
    const albums = await db_access.get_albums_by_id(
        tracks.map((track) => {return track.album_id;}));
    const artists = await db_access.get_artists_by_id(
        tracks.map((track) => {return track.artist_id;}));

    return {history, tracks, albums, artists};
}

function get_start_and_end_of_month() {
    const months = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
      ];
    const current_date = new Date();
    const current_month = current_date.getMonth();
    const current_year = current_date.getFullYear()
    const start = new Date(current_year, current_month, 1).getTime();
    const end = new Date(current_year, current_month + 1, 1).getTime();
    return [start, end, months[current_month], current_year];
}

function get_start_and_end_of_previous_month() {
    const months = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
      ];
      const current_date = new Date();
      const current_month = current_date.getMonth();
      const current_year = current_date.getFullYear()
      const start = new Date(current_year, current_month, 1).getTime();
      const end = new Date(current_year, current_month + 1, 1).getTime();
      return [start, end, months[current_month], current_year];
}

module.exports = {
    handle_wrapped
}

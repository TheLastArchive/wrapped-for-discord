const db_access = require("./database/data_access");
const parser = require("./parser");

async function handle_wrapped() {
    const users = await db_access.get_all_users();
    const [start, end, month, year] = get_start_and_end_of_month();
    let wrapped = parser.create_wrapped_object(month, year);
    for (const user of users) {
        if (user.display_name != "Alex") {
            continue;
        }

        data = get_data(user, start, end);
        // wrapped = parser.parse_wrapped(user.display_name, tracks, user_history, wrapped);
    }
}

async function get_data(user, start, end) {
    let user_history = await db_access.count_user_history(user.user_id, start, end);
    for (let i = 0; i < user_history.rows.length; i++) {
        // console.log(user_history.rows[i]);
        const track = user_history.rows[i].Track;
        console.log(track.name);
        // return;
        const artist = await track.getArtist();
        // console.log(artist);
        const album = await track.getAlbum();
        
        console.log({
            track_name: track.name,
            artist_name: artist.name,
            album_name: album.name,
            track_duration: track.duration_ms,
            count: user_history.count[i].count,
            time_listened: (user_history.count[i].count * track.duration_ms)
        });

    }
}

function get_start_and_end_of_month() {
    const months = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
      ];
    const date = new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime();
    return [start, end, months[date.getMonth()], date.getFullYear()];
}

function get_start_and_end_of_previous_month() {
    const months = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
      ];
    const date = new Date();

    const start = new Date(date.getFullYear(), date.getMonth() - 1, 1).getTime();
    const end = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
    return [start, end];
}

handle_wrapped();
// get_start_and_end_of_month();

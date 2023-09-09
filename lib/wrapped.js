const db_access = require("./database/data_access");
const parser = require("./parser");

async function handle_wrapped() {
    const users = await db_access.get_all_users();
    const [start, end, month, year] = get_start_and_end_of_month();
    let wrapped = parser.create_wrapped_object(month, year);
    for (const user of users) {
        // console.log(user.display_name);
        if (user.display_name != "Alex") {
            continue;
        }
        data = get_data(user, start, end);
        // wrapped = parser.parse_wrapped(user.display_name, tracks, user_history, wrapped);
    }
}

async function get_data(user, start, end) {
    let user_history = await db_access.count_user_history(user.user_id, start, end);
    const track_ids = user_history.map(x => x.track_spotify_id);
    let tracks = await db_access.get_tracks_by_spotify_id(track_ids);
    for (const item of user_history) {
        const track = tracks.filter(track => 
            track.spotify_id === item.track_spotify_id)[0];
        console.log(track.toJSON());
        const album = await track.getAlbum();
        const artist = await track.getArtist();
        console.log([
            track.toJSON(),
            album.toJSON(),
            artist.toJSON(),
            item.count
        ]);
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

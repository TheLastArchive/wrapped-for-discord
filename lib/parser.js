const crypto = require("crypto");
const db_access = require("./database/data_access");

async function handle_recent_track_parse(data, user_id) {
    let track_data_arr = [];
    let album_data_arr = [];
    let artist_data_arr = [];
    let history_data_arr = [];
    //Records are added to the DB in bulk so store in memory
    //in case there are duplicates not in the DB
    let temp_artists = {}; //spotify_id: database_id
    let temp_albums = {};
    let temp_tracks = {};

    for (const item of data) {
        const track = item.track;
        const album = track.album;
        const artist = album.artists[0];

        let ids = {
            artist_id: await get_or_create_artist_id(artist.id, temp_artists),
            album_id: await get_or_create_album_id(album.id, temp_albums),
            track_id: await get_or_create_track_id(track.id, temp_tracks),
        };
        temp_artists[artist.id] = ids.artist_id;
        temp_albums[album.id] = ids.album_id;
        temp_tracks[track.id] = ids.track_id;

        track_data_arr.push(parse_recent_track(track, ids));
        album_data_arr.push(parse_recent_album(album, ids));
        artist_data_arr.push(parse_recent_artist(artist, ids));
        history_data_arr.push(parse_recent_history(item, ids, user_id));
    }
    return [artist_data_arr, album_data_arr, track_data_arr, history_data_arr];
}

async function get_or_create_artist_id(id, temp_artists) {
    if (id in temp_artists) {
        return temp_artists[id];
    }
    const artist = await db_access.get_artist_by_spotify_id(id);
    return artist ? artist.artist_id : crypto.randomUUID();
}

async function get_or_create_album_id(id, temp_albums) {
    if (id in temp_albums) {
        return temp_albums[id];
    }
    const album = await db_access.get_album_by_spotify_id(id);
    return album ? album.album_id : crypto.randomUUID();
}

async function get_or_create_track_id(id, temp_tracks) {
    if (id in temp_tracks) {
        return temp_tracks[id];
    }
    const track = await db_access.get_track_by_spotify_id(id);
    return track ? track.track_id : crypto.randomUUID();
}

function find_album_art(images) {
    for (const image of images) {
        if (image.height === 64) {
            return image.url;
        }
    }
}

function parse_recent_track(track, ids) {
    return {
        track_id: ids.track_id,
        name: track.name,
        duration_ms: track.duration_ms,
        spotify_id: track.id,
        spotify_url: track.external_urls.spotify,
        artist_id: ids.artist_id,
        album_id: ids.album_id,
    };
}

function parse_recent_album(album, ids) {
    const album_art = find_album_art(album.images);
    return {
        album_id: ids.album_id,
        name: album.name,
        spotify_id: album.id,
        spotify_url: album.external_urls.spotify,
        album_image_url: album_art,
        artist_id: ids.artist_id,
    };
}

function parse_recent_artist(artist, ids) {
    return {
        artist_id: ids.artist_id,
        name: artist.name,
        spotify_id: artist.id,
        spotify_url: artist.external_urls.spotify,
    };
}

function parse_recent_history(item, ids, user_id) {
    return {
        history_id: crypto.randomUUID(),
        user_id,
        track_id: ids.track_id,
        album_id: ids.album_id,
        artist_id: ids.artist_id,
        played_at: new Date(item.played_at).getTime(),
    };
}

function parse_wrapped(data, obj) {
    data.history.count.forEach(item => {
        let [track, album, artist, total_time_listened] = find_history_data(item.track_id, data);
        track.count = item.count;
        track.total_time_listened = total_time_listened;
        obj.tracks.push(track);
        update_or_add_item(obj.albums, album, item.count, total_time_listened);
        update_or_add_item(obj.artists, artist, item.count, total_time_listened);
        obj.total_count += item.count;
        obj.total_time_listened += total_time_listened;
    });
    return obj;
}

/**
 * @description Finds the relevant track, album, and artist object for a track id;
 * @param {UUID} track_id The id for the track to get the data for
 * @param {*} data object with history, tracks, albums, and artists data models
 * @returns track, album, artist, and the total time listened for the given track
 */
function find_history_data(track_id, data) {
    const track = data.tracks.find(
        (track) => track.track_id === track_id).toJSON();
    const album = data.albums.find(
        (album) => album.album_id === track.album_id).toJSON();
    const artist = data.artists.find(
        (artist) => artist.artist_id === track.artist_id).toJSON();
    const total_time_listened = track.duration_ms * item.count;
    return [track, album, artist, total_time_listened];
}

/**
 * @description Checks if an element (track, artist, or album) exists in an array
 *              if not, then it adds the item, else it increments the given values
 * @param {*} array The array of objects to search
 * @param {*} item The item to reference the search to.
 * @param {int} count value to increment
 * @param {int} total_time_listened value to increment
 */
function update_or_add_item(array, item, count, total_time_listened) {
    const exists = array.find((element) => element.spotify_id === item.spotify_id);
    if (exists !== undefined) {
        exists.count += item.count;
        exists.total_time_listened += item.total_time_listened;
    } 
    else {
        item.count = count;
        item.total_time_listened = total_time_listened;
        array.push(item);
    }
}

function create_global_wrapped_object(month, year) {
    return {
        title: `Gamer Aquarium Wrapped for ${month} ${year}`,
        global_stats: {
            tracks: [],
            albums: [],
            artists: [],
            total_count: 0,
            total_time_listened: 0
        },
        user_stats: [],
    };
}

function create_user_wrapped_object(user) {
    user.tracks = [];
    user.albums = [];
    user.artists = [];
    user.total_count = 0;
    user.total_time_listened = 0;
    return user;
}

module.exports = {
    handle_recent_track_parse,
    create_global_wrapped_object,
    create_user_wrapped_object,
    parse_wrapped
};

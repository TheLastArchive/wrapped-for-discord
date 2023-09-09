const crypto = require("crypto");
const db_access = require("./database/data_access");
const db_insert = require("./database/data_insertion");

async function handle_recent_track_parse(data, user_id) {
    let track_data_arr = [];
    let album_data_arr = [];
    let artist_data_arr = [];
    let history_data_arr = [];
    for (const item of data) {
        const exists = await does_track_exist(item.track.id);
        
        if (exists) {
            history_data_arr.push(
                parse_recent_history(item, exists.track_id, user_id)
            );
            continue;
        }
        const track = item.track;
        const album = track.album;
        const artist = album.artists[0];
        const ids = {
            artist_id: crypto.randomUUID(),
            track_id: crypto.randomUUID(),
            album_id: crypto.randomUUID(),
        };
        track_data_arr.push(parse_recent_track(track, ids));
        album_data_arr.push(parse_recent_album(album, ids));
        artist_data_arr.push(parse_recent_artist(artist, ids));
        history_data_arr.push(parse_recent_history(item, ids.track_id, user_id));
    }
    return [artist_data_arr, album_data_arr, track_data_arr, history_data_arr];
}

async function does_track_exist(id) {
    return await db_access.get_track_by_spotify_id(id);
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
        artist_id: ids.artist_spotify_id,
        album_id: ids.album_spotify_id,
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
        artist_id: ids.artist_spotify_id,
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

function parse_recent_history(item, track_id, user_id) {
    return {
        history_id: crypto.randomUUID(),
        user_id,
        track_id: track_id,
        played_at: new Date(item.played_at).getTime(),
    };
}

function parse_wrapped(user_display_name, tracks, history, wrapped) {
    let user = create_wrapped_user_object(user_display_name);
    history.forEach((item) => {
        const track = find_track(item.track_spotify_id, tracks);
    });
}

function find_track(id, tracks) {
    for (const track of tracks) {
        if (track.spotify_id === id) {
            return track;
        }
    }
}

function create_wrapped_object(month, year) {
    return {
        title: `Gamer Aquarium Wrapped for ${month} ${year}`,
        global_stats: {
            tracks: [],
            albums: [],
            artists: [],
        },
        user_stats: [],
    };
}

function create_wrapped_user_object(name) {
    return {
        name: {
            tracks: [],
            albums: [],
            artists: [],
            total_time_listened: 0,
        },
    };
}

module.exports = {
    handle_recent_track_parse,
    parse_wrapped,
    create_wrapped_object,
};

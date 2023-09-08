const crypto = require("crypto");

function handle_recent_track_parse(data, user_id) {
    let track_data_arr = [];
    let album_data_arr = [];
    let artist_data_arr = [];
    let history_data_arr = [];
    data.forEach((item) => {
        const track = item.track;
        const album = track.album;
        const artist = album.artists[0];
        const ids = {
            artist_id: crypto.randomUUID(),
            track_id: crypto.randomUUID(),
            album_id: crypto.randomUUID(),
            history_id: crypto.randomUUID(),
        };
        track_data_arr.push(parse_track_data(track, ids));
        album_data_arr.push(parse_album_data(album, ids));
        artist_data_arr.push(parse_artist_data(artist, ids));
        history_data_arr.push(parse_history_data(item, ids, user_id));
    });
    return [
        artist_data_arr,
        album_data_arr,
        track_data_arr,
        history_data_arr,
    ];
}

function find_album_art(images) {
    for (const image of images) {
        if (image.height === 64) {
            return image.url;
        }
    }
}

function parse_track_data(track, ids) {
    return {
        track_id: ids.track_id,
        name: track.name,
        duration_ms: track.duration_ms,
        spotify_id: track.id,
        spotify_url: track.external_urls.spotify,
        artist_id: ids.artist_id,
        album_id: ids.album_id
    };
}

function parse_album_data(album, ids) {
    const album_art = find_album_art(album.images);
    return {
        album_id: ids.album_id,
        name: album.name,
        spotify_id: album.id,
        spotify_url: album.external_urls.spotify,
        album_image_url: album_art,
        artist_id: ids.artist_id
    };
}

function parse_artist_data(artist, ids) {
    return {
        artist_id: ids.artist_id,
        name: artist.name,
        spotify_id: artist.id,
        spotify_url: artist.external_urls.spotify,
    };
}

function parse_history_data(track, ids, user_id) {
    return {
        history_id: ids.history_id,
        user_id,
        track_id: ids.track_id,
        played_at: new Date(track.played_at).getTime()
    };

}

module.exports = {
    handle_recent_track_parse
}
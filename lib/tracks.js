const fetch = require("node-fetch");

/**
 *
 * @param {string} access_token Required to access the user's listening history
 * @param {*} after Optional parameter to filter the search and avoid duplicates. Must be in epoch
 * @returns {}
 */
async function get_recent_tracks(access_token, after = null) {
    console.log("Getting recent tracks");
    const after_param = after ? "&after=" + after : "";
    const response = await fetch_recent_tracks(access_token, after_param);
    if (!response.items) {
        console.error("Error fetching recent tracks", data);
        return null;
    }
    const recent_tracks = parse_recent_tracks(response);
    return recent_tracks;
}

async function fetch_recent_tracks(access_token, after_param) {
    const response = await fetch(
        "https://api.spotify.com/v1/me/player/recently-played?limit=5" +
            after_param,
        {
            method: "GET",
            headers: { Authorization: "Bearer " + access_token },
        }
    );
    const data = await response.json();
    return data;
}

function parse_recent_tracks(data) {
    const recent_tracks = { tracks: [] };
    data.items.forEach((item) => {
        const track = item.track;
        const album = track.album;
        const artist = album.artists[0];
        const album_art = find_album_art(album.images);
        recent_tracks.tracks.push({
            track_data: {
                name: track.name,
                duration_ms: track.duration_ms,
                spotify_id: track.id,
                spotify_url: track.external_urls.spotify,
            },
            artist_data: {
                name: artist.name,
                spotify_id: artist.id,
                spotify_url: artist.external_urls.spotify,
            },
            album_data: {
                name: album.name,
                spotify_id: album.id,
                spotify_url: album.external_urls.spotify,
                album_image_url: album_art,
            },
            //convert to epoch
            played_at: new Date(item.played_at).getTime(),
        });
    });
    return recent_tracks;
}

function find_album_art(images) {
    let album_art;
    images.forEach((image) => {
        if (image.height === 64) {
            album_art = image.url;
        }
    });
    return album_art;
}

async function get_top_tracks() {
    await fetch(
        "https://api.spotify.com/v1/me/top/tracks?" +
            "time_range=short_term&" +
            "limit=10",
        {
            method: "GET",
            headers: { Authorization: "Bearer " + tokens.access_token },
        }
    )
        .then((res) => res.json())
        .then((data) => {
            data.items.forEach((item) => {
                console.log(item.name);
            });
        });
}

module.exports = {
    get_recent_tracks,
    get_top_tracks,
};

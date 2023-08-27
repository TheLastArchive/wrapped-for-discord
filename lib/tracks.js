const fetch = require("node-fetch");

/**
 * @description: Gets the user's 50 most recently listened to tracks
 */
async function get_recent_tracks(access_token) {
    console.log("Getting recent tracks");
    let recent_tracks = {
        tracks: [],
    };
    //Track limit at 5 for testing
    await fetch(
        "https://api.spotify.com/v1/me/player/recently-played?limit=5",
        {
            method: "GET",
            headers: { Authorization: "Bearer " + access_token },
        }
    )
        .then((res) => res.json())
        .then((data) => {
            if (!data.items) {
                console.error("Error fetching recent tracks", data);
                return null;
            }
            data.items.forEach((item) => {
                const track = item.track;
                recent_tracks.tracks.push({
                    name: track.name,
                    duration_ms: track.duration_ms,
                    artist: track.artists[0].name,
                    url: track.external_urls.spotify,
                    id: track.id,
                    played_at: item.played_at,
                });
            });
        });
    console.log(recent_tracks);
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

const fetch = require("node-fetch");

/**
 *
 * @param {string} access_token Required to access the user's listening history
 * @param {*} after Optional parameter to filter the search and avoid duplicates. Must be in epoch
 * @returns {object} Recent tracks data
 */
async function get_recent_tracks(access_token, after = null) {
    console.log("Getting recent tracks...");
    const after_param = after ? "&after=" + after : "";
    let response = await fetch(
        "https://api.spotify.com/v1/me/player/recently-played?limit=50" +
            after_param,
        {
            method: "GET",
            headers: { Authorization: "Bearer " + access_token },
        }
    );
    response = await response.json();
    if (!response.items) {
        console.error("Error fetching recent tracks", response);
        return null;
    }
    else if (!response.items.length) {
        console.log("No new tracks");
        return null;
    }
    console.log("Recent tracks received");
    return response;
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

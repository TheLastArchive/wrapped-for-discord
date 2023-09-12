const fetch = require("node-fetch");

/**
 * @param {string} accessToken Required to access the user's listening history
 * @param {*} after Optional parameter to filter the search and avoid duplicates. Must be in epoch
 * @returns {object} Recent tracks data
 */
async function getRecentTracks(accessToken, after = null) {
    console.log("Getting recent tracks...");
    const afterParam = after ? "&after=" + after : "";
    let response = await fetch(
        "https://api.spotify.com/v1/me/player/recently-played?limit=50" +
            afterParam,
        {
            method: "GET",
            headers: { Authorization: "Bearer " + accessToken },
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

async function getTopTracks() {
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
    getRecentTracks,
    getTopTracks,
};

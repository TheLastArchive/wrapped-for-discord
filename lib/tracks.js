const fetch = require('node-fetch');

/**
 * Gets the user's 50 most recently listened to tracks
 */
async function get_recent_tracks() {

    let recent_tracks = {
        tracks: []
    }

    await fetch('https://api.spotify.com/v1/me/player/recently-played?' +
    'limit=50', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + access_token }

    })
    .then(res => res.json())
    .then(data => {
        data.items.forEach(item => {
            const track = item.track
            recent_tracks.tracks.push({
                name: track.name,
                duration_ms: track.duration_ms,
                artist: track.artists[0].name,
                url: track.external_urls.spotify,
                id: track.id,
                played_at: item.played_at
            });
        })
    })
    recent_tracks.tracks.forEach(track => {
        console.log(track)
    })
}

async function get_top_tracks() {
    await fetch('https://api.spotify.com/v1/me/top/tracks?' +
    'time_range=short_term&' +
    'limit=10', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + access_token }
    })
    .then(res => res.json())
    .then(data => {
        data.items.forEach(item => {
            console.log(item.name)
        })
    });
}


module.exports = {
    get_recent_tracks,
    get_top_tracks
}
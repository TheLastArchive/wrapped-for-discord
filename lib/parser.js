const crypto = require("crypto");
const dbAccess = require("./database/dataAccess");

async function handleRecentTrackParse(data, userID) {
    let trackDataArray = [];
    let albumDataArray = [];
    let artistDataArray = [];
    let historyDataArray = [];
    //Records are added to the DB in bulk so store in memory
    //in case there are duplicates not in the DB
    let tempArtists = {}; //spotify_id: database_id
    let tempAlbums = {};
    let tempTracks = {};

    for (const item of data) {
        const track = item.track;
        const album = track.album;
        const artist = album.artists[0];

        let ids = {
            artist_id: await getOrCreateArtistID(artist.id, tempArtists),
            album_id: await getOrCreateAlbumID(album.id, tempAlbums),
            track_id: await getOrCreateTrackID(track.id, tempTracks),
        };
        tempArtists[artist.id] = ids.artist_id;
        tempAlbums[album.id] = ids.album_id;
        tempTracks[track.id] = ids.track_id;

        trackDataArray.push(parseRecentTrack(track, ids));
        albumDataArray.push(parseRecentAlbum(album, ids));
        artistDataArray.push(parseRecentArtist(artist, ids));
        historyDataArray.push(parseRecentHistory(item, ids, userID));
    }
    return [artistDataArray, albumDataArray, trackDataArray, historyDataArray];
}

async function getOrCreateArtistID(id, tempArtists) {
    if (id in tempArtists) {
        return tempArtists[id];
    }
    const artist = await dbAccess.getArtistBySpotifyID(id);
    return artist ? artist.artist_id : crypto.randomUUID();
}

async function getOrCreateAlbumID(id, tempAlbums) {
    if (id in tempAlbums) {
        return tempAlbums[id];
    }
    const album = await dbAccess.getAlbumBySpotifyID(id);
    return album ? album.album_id : crypto.randomUUID();
}

async function getOrCreateTrackID(id, tempTracks) {
    if (id in tempTracks) {
        return tempTracks[id];
    }
    const track = await dbAccess.getTrackBySpotifyID(id);
    return track ? track.track_id : crypto.randomUUID();
}

function findAlbumArt(images) {
    for (const image of images) {
        if (image.height === 64) {
            return image.url;
        }
    }
}

function parseRecentTrack(track, ids) {
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

function parseRecentAlbum(album, ids) {
    const album_art = findAlbumArt(album.images);
    return {
        album_id: ids.album_id,
        name: album.name,
        spotify_id: album.id,
        spotify_url: album.external_urls.spotify,
        album_image_url: album_art,
        artist_id: ids.artist_id,
    };
}

function parseRecentArtist(artist, ids) {
    return {
        artist_id: ids.artist_id,
        name: artist.name,
        spotify_id: artist.id,
        spotify_url: artist.external_urls.spotify,
    };
}

function parseRecentHistory(item, ids, userID) {
    return {
        history_id: crypto.randomUUID(),
        user_id: userID,
        track_id: ids.track_id,
        album_id: ids.album_id,
        artist_id: ids.artist_id,
        played_at: new Date(item.played_at).getTime(),
    };
}

function parseWrapped(data, obj) {
    data.history.count.forEach(item => {
        let [track, album, artist] = findHistoryData(item.track_id, data);
        const totalTimeListened = track.duration_ms * item.count;
        track.count = item.count;
        track.total_time_listened = totalTimeListened;
        obj.tracks.push(track);
        updateOrAddItem(obj.albums, album, item.count, totalTimeListened);
        updateOrAddItem(obj.artists, artist, item.count, totalTimeListened);
        obj.count += item.count;
        obj.total_time_listened += totalTimeListened;
    });
    //Sort the arrays in descending order
    const properties = ["tracks", "albums", "artists"];
    properties.forEach(property => {
        obj[property].sort((a, b) => {
            if (a.count === b.count)
                return b.total_time_listened - a.total_time_listened
            return b.count - a.count
        });
    })
    return obj;
}

/**
 * @description Finds the relevant track, album, and artist object for a track id;
 * @param {UUID} trackID The id for the track to get the data for
 * @param {*} data object with history, tracks, albums, and artists data models
 * @returns track, album, artist, and the total time listened for the given track
 */
function findHistoryData(trackID, data) {
    const track = data.tracks.find(
        (track) => track.track_id === trackID).toJSON();
    const album = data.albums.find(
        (album) => album.album_id === track.album_id).toJSON();
    const artist = data.artists.find(
        (artist) => artist.artist_id === track.artist_id).toJSON();
    return [track, album, artist];
}

/**
 * @description Checks if an element (track, artist, or album) exists in an array
 *              if not, then it adds the item, else it increments the given values
 * @param {*} array The array of objects to search
 * @param {*} item The item to reference the search to.
 * @param {int} count value to increment
 * @param {int} TotalTimeListened value to increment
 */
function updateOrAddItem(array, item, count, TotalTimeListened) {
    const exists = array.find((element) => element.spotify_id === item.spotify_id);
    if (exists !== undefined) {
        exists.count += count;
        exists.total_time_listened += TotalTimeListened;
    } 
    else {
        item.count = count;
        item.total_time_listened = TotalTimeListened;
        array.push(item);
    }
}

function createGlobalWrappedObject(month, year) {
    return {
        title: `Gamer Aquarium Wrapped for ${month} ${year}`,
        global_stats: {
            tracks: [],
            albums: [],
            artists: [],
            count: 0,
            total_time_listened: 0
        },
        user_stats: [],
    };
}

function createUserWrappedObject(user) {
    user.tracks = [];
    user.albums = [];
    user.artists = [];
    user.count = 0;
    user.total_time_listened = 0;
    return user;
}

module.exports = {
    handleRecentTrackParse,
    createGlobalWrappedObject,
    createUserWrappedObject,
    parseWrapped
};

const { Op } = require("sequelize");
const db = require("./databaseManager");
const dataCrypto = require("./dataCrypto");

let sequelize = null;

async function getAllUsers() {
    await checkDBConnection();
    return await sequelize.models.User.findAll();
}

async function getUserByID(user_id) {
    await checkDBConnection();
    return await sequelize.models.User.findOne({
        where: {
            user_id,
        },
    });
}

async function getUserBySpotifyID(spotify_id) {
    await checkDBConnection();
    return await sequelize.models.User.findOne({
        where: {
            spotify_id,
        },
    });
}

async function getAllTokens() {
    await checkDBConnection();
    let tokens = await sequelize.models.Token.findAll();
    tokens.forEach((token) => {
        token = handleTokenDecrypt(token);
    });
}

async function getTokenByID(token_id) {
    await checkDBConnection();
    let token = await sequelize.models.Token.findOne({
        where: {
            token_id,
        },
    });
    return handleTokenDecrypt(token);
}

async function getTokenByUserID(user_id) {
    await checkDBConnection();
    let token = await sequelize.models.Token.findOne({
        where: {
            user_id,
        },
    });
    return handleTokenDecrypt(token);
}

function handleTokenDecrypt(token) {
    token.access_token = dataCrypto.decrypt(token.access_token, token.iv);
    token.refresh_token = dataCrypto.decrypt(token.refresh_token, token.iv);
    return token;
}

async function getTrackByID(track_id) {
    await checkDBConnection();
    return await sequelize.models.Track.findOne({
        where: {
            track_id,
        },
    });
}

/**
 * 
 * @param {array} ids array of ids to fetch
 * @returns {array} Objects that match the given ids
 */
async function getTracksByID(ids) {
    await checkDBConnection();
    return await sequelize.models.Track.findAll({
        where: {
            track_id: {
                [Op.in]: ids
            }
        },
    });
}

/**
 * 
 * @param {array} ids array of ids to fetch
 * @returns {array} Objects that match the given ids
 */
async function getAlbumsByID(ids) {
    await checkDBConnection();
    return await sequelize.models.Album.findAll({
        where: {
            album_id: {
                [Op.in]: ids
            }
        },
    });
}

async function getAlbumBySpotifyID(spotify_id) {
    await checkDBConnection();
    return await sequelize.models.Album.findOne({
        where: {
            spotify_id
        },
    });
}


/**
 * 
 * @param {array} ids array of ids to fetch
 * @returns {array} Objects that match the given ids
 */
async function getArtistsByID(ids) {
    await checkDBConnection();
    return await sequelize.models.Artist.findAll({
        where: {
            artist_id: {
                [Op.in]: ids
            }
        },
    });
}

async function getArtistBySpotifyID(spotify_id) {
    await checkDBConnection();
    return await sequelize.models.Artist.findOne({
        where: {
            spotify_id
        }
    });
}

async function getTrackBySpotifyID(spotify_id) {
    await checkDBConnection();
    return await sequelize.models.Track.findOne({
        where: {
            spotify_id
        },
    });
}

/**
 * 
 * @param {array} ids array of ids to fetch
 * @returns {array} Objects that match the given ids
 */
async function getTracksBySpotifyID(ids) {
    await checkDBConnection();
    return await sequelize.models.Track.findAll({
        where: {
            spotify_id: {
                [Op.in]: ids
            }
        },
    });
}

/**
 * 
 * @param {array} ids array of ids to fetch
 * @returns {array} Objects that match the given ids
 */
async function getAlbumsBySpotifyID(ids) {
    await checkDBConnection();
    return await sequelize.models.Album.findAll({
        where: {
            spotify_id: {
                [Op.in]: ids
            }
        },
    });
}

/**
 * 
 * @param {array} ids array of ids to fetch
 * @returns {array} Objects that match the given ids
 */
async function getArtistsBySpotifyID(ids) {
    await checkDBConnection();
    return await sequelize.models.Artist.findAll({
        where: {
            spotify_id: {
                [Op.in]: ids
            }
        },
    });
}
/**
 * @description Gets the listening history between a given time frame
 * @param {*} from epoch to start search from
 * @param {*} to epoch to end the search
 * @returns An array of records
 */
async function getHistory(from = 0, to = 2147483647000, includeTracks = false) {
    await checkDBConnection();
    const history = await sequelize.models.History.findAll({
        where: {
            played_at: {
                [Op.between]: [from, to],
            },
        },
        include: [{
            model: sequelize.models.Track,
        }]
    });
    return includeTracks ? history : history.count
}

/**
 * @description Counts each occurrence of a song history in a given time frame for a user
 * @param {*} user_id UUID for the user
 * @param {*} from epoch to start search from
 * @param {*} to epoch to end the search
 * @param {boolean} includeTracks Include the track objects with the response
 * @returns {object} count: Array of objects with the track id and count of occurrences
 *                  rows: Array of History.track_ids as well as the actual Track model
 */
async function countUserHistory(user_id, from = 0, to = 2147483647000, includeTracks = false) {
    await checkDBConnection();
    const history = await sequelize.models.History.findAndCountAll({
        where: {
            user_id,
            played_at: {
                [Op.between]: [from, to],
            },
        },
        attributes: ["track_id"],
        group: ["track_id"],
        include: [{
            model: sequelize.models.Track,
        }]
    });
    return includeTracks ? history : history.count
}

/**
 * @description Counts each occurrence of a track in history between given time frame
 * @param {*} from epoch to start search from
 * @param {*} to epoch to end the search
 * @param {boolean} includeTracks Include the track objects with the response
 * @returns {object} count: Array of objects with the track id and count of occurrences
 *                  rows: Array of History.track_ids as well as the actual Track model
 */
async function countHistory(from = 0, to = 2147483647000, includeTracks = false) {
    await checkDBConnection();
    const history = await sequelize.models.History.findAndCountAll({
        where: {
            played_at: {
                [Op.between]: [from, to],
            },
        },
        attributes: ["track_id"],
        group: ["track_id"],
        include: [{
            model: sequelize.models.Track,
        }]
    });
    return includeTracks ? history : history.count
}

/**
 * @description Counts each time each user listened to a track between given time frame
 * @param {epoch} from epoch to start search from
 * @param {epoch} to epoch to end the search
 * @param {boolean} includeTracks Include the track objects with the response
 * @returns {object} count: Array of objects with the track id and count of occurrences
 *                  rows: Array of History.track_ids as well as the actual Track model
 */
async function countUsersTrackHistory(from = 0, to = 2147483647000, includeTracks = false) {
    await checkDBConnection();
    const history = await sequelize.models.History.findAndCountAll({
        where: {
            played_at: {
                [Op.between]: [from, to],
            },
        },
        attributes: ["user_id", "track_id"],
        group: ["user_id", "track_id"],
        include: [{
            model: sequelize.models.Track,
        }]
    });
    return includeTracks ? history : history.count
}

async function checkDBConnection() {
    if (!sequelize) {
        sequelize = await db.getDBConnection();
    }
}

module.exports = {
    getAllTokens,
    getAllUsers,
    getTokenByID,
    getTokenByUserID,
    getUserByID,
    getUserBySpotifyID,
    handleTokenDecrypt,
    getHistory,
    countUserHistory,
    countHistory,
    countUsersTrackHistory,
    getTrackBySpotifyID,
    getAlbumsBySpotifyID,
    getAlbumsByID,
    getAlbumBySpotifyID,
    getArtistsByID,
    getArtistsBySpotifyID,
    getArtistBySpotifyID
}
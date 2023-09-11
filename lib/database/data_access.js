const { Op } = require("sequelize");
const db = require("./database_manager");
const data_crypto = require("./data_crypto");

let sequelize = null;

async function get_all_users() {
    await check_db_connection();
    return await sequelize.models.User.findAll();
}

async function get_user_by_id(user_id) {
    await check_db_connection();
    return await sequelize.models.User.findOne({
        where: {
            user_id,
        },
    });
}

async function get_user_by_spotify_id(spotify_id) {
    await check_db_connection();
    return await sequelize.models.User.findOne({
        where: {
            spotify_id,
        },
    });
}

async function get_all_tokens() {
    await check_db_connection();
    let tokens = await sequelize.models.Token.findAll();
    tokens.forEach((token) => {
        token = handle_token_decrypt(token);
    });
}

async function get_token_by_id(token_id) {
    await check_db_connection();
    let token = await sequelize.models.Token.findOne({
        where: {
            token_id,
        },
    });
    return handle_token_decrypt(token);
}

async function get_token_by_user_id(user_id) {
    await check_db_connection();
    let token = await sequelize.models.Token.findOne({
        where: {
            user_id,
        },
    });
    return handle_token_decrypt(token);
}

function handle_token_decrypt(token) {
    // console.log(token.toJSON());
    token.access_token = data_crypto.decrypt(token.access_token, token.iv);
    token.refresh_token = data_crypto.decrypt(token.refresh_token, token.iv);
    // console.log(token.toJSON());
    return token;
}

async function get_track_by_id(track_id) {
    await check_db_connection();
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
async function get_tracks_by_id(ids) {
    await check_db_connection();
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
async function get_albums_by_id(ids) {
    await check_db_connection();
    return await sequelize.models.Album.findAll({
        where: {
            album_id: {
                [Op.in]: ids
            }
        },
    });
}

async function get_album_by_spotify_id(spotify_id) {
    await check_db_connection();
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
async function get_artists_by_id(ids) {
    await check_db_connection();
    return await sequelize.models.Artist.findAll({
        where: {
            artist_id: {
                [Op.in]: ids
            }
        },
    });
}

async function get_artist_by_spotify_id(spotify_id) {
    await check_db_connection();
    return await sequelize.models.Artist.findOne({
        where: {
            spotify_id
        }
    });
}

async function get_track_by_spotify_id(spotify_id) {
    await check_db_connection();
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
async function get_tracks_by_spotify_id(ids) {
    await check_db_connection();
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
async function get_albums_by_spotify_id(ids) {
    await check_db_connection();
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
async function get_artists_by_spotify_id(ids) {
    await check_db_connection();
    return await sequelize.models.Artist.findAll({
        where: {
            spotify_id: {
                [Op.in]: ids
            }
        },
    });
}
/**
 * @description Get's the user's listening history between a given time frame
 * @param {*} from epoch to start search from
 * @param {*} to epoch to end the search
 * @returns An array of records
 */
async function get_history(from = 0, to = 2147483647000, include_tracks = false) {
    await check_db_connection();
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
    return include_tracks ? history : history.count
}

/**
 * @description Counts each occurrence of a song history in a given time frame for a user
 * @param {*} user_id UUID for the user
 * @param {*} from epoch to start search from
 * @param {*} to epoch to end the search
 * @param {boolean} include_tracks Include the track objects with the response
 * @returns {object} count: Array of objects with the track id and count of occurrences
 *                  rows: Array of History.track_ids as well as the actual Track model
 */
async function count_user_history(user_id, from = 0, to = 2147483647000, include_tracks = false) {
    await check_db_connection();
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
    return include_tracks ? history : history.count
}

/**
 * @description Counts each occurrence of a track in history between given time frame
 * @param {*} from epoch to start search from
 * @param {*} to epoch to end the search
 * @param {boolean} include_tracks Include the track objects with the response
 * @returns {object} count: Array of objects with the track id and count of occurrences
 *                  rows: Array of History.track_ids as well as the actual Track model
 */
async function count_history(from = 0, to = 2147483647000, include_tracks = false) {
    await check_db_connection();
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
    return include_tracks ? history : history.count
}

/**
 * @description Counts each time each user listened to a track between given time frame
 * @param {*} from epoch to start search from
 * @param {*} to epoch to end the search
 * @param {boolean} include_tracks Include the track objects with the response
 * @returns {object} count: Array of objects with the track id and count of occurrences
 *                  rows: Array of History.track_ids as well as the actual Track model
 */
async function count_users_track_history(from = 0, to = 2147483647000, include_tracks = false) {
    await check_db_connection();
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
    return include_tracks ? history : history.count
}

async function check_db_connection() {
    if (!sequelize) {
        sequelize = await db.get_db_connection();
    }
}

module.exports = {
    get_all_tokens,
    get_all_users,
    get_token_by_id,
    get_token_by_user_id,
    get_user_by_id,
    get_user_by_spotify_id,
    handle_token_decrypt,
    get_history,
    count_user_history,
    count_history,
    count_users_track_history,
    get_track_by_spotify_id,
    get_tracks_by_spotify_id,
    get_albums_by_spotify_id,
    get_albums_by_id,
    get_artists_by_id,
    get_artists_by_spotify_id,
    get_artist_by_spotify_id,
    get_album_by_spotify_id
};

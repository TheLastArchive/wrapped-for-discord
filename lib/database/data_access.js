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

async function get_track_by_spotify_id(spotify_id) {
    await check_db_connection();
    return await sequelize.models.Track.findOne({
        where: {
            spotify_id,
        },
    });
}

async function get_history(from = 0, to = 2147483647000) {
    await check_db_connection();
    return await sequelize.models.History.findAll({
        where: {
            played_at: {
                [Op.between]: [from, to],
            },
        },
    });
}
/**
 * @description Get's the user's listening history between a given time frame
 * @param {*} user_id UUID for the user
 * @param {*} from epoch to start search from
 * @param {*} to epoch to end the search
 * @returns {array of objects} Array of the Spotify IDs and the count
 */
async function count_user_history(user_id, from = 0, to = 2147483647000) {
    await check_db_connection();

    const history = await sequelize.models.History.findAndCountAll({
        where: {
            user_id,
            played_at: {
                [Op.between]: [from, to],
            },
        },
        attributes: ["track_spotify_id"],
        group: ["track_spotify_id"],
    });

    return history.count;
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
};

const db = require("./database_manager");

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
    return await sequelize.models.Token.findAll();
}

async function get_token_by_id(token_id) {
    await check_db_connection();
    return await sequelize.models.Token.findOne({
        where: {
            token_id,
        },
    });
}

async function get_token_by_user_id(user_id) {
    await check_db_connection();
    return await sequelize.models.Token.findOne({
        where: {
            user_id,
        },
    });
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
};

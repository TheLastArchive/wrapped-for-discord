const db = require('./database_manager');

let sequelize = null;

async function add_new_user(user_profile, token) {
    await check_db_connection();

    const [ new_user, created ] = await insert_new_user(user_profile);
    const new_user_json = new_user.toJSON();
    if (!created) {
        console.log("User " + new_user_json.spotify_id + " already exists");
        return
    }
    console.log("New user " + new_user_json.spotify_id + " added to the database");

    await insert_new_token(token, new_user_json.user_id);
    console.log("Tokens for user " + new_user_json.spotify_id + " added to the database");
}


/**
 * @description Creates and adds a new user to the database (if the user doesn't exist already)
 * @param {JSON} user_profile Response from Spotify with the user's profile information
 * @returns {Sequelize data model} *new_user* Information on the new or found user
 * @returns {boolean} *created* TRUE = If the user did not exist and a new one was created
 */
async function insert_new_user(user_profile) {
    let profile_image_url = null;
    user_profile.images.forEach(image => {
        if (image.height == 64) {
            profile_image_url = image.url;
        }
    })

    const [ new_user, created ] = await sequelize.models.User.findOrCreate({
        where: { spotify_id: user_profile.id },
        defaults: {
            spotify_id: user_profile.id,
            display_name: user_profile.display_name,
            spotify_url: user_profile.external_urls.spotify,
            profile_image_url: profile_image_url 
        }
    });

    return [ new_user, created ];
}


async function insert_new_token(token, user_uuid) {
    const curr_date = new Date();
    const token_expires_epoch = curr_date.setSeconds(curr_date.getSeconds() + token.expires_in);
    const new_token = await sequelize.models.Token.create({
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        token_expires_epoch,
        user_id: user_uuid,
        salt: null
    })

    return new_token;
}


async function insert_refreshed_token(token, new_token) {
    await check_db_connection();
    const curr_date = new Date();
    const token_expires_epoch = curr_date.setSeconds(curr_date.getSeconds() + new_token.expires_in);
    token.set({
        access_token: new_token.access_token,
        token_expires_epoch
    })
    await token.save();
}


async function check_db_connection() {
    if (!sequelize) {
        sequelize = await db.get_db_connection()
    }
}


module.exports = {
    add_new_user,
    insert_refreshed_token
}

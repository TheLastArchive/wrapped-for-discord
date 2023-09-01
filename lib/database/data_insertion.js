const db = require("./database_manager");
const data_crypto = require("./data_crypto");

let sequelize = null;

async function add_new_user(user_profile, token) {
    await check_db_connection();

    const [new_user, created] = await insert_new_user(user_profile);
    const new_user_json = new_user.toJSON();
    if (!created) {
        console.log("User " + new_user_json.spotify_id + " already exists");
        return;
    }
    console.log(
        "New user " + new_user_json.spotify_id + " added to the database"
    );

    await insert_new_token(token, new_user_json.user_id);
    console.log(
        "Tokens for user " + new_user_json.spotify_id + " added to the database"
    );
}

/**
 * @description Creates and adds a new user to the database (if the user doesn't exist already)
 * @param {JSON} user_profile Response from Spotify with the user's profile information
 * @returns {Sequelize data model} *new_user* Information on the new or found user
 * @returns {boolean} *created* TRUE = If the user did not exist and a new one was created
 */
async function insert_new_user(user_profile) {
    let profile_image_url = null;
    user_profile.images.forEach((image) => {
        if (image.height == 64) {
            profile_image_url = image.url;
        }
    });

    const [new_user, created] = await sequelize.models.User.findOrCreate({
        where: { spotify_id: user_profile.id },
        defaults: {
            spotify_id: user_profile.id,
            display_name: user_profile.display_name,
            spotify_url: user_profile.external_urls.spotify,
            profile_image_url: profile_image_url,
        },
    });

    return [new_user, created];
}

async function insert_new_token(token, user_id) {
    const [encrypted_access_token, iv] = data_crypto.encrypt(
        token.access_token
    );
    const encrypted_refresh_token = data_crypto.encrypt(
        token.refresh_token,
        iv
    );

    const curr_date = new Date();
    const token_expires_epoch = curr_date.setSeconds(
        curr_date.getSeconds() + token.expires_in
    );
    const new_token = await sequelize.models.Token.create({
        access_token: encrypted_access_token,
        refresh_token: encrypted_refresh_token,
        token_expires_epoch,
        user_id,
        iv,
    });

    return new_token;
}

async function insert_refreshed_token(token, new_token) {
    const encrypted_access_token = data_crypto.encrypt(
        new_token.access_token,
        token.iv
    );
    await check_db_connection();
    const curr_date = new Date();
    const token_expires_epoch = curr_date.setSeconds(
        curr_date.getSeconds() + new_token.expires_in
    );
    token.set({
        access_token: encrypted_access_token,
        token_expires_epoch,
    });
    //Sequelize let's you choose which fields to save, we don't want the decrypted
    //refresh token being saved so specify here
    await token.save({fields: ['access_token', 'token_expires_epoch']});
    return token
}

async function insert_artist(artist_data) {
    await check_db_connection();
    const Artist = sequelize.models.Artist.findOrCreate({
        where: { spotify: }
    })
}

// const [new_user, created] = await sequelize.models.User.findOrCreate({
//     where: { spotify_id: user_profile.id },
//     defaults: {
//         spotify_id: user_profile.id,
//         display_name: user_profile.display_name,
//         spotify_url: user_profile.external_urls.spotify,
//         profile_image_url: profile_image_url,
//     },
// });

async function check_db_connection() {
    if (!sequelize) {
        sequelize = await db.get_db_connection();
    }
}

module.exports = {
    add_new_user,
    insert_refreshed_token,
};

const db = require("./database_manager");
const data_crypto = require("./data_crypto");
const parser = require("../parser");

let sequelize = null;

async function add_new_user(user_profile, token) {
    await check_db_connection();

    const [new_user, created] = await insert_new_user(user_profile);
    if (!created) {
        console.log("User " + new_user.spotify_id + " already exists");
        return;
    }
    console.log("New user " + new_user.spotify_id + " added to the database");

    await insert_new_token(token, new_user.user_id);
    console.log(
        "Tokens for user " + new_user.spotify_id + " added to the database"
    );
}

/**
 * @description Creates and adds a new user to the database (if the user doesn't exist already)
 * @param {JSON} user_profile Response from Spotify with the user's profile information
 * @returns {Sequelize data model} *new_user* Information on the new or found user
 * @returns {boolean} *created* TRUE = If the user did not exist and a new one was created
 */
async function insert_new_user(user_profile) {
    const [new_user, created] = await sequelize.models.User.findOrCreate({
        where: { spotify_id: user_profile.id },
        defaults: {
            spotify_id: user_profile.id,
            display_name: user_profile.display_name,
            spotify_url: user_profile.external_urls.spotify,
            profile_image_url: find_profile_image(user_profile.images),
        },
    });

    return [new_user, created];
}

async function insert_new_token(token, user_id) {
    const [encrypted_access_token, iv] = data_crypto.encrypt(
        token.access_token
    );
    const [encrypted_refresh_token] = data_crypto.encrypt(
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
    const [encrypted_access_token] = data_crypto.encrypt(
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
    //Specify which fields to save. Refresh token was decrypted so please don't save it :)
    await token.save({ fields: ["access_token", "token_expires_epoch"] });
    return token;
}

async function handle_recent_tracks(tracks, user) {
    await check_db_connection();
    console.log("Inserting values...");
    [
        artist_data_arr,
        album_data_arr,
        track_data_arr,
        history_data_arr,
        last_played_at,
    ] = parser.handle_recent_track_parse(tracks, user.user_id);
    if (last_played_at > user.played_at) {
        await update_user_played_at(user, last_played_at);
    }
    //DO NOT CHANGE THE ORDER
    //Due to the foreign key associations, models need to be created in this order
    //Other option is allowing the foreign keys to be null which might cause other issues
    const Artist = sequelize.models.Artist;
    await bulk_insert(Artist, artist_data_arr);
    const Album = sequelize.models.Album;
    await bulk_insert(Album, album_data_arr);
    const Track = sequelize.models.Track;
    await bulk_insert(Track, track_data_arr);
    const History = sequelize.models.History;
    await bulk_insert(History, history_data_arr);
    console.log("Insertion complete");
}

async function bulk_insert(model, data) {
    await check_db_connection();
    //Sequelize ignores duplicate foreign keys even if they're not marked as UNIQUE
    //Disable foreign key checks to ensure it only ignores duplicate UNIQUE fields
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await model.bulkCreate(data, {
        ignoreDuplicates: true,
    });
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
}

/**
 * @description Updates the user's timestamp for last played track
 * @param {*} user user data model to be updated
 * @param {EpochTimeStamp} played_at the epoch of the user's last listened track
 */
async function update_user_played_at(user, played_at) {
    user.played_at = played_at;
    await user.save({ fields: ["played_at"] });
}

function find_profile_image(images) {
    for (const image of images) {
        if (image.height == 64) {
            return image.url;
        }
    }
}

async function check_db_connection() {
    if (!sequelize) {
        sequelize = await db.get_db_connection();
    }
}

module.exports = {
    add_new_user,
    insert_refreshed_token,
    handle_recent_tracks,
};

const db = require("./database_manager");
const data_crypto = require("./data_crypto");
const crypto = require("crypto");

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
    ] = handle_data_parse(tracks, user.user_id);
    if (last_played_at > user.played_at) {
        await update_user_played_at(user, last_played_at);
    }
    const Artist = sequelize.models.Artist;
    const Album = sequelize.models.Album;
    const Track = sequelize.models.Track;
    const History = sequelize.models.History;
    //DO NOT CHANGE THE ORDER
    //Due to the foreign key associations, models need to be created in this order
    //Other option is allowing the foreign keys to be null which might cause other issues
    await bulk_insert(Artist, artist_data_arr);
    await bulk_insert(Album, album_data_arr);
    await bulk_insert(Track, track_data_arr);
    await bulk_insert(History, history_data_arr);
    console.log("Insertion complete");
}

function handle_data_parse(tracks, user_id) {
    let track_data_arr = [];
    let album_data_arr = [];
    let artist_data_arr = [];
    let history_data_arr = [];
    let last_played_at = 0;
    tracks.forEach((track) => {
        const ids = {
            artist_id: crypto.randomUUID(),
            track_id: crypto.randomUUID(),
            album_id: crypto.randomUUID(),
            history_id: crypto.randomUUID(),
        };
        track_data_arr.push(parse_track_data(track.track_data, ids));
        album_data_arr.push(parse_album_data(track.album_data, ids));
        artist_data_arr.push(parse_artist_data(track.artist_data, ids));
        history_data_arr.push(parse_history_data(track, ids, user_id));
        if (track.played_at > last_played_at) {
            last_played_at = track.played_at;
        }
    });
    return [
        artist_data_arr,
        album_data_arr,
        track_data_arr,
        history_data_arr,
        last_played_at,
    ];
}

function parse_track_data(track_data, ids) {
    track_data.track_id = ids.track_id;
    track_data.artist_id = ids.artist_id;
    track_data.album_id = ids.album_id;
    return track_data;
}

function parse_album_data(album_data, ids) {
    album_data.album_id = ids.album_id;
    album_data.artist_id = ids.artist_id;
    // console.log(album_data);
    return album_data;
}

function parse_artist_data(artist_data, ids) {
    artist_data.artist_id = ids.artist_id;
    return artist_data;
}

function parse_history_data(track, ids, user_id) {
    let history = {
        history_id: ids.history_id,
        user_id,
        track_id: ids.track_id,
        played_at: track.played_at,
    };
    // console.log(history.played_at);
    return history;
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
 * @param {*} user
 * @param {EpochTimeStamp} played_at
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

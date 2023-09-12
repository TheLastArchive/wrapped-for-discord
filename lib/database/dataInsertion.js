const db = require("./databaseManager");
const dataCrypto = require("./dataCrypto");
const parser = require("../parser");

let sequelize = null;

async function addNewUser(userProfile, token) {
    await checkDBConnection();

    const [newUser, created] = await insertNewUser(userProfile);
    if (!created) {
        console.log("User " + newUser.spotify_id + " already exists");
        return;
    }
    console.log("New user " + newUser.spotify_id + " added to the database");
    await insertNewToken(token, newUser.user_id);
    console.log(
        "Tokens for user " + newUser.spotify_id + " added to the database"
    );
}

/**
 * @description Creates and adds a new user to the database (if the user doesn't exist already)
 * @param {JSON} userProfile Response from Spotify with the user's profile information
 * @returns {Sequelize data model} *newUser* Information on the new or found user
 * @returns {boolean} *created* TRUE = If the user did not exist and was created
 */
async function insertNewUser(userProfile) {
    const [newUser, created] = await sequelize.models.User.findOrCreate({
        where: { spotify_id: userProfile.id },
        defaults: {
            spotify_id: userProfile.id,
            display_name: userProfile.display_name,
            spotify_url: userProfile.external_urls.spotify,
            profile_image_url: findProfileImage(userProfile.images),
        },
    });

    return [newUser, created];
}

async function insertNewToken(token, userID) {
    const [encryptedAccessToken, iv] = dataCrypto.encrypt(
        token.access_token
    );
    const [encryptedRefreshToken] = dataCrypto.encrypt(
        token.refresh_token,
        iv
    );

    const curr_date = new Date();
    const tokenExpiresEpoch = curr_date.setSeconds(
        curr_date.getSeconds() + token.expires_in
    );
    const newToken = await sequelize.models.Token.create({
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expires_epoch: tokenExpiresEpoch,
        user_id: userID,
        iv,
    });

    return newToken;
}

async function insertRefreshedToken(token, newToken) {
    const [encryptedAccessToken] = dataCrypto.encrypt(
        newToken.access_token,
        token.iv
    );
    await checkDBConnection();
    const curr_date = new Date();
    const tokenExpiresEpoch = curr_date.setSeconds(
        curr_date.getSeconds() + newToken.expires_in
    );
    token.set({
        access_token: encryptedAccessToken,
        token_expires_epoch: tokenExpiresEpoch,
    });
    //Specify which fields to save. Refresh token was decrypted so please don't save it :)
    await token.save({ fields: ["access_token", "token_expires_epoch"] });
    return token;
}

async function handleRecentTracks(tracks, user) {
    await checkDBConnection();
    console.log("Inserting values...");
    [
        artist_data_arr,
        album_data_arr,
        track_data_arr,
        history_data_arr,
    ] = await parser.handleRecentTrackParse(tracks, user.user_id);


    //DO NOT CHANGE THE ORDER
    //Due to the foreign key associations, models need to be created in this order
    //Other option is allowing the foreign keys to be null which might cause other issues
    const Artist = sequelize.models.Artist;
    await bulkInsert(Artist, artist_data_arr);
    const Album = sequelize.models.Album;
    await bulkInsert(Album, album_data_arr);
    const Track = sequelize.models.Track;
    await bulkInsert(Track, track_data_arr);
    const History = sequelize.models.History;
    await bulkInsert(History, history_data_arr);
    await updateUserPlayedAt(user);
    console.log("Insertion complete. " + tracks.length + " records added.");
}

async function bulkInsert(model, data) {
    await checkDBConnection();
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
async function updateUserPlayedAt(user, played_at = null) {
    user.played_at = played_at ? played_at : new Date().getTime();
    await user.save({ fields: ["played_at"] });
}

function findProfileImage(images) {
    for (const image of images) {
        if (image.height === 64) {
            return image.url;
        }
    }
}

async function checkDBConnection() {
    if (!sequelize) {
        sequelize = await db.getDBConnection();
    }
}

module.exports = {
    addNewUser,
    insertRefreshedToken,
    handleRecentTracks,
};

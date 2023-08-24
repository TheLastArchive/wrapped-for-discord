const crypto = require('crypto');
const db = require('./data_models');


async function add_new_user(user_profile, token) {
    const sequelize = await db.connect_to_db();

    const [ new_user, created ] = await insert_new_user(sequelize, user_profile);
    if (!created) {
        console.log("User " + new_user.toJSON().spotify_id + " already exists");
        return
    }
    console.log("New user added")
    console.log(new_user.toJSON());
    const new_user_json = new_user.toJSON();
    console.log(new_user_json.user_id);
    await insert_new_token(sequelize, token, new_user_json.user_id);
}

async function insert_new_user(sequelize, user_profile) {
    console.log(user_profile);
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


async function insert_new_token(sequelize, token, user_uuid) {
    const curr_date = new Date();
    const token_expires_date = curr_date.setSeconds(curr_date.getSeconds() + token.expires_in)
    const new_token = await sequelize.models.Token.create({
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        token_expires_epoch: token_expires_date,
        user_id: user_uuid,
        salt: null
    })

    return new_token;
}


module.exports = {
    add_new_user
}

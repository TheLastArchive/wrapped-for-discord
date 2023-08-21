const fs = require('fs');


function loadJSON() {
    return JSON.parse(
        fs.readFileSync('./temp_db.json').toString()
    )
}


function saveJSON(data) {
    return fs.writeFileSync(
        './temp_db.json', JSON.stringify(data))
}


function store_token(token, refresh=false) {
    let json = loadJSON();
    if (!refresh) {
        json.tokens.refresh_token = token.refresh_token;
    }
    const curr_date = new Date();
    const token_expires_date = curr_date.setSeconds(curr_date.getSeconds() + token.expires_in)
    json.tokens.access_token = token.access_token;
    json.tokens.token_expires_date = token_expires_date;
    console.log(json);
    saveJSON(json);
}


function store_user_data(data) {
    let json = loadJSON();
    json.user_data.user_id = data.id;
    json.user_data.display_name = data.display_name;
    json.user_data.url = data.external_urls.spotify;
    saveJSON(json);
}


module.exports = {
    loadJSON,
    saveJSON,
    store_token,
    store_user_data
}
require('dotenv').config();
const fetch = require('node-fetch');
const express = require('express');
const store = require('./store')
const { tokens } = require('../temp_db.json');

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
//Spotify requires the auth string to be base64 encoded in this format
const authentication_string = btoa(client_id + ":" + client_secret);
const state = generate_random_string(16);

const app = express();


app.get('/', (req, res) => {
    console.log("The thingy is working")
    res.send("The thingy is working")
})

/**
 * @description: For authorising a new user to the service. 
 * Redirects the user to the /token endpoint to trade their auth token for an access token
 */
app.get('/authorize', (req, res) => {

    console.log('/authorize hit');
    const scope = 'user-top-read ' +
    'user-read-recently-played ' +
    'user-read-private ' + 
    'user-read-email';

    res.redirect('https://accounts.spotify.com/authorize?' +
    'response_type=code&' +
    'client_id=' + client_id +
    '&scope=' + scope +
    '&redirect_uri=' + redirect_uri +
    '&state=' + state)

});

/**
 * @description: Uses the user's auth token to generate an access and refresh token
 */
app.get('/token', async (req, res) => {

    console.log("/token hit")
    params = new URLSearchParams()
    params.append('grant_type', 'authorization_code')
    params.append('redirect_uri', redirect_uri)
    params.append('code', req.query.code)

    await fetch("https://accounts.spotify.com/api/token", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + authentication_string },
        body: params
    })
    .then(res => res.json())
    .then(async token => {
        get_user_profile(token.access_token)
        store.store_token(token)
    })
})


async function get_user_profile(access_token) {
    console.log("Fetching user profile")
    await fetch("https://api.spotify.com/v1/me", {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + access_token },
    })
    .then(res => res.json())
    .then(data => store.store_user_data(data))
}


function has_token_expired() {
    return new Date > tokens.token_expires_date 
}


/**
 * @description: Refreshes the access token
 */
async function refresh_token() {

    console.log("/refresh hit")
    params = new URLSearchParams()
    params.append('grant_type', 'refresh_token')
    params.append('refresh_token', store.loadJSON().tokens.refresh_token)

    await fetch("https://accounts.spotify.com/api/token", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + authentication_string },
        body: params
    })
    .then(res => res.json())
    .then(token => store.store_token(token, true))
}


function generate_random_string(length) {
    let result = '';
    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

/**
 * @description Starts the express server
 * @param {int} port Server port
 */
function start(port) {
    app.listen(port);
    console.log("Server listening on port: " + port)
}


module.exports = {
    start,
    has_token_expired,
    refresh_token
}
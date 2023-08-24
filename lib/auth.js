require('dotenv').config();
const fetch = require('node-fetch');
const express = require('express');
const crypto = require('crypto');
const store = require('./database/data_insertion')
const path = require('path');

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
//Spotify requires the auth string to be base64 encoded in this format
const authentication_string = btoa(client_id + ":" + client_secret);
const state = crypto.randomBytes(16).toString('hex');

const app = express();


app.get('/', (req, res) => {
    console.log("The thingy is working")
    res.send("The thingy is working")
})


app.get('/china', (req, res) => {
    console.log("/china hit");
    res.sendFile(path.join(__dirname, '/china.html'));
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
        const user_profile = await get_user_profile(token.access_token)
        await store.add_new_user(user_profile, token);
    })

    res.redirect('/china');
})


async function get_user_profile(access_token) {
    console.log("Fetching user profile")
    return await fetch("https://api.spotify.com/v1/me", {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + access_token },
    })
    .then(res => res.json())
    .then(data =>  { return data })
}


/**
 * @description: Refreshes the access token
 */
async function refresh_token(old_tokens) {

    console.log("/refresh hit")
    params = new URLSearchParams()
    params.append('grant_type', 'refresh_token')
    params.append('refresh_token', old_tokens.refresh_token)

    return await fetch("https://accounts.spotify.com/api/token", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + authentication_string },
        body: params
    })
    .then(res => { return res.json() });
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
    refresh_token
}
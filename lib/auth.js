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
    const scope = 'user-top-read user-read-recently-played';

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
    .then(data => data.json())
    .then(token => store_token(token))
})


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
    .then(data => data.json())
    .then(token => store_token(token, true))
}


/**
 * @description: Stores the access token, refresh token, and the datetime the token expires
 * @param {JSON object} token The token object to be stored
 * @param {boolean} refresh has this method been called from refresh_token()?, defaults to false.
 */
function store_token(token, refresh=false) {

    //FIND A NICER WAY TO DO THIS
    //Refresh responses don't give another refresh token. If called from refresh_token()
    //Then just use the stored refresh token, else use the new refresh token in the token param

    const refresh_token = refresh ? tokens.refresh_token : token.refresh_token
    const curr_date = new Date();
    const token_expires_date = curr_date.setSeconds(curr_date.getSeconds() + token.expires_in)
    store.saveJSON({
        'tokens': {
            "access_token": token.access_token,
            "refresh_token": refresh_token,
            "token_expires_date": token_expires_date
        }
    })
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
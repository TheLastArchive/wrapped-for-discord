require('dotenv').config();
const fetch = require('node-fetch');
const express = require('express');
const store = require('./store')

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

app.get('/token', async (req, res) => {

    params = new URLSearchParams()
    params.append('grant_type', 'authorization_code')
    params.append('redirect_uri', redirect_uri)
    params.append('code', req.query.code)

    const token = await fetch("https://accounts.spotify.com/api/token", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + authentication_string },
        body: params
    })
    .then(data => {
        return data.json();
    })
    store.saveJSON({
        'tokens': {
            access_token: token.access_token,
            refresh_token: token.refresh_token
        }
    })
})


async function refresh() {

    params = new URLSearchParams()
    params.append('grant_type', 'refresh_token')
    params.append('refresh_token', store.loadJSON().tokens.refresh_token)

    const token = await fetch("https://accounts.spotify.com/api/token", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + authentication_string },
        body: params
    })
    .then(data => {
        return data.json();
    })
    store.saveJSON({
        'tokens': {
            access_token: token.access_token,
            refresh_token: token.refresh_token
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

function start(port) {
    app.listen(port);
    console.log("Server listening on port: " + port)
}

module.exports = {
    start
}
require('dotenv').config();
const fetch = require('node-fetch');
const express = require('express');

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;

const app = express();
const state = generate_random_string(16);
var access_token;


app.get('/', (req, res) => {
    console.log("The thingy is working")
    res.send("The thingy is working")
})


app.get('/authorize', (req, res) => {
    console.log('/authorize hit');

    const scope = 'user-top-read user-read-recently-played';
    const redirect_uri = 'http://localhost:5000/callback'

    res.redirect('https://accounts.spotify.com/authorize?' +
    'response_type=code&' +
    'client_id=' + client_id +
    '&scope=' + scope +
    '&redirect_uri=' + redirect_uri +
    '&state=' + state)

});

app.get('/callback', async (req, res) => {

    //Spotify requires the auth string to be base64 encoded in this format
    const authentication_string = btoa(client_id + ":" + client_secret);
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
    console.log(token.access_token)
    access_token = token.access_token;
})


function generate_random_string(length) {
    let result = '';
    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

app.listen(5000);
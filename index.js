const fetch = require('node-fetch');
require('dotenv').config();
const express = require('express');

var app = express();
const state = generate_random_string(16);
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
var access_token;


app.get('/', (req, res) => {
    console.log("The thingy is working")
    res.send("The thingy is working")
})


app.get('/callback', async function(req, res) {

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


app.get('/authorize', (req, res) => {
    console.log('/authorize hit');

    const scope = 'user-top-read';
    const redirect_uri = 'http://localhost:5000/callback'

    res.redirect('https://accounts.spotify.com/authorize?' +
    'response_type=code&' +
    'client_id=' + client_id +
    '&scope=' + scope +
    '&redirect_uri=' + redirect_uri +
    '&state=' + state)

});


function generate_random_string(length) {
    let result = '';
    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}



app.get('/top_artists', async function(req, res) {
    const response = await fetch('https://api.spotify.com/v1/me/top/artists?' +
    'time_range=short_term&' +
    'limit=10', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + access_token }
})
    .then(res =>  {
        return res.json() 
    })
    
    response.items.forEach(item => {
        console.log(item.name)
    });
})


app.listen(5000);

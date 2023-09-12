require("dotenv").config();
const fetch = require("node-fetch");
const express = require("express");
const crypto = require("crypto");
const path = require("path");
const cookie = require("cookie-parser");
const db_insert = require("./database/data_insertion");
const db_access = require("./database/data_access");


const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
//Spotify requires the auth string to be base64 encoded in this format
// const authentication_string = btoa(client_id + ":" + client_secret);
const authentication_string = Buffer.from(client_id + ":" + client_secret).toString('base64');
const state_key = "spotify_auth_state";
const app = express();

app.use(cookie());

app.get("/", (req, res) => {
    console.log("The thingy is working");
    res.send("The thingy is working");
});

app.get("/china", (req, res) => {
    console.log("/china hit");
    res.sendFile(path.join(__dirname, "/html/china.html"));
});

/**
 * @description: For authorising a new user to the service.
 * Redirects the user to the /token endpoint to trade their auth token for an access token
 */
app.get("/authorize", (req, res) => {
    console.log("/authorize hit");
    const scope =
        "user-top-read " +
        "user-read-recently-played " +
        "user-read-private " +
        "user-read-email";

    const state = crypto.randomBytes(16).toString("hex");
    res.cookie(state_key, state);

    res.redirect(
        "https://accounts.spotify.com/authorize?" +
            "response_type=code&" +
            "client_id=" +
            client_id +
            "&scope=" +
            scope +
            "&redirect_uri=" +
            redirect_uri +
            "&state=" +
            state
    );
});

/**
 * @description: Uses the user's auth token to generate an access and refresh token
 */
app.get("/token", async (req, res) => {
    console.log("/token hit");
    const state = req.query.state || null;
    const stored_state = req.cookies ? req.cookies[state_key] : null;
    if (state == null || state != stored_state) {
        console.log("State mismatch");
        return;
    }
    res.clearCookie(state_key);
    params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("redirect_uri", redirect_uri);
    params.append("code", req.query.code);

    await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + authentication_string,
        },
        body: params,
    })
        .then((res) => res.json())
        .then(async (token) => {
            const user_profile = await fetch_user_profile(token.access_token);
            await db_insert.add_new_user(user_profile, token);
        });

    res.redirect("/china");
});

async function fetch_user_profile(access_token) {
    console.log("Fetching user profile");
    return await fetch("https://api.spotify.com/v1/me", {
        method: "GET",
        headers: {
            Authorization: "Bearer " + access_token,
        },
    })
        .then((res) => res.json())
        .then((data) => {
            return data;
        });
}

/**
 * @description: Refreshes the access token
 */
async function refresh_token(old_token) {
    console.log("/refresh hit");
    params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", old_token.refresh_token);

    const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + authentication_string,
        },
        body: params,
    });
    return await res.json();
}

function has_token_expired(token) {
    return new Date() > token.token_expires_epoch;
}

async function get_token(user) {
    let encrypted_token = await user.getToken();
    let token = db_access.handle_token_decrypt(encrypted_token);
    return has_token_expired(token) ?
    await handle_token_refresh(token) : token
}

/**
 * @description Fetches a new refresh token, encrypts and stores in the database, updates 'token'
 * @param {*} token sequelize token for the user
 * @returns user token with the refreshed access token
 */
async function handle_token_refresh(token) {
    console.log("Token expired, refreshing...");
    const refreshed_token = await refresh_token(token);
    token = await db_insert.insert_refreshed_token(token, refreshed_token);
    token.access_token = refreshed_token.access_token;
    console.log("Token refreshed and stored in database");
    return token;
}

function start(port) {
    app.listen(port);
    console.log("Server listening on port: " + port);
}

module.exports = {
    start,
    refresh_token,
    get_token
};

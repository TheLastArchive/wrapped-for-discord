require("dotenv").config();
const fetch = require("node-fetch");
const express = require("express");
const crypto = require("crypto");
const path = require("path");
const cookie = require("cookie-parser");
const dbInsert = require("./database/dataInsertion");
const dbAccess = require("./database/dataAccess");


const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectURI = process.env.REDIRECT_URI;
//Spotify requires the auth string to be base64 encoded in this format
// const authenticationString = btoa(clientID + ":" + clientSecret);
const authenticationString = Buffer.from(clientID + ":" + clientSecret).toString('base64');
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
 * @description: For authorizing a new user to the service.
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
            "clientID=" +
            clientID +
            "&scope=" +
            scope +
            "&redirectURI=" +
            redirectURI +
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
    params.append("redirectURI", redirectURI);
    params.append("code", req.query.code);

    await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + authenticationString,
        },
        body: params,
    })
        .then((res) => res.json())
        .then(async (token) => {
            const userProfile = await fetchUserProfile(token.access_token);
            await dbInsert.addNewUser(userProfile, token);
        });

    res.redirect("/china");
});

async function fetchUserProfile(accessToken) {
    console.log("Fetching user profile");
    return await fetch("https://api.spotify.com/v1/me", {
        method: "GET",
        headers: {
            Authorization: "Bearer " + accessToken,
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
async function refreshToken(oldToken) {
    console.log("/refresh hit");
    params = new URLSearchParams();
    params.append("grant_type", "refreshToken");
    params.append("refreshToken", oldToken.refresh_token);

    const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + authenticationString,
        },
        body: params,
    });
    return await res.json();
}

function hasTokenExpired(token) {
    return new Date() > token.token_expires_epoch;
}

async function getToken(user) {
    let encrypted_token = await user.getToken();
    let token = dbAccess.handleTokenDecrypt(encrypted_token);
    return hasTokenExpired(token) ?
    await handleTokenRefresh(token) : token
}

/**
 * @description Fetches a new refresh token, encrypts and stores in the database, updates 'token'
 * @param {*} token sequelize token for the user
 * @returns user token with the refreshed access token
 */
async function handleTokenRefresh(token) {
    console.log("Token expired, refreshing...");
    const refreshedToken = await refreshToken(token);
    token = await dbInsert.insertRefreshedToken(token, refreshedToken);
    token.access_token = refreshedToken.access_token;
    console.log("Token refreshed and stored in database");
    return token;
}

function start(port) {
    app.listen(port);
    console.log("Server listening on port: " + port);
}

module.exports = {
    start,
    refreshToken,
    getToken
};

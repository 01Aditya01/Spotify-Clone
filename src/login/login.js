import { ACCESS_TOKEN, TOKEN_TYPE, EXPIRES_IN } from "../common";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;
const APP_URL = import.meta.env.VITE_APP_URL;

const scopes =
  "user-top-read user-follow-read playlist-read-private user-library-read";
const authorizeUser = () => {
  const url = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${REDIRECT_URI}&scope=${scopes}&show_dialog=true`;
  window.open(url, "Login", "height=600,width=800");
};

document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.querySelector("#login-to-spotify");
  loginButton.addEventListener("click", authorizeUser);
});

window.setItemInLocalStorage = (access_token, token_type, expires_in) => {
  window.localStorage.setItem(ACCESS_TOKEN, access_token);
  window.localStorage.setItem(TOKEN_TYPE, token_type);
  window.localStorage.setItem(EXPIRES_IN, expires_in);
};

window.addEventListener("load", () => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN);
  if (accessToken) {
    window.location.href = `${APP_URL}/dashboard/dashboard.html`;
  } else if (window.opener && !window.opener.closed) {
    window.focus();
    if (window.location.href.includes("error")) {
      window.close();
    }
    const getURL = window.location.hash;
    const params = new URLSearchParams(getURL);
    const access_token = params.get("#access_token");
    const token_type = params.get("token_type");
    const expires_in = params.get("expires_in");
    console.log(token_type);
    if (access_token) {
      window.opener.setItemInLocalStorage(access_token, token_type, expires_in);
      window.opener.location.href = APP_URL;
    }
    window.close();
  }
});

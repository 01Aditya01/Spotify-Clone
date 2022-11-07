import { formatWithCursor } from "prettier";

const BASE_API_URL = import.meta.env.VITE_API_BASE_URL;
let accessToken;
let expiresIn;
let tokenType;

const fetchAccessToken = async () => {
  const response = await fetch(
    "https://spotify-apifetch.netlify.app/.netlify/functions/spotify"
  );
  return response.json();
};

const getAccessToken = async () => {
  if (!accessToken || Date.now() > expiresIn) {
    const { access_token, token_type, expires_in } = await fetchAccessToken();
    accessToken = access_token;
    tokenType = token_type;
    expiresIn = Date.now() + expires_in * 1000;
  }
  return { accessToken, tokenType };
};

const createAPIConfig = ({ accessToken, tokenType }, method = "GET") => {
  return {
    headers: {
      Authorization: `${tokenType} ${accessToken}`,
    },
    method,
  };
};

export const fetchRequest = async (endpoint) => {
  const url = `${BASE_API_URL}/${endpoint}`;
  const result = await fetch(url, createAPIConfig(await getAccessToken()));
  return result.json();
};

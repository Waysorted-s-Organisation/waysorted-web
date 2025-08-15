import axios from "axios";

export async function refreshGoogleToken(refreshToken) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await axios.post(
    "https://oauth2.googleapis.com/token",
    params,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  return response.data; // contains new access_token, expires_in, and sometimes refresh_token
}

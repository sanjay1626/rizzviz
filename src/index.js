const Spotify = require('spotify-web-api-node');
require('dotenv').config();
const spotifyApi = new Spotify({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
});

spotifyApi.clientCredentialsFlow()
  .then((data) => {
    console.log('Authenticated with Spotify API');
    const accessToken = data.body['access_token'];
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(data.body['refresh_token']);

    // Fetch data about the user's recently played tracks
    spotifyApi.getMyRecentlyPlayedTracks()
      .then((data) => {
        console.log('Fetched recently played tracks');
        const tracks = data.body.items;
        // Generate visualizations using the track data
      })
      .catch((err) => {
        console.error('Error fetching recently played tracks', err);
      });
  })
  .catch((err) => {
    console.error('Error authenticating with Spotify API', err);
  });
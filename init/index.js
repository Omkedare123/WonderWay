require('dotenv').config();
const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});
  
  // Add geometry data to each listing
  for (let listing of initData.data) {
    try {
      const query = `${listing.location}, ${listing.country}`;
      const geoData = await geocodingClient
        .forwardGeocode({
          query,
          limit: 1
        })
        .send();

      if (geoData.body.features && geoData.body.features.length > 0) {
        listing.geometry = {
          type: "Point",
          coordinates: geoData.body.features[0].center
        };
      } else {
        console.log(`! No coordinates found for ${listing.location}`);
      }
    } catch (err) {
      console.error(`Error geocoding ${listing.location}:`, err.message);
    }
  }

  // Add owner and save listings
  const listingsWithOwner = initData.data.map((obj) => ({
    ...obj,
    owner: "65f2e759f5ae569910009f4c"
  }));

  await Listing.insertMany(listingsWithOwner);
  console.log("Data was initialized");
};

initDB(); 
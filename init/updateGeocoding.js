require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/listing');
const User = require('../models/user');
const Review = require('../models/review');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;

async function main() {
    try {
        console.log("Testing Mapbox token...");
        console.log("Token:", mapToken ? "Present" : "Missing");

        const geocodingClient = mbxGeocoding({ accessToken: mapToken });

        // Test the token with a simple geocoding request
        const response = await geocodingClient
            .forwardGeocode({
                query: "Mumbai, India",
                limit: 1
            })
            .send();

        if (response.body.features && response.body.features.length > 0) {
            console.log("\n✓ Mapbox token is working!");
            console.log("Test coordinates for Mumbai:", response.body.features[0].center);
        } else {
            console.log("\n! No results found. Token might not be working correctly.");
        }

    } catch (err) {
        console.error("\nError testing Mapbox token:", err.message);
        process.exit(1);
    }
}

main().catch(err => {
    console.error("Error in main:", err);
    process.exit(1);
}); 
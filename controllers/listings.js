require('dotenv').config(); 

const Listing = require("../models/listing.js");
const mapToken = process.env.MAP_TOKEN?.trim(); // Ensure no spaces
console.log("Final Token Passed to Mapbox:", mapToken); // Debugging

const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const geocodingClient = mbxGeocoding({ accessToken: mapToken });



module.exports.index = async (req, res) => {
    const allListings = await Listing.find({}).populate("owner");
    res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    try {
        let { id } = req.params;
        const listing = await Listing.findById(id)
            .populate({
                path: "reviews",
                populate: { path: "author" }
            })
            .populate("owner");

        if (!listing) {
            req.flash("error", "Listing you requested for does not exist");
            return res.redirect("/listings");
        }

        res.render("listings/show.ejs", { listing });
    } catch (err) {
        req.flash("error", "Error loading listing");
        res.redirect("/listings");
    }
};

module.exports.createListing = async (req, res) => {
    try {
        let response = await geocodingClient
            .forwardGeocode({
                query: `${req.body.listing.location}, ${req.body.listing.country}`,
                limit: 1
            })
            .send();

        if (!response.body.features || response.body.features.length === 0) {
            req.flash("error", "Could not find the location. Please try a different location.");
            return res.redirect("/listings/new.ejs");
        }

        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        newListing.geometry = response.body.features[0].geometry;

        await newListing.save();
        req.flash("success", "New Listing Created!");
        res.redirect("/listings");
    } catch (err) {
        req.flash("error", "Error creating listing. Please try again.");
        res.redirect("/listings/new.ejs");
    }
};

module.exports.editListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
    res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
    try {
        let { id } = req.params;
        
        // Get new coordinates if location or country changed
        const existingListing = await Listing.findById(id);
        if (!existingListing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        // Update coordinates if location changed
        if (req.body.listing.location !== existingListing.location || 
            req.body.listing.country !== existingListing.country) {
            let response = await geocodingClient
                .forwardGeocode({
                    query: `${req.body.listing.location}, ${req.body.listing.country}`,
                    limit: 1
                })
                .send();

            if (!response.body.features || response.body.features.length === 0) {
                req.flash("error", "Could not find the new location. Please try a different location.");
                return res.redirect(`/listings/${id}/edit`);
            }

            req.body.listing.geometry = response.body.features[0].geometry;
        } else {
            req.body.listing.geometry = existingListing.geometry;
        }

        // Update the listing with new data
        const updatedListing = await Listing.findByIdAndUpdate(
            id,
            { ...req.body.listing },
            { new: true, runValidators: true }
        );

        if (!updatedListing) {
            req.flash("error", "Could not update listing!");
            return res.redirect(`/listings/${id}/edit`);
        }

        req.flash("success", "Listing Updated Successfully!");
        res.redirect(`/listings/${id}`);
    } catch (err) {
        console.error("Error updating listing:", err);
        req.flash("error", "Error updating listing. Please try again.");
        res.redirect(`/listings/${id}/edit`);
    }
};

module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    
    if (!deletedListing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};
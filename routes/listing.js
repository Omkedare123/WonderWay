const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

router
    .route("/")
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIn,
        upload.single('listing[image]'),
        wrapAsync(async (req, res, next) => {
            try {
                if (!req.file) {
                    req.flash("error", "Please upload an image");
                    return res.redirect("/listings/new");
                }
                if (!req.body.listing) {
                    req.flash("error", "Missing listing data");
                    return res.redirect("/listings/new");
                }
                req.body.listing.image = {
                    url: req.file.path,
                    filename: req.file.filename
                };
                next();
            } catch (err) {
                console.error("Upload error:", err);
                req.flash("error", "Error uploading image. Please try again.");
                return res.redirect("/listings/new");
            }
        }),
        validateListing,
        wrapAsync(listingController.createListing)
    );

router
    .route("/new")
    .get(isLoggedIn, listingController.renderNewForm);

router
    .route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(
        isLoggedIn,
        isOwner,
        upload.single('listing[image]'),
        validateListing,
        wrapAsync(async (req, res, next) => {
            const { id } = req.params;
            const listing = await Listing.findById(id);

            if (!listing) {
                req.flash("error", "Listing not found");
                return res.redirect("/listings");
            }

            if (req.file) {
                req.body.listing.image = {
                    url: req.file.path,
                    filename: req.file.filename
                };
            } else {
                // Keep the existing image if no new file was uploaded
                req.body.listing.image = listing.image;
            }

            next();
        }),
        wrapAsync(listingController.updateListing)
    )
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.deleteListing));

router
    .route("/:id/edit")
    .get(isLoggedIn, isOwner, wrapAsync(listingController.editListing));

module.exports = router;
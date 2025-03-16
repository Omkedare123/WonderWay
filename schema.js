const Joi = require('joi');

module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required().trim(),
        description: Joi.string().required().trim(),
        location: Joi.string().required().trim(),
        country: Joi.string().required().trim(),
        price: Joi.number().required().min(0),
        image: Joi.object({
            url: Joi.string().trim(),
            filename: Joi.string().trim()
        }).optional()
    }).required()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required().trim()
    }).required()
});
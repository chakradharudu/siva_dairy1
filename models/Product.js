const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        unit: {
            type: String,
            required: true,
            trim: true
        },

        icon: {
            type: String,
            default: "🥛"
        },

        /*
         * PRODUCT AVAILABILITY
         *
         * true  = customers can order
         * false = product is unavailable
         */
        available: {
            type: Boolean,
            default: true
        },

        /*
         * STOCK MANAGEMENT
         *
         * Example:
         * stockQuantity: 50
         * unit: "Litre"
         *
         * Means 50 Litres are currently available.
         */
        stockQuantity: {
            type: Number,
            default: 0,
            min: 0
        },

        /*
         * LOW STOCK WARNING LIMIT
         *
         * Example:
         * stockQuantity = 8
         * lowStockLimit = 10
         *
         * Then the admin dashboard can show:
         * "LOW STOCK"
         */
        lowStockLimit: {
            type: Number,
            default: 10,
            min: 0
        },

        specs: {
            type: String,
            default: ""
        },

        /*
         * PRODUCT IMAGE
         */
        image: {
            data: Buffer,
            contentType: String
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.model(
        "Product",
        productSchema
    );
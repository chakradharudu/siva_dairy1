const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
    {
        // ==========================================
        // CUSTOMER DETAILS
        // ==========================================

        customerName: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        address: {
            type: String,
            required: true,
            trim: true
        },

        landmark: {
            type: String,
            default: "",
            trim: true
        },

        // ==========================================
        // PRODUCT DETAILS
        // ==========================================

        productName: {
            type: String,
            required: true,
            trim: true
        },

        productId: {
            type: String,
            default: "",
            trim: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 0.01
        },

        unit: {
            type: String,
            default: "Litre",
            trim: true
        },

        // ==========================================
        // PRICE DETAILS
        // ==========================================

        normalPrice: {
            type: Number,
            default: 0,
            min: 0
        },

        pricePerUnit: {
            type: Number,
            required: true,
            min: 0
        },

        subscriptionDiscount: {
            type: Number,
            default: 0,
            min: 0
        },

        monthlyAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        // ==========================================
        // DELIVERY DETAILS
        // ==========================================

        deliveryDays: {
            type: [String],
            default: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday"
            ]
        },

        startDate: {
            type: Date,
            required: true
        },

        deliverySlot: {
            type: String,
            default: "Morning",
            trim: true
        },

        // ==========================================
        // PAYMENT
        // ==========================================

        paymentMethod: {
            type: String,
            default: "COD",
            trim: true
        },

        // ==========================================
        // STATUS
        // ==========================================

        status: {
            type: String,
            enum: [
                "ACTIVE",
                "PAUSED",
                "CANCELLED",
                "COMPLETED"
            ],
            default: "ACTIVE"
        },

        // ==========================================
        // NOTES
        // ==========================================

        notes: {
            type: String,
            default: "",
            trim: true
        },

        // ==========================================
        // SKIPPED DELIVERY DATES
        //
        // Stored as:
        // ["2026-08-20", "2026-08-25"]
        // ==========================================

        skippedDates: {
            type: [String],
            default: []
        }
    },

    {
        timestamps: true
    }
);


// ==========================================
// INDEXES
// ==========================================

subscriptionSchema.index({
    phone: 1,
    createdAt: -1
});

subscriptionSchema.index({
    status: 1
});


// ==========================================
// CLEAN DUPLICATE SKIPPED DATES
// ==========================================

subscriptionSchema.pre("save", function(next) {

    if (Array.isArray(this.skippedDates)) {

        this.skippedDates = [
            ...new Set(
                this.skippedDates
                    .map(date => String(date))
                    .filter(Boolean)
            )
        ].sort();

    }

    next();

});


module.exports =
    mongoose.models.Subscription ||
    mongoose.model(
        "Subscription",
        subscriptionSchema
    );
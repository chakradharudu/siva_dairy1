const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      required: true
    },

    address: {
      type: String,
      required: true
    },

    slot: {
      type: String,
      default: ""
    },

    payment: {
      type: String,
      default: "COD"
    },

    status: {
      type: String,
      default: "CONFIRMED"
    },

    items: [
      {
        name: {
          type: String,
          required: true
        },

        qty: {
          type: Number,
          required: true
        },

        price: {
          type: Number,
          required: true
        },

        icon: {
          type: String,
          default: "🥛"
        },

        unit: {
          type: String,
          default: "item"
        }
      }
    ],

    subtotal: {
      type: Number,
      required: true
    },

    delivery: {
      type: Number,
      default: 0
    },

    total: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Order", orderSchema);
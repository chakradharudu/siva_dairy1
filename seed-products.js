const mongoose = require("mongoose");
require("dotenv").config();

const Product = require("./models/Product");

const products = [
    {
        name: "Buffalo Milk",
        price: 80,
        unit: "Litre",
        icon: "🥛",
        available: true,
        specs: "Fat 8% • SNF 9%"
    },
    {
        name: "Cow Milk",
        price: 70,
        unit: "Litre",
        icon: "🥛",
        available: true,
        specs: "Fat 3% • SNF 6%"
    },
    {
        name: "Fresh Curd",
        price: 80,
        unit: "Kg",
        icon: "🥣",
        available: true,
        specs: ""
    },
    {
        name: "Buffalo Ghee",
        price: 800,
        unit: "Litre",
        icon: "🫙",
        available: true,
        specs: ""
    },
    {
        name: "Cow Ghee",
        price: 900,
        unit: "Litre",
        icon: "🫙",
        available: true,
        specs: ""
    },
    {
        name: "Butter",
        price: 500,
        unit: "Kg",
        icon: "🧈",
        available: true,
        specs: ""
    }
];

async function seedProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected.");

        for (const productData of products) {

            const existingProduct = await Product.findOne({
                name: productData.name
            });

            if (existingProduct) {

                console.log(
                    `Already exists: ${productData.name}`
                );

            } else {

                const product = new Product(productData);

                await product.save();

                console.log(
                    `Added: ${productData.name}`
                );
            }
        }

        console.log("");
        console.log("✅ Product seeding completed.");
        console.log("");

        const allProducts = await Product.find();

        console.log(
            `Total products in MongoDB: ${allProducts.length}`
        );

    } catch (error) {

        console.error(
            "❌ Error:",
            error.message
        );

    } finally {

        await mongoose.connection.close();

        console.log(
            "MongoDB connection closed."
        );
    }
}

seedProducts();
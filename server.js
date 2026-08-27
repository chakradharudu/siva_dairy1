// ============================================================
// SIVA DAIRY - COMPLETE SERVER.JS
// ============================================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ============================================================
// APP
// ============================================================

const app = express();

const PORT = process.env.PORT || 5000;
const isVercel = process.env.VERCEL === "1";

app.use(cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


// ============================================================
// UPLOAD DIRECTORY
// ============================================================

const uploadsDir = isVercel
    ? path.join("/tmp", "uploads")
    : path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}


// ============================================================
// MULTER - PRODUCT IMAGE UPLOAD
// ============================================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },

    filename: function (req, file, cb) {

        const ext =
            path.extname(file.originalname).toLowerCase();

        const safeName =
            path
                .basename(file.originalname, ext)
                .replace(/[^a-zA-Z0-9-_]/g, "-")
                .substring(0, 40);

        const filename =
            `${Date.now()}-${safeName}${ext}`;

        cb(null, filename);
    }

});


const upload = multer({

    storage,

    limits: {
        fileSize: 20 * 1024 * 1024
    },

    fileFilter: function (req, file, cb) {

        if (file.mimetype.startsWith("image/")) {

            cb(null, true);

        } else {

            cb(
                new Error(
                    "Only image files are allowed."
                )
            );

        }

    }

});


// ============================================================
// STATIC FILES
// ============================================================

app.use(
    "/uploads",
    express.static(uploadsDir)
);

if (isVercel) {
    app.use(
        "/uploads",
        express.static(path.join(__dirname, "uploads"))
    );
}

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// ============================================================
// MONGODB CONNECTION
// ============================================================

const MONGO_URI =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI;

let databaseConnection;

async function connectDatabase() {

    if (!MONGO_URI) {
        throw new Error("MONGO_URI is missing.");
    }

    if (mongoose.connection.readyState === 1) {
        return;
    }

    if (!databaseConnection) {
        databaseConnection = mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });
    }

    try {
        await databaseConnection;
        console.log("MongoDB Atlas connected successfully!");
    }
    catch (error) {
        databaseConnection = undefined;
        throw error;
    }

}


if (!isVercel) {

    connectDatabase()
        .then(() => {

            app.listen(PORT, () => {

                console.log(
                    `Siva Dairy server running on http://localhost:${PORT}`
                );

                console.log(
                    `Product image folder: ${uploadsDir}`
                );

            });

        })
        .catch(error => {

            console.error("MongoDB connection failed:");
            console.error(error);
            process.exit(1);

        });

}


// ============================================================
// MODELS
// ============================================================

// ------------------------------------------------------------
// PRODUCT
// ------------------------------------------------------------

const ProductSchema =
    new mongoose.Schema(
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
                default: "Litre"
            },

            icon: {
                type: String,
                default: "🥛"
            },

            specs: {
                type: String,
                default: ""
            },

            image: {
    type: mongoose.Schema.Types.Mixed,
    default: ""
},

            available: {
               type: Boolean,
               default: true
},

stockQuantity: {
    type: Number,
    default: 0,
    min: 0
},

lowStockLimit: {
    type: Number,
    default: 10,
    min: 0
}

        },

        {
            timestamps: true,
            strict: false
        }
    );


const Product =
    mongoose.models.Product ||
    mongoose.model("Product", ProductSchema);


// ------------------------------------------------------------
// CUSTOMER
// ------------------------------------------------------------

const CustomerSchema =
    new mongoose.Schema(
        {

            name: {
                type: String,
                trim: true
            },

            phone: {
                type: String,
                trim: true,
                index: true
            },

            address: {
                type: String,
                default: ""
            },

            landmark: {
                type: String,
                default: ""
            }

        },

        {
            timestamps: true,
            strict: false
        }
    );


const Customer =
    mongoose.models.Customer ||
    mongoose.model("Customer", CustomerSchema);


// ------------------------------------------------------------
// ORDER
// ------------------------------------------------------------

const OrderSchema =
    new mongoose.Schema(
        {

            customerName: {
                type: String,
                default: ""
            },

            phone: {
                type: String,
                default: ""
            },

            address: {
                type: String,
                default: ""
            },

            items: {
                type: Array,
                default: []
            },

            payment: {
                type: String,
                default: "COD"
            },

            total: {
                type: Number,
                default: 0
            },

            status: {
                type: String,
                default: "PAYMENT_PENDING"
            }

        },

        {
            timestamps: true,
            strict: false
        }
    );


const Order =
    mongoose.models.Order ||
    mongoose.model("Order", OrderSchema);


// ------------------------------------------------------------
// SUBSCRIPTION
// ------------------------------------------------------------

const SubscriptionSchema =
    new mongoose.Schema(
        {

            customerName: {
                type: String,
                required: true
            },

            phone: {
                type: String,
                required: true,
                index: true
            },

            address: {
                type: String,
                default: ""
            },

            landmark: {
                type: String,
                default: ""
            },

            productName: {
                type: String,
                required: true
            },

            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            },

            quantity: {
                type: Number,
                default: 1
            },

            unit: {
                type: String,
                default: "Litre"
            },

            normalPrice: {
                type: Number,
                default: 0
            },

            pricePerUnit: {
                type: Number,
                default: 0
            },

            deliveryDays: {
                type: [String],
                default: []
            },

            startDate: {
                type: Date
            },

            deliverySlot: {
                type: String,
                default: "Morning"
            },

            paymentMethod: {
                type: String,
                default: "COD"
            },

            monthlyAmount: {
                type: Number,
                default: 0
            },

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

            skippedDates: {
                type: [String],
                default: []
            },

            notes: {
                type: String,
                default: ""
            }

        },

        {
            timestamps: true,
            strict: false
        }
    );


const Subscription =
    mongoose.models.Subscription ||
    mongoose.model(
        "Subscription",
        SubscriptionSchema
    );


// ============================================================
// HELPER FUNCTIONS
// ============================================================

function deleteUploadedFile(imageUrl) {

    if (!imageUrl) {
        return;
    }

    try {

        let filename = imageUrl;

        if (filename.startsWith("/uploads/")) {
            filename =
                filename.replace(
                    "/uploads/",
                    ""
                );
        }

        if (filename.startsWith("uploads/")) {
            filename =
                filename.replace(
                    "uploads/",
                    ""
                );
        }

        if (
            filename.startsWith("http://") ||
            filename.startsWith("https://")
        ) {

            return;

        }

        const filePath =
            path.join(
                uploadsDir,
                path.basename(filename)
            );

        if (fs.existsSync(filePath)) {

            fs.unlinkSync(filePath);

        }

    }
    catch (error) {

        console.error(
            "Could not delete image:",
            error.message
        );

    }

}


function productImageUrl(req, filename) {

    return (
        `${req.protocol}://${req.get("host")}` +
        `/uploads/${filename}`
    );

}


// ============================================================
// BASIC ROUTES
// ============================================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        message: "Siva Dairy server is running",
        database:
            mongoose.connection.readyState === 1
                ? "connected"
                : "disconnected",
        time: new Date()
    });

});


if (isVercel) {

    app.use("/api", async (req, res, next) => {

        try {
            await connectDatabase();
            next();
        }
        catch (error) {
            next(error);
        }

    });

}


// ============================================================
// PRODUCTS
// ============================================================


// ------------------------------------------------------------
// GET ALL PRODUCTS
// GET /api/products
// ------------------------------------------------------------

app.get(
    "/api/products",
    async (req, res) => {

        try {

            const products =
                await Product
                    .find()
                    .sort({
                        createdAt: -1
                    })
                    .lean();

            const safeProducts = products.map(product => {

                let imageUrl = "";

                if (
                    typeof product.image === "string"
                ) {
                    imageUrl = product.image;
                }

                return {
                    ...product,
                    imageUrl
                };

            });

            res.json(safeProducts);

        }
        catch (error) {

            console.error(
                "GET PRODUCTS ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to load products.",

                error:
                    error.message

            });

        }

    }
);


// ------------------------------------------------------------
// GET ONE PRODUCT
// GET /api/products/:id
// ------------------------------------------------------------

app.get(
    "/api/products/:id",
    async (req, res) => {

        try {

            const product =
                await Product
                    .findById(req.params.id)
                    .lean();

            if (!product) {

                return res.status(404).json({

                    message:
                        "Product not found."

                });

            }

            let imageUrl = "";

            if (
                typeof product.image === "string"
            ) {
                imageUrl = product.image;
            }

            res.json({
                ...product,
                imageUrl
            });

        }
        catch (error) {

            console.error(
                "GET ONE PRODUCT ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to load product.",

                error:
                    error.message

            });

        }

    }
);


// ------------------------------------------------------------
// ADD PRODUCT
// POST /api/products
// ------------------------------------------------------------

app.post(
    "/api/products",
    upload.single("image"),
    async (req, res) => {

        try {

            const {
                name,
                price,
                unit,
                icon,
                specs
            } = req.body;


            if (!name) {

                if (req.file) {
                    deleteUploadedFile(
                        `/uploads/${req.file.filename}`
                    );
                }

                return res.status(400).json({
                    message:
                        "Product name is required."
                });

            }


            if (
                price === undefined ||
                price === "" ||
                isNaN(Number(price))
            ) {

                if (req.file) {
                    deleteUploadedFile(
                        `/uploads/${req.file.filename}`
                    );
                }

                return res.status(400).json({
                    message:
                        "Valid product price is required."
                });

            }


            const product =
                new Product({

                    name:
                        name.trim(),

                    price:
                        Number(price),

                    unit:
                        unit ||
                        "Litre",

                    icon:
                        icon ||
                        "🥛",

                    specs:
                        specs ||
                        "",

                    image:
                        req.file
                        ?
                        productImageUrl(
                            req,
                            req.file.filename
                        )
                        :
                        "",

                    available:
                        true

                });


            await product.save();


            res.status(201).json({

                message:
                    "Product added successfully.",

                product

            });

        }
        catch (error) {

            if (req.file) {

                deleteUploadedFile(
                    `/uploads/${req.file.filename}`
                );

            }

            console.error(
                "ADD PRODUCT ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to add product.",

                error:
                    error.message

            });

        }

    }
);


// ------------------------------------------------------------
// EDIT PRODUCT
// PUT /api/products/:id
// ------------------------------------------------------------

app.put(
    "/api/products/:id",
    upload.single("image"),
    async (req, res) => {

        try {

            const product =
                await Product.findById(
                    req.params.id
                );

            if (!product) {

                if (req.file) {
                    deleteUploadedFile(
                        `/uploads/${req.file.filename}`
                    );
                }

                return res.status(404).json({

                    message:
                        "Product not found."

                });

            }


            // ============================================
            // PRODUCT NAME
            // ============================================

            if (
                req.body.name !== undefined
            ) {

                const name =
                    String(
                        req.body.name
                    ).trim();

                if (!name) {

                    if (req.file) {
                        deleteUploadedFile(
                            `/uploads/${req.file.filename}`
                        );
                    }

                    return res.status(400).json({

                        message:
                            "Product name is required."

                    });

                }

                product.name = name;

            }


            // ============================================
            // PRICE
            // ============================================

            if (
                req.body.price !== undefined
            ) {

                const price =
                    Number(
                        req.body.price
                    );

                if (
                    isNaN(price) ||
                    price < 0
                ) {

                    if (req.file) {
                        deleteUploadedFile(
                            `/uploads/${req.file.filename}`
                        );
                    }

                    return res.status(400).json({

                        message:
                            "Invalid product price."

                    });

                }

                product.price = price;

            }


            // ============================================
            // UNIT
            // ============================================

            if (
                req.body.unit !== undefined
            ) {

                product.unit =
                    String(
                        req.body.unit
                    ).trim();

            }


            // ============================================
            // ICON
            // ============================================

            if (
                req.body.icon !== undefined
            ) {

                product.icon =
                    String(
                        req.body.icon
                    ).trim();

            }


            // ============================================
            // SPECIFICATIONS
            // ============================================

            if (
                req.body.specs !== undefined
            ) {

                product.specs =
                    String(
                        req.body.specs
                    ).trim();

            }


            // ============================================
            // AVAILABILITY
            // ============================================

            if (
                req.body.available !== undefined
            ) {

                product.available =
                    req.body.available === true ||
                    req.body.available === "true";

            }


            // ============================================
            // NEW IMAGE
            // ============================================

            if (req.file) {

                const oldImage =
                    product.image;


                // Delete old image only when
                // it is a normal uploaded URL
                if (
                    typeof oldImage === "string" &&
                    oldImage.includes("/uploads/")
                ) {

                    deleteUploadedFile(
                        oldImage
                    );

                }


                product.image =
                    productImageUrl(
                        req,
                        req.file.filename
                    );

            }
            else {

                /*
                 * IMPORTANT:
                 *
                 * Some old Siva Dairy products
                 * contain image data as an object.
                 *
                 * We cannot keep that old object
                 * because the new website uses
                 * image URLs.
                 *
                 * If no new image was selected,
                 * convert the old invalid object
                 * into an empty image.
                 */

                if (
                    typeof product.image !== "string"
                ) {

                    product.image = "";

                }

            }


            await product.save();


            // ============================================
            // RETURN SAFE PRODUCT
            // ============================================

            const savedProduct =
                product.toObject();

            savedProduct.imageUrl =
                typeof savedProduct.image === "string"
                    ? savedProduct.image
                    : "";


            res.json({

                success: true,

                message:
                    "Product updated successfully.",

                product:
                    savedProduct

            });

        }
        catch (error) {

            if (req.file) {

                deleteUploadedFile(
                    `/uploads/${req.file.filename}`
                );

            }

            console.error(
                "EDIT PRODUCT ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to update product.",

                error:
                    error.message

            });

        }

    }
);

// ------------------------------------------------------------
// CHANGE STOCK
// PATCH /api/products/:id/stock
// ------------------------------------------------------------

app.patch(
    "/api/products/:id/stock",
    async (req, res) => {

        try {

            const {
                available
            } = req.body;


            const product =
                await Product.findById(
                    req.params.id
                );


            if (!product) {

                return res.status(404).json({

                    message:
                        "Product not found."

                });

            }


            product.available =
                Boolean(available);


            await product.save();


            res.json({

                message:
                    product.available
                    ?
                    "Product marked as available."
                    :
                    "Product marked as out of stock.",

                product

            });

        }
        catch (error) {

            console.error(
                "STOCK ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to update stock.",

                error:
                    error.message

            });

        }

    }
);


// ------------------------------------------------------------
// ⭐ REMOVE PRODUCT
// DELETE /api/products/:id
// ------------------------------------------------------------

app.delete(
    "/api/products/:id",
    async (req, res) => {

        try {

            const product =
                await Product.findById(
                    req.params.id
                );


            if (!product) {

                return res.status(404).json({

                    message:
                        "Product not found."

                });

            }


            // Save image before deleting
            const image =
                product.image;


            // Delete MongoDB product
            await Product.findByIdAndDelete(
                req.params.id
            );


            // Delete uploaded image
            if (
                image &&
                image.includes("/uploads/")
            ) {

                deleteUploadedFile(
                    image
                );

            }


            res.json({

                success: true,

                message:
                    "Product removed successfully."

            });

        }
        catch (error) {

            console.error(
                "DELETE PRODUCT ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to remove product.",

                error:
                    error.message

            });

        }

    }
);


// ============================================================
// CUSTOMERS
// ============================================================


// ------------------------------------------------------------
// GET CUSTOMERS
// GET /api/customers
// ------------------------------------------------------------

app.get(
    "/api/customers",
    async (req, res) => {

        try {

            const customers =
                await Customer
                    .find()
                    .sort({
                        createdAt: -1
                    });

            res.json(customers);

        }
        catch (error) {

            console.error(
                "GET CUSTOMERS ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to load customers.",

                error:
                    error.message

            });

        }

    }
);


// ------------------------------------------------------------
// GET CUSTOMER BY PHONE
// ------------------------------------------------------------

app.get(
    "/api/customers/:phone",
    async (req, res) => {

        try {

            const customer =
                await Customer.findOne({

                    phone:
                        req.params.phone

                });


            if (!customer) {

                return res.status(404).json({

                    message:
                        "Customer not found."

                });

            }


            res.json(customer);

        }
        catch (error) {

            res.status(500).json({

                message:
                    "Failed to find customer.",

                error:
                    error.message

            });

        }

    }
);


// ------------------------------------------------------------
// CREATE / REGISTER CUSTOMER
// POST /api/customers
// ------------------------------------------------------------

app.post(
    "/api/customers",
    async (req, res) => {

        try {

            const {
                name,
                phone,
                address,
                landmark
            } = req.body;


            if (!name || !phone) {

                return res.status(400).json({

                    message:
                        "Name and phone are required."

                });

            }


            let customer =
                await Customer.findOne({
                    phone
                });


            if (customer) {

                customer.name =
                    name;

                customer.address =
                    address ||
                    customer.address ||
                    "";

                customer.landmark =
                    landmark ||
                    customer.landmark ||
                    "";


                await customer.save();


                return res.json({

                    message:
                        "Customer updated.",

                    customer

                });

            }


            customer =
                new Customer({

                    name,

                    phone,

                    address:
                        address || "",

                    landmark:
                        landmark || ""

                });


            await customer.save();


            res.status(201).json({

                message:
                    "Customer registered successfully.",

                customer

            });

        }
        catch (error) {

            console.error(
                "CUSTOMER CREATE ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to save customer.",

                error:
                    error.message

            });

        }

    }
);


// ------------------------------------------------------------
// GET CUSTOMER ORDERS
// GET /api/orders/customer/:phone
// ------------------------------------------------------------

app.get(
    "/api/orders/customer/:phone",
    async (req, res) => {

        try {

            const phone = String(
                req.params.phone || ""
            ).trim();

            if (!phone) {

                return res.status(400).json({
                    message: "Customer phone is required."
                });

            }

            const orders =
                await Order
                    .find({
                        phone: phone
                    })
                    .sort({
                        createdAt: -1
                    });

            res.json(orders);

        }
        catch (error) {

            console.error(
                "GET CUSTOMER ORDERS ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to load customer orders.",

                error:
                    error.message

            });

        }

    }
);


// ------------------------------------------------------------
// GET ORDERS
// GET /api/orders
// ------------------------------------------------------------

app.get(
    "/api/orders",
    async (req, res) => {

        try {

            const orders =
                await Order
                    .find()
                    .sort({
                        createdAt: -1
                    });

            res.json(orders);

        }
        catch (error) {

            console.error(
                "GET ORDERS ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to load orders.",

                error:
                    error.message

            });

        }

    }
);


// ------------------------------------------------------------
// CREATE ORDER
// POST /api/orders
// ------------------------------------------------------------

app.post(
    "/api/orders",
    async (req, res) => {

        try {

            const order =
                new Order(req.body);


            await order.save();


            res.status(201).json({

                message:
                    "Order created successfully.",

                order

            });

        }
        catch (error) {

            console.error(
                "CREATE ORDER ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to create order.",

                error:
                    error.message

            });

        }

    }
);


// ------------------------------------------------------------
// UPDATE ORDER STATUS
// PUT /api/orders/:id
// ------------------------------------------------------------

app.put(
    "/api/orders/:id",
    async (req, res) => {

        try {

            const allowedStatuses = [

                "PAYMENT_PENDING",
                "CONFIRMED",
                "PREPARING",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
                "CANCELLED"

            ];


            const {
                status
            } = req.body;


            if (
                !allowedStatuses.includes(
                    status
                )
            ) {

                return res.status(400).json({

                    message:
                        "Invalid order status."

                });

            }


            const order =
                await Order.findByIdAndUpdate(

                    req.params.id,

                    {
                        $set: {
                            status
                        }
                    },

                    {
                        new: true
                    }

                );


            if (!order) {

                return res.status(404).json({

                    message:
                        "Order not found."

                });

            }


            res.json({

                message:
                    "Order status updated.",

                order

            });

        }
        catch (error) {

            console.error(
                "ORDER STATUS ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to update order status.",

                error:
                    error.message

            });

        }

    }
);

// ------------------------------------------------------------
// GET CUSTOMER SUBSCRIPTIONS
// GET /api/subscriptions/customer/:phone
// ------------------------------------------------------------

app.get(
    "/api/subscriptions/customer/:phone",
    async (req, res) => {

        try {

            const phone = String(
                req.params.phone || ""
            ).trim();

            if (!phone) {

                return res.status(400).json({
                    message: "Customer phone is required."
                });

            }

            const subscriptions =
                await Subscription
                    .find({
                        phone: phone
                    })
                    .sort({
                        createdAt: -1
                    });

            res.json(subscriptions);

        }
        catch (error) {

            console.error(
                "GET CUSTOMER SUBSCRIPTIONS ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to load customer subscriptions.",

                error:
                    error.message

            });

        }

    }
);


// ------------------------------------------------------------
// GET ALL SUBSCRIPTIONS
// GET /api/subscriptions
// ------------------------------------------------------------

app.get(
    "/api/subscriptions",
    async (req, res) => {

        try {

            const subscriptions =
                await Subscription
                    .find()
                    .sort({
                        createdAt: -1
                    });


            res.json(
                subscriptions
            );

        }
        catch (error) {

            console.error(
                "GET SUBSCRIPTIONS ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to load subscriptions.",

                error:
                    error.message

            });

        }

    }
);


// ------------------------------------------------------------
// GET SUBSCRIPTION STATS
// GET /api/subscriptions/stats/summary
// ------------------------------------------------------------

app.get(
    "/api/subscriptions/stats/summary",
    async (req, res) => {

        try {

            const total =
                await Subscription.countDocuments();


            const active =
                await Subscription.countDocuments({
                    status: "ACTIVE"
                });


            const paused =
                await Subscription.countDocuments({
                    status: "PAUSED"
                });


            const cancelled =
                await Subscription.countDocuments({
                    status: "CANCELLED"
                });


            const completed =
                await Subscription.countDocuments({
                    status: "COMPLETED"
                });


            const all =
                await Subscription.find(
                    {},
                    {
                        skippedDates: 1
                    }
                );


            let skippedDays = 0;


            all.forEach(subscription => {

                if (
                    Array.isArray(
                        subscription.skippedDates
                    )
                ) {

                    skippedDays +=
                        subscription
                            .skippedDates
                            .length;

                }

            });


            res.json({

                total,

                active,

                paused,

                cancelled,

                completed,

                skippedDays

            });

        }
        catch (error) {

            console.error(
                "SUBSCRIPTION STATS ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to load subscription statistics.",

                error:
                    error.message

            });

        }

    }
);


// ------------------------------------------------------------
// GET ONE SUBSCRIPTION
// ------------------------------------------------------------

app.get(
    "/api/subscriptions/:id",
    async (req, res) => {

        try {

            const subscription =
                await Subscription.findById(
                    req.params.id
                );


            if (!subscription) {

                return res.status(404).json({

                    message:
                        "Subscription not found."

                });

            }


            res.json(
                subscription
            );

        }
        catch (error) {

            res.status(500).json({

                message:
                    "Failed to load subscription.",

                error:
                    error.message

            });

        }

    }
);


// ------------------------------------------------------------
// CREATE SUBSCRIPTION
// POST /api/subscriptions
// ------------------------------------------------------------

app.post(
    "/api/subscriptions",
    async (req, res) => {

        try {

            const body =
                req.body;


            if (
                !body.customerName ||
                !body.phone ||
                !body.productName
            ) {

                return res.status(400).json({

                    message:
                        "Customer name, phone and product are required."

                });

            }


            const quantity =
                Number(
                    body.quantity || 1
                );


            const normalPrice =
                Number(
                    body.normalPrice ??
                    body.pricePerUnit ??
                    0
                );


            /*
             * Siva Dairy subscription discount
             * ₹5 per unit.
             */

            const discount = 5;


            const subscriptionRate =
                Math.max(
                    0,
                    normalPrice - discount
                );


            const dailyAmount =
                quantity *
                subscriptionRate;


            const monthlyAmount =
                dailyAmount *
                30;


            const subscription =
                new Subscription({

                    customerName:
                        body.customerName,

                    phone:
                        body.phone,

                    address:
                        body.address || "",

                    landmark:
                        body.landmark || "",

                    productName:
                        body.productName,

                    productId:
                        mongoose.Types.ObjectId.isValid(
                            body.productId
                        )
                        ?
                        body.productId
                        :
                        undefined,

                    quantity,

                    unit:
                        body.unit ||
                        "Litre",

                    normalPrice,

                    pricePerUnit:
                        subscriptionRate,

                    deliveryDays:
                        Array.isArray(
                            body.deliveryDays
                        )
                        ?
                        body.deliveryDays
                        :
                        [],

                    startDate:
                        body.startDate
                        ?
                        new Date(
                            body.startDate
                        )
                        :
                        new Date(),

                    deliverySlot:
                        body.deliverySlot ||
                        "Morning",

                    paymentMethod:
                        body.paymentMethod ||
                        "COD",

                    monthlyAmount,

                    status:
                        "ACTIVE",

                    skippedDates:
                        [],

                    notes:
                        body.notes ||
                        ""

                });


            await subscription.save();


            res.status(201).json({

                message:
                    "Daily milk subscription created successfully.",

                subscription

            });

        }
        catch (error) {

            console.error(
                "CREATE SUBSCRIPTION ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to create subscription.",

                error:
                    error.message

            });

        }

    }
);


// ------------------------------------------------------------
// EDIT SUBSCRIPTION
// PUT /api/subscriptions/:id
// ------------------------------------------------------------

app.put(
    "/api/subscriptions/:id",
    async (req, res) => {

        try {

            const subscription =
                await Subscription.findById(
                    req.params.id
                );


            if (!subscription) {

                return res.status(404).json({

                    message:
                        "Subscription not found."

                });

            }


            const body =
                req.body;


            const quantity =
                Number(
                    body.quantity ||
                    subscription.quantity ||
                    1
                );


            const normalPrice =
                Number(
                    body.normalPrice ??
                    body.pricePerUnit ??
                    subscription.normalPrice ??
                    0
                );


            const discount = 5;


            const subscriptionRate =
                Math.max(
                    0,
                    normalPrice - discount
                );


            const monthlyAmount =
                quantity *
                subscriptionRate *
                30;


            subscription.customerName =
                body.customerName ??
                subscription.customerName;


            subscription.phone =
                body.phone ??
                subscription.phone;


            subscription.address =
                body.address ??
                subscription.address;


            subscription.landmark =
                body.landmark ??
                subscription.landmark;


            subscription.productName =
                body.productName ??
                subscription.productName;


            if (
                body.productId &&
                mongoose.Types.ObjectId.isValid(
                    body.productId
                )
            ) {

                subscription.productId =
                    body.productId;

            }


            subscription.quantity =
                quantity;


            subscription.unit =
                body.unit ??
                subscription.unit ??
                "Litre";


            subscription.normalPrice =
                normalPrice;


            subscription.pricePerUnit =
                subscriptionRate;


            if (
                Array.isArray(
                    body.deliveryDays
                )
            ) {

                subscription.deliveryDays =
                    body.deliveryDays;

            }


            if (body.startDate) {

                subscription.startDate =
                    new Date(
                        body.startDate
                    );

            }


            subscription.deliverySlot =
                body.deliverySlot ??
                subscription.deliverySlot;


            subscription.paymentMethod =
                body.paymentMethod ??
                subscription.paymentMethod;


            subscription.monthlyAmount =
                monthlyAmount;


            subscription.notes =
                body.notes ??
                subscription.notes;


            await subscription.save();


            res.json({

                message:
                    "Subscription updated successfully.",

                subscription

            });

        }
        catch (error) {

            console.error(
                "EDIT SUBSCRIPTION ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to update subscription.",

                error:
                    error.message

            });

        }

    }
);


// ------------------------------------------------------------
// UPDATE SUBSCRIPTION STATUS
// PATCH /api/subscriptions/:id/status
// ------------------------------------------------------------

app.patch(
    "/api/subscriptions/:id/status",
    async (req, res) => {

        try {

            const allowedStatuses = [

                "ACTIVE",
                "PAUSED",
                "CANCELLED",
                "COMPLETED"

            ];


            const {
                status
            } = req.body;


            if (
                !allowedStatuses.includes(
                    status
                )
            ) {

                return res.status(400).json({

                    message:
                        "Invalid subscription status."

                });

            }


            const subscription =
                await Subscription.findByIdAndUpdate(

                    req.params.id,

                    {
                        $set: {
                            status
                        }
                    },

                    {
                        new: true
                    }

                );


            if (!subscription) {

                return res.status(404).json({

                    message:
                        "Subscription not found."

                });

            }


            res.json({

                message:
                    "Subscription status updated.",

                subscription

            });

        }
        catch (error) {

            console.error(
                "SUBSCRIPTION STATUS ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to update subscription status.",

                error:
                    error.message

            });

        }

    }
);


// ------------------------------------------------------------
// SKIP MILK
// PATCH /api/subscriptions/:id/skip
// ------------------------------------------------------------

app.patch(
    "/api/subscriptions/:id/skip",
    async (req, res) => {

        try {

            const {
                date
            } = req.body;


            if (!date) {

                return res.status(400).json({

                    message:
                        "Skip date is required."

                });

            }


            const subscription =
                await Subscription.findById(
                    req.params.id
                );


            if (!subscription) {

                return res.status(404).json({

                    message:
                        "Subscription not found."

                });

            }


            if (
                !Array.isArray(
                    subscription.skippedDates
                )
            ) {

                subscription.skippedDates =
                    [];

            }


            if (
                !subscription
                    .skippedDates
                    .includes(date)
            ) {

                subscription
                    .skippedDates
                    .push(date);

            }


            await subscription.save();


            res.json({

                message:
                    `Milk skipped for ${date}.`,

                subscription

            });

        }
        catch (error) {

            console.error(
                "SKIP MILK ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to skip milk.",

                error:
                    error.message

            });

        }

    }
);


// ------------------------------------------------------------
// DELETE SUBSCRIPTION
// DELETE /api/subscriptions/:id
// ------------------------------------------------------------

app.delete(
    "/api/subscriptions/:id",
    async (req, res) => {

        try {

            const subscription =
                await Subscription.findByIdAndDelete(
                    req.params.id
                );


            if (!subscription) {

                return res.status(404).json({

                    message:
                        "Subscription not found."

                });

            }


            res.json({

                success: true,

                message:
                    "Subscription deleted."

            });

        }
        catch (error) {

            console.error(
                "DELETE SUBSCRIPTION ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to delete subscription.",

                error:
                    error.message

            });

        }

    }
);


// ============================================================
// MULTER ERROR HANDLER
// ============================================================

app.use(
    (error, req, res, next) => {

        if (
            error instanceof
            multer.MulterError
        ) {

            return res.status(400).json({

                message:
                    `Upload error: ${error.message}`

            });

        }


        if (
            error &&
            error.message ===
            "Only image files are allowed."
        ) {

            return res.status(400).json({

                message:
                    error.message

            });

        }


        console.error(
            "SERVER ERROR:",
            error
        );


        res.status(500).json({

            message:
                "Internal server error.",

            error:
                error.message

        });

    }
);


// ============================================================
// 404 API HANDLER
// ============================================================

app.use(
    "/api",
    (req, res) => {

        res.status(404).json({

            message:
                "API endpoint not found."

        });

    }
);


module.exports = app;
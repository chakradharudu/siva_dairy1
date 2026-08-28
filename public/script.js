const CART_STORAGE_KEY = "sivaDairyCartV1";
const WHATSAPP_NUMBER = "919652310956";

let cart = loadCart();
let productsCache = [];

// ======================================================
// CART
// ======================================================

function loadCart() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(CART_STORAGE_KEY) || "[]"
        );

        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        return [];
    }
}

function saveCart() {
    localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
    );
}

// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(value) {
    return String(value ?? "").replace(
        /[&<>'"]/g,
        function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "'": "&#39;",
                '"': "&quot;"
            }[char];
        }
    );
}

// ======================================================
// LOAD PRODUCTS FROM SERVER / MONGODB
// ======================================================

async function getProducts() {
    try {
        const response = await fetch("/api/products", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(
                "Server returned " + response.status
            );
        }

        const products = await response.json();

        if (!Array.isArray(products)) {
            throw new Error("Invalid product data.");
        }

        productsCache = products;

        return products;

    } catch (error) {

        console.error(
            "Failed to load products:",
            error
        );

        return [];
    }
}

// ======================================================
// QUANTITY OPTIONS
// ======================================================

function quantityOptions(unit) {

    if (/litre|liter/i.test(unit)) {

        return [
            { v: 0.5, l: "500 ml" },
            { v: 1, l: "1 Litre" },
            { v: 2, l: "2 Litres" },
            { v: 5, l: "5 Litres" }
        ];

    }

    if (/kg/i.test(unit)) {

        return [
            { v: 0.1, l: "100 g" },
            { v: 0.25, l: "250 g" },
            { v: 0.5, l: "500 g" },
            { v: 1, l: "1 Kg" }
        ];

    }

    return [
        {
            v: 1,
            l: `1 ${unit}`
        },
        {
            v: 2,
            l: `2 ${unit}s`
        },
        {
            v: 5,
            l: `5 ${unit}s`
        }
    ];
}

// ======================================================
// PRODUCT IMAGE
// ======================================================
function getProductImage(product) {

    if (!product) {
        return null;
    }

    const productId =
        product.id || product._id;

    const storedImage =
        product.imageUrl ||
        product.image;

    if (storedImage && String(storedImage).trim() !== "") {

        const image = String(storedImage).trim();
        const uploadMarker = "/uploads/";
        const uploadIndex = image.indexOf(uploadMarker);

        if (uploadIndex >= 0 && productId) {
            return `/api/products/${encodeURIComponent(productId)}/image`;
        }

        if (image.startsWith("/")) {
            return image;
        }

        if (
            image.startsWith("http://") ||
            image.startsWith("https://")
        ) {
            return image;
        }
    }

    return null;
}
// ======================================================
// RENDER CUSTOMER PRODUCTS
// ======================================================

async function renderProductGrid() {

    const grid =
        document.getElementById("productGrid");

    if (!grid) return;

    grid.innerHTML = `
        <div class="empty-cart">
            <strong>Loading products...</strong>
            <span>Please wait.</span>
        </div>
    `;

    const products = await getProducts();

    if (!products.length) {

        grid.innerHTML = `
            <div class="empty-cart">
                <strong>No products available.</strong>
                <span>Please check that the Siva Dairy server is running.</span>
            </div>
        `;

        return;
    }

    grid.innerHTML = products.map(function (product) {

        const options =
            quantityOptions(product.unit)
                .map(function (option) {

                    const amount =
                        option.v * Number(product.price);

                    return `
                        <option value="${option.v}">
                            ${option.l} - ₹${amount.toFixed(0)}
                        </option>
                    `;
                })
                .join("");

        const image =
            getProductImage(product);

        let photoHTML;

        if (image) {

            photoHTML = `
                <img
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(product.name)}"
                    class="real-product-image"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                >

                <span
                    class="product-fallback-icon"
                    style="display:none;"
                >
                    ${escapeHtml(product.icon || "🥛")}
                </span>
            `;

        } else {

            photoHTML = `
                <span class="product-fallback-icon">
                    ${escapeHtml(product.icon || "🥛")}
                </span>
            `;
        }

        const stockMessage =
            product.available
                ? ""
                : `
                    <span class="stock-message">
                        🔴 Currently Out of Stock
                    </span>
                `;

        return `
            <article
                class="product-card ${
                    product.available
                        ? ""
                        : "out-of-stock"
                }"
                data-product-id="${escapeHtml(
                    product.id || product._id
                )}"
            >

                <div class="product-photo milk-photo">

                    ${photoHTML}

                </div>

                <h3>
                    ${escapeHtml(product.name)}
                </h3>

                <div class="price">

                    ₹${Number(product.price).toFixed(2)}

                    <small>
                        / ${escapeHtml(product.unit)}
                    </small>

                    ${
                        product.specs
                            ? `
                                <span class="specs">
                                    ${escapeHtml(
                                        product.specs
                                    )}
                                </span>
                            `
                            : ""
                    }

                </div>

                ${stockMessage}

                <label>
                    Quantity

                    <select
                        class="qty"
                        ${
                            product.available
                                ? ""
                                : "disabled"
                        }
                    >
                        ${options}
                    </select>
                </label>

                <button
                    class="add-btn"
                    type="button"
                    onclick="addSelected(this)"
                    ${
                        product.available
                            ? ""
                            : "disabled"
                    }
                >
                    ${
                        product.available
                            ? "🛒 Add to Cart"
                            : "🔴 Out of Stock"
                    }
                </button>

            </article>
        `;

    }).join("");
}

// ======================================================
// ADD TO CART
// ======================================================

async function addSelected(button) {
          cart = loadCart();

    const card =
        button.closest(".product-card");

    if (!card) return;

    const productId =
        card.dataset.productId;

    let product =
        productsCache.find(function (item) {

            return String(
                item.id || item._id
            ) === String(productId);

        });

    if (!product) {

        const products =
            await getProducts();

        product =
            products.find(function (item) {

                return String(
                    item.id || item._id
                ) === String(productId);

            });
    }

    if (!product) {

        alert("Product not found.");
        return;
    }

    if (!product.available) {

        alert(
            "This product is currently out of stock."
        );

        return;
    }

    const select =
        card.querySelector(".qty");

    if (!select) return;

    const quantity =
        Number(select.value);

    const price =
        Number(product.price);

    const total =
        quantity * price;

    const existing =
        cart.find(function (item) {

            return (
                item.productId ===
                (product.id || product._id)
            );

        });

    if (existing) {

        existing.quantity += quantity;

        existing.total =
            existing.quantity *
            existing.price;

    } else {

        cart.push({

            product:
                product.name,

            quantity:
                quantity,

            price:
                price,

            total:
                total,

            icon:
                product.icon || "🥛",

            unit:
                product.unit || "item",

            productId:
                product.id || product._id,

            imageUrl:
                 getProductImage(product),

            image:
               getProductImage(product)
        });
    }

    saveCart();

    renderCart();

    const oldText =
        button.innerHTML;

    button.textContent =
        "✓ Added to Cart";

    setTimeout(function () {

        button.innerHTML =
            oldText;

    }, 900);
}

// ======================================================
// DISPLAY QUANTITY
// ======================================================

function displayQuantity(quantity, unit) {

    if (
        /litre|liter/i.test(unit)
    ) {

        if (quantity < 1) {

            return `${quantity * 1000} ml`;

        }

        return `${quantity} Litre${
            quantity === 1 ? "" : "s"
        }`;
    }

    if (/kg/i.test(unit)) {

        if (quantity < 1) {

            return `${quantity * 1000} g`;

        }

        return `${quantity} Kg`;
    }

    return `${quantity} ${unit || "unit"}`;
}

// ======================================================
// CART RENDER
// ======================================================
function renderCart() {

    const box =
        document.getElementById("cartItems");

    const totalBox =
        document.getElementById("grandTotal");

    const count =
        document.getElementById("cartCount");

    const mobileCount =
        document.getElementById("mobileCartCount");

    const mobileTotal =
        document.getElementById("mobileCartTotal");


    if (!box || !totalBox || !count) {
        return;
    }


    // ==================================================
    // EMPTY CART
    // ==================================================

    if (!cart.length) {

        box.innerHTML = `
            <div class="empty-cart">

                🛒

                <strong>
                    Your cart is empty.
                </strong>

                <span>
                    Add products above to start your order.
                </span>

            </div>
        `;

        totalBox.textContent = "₹0.00";

        count.textContent = "0 items";


        if (mobileCount) {
            mobileCount.textContent = "0 items";
        }


        if (mobileTotal) {
            mobileTotal.textContent = "₹0.00";
        }

        return;
    }


    // ==================================================
    // CART ITEMS
    // ==================================================

    let grand = 0;


    box.innerHTML =
        cart.map(function (item, index) {

            grand += Number(item.total) || 0;


            // ------------------------------------------
            // GET IMAGE
            // ------------------------------------------

            let image =
                item.image ||
                item.imageUrl ||
                null;


            // ------------------------------------------
            // IMAGE HTML
            // ------------------------------------------

            let imageHTML;


            if (image) {

                imageHTML = `
                    <img
                        src="${escapeHtml(image)}"
                        alt="${escapeHtml(item.product)}"
                        class="cart-product-image"
                        onerror="
                            this.style.display='none';
                            this.nextElementSibling.style.display='flex';
                        "
                    >

                    <span
                        class="cart-product-fallback"
                        style="display:none;"
                    >
                        ${escapeHtml(item.icon || "🥛")}
                    </span>
                `;

            } else {

                imageHTML = `
                    <span class="cart-product-fallback">
                        ${escapeHtml(item.icon || "🥛")}
                    </span>
                `;

            }


            // ------------------------------------------
            // CART ROW
            // ------------------------------------------

            return `
                <div class="cart-row">

                    <!-- PRODUCT IMAGE -->

                    <div class="cart-product-image-box">
                        ${imageHTML}
                    </div>


                    <!-- PRODUCT NAME -->

                    <div class="cart-product-details">

                        <strong>
                            ${escapeHtml(item.product)}
                        </strong>

                        <small>
                            ₹${Number(item.price).toFixed(2)}
                            / ${escapeHtml(item.unit || "")}
                        </small>

                    </div>


                    <!-- QUANTITY -->

                    <div class="cart-quantity">

                        ${displayQuantity(
                            item.quantity,
                            item.unit
                        )}

                    </div>


                    <!-- TOTAL -->

                    <div class="cart-price">

                        ₹${Number(item.total).toFixed(2)}

                    </div>


                    <!-- REMOVE -->

                    <div>

                        <button
                            class="remove"
                            type="button"
                            data-remove="${index}"
                        >
                            ×
                        </button>

                    </div>

                </div>
            `;

        }).join("");


    // ==================================================
    // TOTAL
    // ==================================================

    totalBox.textContent =
        `₹${grand.toFixed(2)}`;


    const label =
        `${cart.length} ${
            cart.length === 1
                ? "item"
                : "items"
        }`;


    count.textContent =
        label;


    if (mobileCount) {

        mobileCount.textContent =
            label;

    }


    if (mobileTotal) {

        mobileTotal.textContent =
            `₹${grand.toFixed(2)}`;

    }


    // ==================================================
    // REMOVE BUTTON
    // ==================================================

    box
        .querySelectorAll("[data-remove]")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    removeItem(
                        Number(
                            button.dataset.remove
                        )
                    );

                }
            );

        });

}

// ======================================================
// REMOVE CART ITEM
// ======================================================

function removeItem(index) {

    cart.splice(index, 1);

    saveCart();

    renderCart();
}

// ======================================================
// WHATSAPP ORDER
// ======================================================

function sendOrder() {

    if (!cart.length) {

        alert(
            "Please add at least one product."
        );

        return;
    }

    const name =
        document
            .getElementById(
                "customerName"
            )
            ?.value
            .trim();

    const phone =
        document
            .getElementById(
                "customerPhone"
            )
            ?.value
            .trim();

    const address =
        document
            .getElementById(
                "customerAddress"
            )
            ?.value
            .trim();

    if (
        !name ||
        !phone ||
        !address
    ) {

        alert(
            "Please enter your name, phone number and delivery address."
        );

        return;
    }

    let total = 0;

    const lines = [
        "*NEW ORDER - SIVA DAIRY*",
        "",
        `Customer: ${name}`,
        `Phone: ${phone}`,
        `Address: ${address}`,
        "",
        "*ORDER DETAILS*"
    ];

    cart.forEach(function (item, index) {

        total +=
            Number(item.total);

        lines.push(
            `${index + 1}. ${
                item.product
            } - ${
                displayQuantity(
                    item.quantity,
                    item.unit
                )
            } - ₹${
                Number(
                    item.total
                ).toFixed(2)
            }`
        );

    });

    lines.push(
        "",
        `*GRAND TOTAL: ₹${total.toFixed(2)}*`,
        "",
        "Thank you for ordering from Siva Dairy!"
    );

    const whatsappURL =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${
            encodeURIComponent(
                lines.join("\n")
            )
        }`;

    window.open(
        whatsappURL,
        "_blank"
    );
}

// ======================================================
// REVIEW
// ======================================================

function sendReview() {

    const name =
        document
            .getElementById(
                "reviewName"
            )
            ?.value
            .trim();

    const rating =
        document
            .getElementById(
                "reviewRating"
            )
            ?.value || 5;

    const text =
        document
            .getElementById(
                "reviewText"
            )
            ?.value
            .trim();

    if (!name || !text) {

        alert(
            "Please enter your name and feedback."
        );

        return;
    }

    const stars =
        "★".repeat(
            Number(rating)
        ) +
        "☆".repeat(
            5 - Number(rating)
        );

    const lines = [
        "SIVA DAIRY CUSTOMER FEEDBACK",
        "",
        `Name: ${name}`,
        `Rating: ${stars}`,
        `Feedback: ${text}`
    ];

    const whatsappURL =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${
            encodeURIComponent(
                lines.join("\n")
            )
        }`;

    window.open(
        whatsappURL,
        "_blank"
    );
}

// ======================================================
// MOBILE MENU
// ======================================================

function openMenu() {

    const menu =
        document.getElementById(
            "mobileMenu"
        );

    const button =
        document.getElementById(
            "menuToggle"
        );

    if (!menu) return;

    const open =
        menu.classList.toggle(
            "show"
        );

    if (button) {

        button.setAttribute(
            "aria-expanded",
            String(open)
        );
    }
}

function closeMenu() {

    const menu =
        document.getElementById(
            "mobileMenu"
        );

    const button =
        document.getElementById(
            "menuToggle"
        );

    if (menu) {

        menu.classList.remove(
            "show"
        );
    }

    if (button) {

        button.setAttribute(
            "aria-expanded",
            "false"
        );
    }
}

// ======================================================
// CUSTOMER ACCOUNT
// ======================================================

const ACCOUNT_STORAGE_KEY =
    "sivaDairyOtpAccountsV1";

const CURRENT_USER_KEY =
    "sivaDairyCurrentPhoneV1";

const ACTIVE_CUSTOMERS_KEY =
    "sivaDairyActiveCustomersV1";

let otpSession = {
    phone: null,
    code: null,
    mode: null
};

// ======================================================
// ACCOUNTS
// ======================================================

function getAccounts() {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    ACCOUNT_STORAGE_KEY
                ) || "[]"
            );

        return Array.isArray(saved)
            ? saved
            : [];

    } catch (error) {

        return [];
    }
}

function saveAccounts(accounts) {

    localStorage.setItem(
        ACCOUNT_STORAGE_KEY,
        JSON.stringify(accounts)
    );
}

function normalizePhone(phone) {

    return String(phone)
        .replace(/\D/g, "")
        .slice(-10);
}

function validPhone(phone) {

    return /^[6-9]\d{9}$/.test(
        normalizePhone(phone)
    );
}

function getCurrentUser() {

    const phone =
        localStorage.getItem(
            CURRENT_USER_KEY
        );

    if (!phone) return null;

    return getAccounts().find(
        function (account) {

            return (
                account.phone ===
                phone
            );
        }
    ) || null;
}

// ======================================================
// ACTIVE CUSTOMER
// ======================================================

function markCustomerOnline() {

    const user =
        getCurrentUser();

    if (!user) return;

    let active = {};

    try {

        active =
            JSON.parse(
                localStorage.getItem(
                    ACTIVE_CUSTOMERS_KEY
                ) || "{}"
            );

    } catch (error) {}

    active[user.phone] = {

        name:
            user.name ||
            "Customer",

        lastSeen:
            Date.now()
    };

    localStorage.setItem(
        ACTIVE_CUSTOMERS_KEY,
        JSON.stringify(active)
    );
}

function markCustomerOffline() {

    const user =
        getCurrentUser();

    if (!user) return;

    let active = {};

    try {

        active =
            JSON.parse(
                localStorage.getItem(
                    ACTIVE_CUSTOMERS_KEY
                ) || "{}"
            );

    } catch (error) {}

    delete active[user.phone];

    localStorage.setItem(
        ACTIVE_CUSTOMERS_KEY,
        JSON.stringify(active)
    );
}

function setCurrentUser(phone) {

    if (phone) {

        localStorage.setItem(
            CURRENT_USER_KEY,
            normalizePhone(phone)
        );

        markCustomerOnline();

    } else {

        markCustomerOffline();

        localStorage.removeItem(
            CURRENT_USER_KEY
        );
    }

    updateAccountUI();
}

// ======================================================
// ACCOUNT MODAL
// ======================================================

function openAccount() {

    const modal =
        document.getElementById(
            "accountModal"
        );

    if (!modal) return;

    modal.classList.add("show");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    const user =
        getCurrentUser();

    if (user) {

        showProfile();

    } else {

        showAuth("login");
    }
}

function closeAccount() {

    const modal =
        document.getElementById(
            "accountModal"
        );

    if (modal) {

        modal.classList.remove(
            "show"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );
    }
}

function showAuth(tab = "login") {

    document
        .getElementById(
            "authView"
        )
        ?.classList.remove(
            "hidden"
        );

    document
        .getElementById(
            "profileView"
        )
        ?.classList.add(
            "hidden"
        );

    document
        .getElementById(
            "profileEditView"
        )
        ?.classList.add(
            "hidden"
        );

    document
        .querySelectorAll(
            ".auth-tab"
        )
        .forEach(
            function (button) {

                button.classList.toggle(
                    "active",
                    button.dataset.authTab ===
                    tab
                );

            }
        );

    document
        .getElementById(
            "loginPanel"
        )
        ?.classList.toggle(
            "hidden",
            tab !== "login"
        );

    document
        .getElementById(
            "registerPanel"
        )
        ?.classList.toggle(
            "hidden",
            tab !== "register"
        );

    resetOtpPanels();
}

function resetOtpPanels() {

    [
        "loginOtpStep",
        "registerOtpStep",
        "profileSetupForm"
    ].forEach(
        function (id) {

            document
                .getElementById(id)
                ?.classList.add(
                    "hidden"
                );

        }
    );

    [
        "loginOtp",
        "registerOtp"
    ].forEach(
        function (id) {

            const element =
                document.getElementById(id);

            if (element) {

                element.value = "";
            }
        }
    );

    otpSession = {
        phone: null,
        code: null,
        mode: null
    };
}

// ======================================================
// OTP
// ======================================================

function generateDemoOtp() {

    return String(
        Math.floor(
            100000 +
            Math.random() *
            900000
        )
    );
}

function startOtp(
    phone,
    mode
) {

    otpSession = {

        phone:
            phone,

        code:
            generateDemoOtp(),

        mode:
            mode
    };

    const demoId =
        mode === "login"
            ? "loginDemoOtp"
            : "registerDemoOtp";

    const stepId =
        mode === "login"
            ? "loginOtpStep"
            : "registerOtpStep";

    const demo =
        document.getElementById(
            demoId
        );

    if (demo) {

        demo.textContent =
            `Demo OTP: ${otpSession.code}`;
    }

    document
        .getElementById(stepId)
        ?.classList.remove(
            "hidden"
        );

    const input =
        document.getElementById(
            mode === "login"
                ? "loginOtp"
                : "registerOtp"
        );

    input?.focus();
}

// ======================================================
// PROFILE
// ======================================================

function showProfile() {

    const user =
        getCurrentUser();

    if (!user) {

        showAuth("login");

        return;
    }

    document
        .getElementById(
            "authView"
        )
        ?.classList.add(
            "hidden"
        );

    document
        .getElementById(
            "profileView"
        )
        ?.classList.remove(
            "hidden"
        );

    document
        .getElementById(
            "profileEditView"
        )
        ?.classList.add(
            "hidden"
        );

    document.getElementById(
        "profileName"
    ).textContent =
        user.name || "Customer";

    document.getElementById(
        "profilePhone"
    ).textContent =
        user.phone || "—";

    document.getElementById(
        "profileEmail"
    ).textContent =
        user.email ||
        "Not added";

    document.getElementById(
        "profileAddress"
    ).textContent =
        user.address ||
        "—";

    document.getElementById(
        "profileTitle"
    ).textContent =
        user.name ||
        "Customer Profile";

    document.getElementById(
        "profileAvatar"
    ).textContent =
        (
            user.name ||
            "S"
        )
            .charAt(0)
            .toUpperCase();
}

function updateAccountUI() {

    const user =
        getCurrentUser();

    const text =
        document.getElementById(
            "accountButtonText"
        );

    if (!text) return;

    text.textContent =
        user
            ? `Hi, ${
                (user.name || "Customer")
                    .split(" ")[0]
              }`
            : "Login / Register";
}

// ======================================================
// EDIT PROFILE
// ======================================================

function editProfile() {

    const user =
        getCurrentUser();

    if (!user) return;

    document
        .getElementById(
            "profileView"
        )
        ?.classList.add(
            "hidden"
        );

    document
        .getElementById(
            "profileEditView"
        )
        ?.classList.remove(
            "hidden"
        );

    document.getElementById(
        "editName"
    ).value =
        user.name || "";

    document.getElementById(
        "editPhone"
    ).value =
        user.phone || "";

    document.getElementById(
        "editEmail"
    ).value =
        user.email || "";

    document.getElementById(
        "editAddress"
    ).value =
        user.address || "";
}

async function saveProfile(e) {

    e.preventDefault();

    const current =
        getCurrentUser();

    if (!current) return;

    const name =
        document.getElementById(
            "editName"
        ).value.trim();

    const email =
        document.getElementById(
            "editEmail"
        ).value.trim()
        .toLowerCase();

    const address =
        document.getElementById(
            "editAddress"
        ).value.trim();

    if (!name || !address) {

        alert(
            "Please enter your name and delivery address."
        );

        return;
    }

    if (
        email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
        )
    ) {

        alert(
            "Please enter a valid email address."
        );

        return;
    }

    try {

        const response =
            await fetch(
                `/api/customers/${current.phone}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            name,
                            email,
                            address,
                            landmark:
                                current.landmark || ""
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "Profile update failed."
            );

            return;
        }

        const accounts =
            getAccounts();

        const index =
            accounts.findIndex(
                function (account) {

                    return (
                        account.phone ===
                        current.phone
                    );
                }
            );

        if (index >= 0) {

            accounts[index] =
                {
                    ...accounts[index],
                    ...data.customer
                };

            saveAccounts(accounts);
        }

        setCurrentUser(
            current.phone
        );

        showProfile();

        alert(
            "Profile updated successfully."
        );

    } catch (error) {

        console.error(
            "Profile update error:",
            error
        );

        alert(
            "Could not connect to the server."
        );
    }
}

// ======================================================
// LOGIN
// ======================================================

function requestLoginOtp(e) {

    e.preventDefault();

    const phone =
        normalizePhone(
            document.getElementById(
                "loginPhone"
            ).value
        );

    if (!validPhone(phone)) {

        alert(
            "Please enter a valid 10-digit mobile number."
        );

        return;
    }

    const user =
        getAccounts().find(
            function (account) {

                return (
                    account.phone ===
                    phone
                );
            }
        );

    if (!user) {

        alert(
            "This mobile number is not registered. Please choose New Customer."
        );

        showAuth("register");

        document.getElementById(
            "registerPhone"
        ).value = phone;

        return;
    }

    startOtp(
        phone,
        "login"
    );
}

function verifyLoginOtp() {

    const entered =
        document.getElementById(
            "loginOtp"
        )?.value.trim();

    if (
        !otpSession.code ||
        otpSession.mode !== "login"
    ) {

        alert(
            "Please request an OTP first."
        );

        return;
    }

    if (
        entered !==
        otpSession.code
    ) {

        alert(
            "Incorrect OTP. Please try again."
        );

        return;
    }

    setCurrentUser(
        otpSession.phone
    );

    document
        .getElementById(
            "loginForm"
        )
        ?.reset();

    resetOtpPanels();

    showProfile();
}

// ======================================================
// REGISTER
// ======================================================

function requestRegisterOtp(e) {

    e.preventDefault();

    const phone =
        normalizePhone(
            document.getElementById(
                "registerPhone"
            ).value
        );

    if (!validPhone(phone)) {

        alert(
            "Please enter a valid 10-digit mobile number."
        );

        return;
    }

    if (
        getAccounts().some(
            function (account) {

                return (
                    account.phone ===
                    phone
                );
            }
        )
    ) {

        alert(
            "This mobile number is already registered. Please use Login."
        );

        showAuth("login");

        document.getElementById(
            "loginPhone"
        ).value = phone;

        return;
    }

    startOtp(
        phone,
        "register"
    );
}

function verifyRegisterOtp() {

    const entered =
        document.getElementById(
            "registerOtp"
        )?.value.trim();

    if (
        !otpSession.code ||
        otpSession.mode !== "register"
    ) {

        alert(
            "Please request an OTP first."
        );

        return;
    }

    if (
        entered !==
        otpSession.code
    ) {

        alert(
            "Incorrect OTP. Please try again."
        );

        return;
    }

    document
        .getElementById(
            "registerOtpStep"
        )
        ?.classList.add(
            "hidden"
        );

    document
        .getElementById(
            "profileSetupForm"
        )
        ?.classList.remove(
            "hidden"
        );

    document.getElementById(
        "verifiedRegisterPhone"
    ).textContent =
        otpSession.phone;

    document.getElementById(
        "registerName"
    )?.focus();
}

// ======================================================
// COMPLETE REGISTRATION
// ======================================================

async function completeRegistration(e) {

    e.preventDefault();

    if (
        !otpSession.phone ||
        otpSession.mode !== "register"
    ) {

        alert(
            "Please verify your mobile number first."
        );

        return;
    }

    const name =
        document.getElementById(
            "registerName"
        ).value.trim();

    const email =
        document.getElementById(
            "registerEmail"
        ).value.trim()
        .toLowerCase();

    const address =
        document.getElementById(
            "registerAddress"
        ).value.trim();

    if (!name || !address) {

        alert(
            "Please enter your name and delivery address."
        );

        return;
    }

    if (
        email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
        )
    ) {

        alert(
            "Please enter a valid email address."
        );

        return;
    }

    try {

        const response =
            await fetch(
                "/api/customers",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            name,

                            phone:
                                otpSession.phone,

                            address,

                            landmark:
                                "",

                            email
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "Registration failed."
            );

            return;
        }

        const accounts =
            getAccounts();

        accounts.push({

            name:
                data.customer.name,

            phone:
                data.customer.phone,

            email:
                data.customer.email || "",

            address:
                data.customer.address,

            landmark:
                data.customer.landmark || "",

            createdAt:
                data.customer.createdAt
        });

        saveAccounts(accounts);

        setCurrentUser(
            data.customer.phone
        );

        document
            .getElementById(
                "registerForm"
            )
            ?.reset();

        document
            .getElementById(
                "profileSetupForm"
            )
            ?.reset();

        resetOtpPanels();

        showProfile();

        alert(
            "Registration successful! Your details have been saved."
        );

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        alert(
            "Could not connect to the server. Please make sure the Siva Dairy server is running."
        );
    }
}

// ======================================================
// LOGOUT
// ======================================================

function logoutAccount() {

    markCustomerOffline();

    localStorage.removeItem(
        CURRENT_USER_KEY
    );

    sessionStorage.removeItem(
        "sivaCustomerLoggedIn"
    );

    sessionStorage.removeItem(
        "sivaCustomerPhone"
    );

    closeAccount();

    window.location.replace(
        "customer-login.html"
    );
}

// ======================================================
// INITIALIZE
// ======================================================

window.addEventListener(
    "DOMContentLoaded",
    function () {

        // Load products from MongoDB
        renderProductGrid();

        // Load cart
        renderCart();

        // Mobile menu
        const menuButton =
            document.getElementById(
                "menuToggle"
            );

        if (menuButton) {

            menuButton.addEventListener(
                "click",
                openMenu
            );
        }

        document
            .querySelectorAll(
                ".nav-links a"
            )
            .forEach(
                function (link) {

                    link.addEventListener(
                        "click",
                        closeMenu
                    );
                }
            );

        // Account
        document
            .getElementById(
                "accountButton"
            )
            ?.addEventListener(
                "click",
                openAccount
            );

        document
            .querySelectorAll(
                "[data-close-account]"
            )
            .forEach(
                function (element) {

                    element.addEventListener(
                        "click",
                        closeAccount
                    );
                }
            );

        document
            .querySelectorAll(
                "[data-auth-tab]"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            showAuth(
                                button.dataset.authTab
                            );

                        }
                    );
                }
            );

        document
            .getElementById(
                "loginForm"
            )
            ?.addEventListener(
                "submit",
                requestLoginOtp
            );

        document
            .getElementById(
                "verifyLoginOtpButton"
            )
            ?.addEventListener(
                "click",
                verifyLoginOtp
            );

        document
            .getElementById(
                "resendLoginOtp"
            )
            ?.addEventListener(
                "click",
                function () {

                    const phone =
                        normalizePhone(
                            document.getElementById(
                                "loginPhone"
                            ).value
                        );

                    if (
                        validPhone(phone)
                    ) {

                        startOtp(
                            phone,
                            "login"
                        );
                    }
                }
            );

        document
            .getElementById(
                "registerForm"
            )
            ?.addEventListener(
                "submit",
                requestRegisterOtp
            );

        document
            .getElementById(
                "verifyRegisterOtpButton"
            )
            ?.addEventListener(
                "click",
                verifyRegisterOtp
            );

        document
            .getElementById(
                "resendRegisterOtp"
            )
            ?.addEventListener(
                "click",
                function () {

                    const phone =
                        normalizePhone(
                            document.getElementById(
                                "registerPhone"
                            ).value
                        );

                    if (
                        validPhone(phone)
                    ) {

                        startOtp(
                            phone,
                            "register"
                        );
                    }
                }
            );

        document
            .getElementById(
                "profileSetupForm"
            )
            ?.addEventListener(
                "submit",
                completeRegistration
            );

        document
            .getElementById(
                "editProfileButton"
            )
            ?.addEventListener(
                "click",
                editProfile
            );

        document
            .getElementById(
                "logoutButton"
            )
            ?.addEventListener(
                "click",
                logoutAccount
            );

        document
            .getElementById(
                "profileForm"
            )
            ?.addEventListener(
                "submit",
                saveProfile
            );

        document
            .getElementById(
                "cancelEditButton"
            )
            ?.addEventListener(
                "click",
                showProfile
            );

        updateAccountUI();

        markCustomerOnline();

        setInterval(
            markCustomerOnline,
            20000
        );
    }
);

// ======================================================
// GLOBAL FUNCTIONS
// ======================================================

window.addSelected =
    addSelected;

window.sendOrder =
    sendOrder;

window.sendReview =
    sendReview;
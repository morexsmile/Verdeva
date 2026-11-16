
/* =========================================
   VERDEVA — WEBSITE INTERACTIONS
========================================= */

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
}

const CART_STORAGE_KEY = "verdeva-cart";

/* =========================================
   DOM ELEMENTS
========================================= */

const menuToggle = document.querySelector<HTMLButtonElement>("#menuToggle");
const mainNavigation = document.querySelector<HTMLElement>("#mainNavigation");

const searchToggle = document.querySelector<HTMLButtonElement>("#searchToggle");
const searchPanel = document.querySelector<HTMLElement>("#searchPanel");
const searchForm = document.querySelector<HTMLFormElement>("#searchForm");
const searchInput = document.querySelector<HTMLInputElement>("#siteSearch");

const bagCount = document.querySelector<HTMLElement>("#bagCount");
const bagItemsContainer = document.querySelector<HTMLElement>("#bagItems");
const bagEmpty = document.querySelector<HTMLElement>("#bagEmpty");
const bagSubtotal = document.querySelector<HTMLElement>("#bagSubtotal");
const bagShipping = document.querySelector<HTMLElement>("#bagShipping");
const bagTotal = document.querySelector<HTMLElement>("#bagTotal");
const checkoutButton = document.querySelector<HTMLAnchorElement>("#checkoutButton");

const cartNotification = document.querySelector<HTMLElement>("#cartNotification");
const cartNotificationMessage = document.querySelector<HTMLElement>(
    "#cartNotificationMessage"
);

const newsletterForm = document.querySelector<HTMLFormElement>("#newsletterForm");
const newsletterEmail = document.querySelector<HTMLInputElement>("#newsletterEmail");
const newsletterFeedback = document.querySelector<HTMLElement>(
    "#newsletterFeedback"
);

/* =========================================
   MOBILE NAVIGATION
========================================= */

function closeMobileMenu(): void {
    if (!menuToggle || !mainNavigation) return;

    mainNavigation.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
}

function toggleMobileMenu(): void {
    if (!menuToggle || !mainNavigation) return;

    const isOpen = mainNavigation.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
}

menuToggle?.addEventListener("click", toggleMobileMenu);

mainNavigation?.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
});

document.addEventListener("click", (event: MouseEvent) => {
    if (!menuToggle || !mainNavigation) return;

    const target = event.target;
    if (!(target instanceof Node)) return;

    const clickedInsideMenu =
        mainNavigation.contains(target) || menuToggle.contains(target);

    if (!clickedInsideMenu) closeMobileMenu();
});

/* =========================================
   SEARCH PANEL
========================================= */

function closeSearchPanel(): void {
    if (!searchToggle || !searchPanel) return;

    searchPanel.hidden = true;
    searchToggle.setAttribute("aria-expanded", "false");
}

function toggleSearchPanel(): void {
    if (!searchToggle || !searchPanel) return;

    const isOpen = searchPanel.hidden;

    searchPanel.hidden = !isOpen;
    searchToggle.setAttribute("aria-expanded", String(isOpen));

    if (isOpen) searchInput?.focus();
}

searchToggle?.addEventListener("click", toggleSearchPanel);

searchForm?.addEventListener("submit", (event: SubmitEvent) => {
    event.preventDefault();

    const searchTerm = searchInput?.value.trim();

    if (!searchTerm) {
        searchInput?.focus();
        return;
    }

    const isInsidePages = window.location.pathname.includes("/pages/");
    const shopPath = isInsidePages ? "shop.html" : "pages/shop.html";

    window.location.href =
        `${shopPath}?search=${encodeURIComponent(searchTerm)}`;
});

/* =========================================
   CART — LOCAL STORAGE
========================================= */

function getCart(): CartItem[] {
    try {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);

        if (!storedCart) return [];

        const parsedCart: unknown = JSON.parse(storedCart);

        if (!Array.isArray(parsedCart)) return [];

        return parsedCart.filter((item): item is CartItem => {
            return (
                typeof item.id === "string" &&
                typeof item.name === "string" &&
                typeof item.price === "number" &&
                Number.isFinite(item.price) &&
                typeof item.quantity === "number" &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0
            );
        });
    } catch {
        return [];
    }
}

function saveCart(cart: CartItem[]): void {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
        console.error("Unable to save the cart.");
    }
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat("en-IE", {
        style: "currency",
        currency: "EUR"
    }).format(price);
}

function updateBagCount(): void {
    if (!bagCount) return;

    const cart = getCart();

    const totalItems = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    bagCount.textContent = String(totalItems);
}

/* =========================================
   PRODUCT INFORMATION
========================================= */

function getProductDetails(button: HTMLButtonElement): CartItem | null {
    const productCard = button.closest<HTMLElement>("[data-product-id]");

    if (!productCard) return null;

    const id = productCard.dataset.productId;
    const nameElement = productCard.querySelector<HTMLElement>("h3");

    const priceElement = productCard.querySelector<HTMLElement>(
        "[data-product-price], .product-card__price, .product-price"
    );

    const imageElement = productCard.querySelector<HTMLImageElement>("img");

    if (!id || !nameElement || !priceElement) {
        console.error("Product information is incomplete.");
        return null;
    }

    const name = nameElement.textContent?.trim() ?? "";
    const priceText = priceElement.textContent ?? "";
    const normalizedPrice = priceText.replace(",", ".");
    const priceMatch = normalizedPrice.match(/\d+(?:\.\d{1,2})?/);

    const price = priceMatch ? Number(priceMatch[0]) : NaN;

    if (!name || !Number.isFinite(price)) {
        console.error("Unable to read product information.");
        return null;
    }

    return {
        id,
        name,
        price,
        quantity: 1,
        image: imageElement?.src
    };
}

/* =========================================
   CART NOTIFICATION
========================================= */

function showCartNotification(productName: string): void {
    if (!cartNotification || !cartNotificationMessage) return;

    cartNotificationMessage.textContent =
        `${productName} added to your bag.`;

    cartNotification.hidden = false;

    window.setTimeout(() => {
        cartNotification.hidden = true;
    }, 3000);
}

/* =========================================
   ADD TO CART
========================================= */

function addToCart(button: HTMLButtonElement): void {
    const product = getProductDetails(button);

    if (!product) return;

    const cart = getCart();

    const existingProduct = cart.find(
        (item) => item.id === product.id
    );

    if (existingProduct) {
        existingProduct.quantity += 1;
        existingProduct.image = product.image ?? existingProduct.image;
    } else {
        cart.push(product);
    }

    saveCart(cart);
    updateBagCount();
    renderBag();
    showCartNotification(product.name);
}

document.querySelectorAll<HTMLButtonElement>("[data-add-to-cart]").forEach((button) => {
    button.addEventListener("click", () => {
        addToCart(button);
    });
});

/* =========================================
   BAG — CREATE PRODUCT ELEMENTS
========================================= */

function createBagItemElement(item: CartItem): HTMLElement {
    const article = document.createElement("article");
    article.className = "bag-item";
    article.dataset.cartItemId = item.id;

    const imageContainer = document.createElement("div");
    imageContainer.className = "bag-item__image";

    if (item.image) {
        const image = document.createElement("img");
        image.src = item.image;
        image.alt = item.name;
        image.loading = "lazy";
        imageContainer.appendChild(image);
    }

    const details = document.createElement("div");
    details.className = "bag-item__details";

    const name = document.createElement("h3");
    name.textContent = item.name;

    const unitPrice = document.createElement("p");
    unitPrice.textContent = `${formatPrice(item.price)} each`;

    const quantityControls = document.createElement("div");
    quantityControls.className = "bag-item__quantity";

    const decreaseButton = document.createElement("button");
    decreaseButton.type = "button";
    decreaseButton.textContent = "−";
    decreaseButton.setAttribute("aria-label", `Decrease ${item.name} quantity`);
    decreaseButton.dataset.cartAction = "decrease";

    const quantity = document.createElement("span");
    quantity.textContent = String(item.quantity);
    quantity.setAttribute("aria-label", "Quantity");

    const increaseButton = document.createElement("button");
    increaseButton.type = "button";
    increaseButton.textContent = "+";
    increaseButton.setAttribute("aria-label", `Increase ${item.name} quantity`);
    increaseButton.dataset.cartAction = "increase";

    quantityControls.append(
        decreaseButton,
        quantity,
        increaseButton
    );

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "bag-item__remove";
    removeButton.textContent = "Remove";
    removeButton.dataset.cartAction = "remove";

    details.append(
        name,
        unitPrice,
        quantityControls,
        removeButton
    );

    const itemTotal = document.createElement("div");
    itemTotal.className = "bag-item__total";
    itemTotal.textContent = formatPrice(item.price * item.quantity);

    article.append(
        imageContainer,
        details,
        itemTotal
    );

    return article;
}

/* =========================================
   BAG — RENDER PRODUCTS AND TOTALS
========================================= */

function renderBag(): void {
    if (!bagItemsContainer) return;

    const cart = getCart();

    const hasItems = cart.length > 0;

    if (bagEmpty) {
        bagEmpty.hidden = hasItems;
    }

    bagItemsContainer
        .querySelectorAll(".bag-item")
        .forEach((element) => element.remove());

    cart.forEach((item) => {
        bagItemsContainer.appendChild(createBagItemElement(item));
    });

    const subtotal = cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    if (bagSubtotal) {
        bagSubtotal.textContent = formatPrice(subtotal);
    }

    if (bagTotal) {
        bagTotal.textContent = formatPrice(subtotal);
    }

    if (bagShipping) {
        bagShipping.textContent = subtotal >= 60
            ? "Complimentary"
            : "Calculated at checkout";
    }

    if (checkoutButton) {
        checkoutButton.setAttribute("aria-disabled", String(!hasItems));
        checkoutButton.classList.toggle("is-disabled", !hasItems);
    }

    updateBagCount();
}

/* =========================================
   BAG — QUANTITY AND REMOVE ACTIONS
========================================= */

bagItemsContainer?.addEventListener("click", (event: MouseEvent) => {
    const target = event.target;

    if (!(target instanceof Element)) return;

    const actionButton = target.closest<HTMLButtonElement>(
        "[data-cart-action]"
    );

    if (!actionButton) return;

    const bagItem = actionButton.closest<HTMLElement>("[data-cart-item-id]");
    const itemId = bagItem?.dataset.cartItemId;
    const action = actionButton.dataset.cartAction;

    if (!itemId || !action) return;

    const cart = getCart();
    const item = cart.find((cartItem) => cartItem.id === itemId);

    if (!item) return;

    if (action === "increase") {
        item.quantity += 1;
    } else if (action === "decrease") {
        item.quantity -= 1;
    } else if (action === "remove") {
        const updatedCart = cart.filter(
            (cartItem) => cartItem.id !== itemId
        );

        saveCart(updatedCart);
        renderBag();
        return;
    }

    const updatedCart = cart.filter(
        (cartItem) => cartItem.quantity > 0
    );

    saveCart(updatedCart);
    renderBag();
});

/* =========================================
   CHECKOUT — PREVENT EMPTY BAG
========================================= */

checkoutButton?.addEventListener("click", (event: MouseEvent) => {
    if (getCart().length === 0) {
        event.preventDefault();
    }
});

/* =========================================
   NEWSLETTER
========================================= */

newsletterForm?.addEventListener("submit", (event: SubmitEvent) => {
    event.preventDefault();

    if (!newsletterEmail || !newsletterFeedback) return;

    const email = newsletterEmail.value.trim();

    if (!email || !newsletterEmail.checkValidity()) {
        newsletterEmail.reportValidity();
        return;
    }

    newsletterFeedback.textContent =
        "Thank you for your interest. Newsletter sign-up will be available soon.";

    newsletterFeedback.hidden = false;
    newsletterForm.reset();
});

/* =========================================
   GLOBAL KEYBOARD INTERACTIONS
========================================= */

document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape") {
        closeMobileMenu();
        closeSearchPanel();
    }
});

/* =========================================
   INITIALIZATION
========================================= */

updateBagCount();
renderBag();

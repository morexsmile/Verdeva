
/* =========================================
   VERDEVA — HOMEPAGE INTERACTIONS
========================================= */

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
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

    if (!clickedInsideMenu) {
        closeMobileMenu();
    }
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

    if (isOpen) {
        searchInput?.focus();
    }
}

searchToggle?.addEventListener("click", toggleSearchPanel);

searchForm?.addEventListener("submit", (event: SubmitEvent) => {
    event.preventDefault();

    const searchTerm = searchInput?.value.trim();

    if (!searchTerm) {
        searchInput?.focus();
        return;
    }

    window.location.href = `pages/shop.html?search=${encodeURIComponent(searchTerm)}`;
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
                typeof item.quantity === "number"
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

function updateBagCount(): void {
    if (!bagCount) return;

    const cart = getCart();

    const totalItems = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    bagCount.textContent = String(totalItems);
}

function getProductDetails(button: HTMLButtonElement): CartItem | null {
    const productCard = button.closest<HTMLElement>("[data-product-id]");

    if (!productCard) return null;

    const id = productCard.dataset.productId;

    const nameElement = productCard.querySelector<HTMLElement>("h3");

    const priceElement = productCard.querySelector<HTMLElement>(
        "[data-product-price], .product-card__price, .product-price"
    );

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
        quantity: 1
    };
}

function showCartNotification(productName: string): void {
    if (!cartNotification || !cartNotificationMessage) return;

    cartNotificationMessage.textContent = `${productName} added to your bag.`;

    cartNotification.hidden = false;

    window.setTimeout(() => {
        cartNotification.hidden = true;
    }, 3000);
}

function addToCart(button: HTMLButtonElement): void {
    const product = getProductDetails(button);

    if (!product) return;

    const cart = getCart();

    const existingProduct = cart.find((item) => item.id === product.id);

    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push(product);
    }

    saveCart(cart);
    updateBagCount();
    showCartNotification(product.name);
}

document.querySelectorAll<HTMLButtonElement>("[data-add-to-cart]").forEach((button) => {
    button.addEventListener("click", () => {
        addToCart(button);
    });
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

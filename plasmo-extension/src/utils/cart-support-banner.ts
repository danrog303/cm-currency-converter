import { COFFEE_ICON_PATH, SUPPORT_LINK_TEXT, SUPPORT_URL } from "./support"

const SHOPPING_CART_PATH = /^\/[^/]+\/[^/]+\/ShoppingCart\/?$/
const CART_OVERVIEW_SELECTOR = ".shopping-cart-content .col-lg-3 > .cart-overview"
const BANNER_ID = "ccc-cart-support"
const SVG_NAMESPACE = "http://www.w3.org/2000/svg"

const createCartSupportBanner = () => {
  const banner = document.createElement("aside")
  banner.id = BANNER_ID
  banner.className = "card w-100 mb-4 text-start"
  banner.setAttribute("aria-labelledby", `${BANNER_ID}-title`)

  const body = document.createElement("div")
  body.className = "card-body"

  const title = document.createElement("h3")
  title.id = `${BANNER_ID}-title`
  title.className = "text-size-regular mb-2"
  title.textContent = "Cardmarket Currency Converter"

  const message = document.createElement("p")
  message.className = "small mb-2"
  message.textContent = "If the extension helps, you can support its development."

  const link = document.createElement("a")
  link.className = "small d-inline-flex align-items-center gap-1 text-decoration-underline"
  link.href = SUPPORT_URL
  link.target = "_blank"
  link.rel = "noopener noreferrer"

  const icon = document.createElementNS(SVG_NAMESPACE, "svg")
  icon.setAttribute("aria-hidden", "true")
  icon.setAttribute("width", "14")
  icon.setAttribute("height", "14")
  icon.setAttribute("viewBox", "0 0 16 16")
  icon.setAttribute("fill", "none")
  icon.setAttribute("stroke", "currentColor")
  icon.setAttribute("stroke-width", "1.3")
  icon.setAttribute("stroke-linecap", "round")
  icon.setAttribute("stroke-linejoin", "round")

  const path = document.createElementNS(SVG_NAMESPACE, "path")
  path.setAttribute("d", COFFEE_ICON_PATH)
  icon.append(path)

  link.append(icon, SUPPORT_LINK_TEXT)
  body.append(title, message, link)
  banner.append(body)

  return banner
}

export const syncCartSupportBanner = () => {
  const banner = document.getElementById(BANNER_ID)
  const cartSidebar = SHOPPING_CART_PATH.test(window.location.pathname)
    ? document.querySelector(CART_OVERVIEW_SELECTOR)?.parentElement
    : null

  if (!cartSidebar) {
    banner?.remove()
  } else if (!banner || cartSidebar.firstElementChild !== banner) {
    cartSidebar.prepend(banner ?? createCartSupportBanner())
  }
}

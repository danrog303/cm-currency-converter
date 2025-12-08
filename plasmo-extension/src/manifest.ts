export default {
  manifest_version: 3,
  name: "Cardmarket Currency Converter",
  description:
    "Automatically converts Euro prices on Cardmarket to your preferred currency.",
  version: "0.2.0",
  host_permissions: ["https://www.cardmarket.com/*"],
  content_scripts: [
    {
      matches: ["https://www.cardmarket.com/*"],
      js: ["contents/cardmarket.js"]
    }
  ],
  action: {
    default_title: "Cardmarket Currency Converter"
  }
} as const


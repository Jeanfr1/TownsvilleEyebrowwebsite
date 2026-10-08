// Single source for business facts. Rendered into the HTML at build time (vite.config.js),
// so contacts work without JavaScript. Transcribed from the kit (07-integracao/config.json).
// TODO(townsville): reconfirm hours, the current service menu and photo permissions with the business.
const phone = '+61457082418';

export const site = {
  name: 'Townsville Eyebrow Threading & Waxing',
  concept: 'A finer line.',
  phoneDisplay: '+61 457 082 418',
  phoneHref: `tel:${phone}`,
  whatsappHref: `https://wa.me/${phone.slice(1)}`,
  addressLine1: '8 Summerset Drive',
  addressLine2: 'Mount Louisa, Townsville QLD 4814',
  address: '8 Summerset Drive, Mount Louisa, Townsville QLD 4814, Australia',
  // TODO(townsville): swap for the Google Maps place link (cid) once the listing is confirmed.
  directionsHref: 'https://www.google.com/maps/search/?api=1&query=8%20Summerset%20Drive%20Mount%20Louisa%20QLD%204814',
  // TODO(townsville): final domain, then drop the noindex meta in index.html.
  url: 'https://townsville-eyebrow-threading.vercel.app',
};

// Prefilled WhatsApp text: it only opens the conversation, nothing is sent automatically.
export const wa = (text) => `${site.whatsappHref}?text=${encodeURIComponent(text)}`;

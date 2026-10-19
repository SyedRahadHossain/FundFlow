/**
 * Canonical credit packages.
 *
 * Price lives here, not in the request body: a client chooses *which* package
 * to buy, never how much it costs.
 */
const PACKAGES = [
  { credits: 100,  price: 10  },
  { credits: 300,  price: 25  },
  { credits: 800,  price: 60  },
  { credits: 1500, price: 110 },
];

const findPackage = (credits) =>
  PACKAGES.find((p) => p.credits === Number(credits)) || null;

module.exports = { PACKAGES, findPackage };

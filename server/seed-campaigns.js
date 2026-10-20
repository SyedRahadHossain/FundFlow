/**
 * Seed the demo campaigns the marketing page shows.
 *
 * The landing page is data-driven: it reads the approved campaigns and the
 * live counters from the API. A fresh database has nothing to show, so this
 * script writes a small, believable world — six approved campaigns with real
 * stories, real images and a ledger that adds up: every campaign's
 * `amount_raised` is exactly the sum of its approved contributions, and every
 * demo supporter's balance is what they started with minus what they gave.
 *
 * Run it:
 *
 *   node seed-campaigns.js
 *
 * It refuses to run in two cases: NODE_ENV is "production", or MONGODB_URI
 * points at the production database. Both refusals exist because the cost of
 * getting this wrong is a public account whose password is printed in this
 * file. A development database (`fundflow_dev`) is the intended target.
 *
 * Options:
 *   --prune-junk   also remove the placeholder campaigns left behind by
 *                  testing (title "test", story "test"), through the app's own
 *                  delete path, so their supporters are refunded
 *
 * Idempotent: running it twice writes nothing new and changes no total.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const PRUNE_JUNK = process.argv.includes('--prune-junk');
const ALLOW_PRODUCTION_DB = process.argv.includes('--allow-production-db');

// ── Guard ─────────────────────────────────────────────────────────
// Demo data must never reach a production database. Two refusals stand in
// the way: a production environment, and a connection to the production
// database itself. The second one matters because NODE_ENV and the
// connection string are separate facts: pointing a development run at the
// live database would publish accounts whose password is printed in this
// file. The refusal names the command that runs it, so the operator is not
// left guessing.
if (process.env.NODE_ENV === 'production') {
  console.error(
    'Refusing to seed: NODE_ENV is "production".\n' +
    'This script writes demo campaigns and demo accounts. Run it with an explicit\n' +
    'non-production environment, for example:\n' +
    '  NODE_ENV=development node seed-campaigns.js'
  );
  process.exit(1);
}

const PRODUCTION_DB = 'fundflow';
const dbName = (() => {
  const uri = process.env.MONGODB_URI || '';
  const match = /\.mongodb\.net\/([^/?]+)|@[^/]+\/([^/?]+)/.exec(uri);
  return (match && (match[1] || match[2])) || '';
})();

if (dbName === PRODUCTION_DB && !ALLOW_PRODUCTION_DB) {
  console.error(
    `Refusing to seed: MONGODB_URI points at the "${PRODUCTION_DB}" database, which is the\n` +
    'deployed server\'s database. Seeding it would publish demo accounts whose password\n' +
    'is printed below, and the deployed site would offer them to anyone who reads this\n' +
    'repository. Point the script at a development database instead, for example:\n' +
    '  mongodb+srv://...@cluster0.byllt.mongodb.net/fundflow_dev\n' +
    'If you truly mean to write to the production database, say so:\n' +
    '  node seed-campaigns.js --allow-production-db'
  );
  process.exit(1);
}

const DEMO_PASSWORD = 'Demo@123456';
const CREATOR_STARTER_CREDITS = 20; // the register route's creator grant
const SUPPORTER_START_CREDITS = {
  'ayesha.karim@fundflow.com': 5000,
  'ibrahim.sayeed@fundflow.com': 3500,
};

// The image pattern the app already loads: Unsplash over HTTPS, cropped.
const unsplash = (id) =>
  `https://images.unsplash.com/${id}?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D`;

const SUPPORTERS = {
  'ayesha.karim@fundflow.com': { name: 'Ayesha Karim' },
  'ibrahim.sayeed@fundflow.com': { name: 'Ibrahim Sayeed' },
};

/**
 * The six campaigns.
 *
 * `days` is counted from the moment the script runs, so a fresh seed always
 * lands in the near future. `contributions` are the credits each supporter
 * gave; the campaign's amount_raised is their sum.
 */
const CAMPAIGNS = [
  {
    title: 'Solar Panels for Riverside Hall',
    story:
      'The Riverside Hall runs its lights, the after-school club and a small food pantry off one diesel generator. We want to put 24 panels on the hall roof, wire them to a battery that carries the hall through a winter evening, and cut the fuel bill that currently decides how many hot meals we can serve. The first three quotes came in under half what we first assumed, so a funded campaign buys the panels, the inverter and the installation, with the electrician already quoted.',
    category: 'Environment',
    creator: { name: 'Maya Okafor', email: 'maya.okafor@fundflow.com' },
    funding_goal: 2400,
    minimum_contribution: 20,
    days: 24,
    reward_info: 'The centre quarterly impact note, and your name on the noticeboard wall.',
    image: unsplash('photo-1509391366360-2e959784a276'),
    contributions: [
      { supporter: 'ayesha.karim@fundflow.com', amount: 1200 },
      { supporter: 'ibrahim.sayeed@fundflow.com', amount: 600 },
      { supporter: 'ayesha.karim@fundflow.com', amount: 300 },
      { supporter: 'ibrahim.sayeed@fundflow.com', amount: 396 },
    ],
  },
  {
    title: 'A Clinic Queue That Works Offline',
    story:
      'Rural clinics lose whole days to a queue system that needs a connection they do not have. We are building a small offline-first queue app: a tablet at the door, a printed fallback, and a sync that catches up when the signal returns. Two clinics are already piloting it for free. The money covers six more tablets, a year of hosting, and the part-time engineer who keeps the sync honest.',
    category: 'Technology',
    creator: { name: 'Daniel Reyes', email: 'daniel.reyes@fundflow.com' },
    funding_goal: 1800,
    minimum_contribution: 10,
    days: 31,
    reward_info: 'Early builds, and your name in the credits of the release.',
    image: unsplash('photo-1518770660439-4636190af475'),
    contributions: [
      { supporter: 'ayesha.karim@fundflow.com', amount: 700 },
      { supporter: 'ibrahim.sayeed@fundflow.com', amount: 404 },
      { supporter: 'ayesha.karim@fundflow.com', amount: 300 },
    ],
  },
  {
    title: 'The Night Market Print Residency',
    story:
      'The night market has been selling prints from local artists on a folding table for six years. This residency gives twelve artists a shared studio, six weeks and a proper printing press, and ends with an edition of one hundred prints that are sold at the market and split with the artists. We are not chasing a gallery — we are chasing a press, a desk each, and six weeks of electricity.',
    category: 'Art & Design',
    creator: { name: 'Amara Osei', email: 'amara.osei@fundflow.com' },
    funding_goal: 1100,
    minimum_contribution: 20,
    days: 18,
    reward_info: 'A print from the residency edition, posted to you.',
    image: unsplash('photo-1541961017774-22349e4a1262'),
    contributions: [
      { supporter: 'ayesha.karim@fundflow.com', amount: 400 },
      { supporter: 'ibrahim.sayeed@fundflow.com', amount: 392 },
    ],
  },
  {
    title: 'Little Ears: Newborn Hearing Screening',
    story:
      'One in a thousand children is born with a hearing loss that a newborn screening catches on day one and a parent never hears about on day thirty. We fund screening kits for the four maternity wards in the county and train the staff who use them. The kits are cheap; the training is the part that needs money, and it is the part that decides whether a child is caught in time.',
    category: 'Health',
    creator: { name: 'Sofia Chen', email: 'sofia.chen@fundflow.com' },
    funding_goal: 1500,
    minimum_contribution: 25,
    days: 42,
    reward_info: 'A thank-you card from the screening team, and the training notes.',
    image: unsplash('photo-1576091160399-112ba8d25d1d'),
    contributions: [
      { supporter: 'ibrahim.sayeed@fundflow.com', amount: 500 },
      { supporter: 'ayesha.karim@fundflow.com', amount: 370 },
    ],
  },
  {
    title: 'The Night School: Exam Prep for Nurses',
    story:
      'Nurses working nights are the students nobody schedules for. The night school runs two evenings a week for two hours: anatomy, drug calculations, and a room where someone who has been studying alone for a year can ask a question out loud. We need exam-fee bursaries for forty students, a second tutor, and the printing costs for a set of past papers that people currently borrow and lose.',
    category: 'Education',
    creator: { name: 'Noor Haddad', email: 'noor.haddad@fundflow.com' },
    funding_goal: 1200,
    minimum_contribution: 15,
    days: 28,
    reward_info: 'A printed set of past papers, and your name on the roll of thanks.',
    image: unsplash('photo-1503676260728-1c00da094a0b'),
    contributions: [
      { supporter: 'ayesha.karim@fundflow.com', amount: 300 },
      { supporter: 'ibrahim.sayeed@fundflow.com', amount: 276 },
    ],
  },
  {
    title: 'Brass & Cedar: A Folk Record Session',
    story:
      'Forty musicians, one barn, and a week to record an album of the songs their grandparents sang. We need the recording engineer, the tape, the van that moves the microphones, and the extra day of studio time these sessions always need. The finished record is pressed, sold at the shows, and every player on it is credited on the sleeve — this is a record made by the people on it.',
    category: 'Music',
    creator: { name: 'Tomás Rivera', email: 'tomas.rivera@fundflow.com' },
    funding_goal: 800,
    minimum_contribution: 10,
    days: 11,
    reward_info: 'Your name in the sleeve credits, and a digital copy of the record.',
    image: unsplash('photo-1511379938547-c1f69419868d'),
    contributions: [
      { supporter: 'ayesha.karim@fundflow.com', amount: 200 },
      { supporter: 'ibrahim.sayeed@fundflow.com', amount: 120 },
    ],
    // The account to try the creator dashboard with: 320 raised credits is
    // above the 200-credit withdrawal minimum.
    demoCreator: true,
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('./models/User');
  const Campaign = require('./models/Campaign');
  const Contribution = require('./models/Contribution');
  const { deleteCampaignWithRefunds } = require('./lib/campaignLifecycle');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ── Accounts ────────────────────────────────────────────────────
  // One account per creator, so the ranking reads like a platform with
  // people on it, plus the demo supporters. The upsert keeps a second run
  // from creating anything.
  const ensureUser = async ({ email, name, role, credits }) => {
    const user = await User.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          name,
          email,
          password: passwordHash,
          role,
          credits,
          photo: '',
        },
      },
      { upsert: true, new: true }
    );
    return user;
  };

  const accounts = [];
  const seenEmails = new Set();
  const register = (email, name, role, credits) => {
    if (seenEmails.has(email)) return null;
    seenEmails.add(email);
    accounts.push({ email, name, role, credits });
    return { email, name, role, credits };
  };

  for (const supporter of Object.entries(SUPPORTERS)) {
    const [email, { name }] = supporter;
    register(email, name, 'supporter', SUPPORTER_START_CREDITS[email]);
  }
  for (const campaign of CAMPAIGNS) {
    register(campaign.creator.email, campaign.creator.name, 'creator', CREATOR_STARTER_CREDITS);
  }

  for (const account of accounts) {
    await ensureUser(account);
  }

  // ── Campaigns and their contributions ───────────────────────────
  const created = [];
  const kept = [];
  const committed = {};

  for (const seedCampaign of CAMPAIGNS) {
    const deadline = new Date(Date.now() + seedCampaign.days * 24 * 60 * 60 * 1000);
    const raised = seedCampaign.contributions.reduce((sum, c) => sum + c.amount, 0);

    const existing = await Campaign.findOne({ title: seedCampaign.title });
    const campaign = await Campaign.findOneAndUpdate(
      { title: seedCampaign.title },
      {
        $setOnInsert: {
          title: seedCampaign.title,
          story: seedCampaign.story,
          category: seedCampaign.category,
          funding_goal: seedCampaign.funding_goal,
          minimum_contribution: seedCampaign.minimum_contribution,
          deadline,
          reward_info: seedCampaign.reward_info,
          campaign_image_url: seedCampaign.image,
          creator_email: seedCampaign.creator.email,
          creator_name: seedCampaign.creator.name,
          status: 'approved',
        },
      },
      { upsert: true, new: true }
    );
    (existing ? kept : created).push({ campaign, seedCampaign, raised });

    // The ledger: amount_raised is the sum of the approved contributions.
    await Campaign.findOneAndUpdate({ _id: campaign._id }, { $set: { amount_raised: raised } });

    for (const contribution of seedCampaign.contributions) {
      const supporter = SUPPORTERS[contribution.supporter];
      await Contribution.findOneAndUpdate(
        {
          campaign_id: campaign._id,
          supporter_email: contribution.supporter,
          contribution_amount: contribution.amount,
          status: 'approved',
        },
        {
          $setOnInsert: {
            campaign_id: campaign._id,
            campaign_title: seedCampaign.title,
            contribution_amount: contribution.amount,
            supporter_email: contribution.supporter,
            supporter_name: supporter.name,
            creator_email: seedCampaign.creator.email,
            creator_name: seedCampaign.creator.name,
            status: 'approved',
            date: new Date(),
          },
        },
        { upsert: true, new: true }
      );
      committed[contribution.supporter] =
        (committed[contribution.supporter] || 0) + contribution.amount;
    }
  }

  // The supporter balances follow from the ledger, so a rerun cannot spend
  // the same credits twice.
  for (const [email, spent] of Object.entries(committed)) {
    const start = SUPPORTER_START_CREDITS[email];
    if (start === undefined) continue;
    await User.findOneAndUpdate({ email }, { $set: { credits: start - spent } });
  }

  // ── Optional: drop the placeholder campaigns ────────────────────
  if (PRUNE_JUNK) {
    const junk = await Campaign.find({ title: /^test$/i, story: /^test$/i });
    for (const campaign of junk) {
      const { refunded } = await deleteCampaignWithRefunds(campaign._id);
      console.log(
        `Removed placeholder campaign "${campaign.title}" (${campaign._id}) ` +
          `and refunded ${refunded} credits to its supporters.`
      );
    }
    if (junk.length === 0) console.log('No placeholder campaigns found.');
  }

  // ── Report ──────────────────────────────────────────────────────
  const all = await Campaign.find({ status: 'approved' }).sort({ amount_raised: -1 });
  const live = all.filter((c) => new Date(c.deadline) > new Date());
  const totalCredits = all.reduce((sum, c) => sum + (c.amount_raised || 0), 0);
  const goalsReached = all.filter((c) => (c.amount_raised || 0) >= c.funding_goal).length;
  const supporters = await Contribution.distinct('supporter_email', { status: 'approved' });

  console.log(`\nCreated ${created.length} campaign(s); ${kept.length} already existed.`);
  console.log('\nCampaigns now live (ranked by credits raised):');
  console.log('  #  title                                              category       goal   raised   funded  deadline');
  all.forEach((c, index) => {
    const percent = Math.round(((c.amount_raised || 0) / c.funding_goal) * 100);
    console.log(
      `  ${String(index + 1).padStart(2)} ${c.title.slice(0, 50).padEnd(50)} ` +
        `${c.category.padEnd(13)} ${String(c.funding_goal).padStart(5)} ` +
        `${String(c.amount_raised).padStart(8)} ${String(percent).padStart(6)}%  ` +
        `${new Date(c.deadline).toISOString().slice(0, 10)}`
    );
  });

  console.log('\nThe landing page will now read:');
  console.log(`  ${live.length} live campaigns, ${goalsReached} goal${goalsReached === 1 ? '' : 's'} reached, ` +
    `${totalCredits.toLocaleString()} credits raised, ${supporters.length} supporter${supporters.length === 1 ? '' : 's'}.`);

  const demoCreator = CAMPAIGNS.find((c) => c.demoCreator);
  console.log(`\nDemo accounts — the password for every one of them is ${DEMO_PASSWORD}`);
  console.log('  creator    ' + demoCreator.creator.email.padEnd(32) +
    `${demoCreator.creator.name} (owns "${demoCreator.title}")`);
  for (const campaign of CAMPAIGNS.filter((c) => !c.demoCreator)) {
    console.log('  creator    ' + campaign.creator.email.padEnd(32) +
      `${campaign.creator.name} (owns "${campaign.title}")`);
  }
  for (const [email, { name }] of Object.entries(SUPPORTERS)) {
    console.log('  supporter  ' + email.padEnd(32) +
      `${name} (${SUPPORTER_START_CREDITS[email] - (committed[email] || 0)} credits left)`);
  }
  console.log('  Sign in at /login with any of the addresses above.');

  const categories = ['Technology', 'Art & Design', 'Community', 'Health', 'Music', 'Education', 'Environment', 'Gaming'];
  const seeded = new Set(CAMPAIGNS.map((c) => c.category));
  const empty = categories.filter((c) => !seeded.has(c));
  if (empty.length) {
    console.log(`\nCategories with no seeded campaign: ${empty.join(', ')}.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

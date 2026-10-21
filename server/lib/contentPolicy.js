/**
 * The platform's content policy.
 *
 * Two rules, and they are rules of the platform rather than preferences:
 *
 *   1. The platform does not host campaigns that attack a religion or the
 *      people who follow it.
 *
 *   2. The platform does not host campaigns about music.
 *
 * A campaign that breaks either rule is refused when it is written, refused
 * again when it is edited, and refused once more when an admin tries to
 * publish it, so it cannot reach the public page by any of the three doors.
 *
 * The first rule covers hostility aimed at Islam and at Muslims: calls to
 * destroy, expel or kill them, and descriptions of the religion or its
 * adherents as evil, diseased, subhuman or inherently violent. Writing about
 * Islam is not an attack on Islam, and the rule does not reach it.
 *
 * The second rule covers music: the category, and the words a campaign uses
 * to describe what it is for. It is a category of work the platform does not
 * host, in the same way that it does not host a campaign in a category it
 * does not offer.
 *
 * Both refusals say what the rule is and never repeat the text that broke
 * it, so the rule cannot be probed for its boundaries.
 */

const POLICIES = {
  'no-religious-hostility': {
    id: 'no-religious-hostility',
    message:
      'This campaign cannot be published. The platform does not host campaigns that attack a religion or the people who follow it.',
  },
  'no-music': {
    id: 'no-music',
    message:
      'This campaign cannot be published. The platform does not host campaigns about music.',
  },
};

const POLICY = POLICIES['no-religious-hostility'];

/**
 * The religious-hostility rules, each with a name for the log.
 *
 * The patterns look for a hostile verb or a hostile adjective close to the
 * religion or its adherents, in either order, because the same sentence
 * can be written both ways round ("destroy Islam", "Islam must be
 * destroyed").
 */
const TARGET = "islam|islamic|muslims?|muslim|mosques?|masjids?|qur'?ans?|shariah";

const HOSTILITY_RULES = [
  {
    name: 'call to destroy, expel or end the religion or its people',
    pattern: new RegExp(
      '\\b(destroy|burn|burning|exile|expel|expelling|erase|eradicate|eliminate|annihilate|wipe out|get rid of|remove|end|abolish|curb|stop|hate|attack|fight|crush|desecrate|humiliate|insult|ridicule|demean|demonize)\\b[^.!?\\n]{0,40}\\b(' +
        TARGET +
        ')\\b',
      'i'
    ),
  },
  {
    name: 'call to drive the religion or its people out',
    pattern: new RegExp(
      '\\b(drive|push|force|herd|rail)\\b[^.!?\\n]{0,15}\\b(' +
        TARGET +
        ')\\b\\s+(out|away)\\b',
      'i'
    ),
  },
  {
    name: 'call to send the religion or its people into exile',
    pattern: new RegExp(
      '\\b(' +
        TARGET +
        ')\\b[^.!?\\n]{0,15}\\binto exile\\b',
      'i'
    ),
  },
  {
    name: 'call to harm the religion or its people',
    pattern: new RegExp(
      '\\b(kill|murder|assault|attack|hunt|shoot|stab|lynch|behead|poison|torment)\\b[^.!?\\n]{0,40}\\b(' +
        TARGET +
        ')\\b',
      'i'
    ),
  },
  {
    name: 'the religion or its people called evil, diseased or subhuman',
    pattern: new RegExp(
      '\\b(' +
        TARGET +
        ')\\b[^.!?\\n]{0,40}\\b(evil|plague|disease|cancer|cancerous|curse|cursed|scourge|vermin|filth|infestation|apes?|animals?|subhuman|lower species|cockroaches|parasites?)\\b',
      'i'
    ),
  },
  {
    name: 'the religion or its people called a plague',
    pattern: new RegExp(
      '\\b(evil|plague|disease|cancer|curse|scourge|vermin|filth|infestation|terrorist|terrorists|barbaric|backward|primitive|inferior)\\b[^.!?\\n]{0,30}\\b(' +
        TARGET +
        ')\\b',
      'i'
    ),
  },
  {
    name: 'every believer held responsible for violence',
    pattern: new RegExp(
      '\\b(all|every|each)\\s+(' +
        TARGET +
        ')\\b[^.!?\\n]{0,50}\\b(terrorists?|terrorist|violent|violence|killers?|murderers?|bombs?|barbarians?|savages?)\\b',
      'i'
    ),
  },
  {
    name: 'every believer held responsible for violence, the other way round',
    pattern: new RegExp(
      '\\b(terrorists?|terrorist|violent|violence|killers?|murderers?|bombs?|barbarians?|savages?)\\b[^.!?\\n]{0,30}\\b(all|every|each)\\s+(' +
        TARGET +
        ')\\b',
      'i'
    ),
  },
];

/**
 * The music rules.
 *
 * The category the platform does not offer, and the words a campaign uses
 * to say what it is for. The list holds the words that name music itself -
 * the art, the people, the instruments, the records and the performances -
 * and leaves the general words of a community life alone: a hall is a hall,
 * a stage is a stage, a record is a record.
 */
const MUSIC_WORDS = [
  'music',
  'musical',
  'musician',
  'musicians',
  'album',
  'albums',
  'orchestra',
  'symphony',
  'guitar',
  'guitars',
  'piano',
  'pianos',
  'violin',
  'cello',
  'saxophone',
  'flute',
  'trumpet',
  'harp',
  'banjo',
  'lute',
  'fiddle',
  'drum',
  'drums',
  'melody',
  'melodies',
  'karaoke',
  'rapper',
  'rapping',
  'disc jockey',
  'vinyl',
  'nightclub',
  'gig',
];

/**
 * The words a devotional campaign may use: they name a song, a set of
 * lyrics, a choir or a gathering, and in a devotional campaign they are not
 * music.
 */
const DEVOTIONAL_WORDS = [
  'song',
  'songs',
  'lyric',
  'lyrics',
  'choir',
  'concert',
  'concerts',
  'harmonium',
  'tabla',
];

/** What tells a devotional campaign apart from a musical one. */
const DEVOTIONAL_MARKER = 'nasheed|nasheeds|recitation|recitations|recite|recites|reciting|recited';

const MUSIC_RULES = [
  {
    name: 'the campaign is in the music category',
    pattern: null,
    category: 'music',
  },
  {
    name: 'the campaign is about music',
    pattern: new RegExp(`\\b(${MUSIC_WORDS.join('|')})\\b`, 'i'),
  },
  {
    name: 'the campaign is about music',
    pattern: new RegExp(`\\b(${DEVOTIONAL_WORDS.join('|')})\\b`, 'i'),
    devotionalOnly: true,
  },
];

/**
 * The text a creator wrote. The title, the story and the reward note are
 * the three free-text fields; the rest of a campaign is numbers and
 * choices from a fixed list.
 */
function campaignText(campaign = {}) {
  return [campaign.title, campaign.story, campaign.reward_info, campaign.body]
    .filter((value) => typeof value === 'string' && value.trim())
    .join('\n');
}

/**
 * The first rule the campaign breaks, or null.
 *
 * The refusal carries the rule's name for the server's log, and never the
 * text that matched: the creator is told what the rule is, not how to get
 * around it.
 */
function findPolicyViolation(campaign = {}) {
  const text = campaignText(campaign);

  const category = typeof campaign.category === 'string' ? campaign.category.trim().toLowerCase() : '';

  // A campaign about devotional singing is not a music campaign, so the
  // words that name that practice are excused in it.
  const devotional = text ? new RegExp(`\\b(${DEVOTIONAL_MARKER})\\b`, 'i').test(text) : false;

  for (const rule of MUSIC_RULES) {
    if (rule.category) {
      if (category === rule.category) {
        return { id: 'no-music', rule: rule.name, message: POLICIES['no-music'].message };
      }
      continue;
    }
    if (!text || !rule.pattern.test(text)) continue;
    if (rule.devotionalOnly && devotional) continue;
    return { id: 'no-music', rule: rule.name, message: POLICIES['no-music'].message };
  }

  if (!text) return null;

  for (const rule of HOSTILITY_RULES) {
    if (rule.pattern.test(text)) {
      return {
        id: 'no-religious-hostility',
        rule: rule.name,
        message: POLICIES['no-religious-hostility'].message,
      };
    }
  }

  return null;
}

function isPublishable(campaign = {}) {
  return findPolicyViolation(campaign) === null;
}

module.exports = {
  POLICY,
  POLICIES,
  HOSTILITY_RULES,
  MUSIC_RULES,
  DEVOTIONAL_WORDS,
  DEVOTIONAL_MARKER,
  findPolicyViolation,
  isPublishable,
  campaignText,
};

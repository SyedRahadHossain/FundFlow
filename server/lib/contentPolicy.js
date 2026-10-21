/**
 * The platform's content policy.
 *
 * FundFlow does not host campaigns that attack a religion or the people who
 * follow it. This is a rule, not a preference: a campaign that breaks it is
 * refused when it is written, refused again when it is edited, and refused
 * once more when an admin tries to publish it, so it cannot reach the
 * public page by any of the three doors.
 *
 * What the rule covers is hostility aimed at Islam and at Muslims: calls to
 * destroy, expel or kill them, and descriptions of the religion or its
 * adherents as evil, diseased, subhuman or inherently violent.
 *
 * What it does not cover is writing about Islam. Mosques, madrasas, Ramadan
 * drives, zakat, Islamic charities, Muslim-led cooperatives, the history of
 * Islamic art, interfaith dialogue - a platform in this part of the world
 * exists to serve exactly that, and a rule that swallowed it would empty the
 * platform of the people it is for. A rule that cannot tell a campaign
 * against Islam from a campaign by Muslims is not a rule, it is a filter,
 * and it does not belong on a crowdfunding platform.
 *
 * The check is deliberately simple and deterministic: patterns over the free
 * text a creator writes. The admin who approves campaigns is the second
 * layer, and they can reject anything this one misses.
 */

const POLICY = {
  id: 'no-religious-hostility',
  message:
    'This campaign cannot be published. The platform does not host campaigns that attack a religion or the people who follow it.',
};

/**
 * The rules, each with a name for the log.
 *
 * The patterns look for a hostile verb or a hostile adjective close to the
 * religion or its adherents, in either order, because the same sentence
 * can be written both ways round ("destroy Islam", "Islam must be
 * destroyed").
 */
const TARGET = "islam|islamic|muslims?|muslim|mosques?|masjids?|qur'?ans?|shariah";

const RULES = [
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
  if (!text) return null;

  for (const rule of RULES) {
    if (rule.pattern.test(text)) {
      return { id: POLICY.id, rule: rule.name, message: POLICY.message };
    }
  }
  return null;
}

function isPublishable(campaign = {}) {
  return findPolicyViolation(campaign) === null;
}

module.exports = { POLICY, RULES, findPolicyViolation, isPublishable, campaignText };

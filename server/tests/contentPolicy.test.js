const {
  POLICY,
  findPolicyViolation,
  isPublishable,
} = require('../lib/contentPolicy');

/**
 * The platform does not host campaigns that attack a religion or the people
 * who follow it. That is a rule, not a preference, and it is checked the
 * moment a campaign is written and again the moment an admin tries to
 * publish it.
 *
 * The tests below come in two kinds. The first kind is content that must be
 * refused: calls to destroy, expel or kill Muslims, and descriptions of
 * Islam or its adherents as evil, diseased, subhuman or violent.
 *
 * The second kind matters just as much. A crowdfunding platform in
 * Bangladesh hosts campaigns for mosques, madrasas, Ramadan drives and
 * Islamic charities, and a rule that swallowed those would be a rule that
 * emptied the platform of the very people it exists for. Ordinary writing
 * about Islam - its history, its art, its holidays, its charities - is not
 * an attack on Islam and is never refused.
 */

describe('campaigns that attack Islam or Muslims', () => {
  const refused = [
    ['a call to destroy the religion', 'Destroy Islam from the face of the earth'],
    ['a call to expel believers', 'A campaign to expel Muslims from the country'],
    ['a call to kill', 'We will kill all Muslims who stay'],
    ['a call to burn a mosque', 'Burn the mosque and collect the money'],
    ['a call to desecrate a holy book', 'Raise funds to desecrate the Quran'],
    ['the religion called a disease', 'Islam is a disease that must be cured'],
    ['the religion called a cancer', 'Stop Islam: it is the cancer of the world'],
    ['believers called subhuman', 'Muslims are vermin and should be treated as such'],
    ['believers compared to animals', 'Muslims are apes and cannot be taught'],
    ['every believer called violent', 'All Muslims are terrorists and must be driven out'],
    ['the religion called a terrorist ideology', 'Fund the fight: Islam is a terrorist religion'],
    ['a hate campaign by name', 'A campaign to hate Islam and its people'],
    ['a call to end the religion', 'Help us end Islam for good'],
    ['believers called a plague', 'Muslims are a plague on this country'],
  ];

  test.each(refused)('refuses %s', (_label, text) => {
    const violation = findPolicyViolation({ title: text, story: '' });
    expect(violation).not.toBeNull();
    expect(violation.id).toBe(POLICY.id);
  });

  test('refuses a hostile story even when the title is ordinary', () => {
    const violation = findPolicyViolation({
      title: 'Neighbourhood project',
      story: 'The money will fund a march to drive Muslims out of the district.',
    });
    expect(violation).not.toBeNull();
  });

  test('refuses a hostile reward note', () => {
    const violation = findPolicyViolation({
      title: 'A quiet campaign',
      story: 'A community project.',
      reward_info: 'Your name on the list of people who hate Islam.',
    });
    expect(violation).not.toBeNull();
  });

  test('refuses a hostile progress update', () => {
    const violation = findPolicyViolation({
      title: 'A quiet campaign',
      story: 'A community project.',
      body: 'Next week we burn the mosque.',
    });
    expect(violation).not.toBeNull();
  });
});

describe('campaigns that are not an attack on Islam', () => {
  const allowed = [
    ['a mosque roof', 'Put a new roof on the village mosque before the rains'],
    ['a madrasa library', 'A library for the madrasa, with books for the children'],
    ['a Ramadan drive', 'A Ramadan food drive for two hundred families'],
    ['an Islamic charity', 'An Islamic charity that feeds families through the winter'],
    ['a Muslim-led cooperative', 'Support for a Muslim-led women\'s cooperative'],
    ['the history of Islamic art', 'A travelling exhibition on the history of Islamic art'],
    ['interfaith dialogue', 'A series of interfaith dialogue meetings in the city'],
    ['a Muslim community garden', 'A community garden run by the Muslim community centre'],
    ['Zakat for orphans', 'Collect zakat for orphans in the district'],
    ['a Muslim community hall', 'Repair the roof of the Muslim community hall'],
    ['an ordinary campaign', 'A clinic queue that works offline in rural villages'],
  ];

  test.each(allowed)('allows %s', (_label, text) => {
    expect(findPolicyViolation({ title: text, story: text })).toBeNull();
    expect(isPublishable({ title: text, story: text })).toBe(true);
  });

  test('ignores empty fields', () => {
    expect(findPolicyViolation({ title: '', story: '', reward_info: '' })).toBeNull();
    expect(findPolicyViolation({})).toBeNull();
  });

  test('a campaign with no text at all is publishable', () => {
    expect(isPublishable({})).toBe(true);
  });
});

describe('campaigns about music', () => {
  const refused = [
    ['the music category', { title: 'A record session', story: 'Forty musicians, one barn.', category: 'Music' }],
    ['the category in another case', { title: 'A record session', story: 'Forty musicians.', category: 'music' }],
    ['music in the title', { title: 'A community music school', story: 'Free lessons for the children.' }],
    ['music in the story', { title: 'A weekend', story: 'The money funds live music at the village hall.' }],
    ['a song', { title: 'Record our anthem', story: 'We will press the song on vinyl.' }],
    ['an album', { title: 'The village album', story: 'Twelve songs, pressed and sold at the shows.' }],
    ['a concert', { title: 'The winter concert', story: 'A one-night concert to raise the funds.' }],
    ['an orchestra', { title: 'The school orchestra', story: 'Instruments for the school orchestra.' }],
    ['an instrument', { title: 'Pianos for the hall', story: 'Two pianos so the children can practise.' }],
  ];

  test.each(refused)('refuses %s', (_label, campaign) => {
    const violation = findPolicyViolation(campaign);
    expect(violation).not.toBeNull();
    expect(violation.id).toBe('no-music');
  });

  test('campaigns that are not about music are allowed', () => {
    const allowed = [
      { title: 'A new roof for the village mosque', story: 'The roof leaks in the rains.' },
      { title: 'A clinic queue that works offline', story: 'Rural clinics lose days to a queue.' },
      { title: 'A community hall', story: 'A hall for the neighbourhood meetings.' },
      { title: 'The night market print residency', story: 'Twelve artists with a printing press.' },
      { title: 'Exam prep for nurses', story: 'Evening classes for nurses sitting exams.' },
    ];
    for (const campaign of allowed) {
      expect(findPolicyViolation(campaign)).toBeNull();
    }
  });

  test('the refusal names the music policy', () => {
    const violation = findPolicyViolation({ title: 'A community music school' });
    expect(violation.id).toBe('no-music');
    expect(violation.message).toMatch(/music/i);
  });
});

describe('the refusal itself', () => {
  test('names the policy and does not repeat the offending text', () => {
    const violation = findPolicyViolation({ title: 'Destroy Islam from the face of the earth' });
    expect(violation.id).toBe(POLICY.id);
    expect(violation.message).toBe(POLICY.message);
    expect(violation.message).not.toMatch(/destroy islam/i);
    expect(violation.rule).toEqual(expect.any(String));
  });
});

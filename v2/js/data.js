// Sportswash & Go v2: content and tuning numbers.
// All clubs, states and people are fictional parodies. Real-world references
// are limited to matters of public record.

export const SEASONS = 5;
export const SEASON_SECONDS = 90; // real seconds per season at 1x speed
export const WEEKS = 38;
export const SQUAD_SHARE = 0.7;   // share of booked revenue that reaches the squad
export const DEAL_TERM = 3;       // seasons a recurring deal lasts
export const MAX_CHARGES = 3;     // proven charges before expulsion

// spendLo/spendHi: £m squad spend range of rival clubs in the division.
// scale: £m that one "unit" of money is worth at this level.
export const DIVISIONS = [
  { tier: 1, name: 'Premier League', teams: 20, up: 0, down: 3, scale: 10, base: 250, spendLo: 120, spendHi: 650, lossLimit: 35, scrutiny: 1.4, ptsPenalty: 10, regulator: 'the Independent Commission' },
  { tier: 2, name: 'Championship', teams: 24, up: 2, down: 3, scale: 3, base: 35, spendLo: 18, spendHi: 90, lossLimit: 13, scrutiny: 1.1, ptsPenalty: 12, regulator: 'the EFL' },
  { tier: 3, name: 'League One', teams: 24, up: 2, down: 0, scale: 1, base: 10, spendLo: 5, spendHi: 22, lossLimit: 6, scrutiny: 0.9, ptsPenalty: 12, regulator: 'the EFL' },
];

export const START = { tier: 2, revFactor: 0.6, fans: 55, spend: 20 };

// Deal bubbles. value is in division-scale units, before inflation.
// kind: recurring (booked every season for DEAL_TERM seasons),
//       oneoff (booked this season only),
//       offbook (straight to the squad, never in the accounts, leaks evidence).
export const METHODS = [
  { id: 'airline', emoji: '✈️', name: 'State Airline shirt deal', kind: 'recurring', value: 1.5, heat: 4, weight: 4 },
  { id: 'partners', emoji: '\u{1F310}', name: 'Mysterious Global Partners', kind: 'recurring', value: 1.2, heat: 5, weight: 4 },
  { id: 'sister', emoji: '\u{1F501}', name: 'Sister-club transfer', kind: 'oneoff', value: 2, heat: 6, weight: 3 },
  { id: 'stadium', emoji: '\u{1F3DF}️', name: 'Sell the stadium to yourself', kind: 'oneoff', value: 5, heat: 12, weight: 1 },
  { id: 'image', emoji: '\u{1F5BC}️', name: 'Image rights via Bermuda', kind: 'offbook', value: 2, heat: 9, weight: 2 },
];

// How far over fair market value a deal is. Bigger = richer and far hotter.
export const INFLATION = [
  { mult: 1, p: 0.6, label: 'Fair value' },
  { mult: 2, p: 0.3, label: 'Generous' },
  { mult: 4, p: 0.1, label: 'Absurd' },
];

// The rest of the world's richest clubs, £m revenue in season 1 (+4%/season).
export const MONEY_LEAGUE = [
  { name: 'Real Madrigal', revenue: 860 },
  { name: 'Paris Sportif', revenue: 805 },
  { name: 'Bavaria Munich', revenue: 765 },
  { name: 'Barcelonga', revenue: 760 },
  { name: 'Manchester Untied', revenue: 650 },
  { name: 'Liverpudlian FC', revenue: 715 },
  { name: 'Arsenale', revenue: 715 },
  { name: 'Spurious Hotspur', revenue: 615 },
  { name: 'Borussia Dortmundo', revenue: 500 },
  { name: 'Juventude', revenue: 430 },
];
export const RIVAL_GROWTH = 1.04;

export const TOWNS = ['Grimsworth', 'Muddleton', 'Slagby', 'Bramblewick', 'Crumpton', 'Dunmere', 'Fogbury', 'Gristleford', 'Hollowell', 'Kettlesby', 'Lowmarsh', 'Netherby', 'Oddington', 'Puddlecombe', 'Rotherwick', 'Scunthwaite', 'Thistlebridge', 'Upchurch', 'Wetherfold', 'Yarmley', 'Bogside', 'Clattering', 'Drabford', 'Eggleston'];
export const SUFFIXES = ['United', 'Rovers', 'Athletic', 'Town', 'City', 'Wanderers', 'Albion', 'County'];

// Choice cards. fx keys: heat, case, fans, brand (fractional), spend and oneoff
// (division-scale units), points. Optional risk: { p, fx, news } fires on a roll.
export const CARDS = [
  { id: 'broadsheet', who: '\u{1F4F0}', speaker: 'A broadsheet journalist',
    text: 'How does a club with 9,000 season-ticket holders earn more from an airline than the airline earns from flights?',
    left: { label: 'Credit our "commercial genius"', fx: { heat: 5, fans: 2 } },
    right: { label: 'Ban them from the press box', fx: { heat: 2, fans: 5, case: 4 } } },
  { id: 'auditors', who: '\u{1F9EE}', speaker: 'Your finance director',
    text: 'The auditors would like to see the actual airline contract.',
    left: { label: 'Send the real one', fx: { case: 10, heat: -12 } },
    right: { label: 'Send a "summary"', fx: { heat: 8, case: 3 } } },
  { id: 'striker', who: '\u{1F9E2}', speaker: 'Your manager',
    text: 'I need a world-class striker. Now. Or I walk.',
    left: { label: 'Back him, whatever it costs', fx: { spend: 3, fans: 5, heat: 4 } },
    right: { label: 'Trust the academy', fx: { fans: -7 } } },
  { id: 'tickets', who: '\u{1F39F}️', speaker: 'Commercial team',
    text: 'Ticket prices up 40%? The "global fanbase" won\'t notice.',
    left: { label: 'It\'s the market', fx: { fans: -12, oneoff: 1 } },
    right: { label: 'Freeze prices', fx: { fans: 6 } } },
  { id: 'agent', who: '\u{1F574}️', speaker: 'A super-agent',
    text: 'For a small "facilitation fee" via Jersey, the player is yours.',
    left: { label: 'Pay through Jersey', fx: { spend: 4, heat: 10 } },
    right: { label: 'Decline politely', fx: { heat: -3 } } },
  { id: 'ngo', who: '\u{1F30D}', speaker: 'A human-rights NGO',
    text: 'Our new report mentions your owner 34 times.',
    left: { label: 'Launch a charity foundation', fx: { heat: -8, spend: -1 } },
    right: { label: 'Call it "politically motivated"', fx: { heat: 6, fans: 3 } } },
  { id: 'vote', who: '\u{1F5F3}️', speaker: 'Rival chairmen',
    text: 'We want a vote on tightening associated-party rules.',
    left: { label: 'Wine and dine the voters', fx: { heat: 6, case: -8 } },
    right: { label: 'Let it pass', fx: { case: 8 } } },
  { id: 'pundit', who: '\u{1F4FA}', speaker: 'A TV pundit',
    text: 'This club is a state PR department in shin pads.',
    left: { label: 'Sue for defamation', fx: { heat: 8, fans: 4 } },
    right: { label: 'Ignore it', fx: { fans: -3 } } },
  { id: 'phish', who: '\u{1F4BB}', speaker: 'IT helpdesk',
    text: 'Someone in Accounts clicked a "parcel delivery" link.',
    left: { label: 'Fund a security overhaul', fx: { spend: -1.5 } },
    right: { label: 'It\'s probably fine', fx: {}, risk: { p: 0.5, fx: { case: 18, heat: 12 }, news: 'LEAKED: thousands of club emails dumped online' } } },
  { id: 'minister', who: '\u{1F3DB}️', speaker: 'A government minister',
    text: 'We\'d love your stadium for a trade-summit photo opportunity.',
    left: { label: 'Of course, Minister', fx: { heat: -7, fans: -4 } },
    right: { label: 'Decline', fx: { heat: 4 } } },
  { id: 'amortise', who: '\u{1F9FE}', speaker: 'A creative accountant',
    text: 'We could spread those transfer fees over eight years. Totally legal. For now.',
    left: { label: 'Do it', fx: { case: -10 }, risk: { p: 0.35, fx: { case: 25 }, news: 'Rule change! Amortisation clawed back retroactively' } },
    right: { label: 'Stay boring', fx: {} } },
  { id: 'whistle', who: '\u{1F4E2}', speaker: 'HR', minHeat: 45,
    text: 'A junior accountant says they\'re "uncomfortable" with some invoices.',
    left: { label: 'Promote them (with an NDA)', fx: { heat: -10, spend: -0.5 } },
    right: { label: 'Let HR handle it', fx: {}, risk: { p: 0.5, fx: { case: 20 }, news: 'Whistleblower hands file to regulator' } } },
  { id: 'gala', who: '\u{1F37E}', speaker: 'The referees\' association',
    text: 'Would you sponsor our annual gala? Purely social, of course.',
    left: { label: 'Sponsor generously', fx: { points: 3, heat: 10 } },
    right: { label: 'Decline', fx: {} } },
  { id: 'keeper', who: '\u{1F501}', speaker: 'Your sister club in Belgium',
    text: 'We\'d love to buy your third-choice keeper. Shall we say £40m?',
    left: { label: 'What a fair price', fx: { oneoff: 4, heat: 12 } },
    right: { label: 'Decline', fx: {} } },
  { id: 'protest', who: '\u{1FAA7}', speaker: 'The supporters\' trust', maxFans: 40,
    text: 'Thousands are marching with "Not For Sale" banners.',
    left: { label: 'Meet the trust', fx: { fans: 12, heat: 3 } },
    right: { label: 'Hire more stewards', fx: { fans: -6 } } },
];

// What the regulator's man says when you lose.
export const TAUNTS = [
  'Derek from the League would like a word.',
  'Derek has found the spreadsheet.',
  'Derek is laughing. Derek never laughs.',
  'Derek has framed your airline contract.',
];

// --- The Back Room: secret meetings that might be newspaper stings ------------
// Based on public-record undercover stings, such as the 2016 Telegraph
// investigation that ended an England manager's tenure after one match.
// Each option: tone (safe | bold | reckless), tape (how incriminating it is if
// the room is wired), fx (same keys as cards, plus deal: a recurring deal).
export const NEWSPAPER = 'The Sunday Clarion';
export const STING = {
  base: 0.06,        // chance a room is wired at zero heat
  perHeat: 0.18,     // extra chance at full heat
  perSting: 0.08,    // papers sniff harder after each published sting
  tellIfWired: 0.55, // chance a round shows a tell when the room is wired
  tellIfClean: 0.2,  // chance of a red-herring tell when it isn't
  injunction: 0.4,   // chance a super-injunction kills the story
  weeks: [2, 4],     // weeks between "seeking comment" and the front page
};

export const TELLS = [
  'He asks you to repeat the figure, "just so I\'m clear".',
  'There\'s a small, neat hole in the fruit bowl.',
  'His company\'s website went live last Tuesday.',
  'He orders a sparkling water and never touches it.',
  'His cufflink seems to blink.',
  'He keeps angling his briefcase towards you.',
  'The hotel suite was booked under the name "Mr Clarion".',
  'He laughs a beat too late at all your jokes.',
];
export const SMALL_TALK = [
  'The coffee is excellent.',
  'He talks about golf for ten minutes.',
  'Somewhere below, a string quartet is murdering Vivaldi.',
  'He admires your watch. You admire his.',
  'The view of the marina is spectacular.',
];

export const CONTACTS = [
  { id: 'investor', who: '\u{1F935}', name: 'An "investor" from Pinnacle Horizon Holdings', risk: 0.04,
    intro: 'A smiling man in a hotel suite says his clients are "very keen on English football".',
    rounds: [
      { prompt: 'My clients want a slice of your players\' transfer rights. Is that... allowed?',
        options: [
          { tone: 'safe', label: 'Strictly by the book, I\'m afraid.', tape: 0, fx: {} },
          { tone: 'bold', label: 'There are ways round it.', tape: 1, fx: { spend: 2 } },
          { tone: 'reckless', label: 'Rules are for small clubs. Here\'s how we did it last time.', tape: 2, fx: { spend: 4 } },
        ] },
      { prompt: 'And the regulator? Would they need to know?',
        options: [
          { tone: 'safe', label: 'Everything goes through the lawyers.', tape: 0, fx: {} },
          { tone: 'bold', label: 'They only see what we file.', tape: 1, fx: { case: -6 } },
          { tone: 'reckless', label: 'Derek owes me a favour. Several.', tape: 2, fx: { case: -12 } },
        ] },
      { prompt: 'Shall we say a £400,000 "speaking fee" for you personally?',
        options: [
          { tone: 'safe', label: 'I\'ll have to decline.', tape: 0, fx: { heat: -5 } },
          { tone: 'bold', label: 'Paid to a consultancy, perhaps.', tape: 1, fx: { oneoff: 2 } },
          { tone: 'reckless', label: 'Cash. In a bag. Today.', tape: 2, fx: { oneoff: 4 } },
        ] },
    ] },
  { id: 'fixer', who: '\u{1F9D4}', name: 'A minister\'s "fixer"', risk: 0.02,
    intro: 'In a private members\' club, a man who "doesn\'t officially work for anyone" pours two whiskies.',
    rounds: [
      { prompt: 'The ministry would love a new partnership with your club. How big?',
        options: [
          { tone: 'safe', label: 'Market rate, independently valued.', tape: 0, fx: { deal: 1 } },
          { tone: 'bold', label: 'Whatever makes the accounts work.', tape: 1, fx: { deal: 2.5 } },
          { tone: 'reckless', label: 'Ten times market rate. We\'ll call it "brand synergy".', tape: 2, fx: { deal: 5 } },
        ] },
      { prompt: 'The new football regulator. Friendly faces on the board would help, no?',
        options: [
          { tone: 'safe', label: 'I couldn\'t possibly comment.', tape: 0, fx: {} },
          { tone: 'bold', label: 'I have a few names in mind.', tape: 1, fx: { case: -8 } },
          { tone: 'reckless', label: 'Put my brother-in-law in charge of it.', tape: 2, fx: { case: -15 } },
        ] },
      { prompt: 'And the journalists asking questions about all this?',
        options: [
          { tone: 'safe', label: 'They\'re just doing their jobs.', tape: 0, fx: { heat: -4 } },
          { tone: 'bold', label: 'A few lawyers\' letters should do it.', tape: 1, fx: { heat: -8 } },
          { tone: 'reckless', label: 'Find out where they live.', tape: 3, fx: { heat: -15 } },
        ] },
    ] },
  { id: 'agent', who: '\u{1F574}️', name: 'A super-agent', risk: 0.03,
    intro: 'On a yacht in the marina, a man with three phones waves you aboard.',
    rounds: [
      { prompt: 'My client will sign for you. But he needs... encouragement.',
        options: [
          { tone: 'safe', label: 'He gets the contract. That\'s it.', tape: 0, fx: {} },
          { tone: 'bold', label: 'Image rights, through Bermuda.', tape: 1, fx: { spend: 2.5 } },
          { tone: 'reckless', label: 'A "loyalty bonus" nobody needs to know about.', tape: 2, fx: { spend: 5 } },
        ] },
      { prompt: 'And for me? A small fee, for my trouble.',
        options: [
          { tone: 'safe', label: 'The standard agent\'s fee.', tape: 0, fx: {} },
          { tone: 'bold', label: 'Split across three of your companies.', tape: 1, fx: { spend: 1.5 } },
          { tone: 'reckless', label: 'Name your number. Cash is fine.', tape: 2, fx: { spend: 3 } },
        ] },
      { prompt: 'The manager would like a cut too. He\'s on the deck.',
        options: [
          { tone: 'safe', label: 'Tell him to get off my boat.', tape: 0, fx: { fans: 2 } },
          { tone: 'bold', label: 'He can have a "consultancy".', tape: 1, fx: { spend: 1.5 } },
          { tone: 'reckless', label: 'Get him down here. Bring the envelope.', tape: 2, fx: { spend: 3 } },
        ] },
    ] },
  { id: 'referee', who: '\u{1F9D1}‍⚖️', name: 'A "friend" of the referees\' association', risk: 0.05,
    intro: 'In the back of a restaurant, a man in a blazer orders the most expensive wine on the list.',
    rounds: [
      { prompt: 'The lads work so hard. A holiday would do them good, wouldn\'t it?',
        options: [
          { tone: 'safe', label: 'I\'m sure they\'ll book one.', tape: 0, fx: {} },
          { tone: 'bold', label: 'Our sponsors run a lovely resort.', tape: 1, fx: { points: 2 } },
          { tone: 'reckless', label: 'Five-star, all paid. Name the dates.', tape: 2, fx: { points: 4 } },
        ] },
      { prompt: 'There\'s a big match next month. Tight decisions can go either way.',
        options: [
          { tone: 'safe', label: 'May the best team win.', tape: 0, fx: { fans: 2 } },
          { tone: 'bold', label: 'It would be nice if they went our way.', tape: 1, fx: { points: 2 } },
          { tone: 'reckless', label: 'Penalty in the 89th minute. Non-negotiable.', tape: 3, fx: { points: 5 } },
        ] },
      { prompt: 'And the VAR room? Very boring in there, I hear.',
        options: [
          { tone: 'safe', label: 'Let\'s leave VAR alone.', tape: 0, fx: {} },
          { tone: 'bold', label: 'Maybe a nice hamper.', tape: 1, fx: { points: 1 } },
          { tone: 'reckless', label: 'Send them a hamper. And a car.', tape: 2, fx: { points: 3 } },
        ] },
    ] },
];

// --- The transfer market: star signings with a hidden price -------------------
// Legends of days gone by, names lightly altered: affectionate parodies of
// players in their prime. The players themselves do nothing wrong in this game;
// the dodgy part is entirely how you fund the deal.
// rating drives how much stronger the squad gets.
export const LEGENDS = [
  { id: 'pele', name: 'Pelè', pos: 'Forward', rating: 95 },
  { id: 'maradona', name: 'Diego Marodona', pos: 'Forward', rating: 95 },
  { id: 'zidane', name: 'Zinedone Zidame', pos: 'Midfielder', rating: 94 },
  { id: 'cruyff', name: 'Johan Kroyff', pos: 'Forward', rating: 94 },
  { id: 'beckenbauer', name: 'Franz Breckenbauer', pos: 'Defender', rating: 93 },
  { id: 'distefano', name: 'Alfredo Di Stefanno', pos: 'Forward', rating: 93 },
  { id: 'puskas', name: 'Ferenc Pushcash', pos: 'Forward', rating: 92 },
  { id: 'eusebio', name: 'Eusebiu', pos: 'Forward', rating: 91 },
  { id: 'yashin', name: 'Lev Yashkin', pos: 'Goalkeeper', rating: 91 },
  { id: 'best', name: 'Georgie Bestt', pos: 'Winger', rating: 91 },
  { id: 'maldini', name: 'Paolo Mandolini', pos: 'Defender', rating: 91 },
  { id: 'vanbasten', name: 'Marco van Basteen', pos: 'Forward', rating: 90 },
  { id: 'charlton', name: 'Bobby Charlston', pos: 'Midfielder', rating: 90 },
  { id: 'moore', name: 'Bobby Moor', pos: 'Defender', rating: 90 },
  { id: 'muller', name: 'Gerd Mueler', pos: 'Forward', rating: 90 },
  { id: 'garrincha', name: 'Garrincash', pos: 'Winger', rating: 89 },
  { id: 'banks', name: 'Gordon Bonds', pos: 'Goalkeeper', rating: 89 },
  { id: 'henry', name: 'Thierry Hendry', pos: 'Forward', rating: 89 },
  { id: 'baggio', name: 'Roberto Baggie-o', pos: 'Forward', rating: 88 },
  { id: 'shilton', name: 'Peter Shiltern', pos: 'Goalkeeper', rating: 88 },
  { id: 'gullit', name: 'Rudd Gullet', pos: 'Midfielder', rating: 88 },
  { id: 'dalglish', name: 'Kenny Dalgleash', pos: 'Forward', rating: 87 },
  { id: 'matthews', name: 'Stanley Mathers', pos: 'Winger', rating: 87 },
  { id: 'zoff', name: 'Dino Zoft', pos: 'Goalkeeper', rating: 86 },
  { id: 'gascoigne', name: 'Paul Gasgoine', pos: 'Midfielder', rating: 86 },
  { id: 'lineker', name: 'Gary Linekar', pos: 'Forward', rating: 85 },
  { id: 'keegan', name: 'Kevin Keeghan', pos: 'Forward', rating: 85 },
  { id: 'rush', name: 'Ian Rash', pos: 'Forward', rating: 84 },
];

// How to pay the gap between the public fee and the real asking price.
// heat: base heat for a typical gap; uses: which method the regulator learns.
export const FUNNELS = [
  { id: 'honest', name: 'Pay it all, honestly', desc: 'Owner equity. No heat at all, but it counts against the loss limit.', heat: 0 },
  { id: 'bermuda', name: 'Image rights via Bermuda', desc: 'Never touches the accounts. Hot, and a document will leak.', heat: 9, uses: 'image' },
  { id: 'sister', name: 'Sister-club "loan fee"', desc: 'Routed through your Belgian sister club.', heat: 6, uses: 'sister' },
  { id: 'agent', name: 'Agent "consultancy"', desc: 'Paid to the agent\'s Jersey company. Cooler, but agents talk.', heat: 4, uses: 'agent',
    risk: { p: 0.3, case: 12, news: 'The agent\'s ex-partner sells the "consultancy" story to the papers.' } },
];

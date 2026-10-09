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

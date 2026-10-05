// All clubs, states and people in this game are fictional parodies.
// Real-world references are limited to matters of public record.

export const SEASONS = 10;

// Your state's sovereign wealth fund, in £m. For scale.
export const FUND = 600000;

// scale: roughly £m needed to move squad strength meaningfully in that tier.
// scrutiny: how hard the regulator looks. lossLimit: £m of owner-funded losses
// allowed per season before a cost-control breach (Infinity = no real limit).
export const DIVISIONS = [
  {
    id: 'prem', name: 'Premier League', tier: 1, teams: 20,
    scale: 10, scrutiny: 1.6, lossLimit: 35, baseRevenue: 250,
    regulator: 'Premier League Independent Commission',
    rules: 'Spending is tied to revenue: Profit & Sustainability allowed ~£105m of losses over 3 seasons, and from 2026/27 a Squad Cost Ratio caps squad spending as a share of revenue. Deals with companies linked to the owner are checked against fair market value. The new Independent Football Regulator also watches.',
    ptsPenalty: 10,
  },
  {
    id: 'champ', name: 'Championship', tier: 2, teams: 24,
    scale: 3, scrutiny: 1.2, lossLimit: 13, baseRevenue: 35,
    regulator: 'EFL Disciplinary Commission',
    rules: 'EFL Profit & Sustainability (max £39m losses over 3 seasons), Owners’ & Directors’ Test, plus the Independent Football Regulator.',
    ptsPenalty: 12,
  },
  {
    id: 'l1', name: 'League One', tier: 3, teams: 24,
    scale: 1, scrutiny: 0.9, lossLimit: 40, baseRevenue: 10,
    regulator: 'EFL Disciplinary Commission',
    rules: 'Salary Cost Management Protocol: squad costs capped at 60% of turnover — but owner equity counts as turnover, so honest cash is mostly fine.',
    ptsPenalty: 12,
  },
  {
    id: 'l2', name: 'League Two', tier: 4, teams: 24,
    scale: 0.6, scrutiny: 0.8, lossLimit: 25, baseRevenue: 5,
    regulator: 'EFL Disciplinary Commission',
    rules: 'Salary Cost Management Protocol at 55% of turnover. Owner equity counts, so honesty is (shockingly) an option.',
    ptsPenalty: 12,
  },
  {
    id: 'nl', name: 'National League', tier: 5, teams: 24,
    scale: 0.3, scrutiny: 0.6, lossLimit: Infinity, baseRevenue: 2.5,
    regulator: 'National League Board',
    rules: 'Light-touch. Hollywood actors have bought clubs here and nobody blinked.',
    ptsPenalty: 9,
  },
  {
    id: 'nlns', name: 'National League North / South', tier: 6, teams: 24,
    scale: 0.15, scrutiny: 0.45, lossLimit: Infinity, baseRevenue: 0.8,
    regulator: 'National League Board (regional desk)',
    rules: 'An auditor visits once a year, mostly for the pie.',
    ptsPenalty: 6,
  },
  {
    id: 'step3', name: 'Northern Premier / Isthmian / Southern League', tier: 7, teams: 22,
    scale: 0.08, scrutiny: 0.35, lossLimit: Infinity, baseRevenue: 0.25,
    regulator: 'County FA Disciplinary Panel',
    rules: 'Rules exist. They are in a ring binder. The ring binder is in Derek’s shed.',
    ptsPenalty: 3,
  },
  {
    id: 'sunday', name: 'Sunday League Division 6', tier: 8, teams: 12,
    scale: 0.01, scrutiny: 0.2, lossLimit: Infinity, baseRevenue: 0.004,
    regulator: 'Derek (League Secretary, also referees)',
    rules: 'Subs are £5 a week. Derek will ask where the new kits came from. Derek can be bought with a bacon roll.',
    ptsPenalty: 3,
  },
];

// strength 0-100 within its own division, price in £m, revFactor scales division baseRevenue.
export const CLUBS = {
  prem: [
    { name: 'Manchester Citeh', nick: 'The Accountants', price: 2500, strength: 70, revFactor: 2.8, flavour: 'Already suspiciously good. Comes with a pre-installed legal department.' },
    { name: 'Neverpool', nick: 'The Kopites', price: 4000, strength: 66, revFactor: 2.4, flavour: 'Will never let you forget 2005.' },
    { name: 'Arsenhal', nick: 'The Gooners', price: 3800, strength: 64, revFactor: 2.3, flavour: 'Second place is a lifestyle.' },
    { name: 'Chelski', nick: 'The Blues (and Blues, and Blues)', price: 3500, strength: 55, revFactor: 2.0, flavour: 'Squad of 47 midfielders on 9-year contracts.' },
    { name: 'Tottenham Hotspurt', nick: 'The Lilywhites', price: 3000, strength: 50, revFactor: 2.0, flavour: 'Beautiful stadium. The cheese room is world-class.' },
    { name: 'Brentfjord', nick: 'The Bees', price: 700, strength: 42, revFactor: 0.7, flavour: 'Run entirely by a betting algorithm. Respect.' },
  ],
  champ: [
    { name: 'Ipswich Clown', nick: 'The Tractor Boys', price: 400, strength: 60, revFactor: 1.9, flavour: 'Yo-yo club. The yo-yo is also for sale.' },
    { name: 'Birmingham Citadel', nick: 'The Blues', price: 350, strength: 55, revFactor: 1.5, flavour: 'Already has a famous American quarterback involved. Bring a bigger cheque.' },
    { name: 'Wrexham Hollywood AFC', nick: 'The Red Carpet', price: 450, strength: 52, revFactor: 1.8, flavour: 'Already owned by celebrities. You’d be outbidding Deadpool.' },
    { name: 'Sheffield Wednesday-ish', nick: 'The Owls', price: 60, strength: 40, revFactor: 0.8, flavour: 'Previously sold its own stadium to its own owner. Experienced.' },
    { name: 'Derby Countdown', nick: 'The Rams', price: 80, strength: 44, revFactor: 0.9, flavour: 'Knows exactly what an EFL charge sheet looks like.' },
  ],
  l1: [
    { name: 'Real Oldham', nick: 'The Latics', price: 15, strength: 50, revFactor: 1.0, flavour: 'Galacticos of the Pennines.' },
    { name: 'Stockport Countless', nick: 'The Hatters', price: 25, strength: 58, revFactor: 1.4, flavour: 'Counts everything. Except how they got good.' },
    { name: 'Bolton Wanderless', nick: 'The Trotters', price: 30, strength: 55, revFactor: 1.5, flavour: 'Has wandered. Would like to stop.' },
    { name: 'Inter Milton Keynes', nick: 'The Roundabouts', price: 20, strength: 45, revFactor: 1.0, flavour: 'Exciting, controversial, surrounded by roundabouts.' },
  ],
  l2: [
    { name: 'Accrington Stanley Kubrick', nick: 'The Reds', price: 6, strength: 45, revFactor: 0.8, flavour: '"Who are they?" "Exactly."' },
    { name: 'Grimsby Twin Towns', nick: 'The Mariners', price: 8, strength: 50, revFactor: 1.1, flavour: 'Technically in Cleethorpes. Don’t ask.' },
    { name: 'Forest Green Vegans', nick: 'The Tofu Boys', price: 7, strength: 48, revFactor: 0.9, flavour: 'Your oil money may cause a small identity crisis here.' },
    { name: 'Bristol Rovers Return', nick: 'The Gas', price: 9, strength: 52, revFactor: 1.2, flavour: 'Nickname is literally "The Gas". Perfect fit.' },
  ],
  nl: [
    { name: 'Dagenham & Redbrick', nick: 'The Daggers', price: 2, strength: 50, revFactor: 1.0, flavour: 'Fully detached, open plan, needs work.' },
    { name: 'Yeovil Tow-n', nick: 'The Glovers', price: 1.5, strength: 46, revFactor: 0.9, flavour: 'Famous for gloves and giant-killing.' },
    { name: 'Sutton Unitedish', nick: 'The U’s', price: 1.8, strength: 52, revFactor: 1.1, flavour: 'Artificial pitch. Artificial accounts would match.' },
  ],
  nlns: [
    { name: 'Spennymoor Than Ever', nick: 'The Moors', price: 0.6, strength: 50, revFactor: 1.0, flavour: 'More ambition than ever.' },
    { name: 'Chorley Wonka', nick: 'The Magpies', price: 0.5, strength: 46, revFactor: 0.9, flavour: 'Golden ticket not included.' },
    { name: 'Dartford Vader', nick: 'The Darts', price: 0.7, strength: 52, revFactor: 1.1, flavour: 'Join the dark side. We have funding.' },
  ],
  step3: [
    { name: 'Sporting Ditchwater', nick: 'The Ditchers', price: 0.15, strength: 48, revFactor: 1.0, flavour: 'Ground shares with a cricket club and a goat.' },
    { name: 'Athletico Little Snoring', nick: 'The Snorers', price: 0.12, strength: 44, revFactor: 0.8, flavour: 'Real village. Real name. Look it up.' },
    { name: 'Bishops Stortfordless', nick: 'The Blues', price: 0.2, strength: 52, revFactor: 1.2, flavour: 'Clubhouse does an excellent Sunday roast.' },
  ],
  sunday: [
    { name: 'Dog & Duck FC', nick: 'The Quackers', price: 0.002, strength: 50, revFactor: 1.0, flavour: 'Pub team. Three players are called Dave.' },
    { name: 'Real Mandrid (Hackney)', nick: 'The Hungover', price: 0.001, strength: 42, revFactor: 0.7, flavour: 'Kick-off 10:30. Squad arrives 10:55.' },
    { name: 'Inter Nazionale de Croydon', nick: 'The Kebabs', price: 0.003, strength: 55, revFactor: 1.2, flavour: 'Sponsored by the chippy. You could outbid the chippy.' },
  ],
};

export const STATES = [
  'The Grand Duchy of Offshoria',
  'The Petro-Republic of Barrelstan',
  'The Federated Isles of Loopholia',
  'The Sovereign Wealth Fund of Nowhere-in-Particular',
  'The United Kingdom of Plausible Deniability',
];

export const TITLES = [
  'His Excellency',
  'Her Excellency',
  'Their Excellency',
  'Deputy Prime Minister for Sport and Unrelated Matters',
  'Chairman (Totally Independent, Promise)',
];

// kind:
//   equity    - honest owner cash. Invisible, but counts as a loss under FFP-style rules.
//   recurring - booked as revenue every season (multi-year deals). The slider sets the annual value.
//   oneoff    - booked as revenue this season only (asset and player sales).
//   offbook   - wages paid secretly from elsewhere. Never in the accounts, so no loss, but very risky.
// risk: suspicion weight (0 = invisible to regulators).
// capX: fair-market ceiling as a multiple of the club's *genuine* revenue. It grows as you win.
//   Anything above the ceiling is far more suspicious.
// once: can only be used once per game (you only have one stadium).
export const METHODS = [
  {
    id: 'equity', name: 'Boring Legal Equity Injection', emoji: '\u{1F610}',
    risk: 0, kind: 'equity', capX: Infinity,
    theory: 'You buy new shares in the club. Completely legal and transparent. The catch: spending it on wages and transfers still counts as losses under cost-control rules. Money for stadiums, academies, women’s football and community work is excluded.',
    redFlags: 'None. It’s legal. The only risk is breaking the loss limit, which is automatic and fast.',
    precedent: 'Everton and Nottingham Forest were both docked points in 2023/24 for Profit & Sustainability breaches. Honest money, too much of it.',
  },
  {
    id: 'sponsor', name: 'State Airline Shirt Deal', emoji: '✈️',
    risk: 0.6, kind: 'recurring', capX: 0.6,
    theory: 'A company linked to the owner sponsors the shirt, the sleeve and the training bibs on a 10-year deal. It is booked as "commercial revenue" every season, which raises how much you are allowed to spend. The trick is to grow it in step with your success. A trophy-winning club can justify a far bigger deal than a mid-table one.',
    redFlags: 'Since 2021 the Premier League has checked Associated Party Transactions (APTs) against "fair market value". A deal worth far more than your club’s pulling power gets flagged.',
    precedent: 'Premier League clubs voted in the APT rules just after the 2021 Newcastle takeover. A 2024 tribunal found parts of those rules unlawful after a club challenged them, and they have been amended since.',
  },
  {
    id: 'partners', name: 'Mysterious Global Partners', emoji: '\u{1F35C}',
    risk: 0.45, kind: 'recurring', capX: 0.4,
    theory: 'Rather than one big suspicious deal, you sign 40 small recurring ones: Official Noodle Partner (Central Asia), Official Tyre Pressure Partner (EMEA). Each is plausible alone. Together they are a lot.',
    redFlags: 'Regulators look at who ultimately owns each partner. If they all trace back to the same ministry, it stops being "global commercial reach".',
    precedent: 'Regional partnership deals are a normal, legitimate part of football finance. The question is always who is really paying.',
  },
  {
    id: 'stadium', name: 'Sell the Stadium to Yourself', emoji: '\u{1F3DF}️',
    risk: 0.5, kind: 'oneoff', capX: 4.0, once: true,
    theory: 'A sister company owned by you buys the stadium at a generous valuation and leases it back. The club books a one-off profit on the sale. You still own the stadium. Everyone wins (you).',
    redFlags: 'Independent valuations, and when the sale is booked. Only works once, because you only have one stadium.',
    precedent: 'Derby County, Sheffield Wednesday and Aston Villa all sold grounds to owner-linked companies around 2018–2020. The EFL tightened its rules, and Sheffield Wednesday were later docked points over when their sale was booked in the accounts.',
  },
  {
    id: 'assets', name: 'Sell the Hotel / Car Park / Mascot to Your Parent Company', emoji: '\u{1F3E8}',
    risk: 0.55, kind: 'oneoff', capX: 1.0,
    theory: 'Like the stadium trick, but with smaller assets. Sell the club hotel, the women’s team or the car park to a company in the same group. Each sale is booked as profit.',
    redFlags: 'UEFA’s rules ignore these sales. Domestic regulators have been closing the gap. Selling the mascot raises eyebrows.',
    precedent: 'In 2023 and 2024 Chelsea reported selling hotels, and then its women’s team, to companies within its own ownership group. It was widely debated, and rule-makers have been reviewing it since.',
  },
  {
    id: 'multiclub', name: 'Multi-Club Model Transfer Magic', emoji: '\u{1F501}',
    risk: 0.7, kind: 'oneoff', capX: 0.8,
    theory: 'Buy a sister club somewhere sunny, then sell it your academy kids for big fees. Academy players have zero book value, so every penny is "pure profit".',
    redFlags: 'Transfers between related clubs are subject to fair-value checks. Paying £40m for a 19-year-old with three senior appearances is a giveaway.',
    precedent: 'A run of end-of-June player swaps between Premier League clubs in 2024 was widely criticised as accounting-driven. Multi-club ownership is now a major focus for regulators.',
  },
  {
    id: 'imagerights', name: 'Offshore Image Rights', emoji: '\u{1F334}',
    risk: 1.1, kind: 'offbook', capX: Infinity,
    theory: 'Part of a star’s pay goes from a separate company abroad, labelled as a fee for "image rights". It never appears on the club’s wage bill.',
    redFlags: 'Under the rules, clubs must disclose everything they pay players. If a third party pays wages, that is a classic breach. Tax authorities also take a keen interest.',
    precedent: 'Allegations that player and manager pay was not fully disclosed feature in some high-profile football cases. The clubs involved deny wrongdoing.',
  },
  {
    id: 'consultancy', name: 'Manager’s Lucrative Side Gig', emoji: '\u{1F4BC}',
    risk: 1.2, kind: 'offbook', capX: Infinity,
    theory: 'Your manager signs a modest club contract plus a very generous "consultancy" with a club in your home country. He advises them twice a year by text.',
    redFlags: 'Same disclosure duty as for players. Whistleblowers and leaked emails are how these usually come out.',
    precedent: 'Among the Premier League’s 2023 charges against Manchester City (the real one) were allegations about full disclosure of manager pay. The club denies all the charges.',
  },
  {
    id: 'tpo', name: 'Third-Party Ownership (sell slices of your players)', emoji: '\u{1F9E9}',
    risk: 0.5, kind: 'oneoff', capX: 1.5, banned: true,
    theory: 'An investment fund buys a share of your players’ future transfer value upfront. You get a lump of cash now, booked as income. The fund gets a cut when the player is sold. Instant money with no visible owner involved.',
    redFlags: 'It’s banned. FIFA outlawed third-party ownership in 2015. Using it risks a transfer embargo, not just a fine.',
    precedent: 'West Ham were fined £5.5m in 2007 over the Carlos Tevez and Javier Mascherano third-party ownership arrangements. FIFA banned the practice worldwide in 2015.',
  },
  {
    id: 'bungs', name: 'Inflated Agent Fees ("bungs")', emoji: '\u{1F91D}',
    risk: 1.0, kind: 'offbook', capX: Infinity, inquiry: true,
    theory: 'Overpay the agent on every transfer. The surplus quietly finds its way back to the right people, or pays a player off the books. The official fee looks almost plausible.',
    redFlags: 'Follow-the-money audits of intermediary fees, and television documentaries with hidden cameras.',
    precedent: 'The 2006 BBC Panorama "Undercover: Football’s Dirty Secrets" and the subsequent Lord Stevens inquiry examined hundreds of transfers for irregular payments to agents and managers.',
  },
  {
    id: 'briefcase', name: 'Brown Envelope at the Training Ground', emoji: '\u{1F4B0}',
    risk: 2.0, kind: 'offbook', capX: Infinity,
    theory: 'There is no theory.',
    redFlags: 'All of them. Every single one.',
    precedent: 'Please don’t.',
  },
];

// The EBT scheme is handled as its own method kind: invisible to the football
// regulator, but it builds a tax liability that a completely separate body --
// the taxman -- will eventually come for.
export const EBT = {
  id: 'ebt', name: 'Pay players via an offshore trust (EBT)', emoji: '\u{1F3DB}️',
  kind: 'ebt', taxRate: 0.45, // tax "saved" per £ routed, which becomes your liability
  theory: 'Instead of a normal salary, a chunk of a player’s pay goes as a "loan" from an Employee Benefit Trust — a loan everyone understands will never be repaid. It isn’t taxed as income, so you field a strong squad far more cheaply. The football regulator doesn’t even see it. The taxman eventually will.',
  redFlags: 'Her Majesty’s Revenue & Customs. Tax authorities move slowly, but they have the deepest pockets of any opponent and the courts tend to agree with them.',
  precedent: 'Rangers used Employee Benefit Trusts from 2001. HMRC pursued the "Big Tax Case"; the scheme was ultimately ruled unlawful by the UK Supreme Court in 2017. The old company had already been liquidated in 2012 and the club was reformed in the fourth tier.',
};

// A per-season legal (for now) accounting choice, not a money slider.
export const AMORTISATION = {
  id: 'amortise', name: 'Sign players on ultra-long contracts', emoji: '\u{1F4C6}',
  theory: 'Spread each transfer fee across a contract twice as long as normal. On paper your yearly cost halves, so you can spend far more before breaching the loss limit. Perfectly legal — today.',
  redFlags: 'The rule-makers notice when everyone starts doing it. If they cap contract lengths retroactively, all that deferred cost lands at once.',
  precedent: 'Chelsea handed out seven- and eight-year contracts in 2023 to spread transfer fees under FFP. UEFA responded by capping the accounting period at five years.',
};

// The taxman: a second enforcer, separate from football's regulators.
export const HMRC = {
  name: 'HM Revenue & Customs',
  caseDelayMin: 3, caseDelayMax: 5, // slow: the real case ran for years
  billMultiplier: 1.6,             // back-tax plus penalties and interest
  // If the bill exceeds this share of the club's genuine revenue, it's insolvency.
  liquidationRatio: 1.6,
};

export const LAWYERS = [
  { id: 'cousin', name: 'Your cousin who did a law module', costX: 0, delay: 1, defence: 0.05,
    blurb: 'Enthusiastic. Has a briefcase. The briefcase is empty.' },
  { id: 'firm', name: 'A respectable City law firm', costX: 2, delay: 2, defence: 0.3,
    blurb: 'Bills in six-minute increments, which add up to roughly a small country’s GDP.' },
  { id: 'everyone', name: 'Every KC in London (so the other side can’t hire them)', costX: 8, delay: 4, defence: 0.55,
    blurb: 'Disclosure will take years. Legal challenges will take more years. Some charges may become "time-barred". Fans will make banners.' },
];

// susp: suspicion change. strength: squad strength change. minTier/maxTier filter by division tier.
export const EVENTS = [
  { text: 'A hacker leaks 70 million of your emails to a German magazine. Headline: "THE WHOLE THING".', susp: 25, minTier: 1, maxTier: 2 },
  { text: 'Your shirt sponsor’s CEO goes on a podcast and can’t name a single player.', susp: 10 },
  { text: 'Eighteen rival clubs sign a strongly worded letter. They mostly agree on the font.', susp: 8, minTier: 1, maxTier: 1 },
  { text: 'A pundit says "Say what you like, they’ve earned it." Moments later, a regulator closes a tab.', susp: -6 },
  { text: 'A government minister visits the training ground and calls it "a fantastic investment in the region".', susp: -5, minTier: 1, maxTier: 3 },
  { text: 'Fans unveil a banner thanking the regulator for its patience.', susp: 3 },
  { text: 'Your finance director resigns "to spend more time with family in a non-extradition country".', susp: 15 },
  { text: 'Investigative journalists file a Freedom of Information request. Your state doesn’t have that law, but it rattles everyone.', susp: 7 },
  { text: 'You win a cup. In the open-top bus parade, nobody mentions the accounts.', susp: -8, strength: 2 },
  { text: 'Your star striker’s offshore company posts a thank-you selfie on Instagram. With a geotag.', susp: 12 },
  { text: 'Derek the League Secretary notices your Sunday League side has a nutritionist.', susp: 10, minTier: 8, maxTier: 8 },
  { text: 'The local paper runs: "Mystery Billionaire Buys Club, Promises Champions League by 2031".', susp: 4, minTier: 5, maxTier: 8 },
  { text: 'The Independent Football Regulator asks for "source of funds" documents. Your accountant asks which source.', susp: 9, minTier: 1, maxTier: 4 },
  { text: 'A rival owner complains on TV. He is also a billionaire, so nobody listens.', susp: 2 },
  { text: 'Your academy produces a genuinely brilliant player. It’s the only clean thing you own.', strength: 4 },
  { text: 'Your new £80m signing turns out to be allergic to grass.', strength: -4 },
];

// --- Cyber incident side mission -------------------------------------------
// The twist: your real secret isn't trophies, it's the accounts. A breach that
// exfiltrates data leaks HOW you've been inflating revenue. The more you've
// faked, the bigger the suspicion spike. Good security lets you get away with more.
//
// These vectors are named at awareness level only: what a defender has to plan
// for. The game is the response, not the attack. severity = how much data is at
// risk if you do nothing.
export const BREACH_VECTORS = [
  { id: 'phish', emoji: '\u{1F3A3}', severity: 0.7,
    name: 'Phishing email',
    flavour: 'An "URGENT: invoice from your law firm" email lands in the finance team’s inbox. Someone clicks. Attackers now have a foothold on the network.',
    lesson: 'Phishing is the number-one way breaches start. Defences: staff training, multi-factor authentication so a stolen password isn’t enough, and email filtering.' },
  { id: 'usb', emoji: '\u{1F50C}', severity: 0.6,
    name: 'Poisoned USB drop',
    flavour: 'Branded USB sticks appear in the training-ground car park. A curious kit man plugs one into a club laptop. It runs code the moment it mounts.',
    lesson: 'Never plug in unknown USB devices. Defences: disabling USB auto-run and mass-storage on work machines, and endpoint protection that blocks unknown devices.' },
  { id: 'vendor', emoji: '\u{1F517}', severity: 0.75,
    name: 'Compromised supplier',
    flavour: 'Your ticketing software vendor is hacked. The attackers ride the trusted connection straight into your systems. You didn’t do anything wrong — your supplier did.',
    lesson: 'A supply-chain attack. Defences: vetting vendors, limiting the access third parties get, and segmenting networks so one supplier can’t reach everything.' },
  { id: 'laptop', emoji: '\u{1F4BB}', severity: 0.5,
    name: 'Lost laptop',
    flavour: 'The finance director leaves a laptop on a train. It has the "real" spreadsheet on the desktop. Named, helpfully, final_REAL_do_not_share.xlsx.',
    lesson: 'Lost devices are a top cause of data loss. Defences: full-disk encryption (so a lost laptop is just scrap metal) and the ability to remote-wipe it.' },
  { id: 'insider', emoji: '\u{1F575}️', severity: 0.9,
    name: 'Disgruntled insider',
    flavour: 'An analyst you passed over for promotion starts quietly copying documents to a personal drive. The ultimate source: Football Leaks began with an insider.',
    lesson: 'Insider threats are hard. Defences: least-privilege access (people see only what they need), logging and alerting on bulk downloads, and treating leavers’ access carefully.' },
  { id: 'password', emoji: '\u{1F511}', severity: 0.55,
    name: 'Reused password',
    flavour: 'A board member used the same password for the club VPN and a shopping site that got breached years ago. Attackers try it. It works.',
    lesson: 'Credential stuffing. Defences: a password manager, unique passwords, and again multi-factor authentication, which stops a stolen password cold.' },
];

// Incident responses. containment = fraction of the at-risk data that STILL leaks
// after you act (lower is better). They teach real incident-response tradeoffs:
// speed vs thoroughness vs the temptation to cover it up.
export const RESPONSES = [
  { id: 'isolate', emoji: '⚡', name: 'Isolate and rotate — now',
    containment: 0.3, costX: 1, postureGain: 5,
    blurb: 'Pull affected machines off the network, force-reset every credential, revoke sessions. Fast and decisive. The textbook first move: contain before you investigate.',
    best: 'Speed. Every minute attackers stay in, more data goes out.' },
  { id: 'forensics', emoji: '\u{1F50E}', name: 'Call in a DFIR forensics firm',
    containment: 0.45, costX: 4, postureGain: 20,
    blurb: 'Specialists find exactly how far they got and close every door properly. Slower to stop the bleeding, but you come out genuinely more secure.',
    best: 'Thoroughness. You permanently harden the club, so future breaches hurt less.' },
  { id: 'coverup', emoji: '\u{1F648}', name: 'Pay them off and keep it quiet',
    containment: 0.5, costX: 3, postureGain: 0, risky: true,
    blurb: 'Quietly pay the attackers and tell no one. Sometimes it works. Sometimes they take the money and leak it anyway — and now you’ve hidden a breach too.',
    best: 'Nothing, really. Covering up a breach is how a bad day becomes a scandal.' },
  { id: 'nothing', emoji: '\u{1F648}', name: 'Hope it blows over',
    containment: 1, costX: 0, postureGain: 0,
    blurb: 'Do nothing and pray. The attackers help themselves for as long as they like.',
    best: 'Saving money, right up until everything you’ve ever done is on the front page.' },
];

// --- Obstruction / non-cooperation side mission ----------------------------
// After each season you can throw sand in the regulator's gears. These mirror
// real disclosure-battle tactics. They raise your "cover level", which means
// fewer charges stick and verdicts take longer (helping charges become
// time-barred) -- but stonewalling is itself suspicious, and non-cooperation
// is a chargeable offence in its own right. The game is clear these are the
// dodgy bits.
export const OBSTRUCTIONS = [
  { id: 'flatten', emoji: '\u{1F5BC}️', name: 'Hand everything over as flattened scans', coverGain: 16, costX: 0.5,
    blurb: 'Comply "fully" by providing 40,000 pages as images no one can search, copy or paste. Technically cooperation. Practically a paper wall.',
    real: 'Producing documents in deliberately unusable formats is a classic way to slow the other side down.' },
  { id: 'slow', emoji: '\u{1F40C}', name: 'Reply on the last legal minute, every time', coverGain: 13, costX: 0.3,
    blurb: 'Answer every request at 4:59pm on the final day of the deadline, then ask for an extension. Repeat for years.',
    real: 'Running down the clock. The longer a case drags, the more allegations risk becoming time-barred.' },
  { id: 'redact', emoji: '█', name: 'Redact aggressively — even the weather', coverGain: 15, costX: 0.4,
    blurb: 'Black out names, numbers, dates and the occasional "the". Make them fight for every unredaction.',
    real: 'Over-redaction buries the relevant in a sea of disputes over the irrelevant.' },
  { id: 'jurisdiction', emoji: '⚖️', name: 'Challenge the regulator’s right to even ask', coverGain: 22, costX: 3,
    blurb: 'Don’t fight the evidence — fight the rulebook. Argue the whole process is unlawful. Tie it up in a separate case entirely.',
    real: 'Challenging the rules themselves can pause everything and has genuinely reshaped football’s financial regulations.' },
  { id: 'vanish', emoji: '\u{1F6E5}️', name: 'The key emails are, regrettably, unavailable', coverGain: 28, costX: 1, risky: true,
    blurb: 'A server was decommissioned. A phone fell in a harbour. The relevant inbox is on a yacht in international waters. So sorry.',
    real: 'Failing to produce evidence is the riskiest move of all — and non-cooperation is itself one of the most serious charges.' },
];

// Fictional "Money League" rivals, with season-1 revenue in £m. They grow ~4% a year.
export const MONEY_LEAGUE = [
  { name: 'Real Madreeed', revenue: 1000 },
  { name: 'FC Barcelonia', revenue: 820 },
  { name: 'Bayern M\u00fcnchkin', revenue: 800 },
  { name: 'Paris Saint-Germoney', revenue: 780 },
  { name: 'Manchester Unitedish', revenue: 680 },
  { name: 'Arsenhal', revenue: 640 },
  { name: 'Neverpool', revenue: 630 },
  { name: 'Juventoast', revenue: 420 },
];
export const RIVAL_GROWTH = 0.04;

export const BLUEPRINT = [
  { h: '1. Buy cheap, buy ambitious', p: 'Pick a club with a big catchment and a small balance sheet. A club earning under \u00a3100m a year costs a rounding error from your fund.' },
  { h: '2. Spend honest money where the rules don\u2019t count it', p: 'Use owner equity for the stadium, the training ground, the academy and the women\u2019s team. These are excluded from loss calculations, so they build the club with zero FFP risk.' },
  { h: '3. Turn owner money into "revenue"', p: 'Your spending cap is tied to revenue, so the real game is making money look earned. Related-party sponsorships, regional partners and asset sales all count as income. Only revenue lets you spend.' },
  { h: '4. Run the flywheel', p: 'Inflated revenue \u2192 bigger wage bill \u2192 better players \u2192 trophies \u2192 genuine global brand \u2192 a higher "fair market value" \u2192 a bigger sponsorship you can now justify. Grow deals in step with success. Jump too early and they look like what they are.' },
  { h: '5. Let the fake become real', p: 'Win long enough and the Champions League prize money, TV deals and real sponsors arrive. Eventually your genuine revenue catches up with the story you told. That is the end goal: a club that would look rich even if you left.' },
  { h: '6. Mind the tripwires', p: 'Fair-market-value checks on related-party deals. Leaked emails. Disclosure of every penny paid to players and managers. The new Independent Football Regulator asking where the money came from. And recurring deals keep being scrutinised every season, not just once.' },
  { h: 'The real-world benchmark', p: 'Manchester City\u2019s revenue was under \u00a3100m when it was taken over in 2008. Deloitte\u2019s Football Money League ranked it the highest-earning club in the world for 2021/22 and 2022/23. City says this reflects genuine commercial success. The Premier League\u2019s 2023 charges include allegations about how revenue, including sponsorship, was reported. The club denies all of them.' },
];

export const RULES_EXPLAINER = [
  { h: 'Financial fair play, in one sentence', p: 'You can only spend roughly what you earn, plus a small allowed loss. UEFA calls its version "financial sustainability" and caps squad costs at 70% of revenue. The Premier League ran Profit & Sustainability (~\u00a3105m loss over 3 years) and moved to a Squad Cost Ratio from 2026/27. The EFL has its own versions. Either way, revenue is the key that unlocks spending.' },
  { h: 'Who actually enforces this?', p: 'Despite the name on the tin, the FA mostly runs the rules of the game, discipline and the national teams. Financial rules are run by each competition: the Premier League in the top tier and the EFL across tiers 2–4. Since the Football Governance Act 2025 there is also an Independent Football Regulator (IFR), which licenses the top five tiers and looks at owners and their source of funds.' },
  { h: 'Why can’t a rich owner just spend?', p: 'Cost-control rules limit how much loss an owner can cover. That is to stop clubs collapsing when the owner gets bored. Revenue is the "good" money. So anyone wanting to spend more is tempted to make owner money look like revenue.' },
  { h: 'What’s fair market value?', p: 'Deals between a club and companies linked to its owner (Associated Party Transactions) are tested against what an independent party would pay. If the market pays £10m for your sleeve, your cousin’s airline paying £100m is not "commercial success".' },
  { h: 'Why do these cases take forever?', p: 'Documents, disclosure, challenges to the rules themselves, appeals, and limits on how far back charges can go. In 2020 the Court of Arbitration for Sport lifted a UEFA ban on Manchester City, partly because some allegations were "time-barred" (too old to pursue). The Premier League’s 2023 case covering 115 alleged breaches went to an independent commission. The club denies all the charges.' },
];

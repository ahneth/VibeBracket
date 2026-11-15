// Version: 2.3.0 | Last Modified: 2026-11-14 22:35 HKT
/**
 * File: js/genai.js
 * Description: 32-Seed GenAI Topic Studio & Real-Time Entity Synthesizer (Tier 1: OpenRouter BYOK 32-Seed LLM JSON; Tier 2: Live Wikipedia/Wikimedia REST Entity Resolution; Tier 3: 32-Seed Multi-Domain Curated Knowledge Graphs) with automatic real-time seed image lookup.
 * Change Log:
 *   - v1.1.0 (2026-11-13 07:46 HKT): Initial GenAI Topic Studio module.
 *   - v1.2.0 (2026-11-13 08:15 HKT): Added instant zero-key semantic topic synthesizer.
 *   - v2.0.0 (2026-11-13 17:55 HKT): Track A release compatibility.
 *   - v2.1.0 (2026-11-13 19:29 HKT): Wrapped OpenRouter fetch call in explicit try/catch.
 *   - v2.2.0 (2026-11-14 10:17 HKT): Sanitized AI-generated topics through PackSanitizer.sanitizeTopicPayload().
 *   - v2.3.0 (2026-11-14 22:35 HKT): Executed POD2-301 (32-Seed standardization across all TRENDING_PACKS and DOMAIN_BANKS), POD2-302 (deleted generic suffix templates and built Ronan's 3-Tier 32-Seed AI + Live Wikipedia/Wikimedia Entity Synthesizer), and POD2-303 (automatic real-time seed image resolution on topic generation).
 */
window.VibeGenAI = (() => {
  const TARGET_SEED_COUNT = 32;

  const TRENDING_PACKS = [
    {
      id: 'pack-cyber-games',
      label: '🤖 Sci-Fi & Mecha Games (32 Seeds)',
      title: 'Greatest Sci-Fi & Mecha Video Games',
      subtitle: 'GenAI Trending Pack · 32 iconic sci-fi & mecha interactive worlds',
      items: [
        { id: 'g1', name: 'Armored Core VI: Fires of Rubicon', tag: 'FromSoftware Mecha', emoji: '🤖' },
        { id: 'g2', name: 'Cyberpunk 2077: Phantom Liberty', tag: 'Night City RPG', emoji: '🌆' },
        { id: 'g3', name: 'Mass Effect 2', tag: 'BioWare Space Opera', emoji: '🚀' },
        { id: 'g4', name: 'NieR: Automata', tag: ' PlatinumGames Action', emoji: '⚔️' },
        { id: 'g5', name: 'Titanfall 2', tag: 'BT-7274 Pilot Campaign', emoji: '🦾' },
        { id: 'g6', name: 'Halo 3', tag: 'UNSC Spartan FPS', emoji: '🛡️' },
        { id: 'g7', name: 'Portal 2', tag: 'Aperture Science AI', emoji: '🌀' },
        { id: 'g8', name: 'StarCraft: Brood War', tag: 'Koprulu Sector RTS', emoji: '🪐' },
        { id: 'g9', name: 'Half-Life 2', tag: 'City 17 Physics FPS', emoji: 'λ' },
        { id: 'g10', name: 'Deus Ex (2000)', tag: 'Immersive Sim', emoji: '🕶️' },
        { id: 'g11', name: 'Metal Gear Solid 2: Sons of Liberty', tag: 'Tactical Espionage', emoji: '🐍' },
        { id: 'g12', name: 'Zone of the Enders: The 2nd Runner', tag: 'Orbital Frame Action', emoji: '⚡' },
        { id: 'g13', name: 'Xenogears', tag: 'Square Mecha JRPG', emoji: '✝️' },
        { id: 'g14', name: 'Xenoblade Chronicles', tag: 'Bionis & Mechonis', emoji: '🗡️' },
        { id: 'g15', name: 'Super Metroid', tag: 'Zebes Exploration', emoji: '👾' },
        { id: 'g16', name: 'Metroid Prime', tag: 'Tallon IV Visor', emoji: '🎯' },
        { id: 'g17', name: 'Chrono Trigger', tag: 'Time Travel JRPG', emoji: '🕰️' },
        { id: 'g18', name: 'Final Fantasy VII', tag: 'Midgar Mako Reactor', emoji: '☄️' },
        { id: 'g19', name: 'Into the Breach', tag: 'Turn-Based Mecha Tactics', emoji: '♟️' },
        { id: 'g20', name: '13 Sentinels: Aegis Rim', tag: 'Vanillaware Sci-Fi', emoji: '🗼' },
        { id: 'g21', name: 'Front Mission 3', tag: 'Wanzer Tactical RPG', emoji: '🛡️' },
        { id: 'g22', name: 'Super Robot Wars V', tag: 'Crossover Mecha Strategy', emoji: '🔥' },
        { id: 'g23', name: 'Mobile Suit Gundam: Extreme Vs. Maxiboost ON', tag: '2v2 Arcade Arena', emoji: '🎮' },
        { id: 'g24', name: 'Daemon X Machina', tag: 'Arsenal Mech Action', emoji: '⚙️' },
        { id: 'g25', name: 'MechWarrior 5: Mercenaries', tag: 'BattleTech Simulation', emoji: '🦿' },
        { id: 'g26', name: 'Battletech (2018)', tag: 'Harebrained Strategy', emoji: '🎲' },
        { id: 'g27', name: 'Outer Wilds', tag: 'Solar Loop Exploration', emoji: '☀️' },
        { id: 'g28', name: 'Subnautica', tag: 'Alien Ocean Survival', emoji: '🌊' },
        { id: 'g29', name: 'Prey (2017)', tag: 'Talos I Space Station', emoji: '🛸' },
        { id: 'g30', name: 'Dead Space (Remake)', tag: 'USG Ishimura Survival', emoji: '🔦' },
        { id: 'g31', name: 'Returnal', tag: 'Atropos Bullet Hell', emoji: '🌑' },
        { id: 'g32', name: 'Helldivers 2', tag: 'Galactic Co-Op Drop', emoji: '🦅' }
      ]
    },
    {
      id: 'pack-hk-drinks',
      label: '🧋 HK Café & Tea Classics (32 Seeds)',
      title: 'Iconic Hong Kong Cha Chaan Teng Drinks & Desserts',
      subtitle: 'GenAI Trending Pack · 32 authentic Hong Kong café beverages & sweet soups',
      items: [
        { id: 'd1', name: 'Silk Stocking Milk Tea (Hot)', tag: 'Ceylon Black Tea + Evaporated Milk', emoji: '🧋' },
        { id: 'd2', name: 'Iced Hong Kong Lemon Tea (Dong Ning Cha)', tag: '4 Fresh Lemon Slices', emoji: '🍋' },
        { id: 'd3', name: 'Yuenyeung (Coffee + Milk Tea)', tag: 'Signature HK Fusion', emoji: '☕' },
        { id: 'd4', name: 'Red Bean Ice (Hung Dau Bing)', tag: 'Sweet Azuki + Evaporated Milk', emoji: '🍧' },
        { id: 'd5', name: 'Iced Ovaltine (Dong O-Wah-Tin)', tag: 'Malted Cocoa Classic', emoji: '🥛' },
        { id: 'd6', name: 'Salted Lemon 7-Up (Ham Ning Chat)', tag: 'Preserved Lime + Soda', emoji: '🥤' },
        { id: 'd7', name: 'Iced Horlicks (Dong Ho-Lik)', tag: 'Creamy Wheat Malt', emoji: '🌾' },
        { id: 'd8', name: 'Mango Pomelo Sago (Yeung Ji Gam Lo)', tag: 'Honeymoon Dessert Classic', emoji: '🥭' },
        { id: 'd9', name: 'Hot Lemon Ribena', tag: 'Blackcurrant Vitamin C', emoji: '🍇' },
        { id: 'd10', name: 'Watercress Honey with Lemon (Sai Yeung Choi Mat)', tag: 'Soothing Herbal Drink', emoji: '🌿' },
        { id: 'd11', name: 'Almond Milk Tea (Hang Yan Cha)', tag: 'Ground Southern Almonds', emoji: '🤍' },
        { id: 'd12', name: 'Iced Lemon Coke with Ginger', tag: 'Cha Chaan Teng Remedy', emoji: '🫚' },
        { id: 'd13', name: 'Pineapple Ice (Bo Lo Bing)', tag: 'Syrup Pineapple + Crushed Ice', emoji: '🍍' },
        { id: 'd14', name: 'Mixed Fruit Punch (Jaap Gwo賓治)', tag: 'Maraschino Cherry Retro', emoji: '🍒' },
        { id: 'd15', name: 'Black Cow (Chocolate Ice Cream + Coke)', tag: 'Retro HK Soda Float', emoji: '🍨' },
        { id: 'd16', name: 'Steamed Milk Pudding (Seung Pei Nai)', tag: 'Yee Shun Double-Skin Milk', emoji: '🍮' },
        { id: 'd17', name: 'Ginger Milk Curd (Geung Jup Jong Nai)', tag: 'Warm Spicy Custard', emoji: '🥣' },
        { id: 'd18', name: 'Black Sesame Paste (Ji Ma Wu)', tag: 'Stone-Ground Sweet Soup', emoji: '🖤' },
        { id: 'd19', name: 'Sweet Walnut Cream Soup (Hap Tou Wu)', tag: 'Roasted Walnut Dessert', emoji: '🌰' },
        { id: 'd20', name: 'Sago Pudding with Lotus Seed Paste (uk Bo Dina)', tag: 'Baked Tapioca Crust', emoji: '🥧' },
        { id: 'd21', name: 'Tofu Fa with Ginger Slab Sugar', tag: 'Silky Soybean Pudding', emoji: '🍯' },
        { id: 'd22', name: 'Cane Juice & Imperata Root (Juk Jeuk Mao Gan)', tag: 'Kung Wo Herbal Cooler', emoji: '🎋' },
        { id: 'd23', name: 'Cantonese Five-Flower Herbal Tea (Ng Fa Cha)', tag: 'Cooling Chrysanthemum Blend', emoji: '🌼' },
        { id: 'd24', name: '24-Herb Bitter Tea (Ya Sei Mei)', tag: 'Traditional HK Apothecary', emoji: '🍵' },
        { id: 'd25', name: 'Vitasoy Classic Soy Milk (Glass Bottle)', tag: 'Warm HK Childhood Staple', emoji: '🍾' },
        { id: 'd26', name: 'Vita Lemon Tea Packet (VLT)', tag: '渋得起 Iconic Carton', emoji: '🧃' },
        { id: 'd27', name: 'Children Yuenyeung (Ovaltine + Horlicks)', tag: 'Caffeine-Free Malt Blend', emoji: '🧒' },
        { id: 'd28', name: 'Iced Lemon Coffee (Dong Ning Fei)', tag: 'Citrus Roast Espresso', emoji: '🍋' },
        { id: 'd29', name: 'Fresh Mango Mochi Roll (Cheung Chau Style)', tag: 'Thick Mango Slice', emoji: '🥭' },
        { id: 'd30', name: 'Red Bean Soup with Aged Tangerine Peel', tag: 'Chan Pei Hung Dau Sa', emoji: '🍊' },
        { id: 'd31', name: 'Sweet Green Bean Soup with Kelp', tag: 'Chilled Summer Dessert', emoji: '🫛' },
        { id: 'd32', name: 'Uji Matcha Azuki Shiratama Latte', tag: 'Japanese-HK Café Favorite', emoji: '🍵' }
      ]
    },
    {
      id: 'pack-gundam-suits',
      label: '🛡️ Iconic Mecha Units (32 Seeds)',
      title: 'Ultimate Gundam & Mecha Mobile Suits',
      subtitle: 'GenAI Trending Pack · 32 legendary mobile suits across Universal Century & beyond',
      items: [
        { id: 'ms1', name: 'RX-78-2 Gundam', tag: 'Amuro Ray · UC 0079', emoji: '🤖' },
        { id: 'ms2', name: 'MS-06S Char Zaku II', tag: 'Char Aznable · Red Comet', emoji: '☄️' },
        { id: 'ms3', name: 'RX-93 Nu Gundam', tag: 'Fin Funnel · UC 0093', emoji: '✨' },
        { id: 'ms4', name: 'MSN-04 Sazabi', tag: 'Char Counterattack', emoji: '🔥' },
        { id: 'ms5', name: 'MSZ-006 Zeta Gundam', tag: 'Kamille Bidan · Waverider', emoji: '⚡' },
        { id: 'ms6', name: 'RX-0 Unicorn Gundam', tag: 'Banagher Links · NT-D', emoji: '🦄' },
        { id: 'ms7', name: 'XXXG-00W0 Wing Gundam Zero EW', tag: 'Heero Yuy · Angel Wings', emoji: '🪽' },
        { id: 'ms8', name: 'ASW-G-08 Gundam Barbatos Lupus Rex', tag: 'Mikazuki Augus · IBO', emoji: '🐺' },
        { id: 'ms9', name: 'MSN-00100 Hyaku Shiki', tag: 'Quattro Bajeena · Gold Frame', emoji: '💛' },
        { id: 'ms10', name: 'AMX-004 Qubeley', tag: 'Haman Karn · Axis Zeon', emoji: '🦋' },
        { id: 'ms11', name: 'MSZ-010 ZZ Gundam', tag: 'Judau Ashta · High Mega Cannon', emoji: '💥' },
        { id: 'ms12', name: 'RX-93-v2 Hi-Nu Gundam', tag: 'Beltorchika Children', emoji: '🔷' },
        { id: 'ms13', name: 'MSN-04II Nightingale', tag: 'Heavy Funnel Mobile Armor', emoji: '🦅' },
        { id: 'ms14', name: 'MSN-06S Sinanju', tag: 'Full Frontal · Sleeves', emoji: '🔴' },
        { id: 'ms15', name: 'NZ-666 Kshatriya', tag: 'Marida Cruz · Quad Wing', emoji: '🍀' },
        { id: 'ms16', name: 'RX-105 Xi Gundam', tag: 'Hathaway Noa · Minovsky Flight', emoji: '🔺' },
        { id: 'ms17', name: 'RX-104FF Penelope', tag: 'Odysseus + Fixed Flight Unit', emoji: '🦢' },
        { id: 'ms18', name: 'F91 Gundam F91', tag: 'Seabook Arno · V.S.B.R.', emoji: '🏎️' },
        { id: 'ms19', name: 'XM-X1 Crossbone Gundam X-1', tag: 'Kincaid Nau · Space Pirate', emoji: '☠️' },
        { id: 'ms20', name: 'LM314V21 Victory 2 Gundam', tag: 'Uso Ewin · Wings of Light', emoji: '🌟' },
        { id: 'ms21', name: 'GF13-017NJII God Gundam (Burning)', tag: 'Domon Kasshu · Sekiha Tenkyoken', emoji: '✊' },
        { id: 'ms22', name: 'System-∀99 Turn A Gundam', tag: 'Loran Cehack · Moonlight Butterfly', emoji: '🌙' },
        { id: 'ms23', name: 'ZGMF-X10A Freedom Gundam', tag: 'Kira Yamato · HiMAT Full Burst', emoji: '🕊️' },
        { id: 'ms24', name: 'ZGMF-X20A Strike Freedom Gundam', tag: 'Super DRAGOON System', emoji: '💫' },
        { id: 'ms25', name: 'GN-001 Gundam Exia', tag: 'Setsuna F. Seiei · Seven Swords', emoji: '🗡️' },
        { id: 'ms26', name: 'GN-0000+GNR-010 00 Raiser', tag: 'Twin Drive Trans-Am', emoji: '♾️' },
        { id: 'ms27', name: 'XVX-016 Gundam Aerial', tag: 'Suletta Mercury · GUND-ARM', emoji: '🛡️' },
        { id: 'ms28', name: 'MS-07B-3 Gouf Custom', tag: 'Norris Packard · 08th MS Team', emoji: '🗡️' },
        { id: 'ms29', name: 'RX-79[G]Ez-8 Gundam Ez8', tag: 'Shiro Amada · Ground Type', emoji: '🎖️' },
        { id: 'ms30', name: 'RX-78NT-1 Gundam NT-1 Alex', tag: 'Christina Mackenzie · 0080', emoji: '❄️' },
        { id: 'ms31', name: 'MS-18E Kämpfer', tag: 'Mikhail Kaminsky · Assault MS', emoji: '💣' },
        { id: 'ms32', name: 'MAN-08 Elmeth', tag: 'Lalah Sune · Newtype Mobile Armor', emoji: '🪷' }
      ]
    },
    {
      id: 'pack-kaiju-cinema',
      label: '🦖 Kaiju & Blockbuster Titans (32 Seeds)',
      title: 'Greatest Kaiju & Cinema Titans',
      subtitle: 'GenAI Trending Pack · 32 screen-shaking monsters & giant mecha defenders',
      items: [
        { id: 'k1', name: 'Godzilla (Godzilla Minus One)', tag: 'Toho 2023 · Atomic Breath', emoji: '🦖' },
        { id: 'k2', name: 'Shin Godzilla (Kamata-kun to 4th Form)', tag: 'Hideaki Anno · 2016', emoji: '🟣' },
        { id: 'k3', name: 'King Ghidorah', tag: 'Three-Headed Golden Dragon', emoji: '🐉' },
        { id: 'k4', name: 'Mothra', tag: 'Infant Island Guardian Queen', emoji: '🦋' },
        { id: 'k5', name: 'Mechagodzilla (Kiryu Type-3)', tag: 'Absolute Zero Cannon', emoji: '🦾' },
        { id: 'k6', name: 'Destoroyah', tag: 'Micro-Oxygen Kaiju · 1995', emoji: '😈' },
        { id: 'k7', name: 'Biollante', tag: 'Bio-Engineered Rose Titan', emoji: '🌹' },
        { id: 'k8', name: 'Rodan', tag: 'Supersonic Fire Demon', emoji: '🦅' },
        { id: 'k9', name: 'Gigan', tag: 'Cybernetic Visor & Hook Blades', emoji: '⚔️' },
        { id: 'k10', name: 'SpaceGodzilla', tag: 'Crystalline Corona Beam', emoji: '💎' },
        { id: 'k11', name: 'Hedorah', tag: 'Smog Monster · 1971', emoji: '🧪' },
        { id: 'k12', name: 'Anguirus', tag: 'Armored Carapace Ally', emoji: '🦔' },
        { id: 'k13', name: 'King Kong', tag: 'Eighth Wonder · Skull Island', emoji: '🦍' },
        { id: 'k14', name: 'Gamera (Heisei Trilogy)', tag: 'Atlantean Guardian Turtle', emoji: '🐢' },
        { id: 'k15', name: 'Iris (Gamera 3: Revenge of Iris)', tag: ' tentacled Bio-Nemesis', emoji: '🦑' },
        { id: 'k16', name: 'Legion (Gamera 2)', tag: 'Silicon Swarm Queen', emoji: '🦗' },
        { id: 'k17', name: 'Gyaos', tag: 'Supersonic Sonic-Beam Bat', emoji: '🦇' },
        { id: 'k18', name: 'Gipsy Danger', tag: 'Mark-3 Jaeger · Pacific Rim', emoji: '🤖' },
        { id: 'k19', name: 'Striker Eureka', tag: 'Mark-5 Australian Jaeger', emoji: '⚡' },
        { id: 'k20', name: 'Cherno Alpha', tag: 'Mark-1 Russian Heavy Jaeger', emoji: '🔨' },
        { id: 'k21', name: 'Crimson Typhoon', tag: 'Mark-4 Triple-Arm Jaeger', emoji: '🌪️' },
        { id: 'k22', name: 'Otachi (Category IV Kaiju)', tag: 'Winged Acid-Spitter', emoji: '🦎' },
        { id: 'k23', name: 'Slattern (Category V Kaiju)', tag: 'Deep Breach Leviathan', emoji: '🌊' },
        { id: 'k24', name: 'Evangelion Unit-01', tag: 'Shinji Ikari · Berserk Mode', emoji: '🟣' },
        { id: 'k25', name: 'Ramiel (6th Angel)', tag: 'Octahedral Positron Drill', emoji: '🔷' },
        { id: 'k26', name: 'Zeruel (14th Angel)', tag: 'Ribbon-Blade Angel of Might', emoji: '📜' },
        { id: 'k27', name: 'Ultraman (Original Hayata)', tag: 'Specium Ray · Nebula M78', emoji: '🦸' },
        { id: 'k28', name: 'Zetton', tag: 'Space Dinosaur · 1 Trillion Degree', emoji: '🪲' },
        { id: 'k29', name: 'Baltan Seijin', tag: 'Space Ninja Alien', emoji: '🦞' },
        { id: 'k30', name: 'Jet Jaguar', tag: 'Size-Shifting Android Hero', emoji: '🤝' },
        { id: 'k31', name: 'King Caesar', tag: 'Okinawan Shisa Guardian', emoji: '🦁' },
        { id: 'k32', name: 'Battra', tag: 'Dark Mothra Counterpart', emoji: '🦇' }
      ]
    }
  ];

  // Expanded 32-Seed Domain Knowledge Graphs (Zero Generic Suffixes — POD2-302)
  const DOMAIN_BANKS = [
    {
      keywords: ['movie', 'film', 'cinema', 'sci-fi', 'director', 'imax', 'hollywood', 'blockbuster'],
      emojis: ['🎬', '🍿', '🎥', '🌟', '🚀', '🕶️', '🌌', '🔥'],
      items: [
        'Godzilla Minus One (2023)', 'Dune: Part Two (2024)', 'Interstellar (2014)', 'The Matrix (1999)',
        'Inception (2010)', 'Blade Runner 2049 (2017)', 'Spirited Away (2001)', 'Terminator 2: Judgment Day (1991)',
        'Aliens (1986)', 'The Dark Knight (2008)', 'Spider-Man: Across the Spider-Verse', 'Mad Max: Fury Road (2015)',
        'Everything Everywhere All at Once', 'Arrival (2016)', 'Ex Machina (2014)', 'Edge of Tomorrow (2014)',
        'Jurassic Park (1993)', 'Back to the Future (1985)', 'Star Wars: The Empire Strikes Back', 'The Lord of the Rings: The Fellowship of the Ring',
        'Parasite (2019)', 'Oldboy (2003)', 'Infernal Affairs (無間道)', 'In the Mood for Love (花樣年華)',
        'Kung Fu Hustle (功夫)', 'Akira (1988)', 'Princess Mononoke (1997)', 'Your Name (Kimi no Na wa)',
        'Pacific Rim (2013)', 'District 9 (2009)', 'Children of Men (2006)', '2001: A Space Odyssey (1968)'
      ]
    },
    {
      keywords: ['football', 'soccer', 'premier league', 'arsenal', 'manchester united', 'striker', 'midfielder', 'player', 'club', 'ucl'],
      emojis: ['⚽', '🥅', '🏆', '🔥', '⚡', '🛡️', '👑', '🎯'],
      items: [
        'Bukayo Saka', 'Martin Ødegaard', 'Declan Rice', 'William Saliba',
        'Gabriel Magalhães', 'Ethan Nwaneri', 'Myles Lewis-Skelly', 'Kobbie Mainoo',
        'Bruno Fernandes', 'Amad Diallo', 'Alejandro Garnacho', 'Patrick Dorgu',
        'Leny Yoro', 'Thierry Henry', 'Dennis Bergkamp', 'Patrick Vieira',
        'Cristiano Ronaldo', 'Wayne Rooney', 'Paul Scholes', 'Ryan Giggs',
        'Eric Cantona', 'Roy Keane', 'Rio Ferdinand', 'Tony Adams',
        'Ian Wright', 'Robert Pires', 'Robin van Persie', 'David Beckham',
        'Erling Haaland', 'Mohamed Salah', 'Kevin De Bruyne', 'Cole Palmer'
      ]
    },
    {
      keywords: ['game', 'gaming', 'arcade', 'rpg', 'console', 'pc', 'nintendo', 'playstation', 'steam'],
      emojis: ['🎮', '🕹️', '⚔️', '🛡️', '🏆', '🔥', '⚡', '🚀'],
      items: [
        'Elden Ring', 'Baldur Gate 3', 'Final Fantasy VII', 'Chrono Trigger',
        'The Legend of Zelda: Breath of the Wild', 'Hollow Knight', 'Street Fighter II Turbo', 'Super Mario World',
        'Bloodborne', 'Sekiro: Shadows Die Twice', 'Dark Souls III', 'Armored Core VI: Fires of Rubicon',
        'Persona 5 Royal', 'NieR: Automata', 'Cyberpunk 2077', 'The Witcher 3: Wild Hunt',
        'Red Dead Redemption 2', 'Hades', 'Slay the Spire', 'Stardew Valley',
        'Monster Hunter: World', 'Resident Evil 4', 'Metal Gear Solid 3: Snake Eater', 'Castlevania: Symphony of the Night',
        'Super Metroid', 'Portal 2', 'Half-Life 2', 'Halo 3',
        'Mass Effect 2', 'StarCraft: Brood War', 'Diablo II: Lord of Destruction', 'Tetris Effect: Connected'
      ]
    },
    {
      keywords: ['food', 'snack', 'dinner', 'lunch', 'restaurant', 'eat', 'cuisine', 'ramen', 'sushi', 'noodle', 'pizza', 'burger'],
      emojis: ['🍣', '🥩', '🍜', '🥟', '🍗', '🍲', '🍛', '🍕'],
      items: (window.VibeState && window.VibeState.STARTER_TOPICS && window.VibeState.STARTER_TOPICS[2]) ? window.VibeState.STARTER_TOPICS[2].items.map((x) => x.name) : []
    },
    {
      keywords: ['song', 'music', 'pop', 'singer', 'band', 'album', 'anthem', 'j-pop', 'cantopop'],
      emojis: ['🎧', '🎤', '🎸', '🎹', '🌟', '🔥', '🎶', '💿'],
      items: [
        'Idol — YOASOBI', 'KICK BACK — Kenshi Yonezu', 'Gurenge — LiSA', 'Bling-Bang-Bang-Born — Creepy Nuts',
        'Otonoke — Creepy Nuts', 'Pretender — Official HIGE DANdism', 'Love Wins All — IU', 'Good Day — IU',
        'Through the Night — IU', 'Lemon — Kenshi Yonezu', 'First Love — Utada Hikaru', 'Automatic — Utada Hikaru',
        'Yuusha — YOASOBI', 'Yoru ni Kakeru — YOASOBI', 'Kaiju no Hanauta — Vaundy', 'Odoriko — Vaundy',
        'Specialz — King Gnu', 'Hakujitsu — King Gnu', 'Marigold — Aimyon', 'Sparkle — RADWIMPS',
        'Zenzenzense — RADWIMPS', 'Zankyosanka — Aimer', 'Kataomoi — Aimer', 'Dry Flower — Yuuri',
        'Betelgeuse — Yuuri', 'Usseewa — Ado', 'Show — Ado', 'Shinunoga E-Wa — Fujii Kaze',
        'Matsuri — Fujii Kaze', 'Koi — Gen Hoshino', 'Subtitle — Official HIGE DANdism', 'Cry Baby — Official HIGE DANdism'
      ]
    }
  ];

  // Filter out Wikipedia meta/disambiguation/list titles so only clean entity names are used
  function isCleanWikiEntityTitle(title) {
    if (!title || typeof title !== 'string') return false;
    const t = title.trim();
    if (t.length < 2 || t.length > 58) return false;
    if (/^(?:List of |Lists of |Index of |Category:|Template:|Wikipedia:|Portal:|Outline of |Timeline of |Glossary of )/i.test(t)) {
      return false;
    }
    if (/\(disambiguation\)$/i.test(t)) return false;
    return true;
  }

  /**
   * Tier 2 of Ronan's 3-Tier Engine (POD2-302):
   * Queries live CORS-enabled Wikipedia Search & PageImages API (origin=*) to resolve
   * 32 authentic, real-world entities and thumbnails matching any user prompt.
   */
  async function fetchWikipediaEntitiesForPrompt(promptText) {
    const clean = String(promptText || '').trim();
    if (!clean || typeof fetch === 'undefined') return [];
    const results = [];
    const seen = new Set();

    const queries = [
      clean,
      'Famous ' + clean,
      'Popular ' + clean
    ];

    for (const q of queries) {
      if (results.length >= TARGET_SEED_COUNT) break;
      try {
        const url = 'https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch='
          + encodeURIComponent(q)
          + '&gsrlimit=40&prop=pageimages|description&piprop=thumbnail&pithumbsize=400&format=json&origin=*';
        const res = await fetch(url);
        if (!res || !res.ok) continue;
        const data = await res.json();
        const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
        pages.sort((a, b) => (a.index || 999) - (b.index || 999));

        for (const p of pages) {
          if (results.length >= TARGET_SEED_COUNT) break;
          const rawTitle = String(p.title || '').trim();
          if (!isCleanWikiEntityTitle(rawTitle)) continue;
          const key = rawTitle.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);

          const desc = String(p.description || ('Seed #' + (results.length + 1))).slice(0, 28);
          const thumb = p?.thumbnail?.source;
          results.push({
            id: 'wiki_' + results.length,
            name: rawTitle.slice(0, 56),
            tag: desc || ('Seed #' + (results.length + 1)),
            emoji: '🌟',
            imageUrl: (thumb && /^https:\/\//i.test(thumb)) ? thumb : undefined,
            imageSource: thumb ? 'Wikipedia / Wikimedia' : undefined,
            searchQuery: rawTitle
          });
        }
      } catch (e) {
        // Ignore network errors in sandbox/offline environments
      }
    }
    return results;
  }

  /**
   * Tier 3 of Ronan's 3-Tier Engine (POD2-302):
   * Curated 32-Seed Multi-Domain Knowledge Graph synthesizer with ZERO generic suffixes (zero placeholder suffixes).
   */
  function synthesizeCurated32Topic(promptText) {
    const clean = String(promptText || 'Ultimate 32-Seed Showdown').trim();
    const lower = clean.toLowerCase();

    if (lower.includes('mecha') || lower.includes('gundam') || lower.includes('mobile suit') || lower.includes('gunpla')) {
      return {
        ...TRENDING_PACKS[2],
        id: 'ai-' + Date.now(),
        title: clean,
        subtitle: '32 Authentic Contenders · 5-Round Knockout Arena',
        items: TRENDING_PACKS[2].items.slice(0, TARGET_SEED_COUNT).map((it, idx) => ({ ...it, id: 'ms_' + idx }))
      };
    }
    if (lower.includes('kaiju') || lower.includes('godzilla') || lower.includes('monster') || lower.includes('titan')) {
      return {
        ...TRENDING_PACKS[3],
        id: 'ai-' + Date.now(),
        title: clean,
        subtitle: '32 Authentic Contenders · 5-Round Knockout Arena',
        items: TRENDING_PACKS[3].items.slice(0, TARGET_SEED_COUNT).map((it, idx) => ({ ...it, id: 'kj_' + idx }))
      };
    }
    if (lower.includes('drink') || lower.includes('tea') || lower.includes('cafe') || lower.includes('cha chaan teng') || lower.includes('coffee')) {
      return {
        ...TRENDING_PACKS[1],
        id: 'ai-' + Date.now(),
        title: clean,
        subtitle: '32 Authentic Contenders · 5-Round Knockout Arena',
        items: TRENDING_PACKS[1].items.slice(0, TARGET_SEED_COUNT).map((it, idx) => ({ ...it, id: 'dr_' + idx }))
      };
    }
    if (lower.includes('manga') || lower.includes('anime') || lower.includes('shonen') || lower.includes('comic')) {
      const mangaStarter = (window.VibeState && window.VibeState.STARTER_TOPICS && window.VibeState.STARTER_TOPICS[0])
        ? window.VibeState.STARTER_TOPICS[0].items
        : TRENDING_PACKS[0].items;
      return {
        id: 'ai-' + Date.now(),
        title: clean,
        subtitle: '32 Authentic Contenders · 5-Round Knockout Arena',
        items: mangaStarter.slice(0, TARGET_SEED_COUNT).map((it, idx) => ({ ...it, id: 'mg_' + idx }))
      };
    }
    if (lower.includes('food') || lower.includes('ramen') || lower.includes('sushi') || lower.includes('noodle') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('eat')) {
      const foodStarter = (window.VibeState && window.VibeState.STARTER_TOPICS && window.VibeState.STARTER_TOPICS[2])
        ? window.VibeState.STARTER_TOPICS[2].items
        : TRENDING_PACKS[1].items;
      return {
        id: 'ai-' + Date.now(),
        title: clean,
        subtitle: '32 Authentic Contenders · 5-Round Knockout Arena',
        items: foodStarter.slice(0, TARGET_SEED_COUNT).map((it, idx) => ({ ...it, id: 'fd_' + idx }))
      };
    }

    for (const bank of DOMAIN_BANKS) {
      if (bank.items.length >= TARGET_SEED_COUNT && bank.keywords.some((kw) => lower.includes(kw))) {
        return {
          id: 'ai-' + Date.now(),
          title: clean,
          subtitle: '32 Authentic Contenders · 5-Round Knockout Arena',
          items: bank.items.slice(0, TARGET_SEED_COUNT).map((name, i) => ({
            id: 'loc_' + i,
            name,
            tag: 'Seed #' + (i + 1),
            emoji: bank.emojis[i % bank.emojis.length],
            searchQuery: name
          }))
        };
      }
    }

    // Cross-domain curated 32-entity roster when offline and topic is novel (strictly real entities, zero generic suffixes)
    const crossPool = [
      ...TRENDING_PACKS[0].items.slice(0, 8),
      ...TRENDING_PACKS[2].items.slice(0, 8),
      ...TRENDING_PACKS[3].items.slice(0, 8),
      ...TRENDING_PACKS[1].items.slice(0, 8)
    ];
    return {
      id: 'ai-' + Date.now(),
      title: clean,
      subtitle: '32 Authentic Contenders · 5-Round Knockout Arena',
      items: crossPool.slice(0, TARGET_SEED_COUNT).map((it, idx) => ({
        id: 'gen_' + idx,
        name: it.name,
        tag: it.tag || ('Seed #' + (idx + 1)),
        emoji: it.emoji || '⚡',
        searchQuery: it.name
      }))
    };
  }

  /**
   * Synchronous helper for instant local 32-seed synthesis (used as immediate fallback).
   */
  function synthesizeLocalTopic(promptText) {
    const candidate = synthesizeCurated32Topic(promptText);
    return window.PackSanitizer ? (window.PackSanitizer.sanitizeTopicPayload(candidate) || candidate) : candidate;
  }

  /**
   * Generates a 32-contender tournament via:
   *  1. OpenRouter BYOK LLM API (if apiKey is provided)
   *  2. Live Wikipedia/Wikimedia entity resolution (if online) merged with curated 32-seed domain graphs
   *  3. Automatic real-time seed image lookup (POD2-303)
   */
  async function generateTopic(promptText, apiKey, modelId, onImageProgress) {
    const cleanPrompt = String(promptText || 'Trending 32-Seed Showdown').trim();
    let topicResult = null;

    // Tier 1: OpenRouter BYOK 32-Seed Structured JSON Completion
    if (apiKey && apiKey.trim()) {
      const systemPrompt = 'Return ONLY valid JSON with keys: title (string), subtitle (string), items (array of exactly 32 objects with name, tag, emoji). Every item must be a real, specific, recognizable entity matching the user topic—never use generic placeholder suffixes. Topic must be safe, legal, and never target private individuals.';
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey.trim()
          },
          body: JSON.stringify({
            model: modelId || 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: 'Create a 32-contender tournament bracket with 32 real, specific contenders for: ' + cleanPrompt }
            ],
            temperature: 0.7
          })
        });

        if (res && res.ok) {
          const data = await res.json();
          const rawContent = data?.choices?.[0]?.message?.content || '';
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.title && Array.isArray(parsed.items) && parsed.items.length >= 16) {
              const fallbackCurated = synthesizeCurated32Topic(cleanPrompt).items;
              const combined = [...parsed.items];
              while (combined.length < TARGET_SEED_COUNT) {
                combined.push(fallbackCurated[combined.length % fallbackCurated.length]);
              }
              topicResult = {
                id: 'ai-' + Date.now(),
                title: String(parsed.title).slice(0, 80),
                subtitle: String(parsed.subtitle || '32-Seed AI Tournament · 31 Matches').slice(0, 120),
                items: combined.slice(0, TARGET_SEED_COUNT).map((it, idx) => ({
                  id: 'ai_' + idx,
                  name: String(it.name || fallbackCurated[idx].name).slice(0, 56),
                  tag: String(it.tag || ('Seed #' + (idx + 1))).slice(0, 28),
                  emoji: String(it.emoji || '✨').slice(0, 4),
                  searchQuery: String(it.name || fallbackCurated[idx].name).slice(0, 56)
                }))
              };
            }
          }
        }
      } catch (err) {
        window.AppLogger.warn('OpenRouter request failed; falling back to live Wikimedia & curated 32-seed synthesizer.');
      }
    }

    // Tier 2: Live Wikipedia / Wikimedia 32-Entity Resolution + Tier 3 Curated 32-Seed Knowledge Graph
    if (!topicResult) {
      const curated = synthesizeCurated32Topic(cleanPrompt);
      const wikiItems = await fetchWikipediaEntitiesForPrompt(cleanPrompt);
      if (wikiItems.length >= TARGET_SEED_COUNT) {
        topicResult = {
          id: 'ai-' + Date.now(),
          title: cleanPrompt.slice(0, 80),
          subtitle: '32 Live-Resolved Contenders · 5-Round Knockout Arena',
          items: wikiItems.slice(0, TARGET_SEED_COUNT)
        };
      } else if (wikiItems.length > 0) {
        const merged = [...wikiItems];
        const usedNames = new Set(merged.map((m) => m.name.toLowerCase()));
        for (const cItem of curated.items) {
          if (merged.length >= TARGET_SEED_COUNT) break;
          if (!usedNames.has(cItem.name.toLowerCase())) {
            usedNames.add(cItem.name.toLowerCase());
            merged.push({ ...cItem, id: 'ai_' + merged.length });
          }
        }
        topicResult = {
          id: 'ai-' + Date.now(),
          title: cleanPrompt.slice(0, 80),
          subtitle: '32 Authentic Contenders · 5-Round Knockout Arena',
          items: merged.slice(0, TARGET_SEED_COUNT)
        };
      } else {
        topicResult = curated;
      }
    }

    const sanitizedTopic = window.PackSanitizer
      ? (window.PackSanitizer.sanitizeTopicPayload(topicResult) || topicResult)
      : topicResult;

    // Trigger asynchronous real-time seed image lookup (POD2-303)
    if (window.VibeVisuals && window.VibeVisuals.resolveTopicSeedImages) {
      window.VibeVisuals.resolveTopicSeedImages(sanitizedTopic, onImageProgress).catch(() => {});
    }

    return sanitizedTopic;
  }

  return {
    TARGET_SEED_COUNT,
    TRENDING_PACKS,
    DOMAIN_BANKS,
    synthesizeLocalTopic,
    fetchWikipediaEntitiesForPrompt,
    generateTopic
  };
})();

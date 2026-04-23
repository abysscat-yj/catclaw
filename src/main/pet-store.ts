// PetStore - SQLite persistence for buddy collection system
// Inspired by Claude Code's Buddy system: 18 species, 6 eyes, 8 hats, 5 rarities, shiny variant

import type Database from "better-sqlite3";
import { v4 as uuid } from "uuid";

// --- Species definitions (18 types with ASCII art frames) ---

export interface Species {
  id: string;
  name: string;
  emoji: string;
  frames: string[]; // 3 idle animation frames (ASCII art)
}

export const SPECIES: Species[] = [
  { id: "duck", name: "Duck", emoji: "\uD83E\uDD86", frames: [
    "  __  \n<( . )_\n (  ._>\n `--´ ",
    "  __  \n<( · )_\n (  ._>\n `--´ ",
    "  __  \n<( - )_\n (  ._>\n `--´ ",
  ]},
  { id: "cat", name: "Cat", emoji: "\uD83D\uDC31", frames: [
    " /\\_/\\ \n( .  .)\n(  w  )\n(\")\\_(\") ",
    " /\\_/\\ \n( ·  ·)\n(  w  )\n(\")\\_(\") ",
    " /\\_/\\ \n( -  -)\n(  w  )\n(\")\\_(\") ",
  ]},
  { id: "blob", name: "Blob", emoji: "\uD83E\uDEE7", frames: [
    " .----. \n( .  . )\n(      )\n `----´ ",
    " .----. \n( ·  · )\n(      )\n `----´ ",
    " .----. \n( -  - )\n(      )\n `----´ ",
  ]},
  { id: "dragon", name: "Dragon", emoji: "\uD83D\uDC09", frames: [
    " /^\\  /^\\ \n<  .  .  >\n(   ~~   )\n `-vvvv-´ ",
    " /^\\  /^\\ \n<  ·  ·  >\n(   ~~   )\n `-vvvv-´ ",
    " /^\\  /^\\ \n<  -  -  >\n(   ~~   )\n `-vvvv-´ ",
  ]},
  { id: "octopus", name: "Octopus", emoji: "\uD83D\uDC19", frames: [
    " .----. \n( .  . )\n(______)\n/\\/\\/\\/\\ ",
    " .----. \n( ·  · )\n(______)\n/\\/\\/\\/\\ ",
    " .----. \n( -  - )\n(______)\n/\\/\\/\\/\\ ",
  ]},
  { id: "owl", name: "Owl", emoji: "\uD83E\uDD89", frames: [
    " /\\  /\\ \n((.)(.))\n(  ><  )\n `----´ ",
    " /\\  /\\ \n((·)(·))\n(  ><  )\n `----´ ",
    " /\\  /\\ \n((-)(-))\n(  ><  )\n `----´ ",
  ]},
  { id: "penguin", name: "Penguin", emoji: "\uD83D\uDC27", frames: [
    "  .---.  \n (.>.) \n/(   )\\\n `---´ ",
    "  .---.  \n (·>·) \n/(   )\\\n `---´ ",
    "  .---.  \n (->-) \n/(   )\\\n `---´ ",
  ]},
  { id: "turtle", name: "Turtle", emoji: "\uD83D\uDC22", frames: [
    "  _,--._  \n ( .  . ) \n/[______]\\\n ``    `` ",
    "  _,--._  \n ( ·  · ) \n/[______]\\\n ``    `` ",
    "  _,--._  \n ( -  - ) \n/[______]\\\n ``    `` ",
  ]},
  { id: "ghost", name: "Ghost", emoji: "\uD83D\uDC7B", frames: [
    " .----. \n/ .  . \\\n|      |\n~`~``~`~ ",
    " .----. \n/ ·  · \\\n|      |\n~`~``~`~ ",
    " .----. \n/ -  - \\\n|      |\n~`~``~`~ ",
  ]},
  { id: "robot", name: "Robot", emoji: "\uD83E\uDD16", frames: [
    " .[||]. \n[ .  . ]\n[ ==== ]\n`------´ ",
    " .[||]. \n[ ·  · ]\n[ ==== ]\n`------´ ",
    " .[||]. \n[ -  - ]\n[ ==== ]\n`------´ ",
  ]},
  { id: "rabbit", name: "Rabbit", emoji: "\uD83D\uDC30", frames: [
    " (\\__/) \n( .  . )\n=( .. )=\n(\")__(\")",
    " (\\__/) \n( ·  · )\n=( .. )=\n(\")__(\")",
    " (\\__/) \n( -  - )\n=( .. )=\n(\")__(\")",
  ]},
  { id: "mushroom", name: "Mushroom", emoji: "\uD83C\uDF44", frames: [
    ".-o-OO-o-.\n(__________)\n   |.  .|\n   |____| ",
    ".-o-OO-o-.\n(__________)\n   |·  ·|\n   |____| ",
    ".-o-OO-o-.\n(__________)\n   |-  -|\n   |____| ",
  ]},
  { id: "capybara", name: "Capybara", emoji: "\uD83E\uDDAB", frames: [
    " n______n \n( .    . )\n(   oo   )\n `------´ ",
    " n______n \n( ·    · )\n(   oo   )\n `------´ ",
    " n______n \n( -    - )\n(   oo   )\n `------´ ",
  ]},
  { id: "cactus", name: "Cactus", emoji: "\uD83C\uDF35", frames: [
    "n  ____  n\n| |.  .| |\n|_|    |_|\n   |    | ",
    "n  ____  n\n| |·  ·| |\n|_|    |_|\n   |    | ",
    "n  ____  n\n| |-  -| |\n|_|    |_|\n   |    | ",
  ]},
  { id: "snail", name: "Snail", emoji: "\uD83D\uDC0C", frames: [
    "     .--.\n  \\ ( @ )\n   \\_`--´\n  ~~~~~~~ ",
    "     .--.\n  \\ ( · )\n   \\_`--´\n  ~~~~~~~ ",
    "     .--.\n  \\ ( - )\n   \\_`--´\n  ~~~~~~~ ",
  ]},
  { id: "axolotl", name: "Axolotl", emoji: "\uD83E\uDD8E", frames: [
    "}~(______)~{\n}~(. .. .)~{\n  ( .--. )\n  (_/  \\_) ",
    "}~(______)~{\n}~(· ·· ·)~{\n  ( .--. )\n  (_/  \\_) ",
    "}~(______)~{\n}~(- -- -)~{\n  ( .--. )\n  (_/  \\_) ",
  ]},
  { id: "chonk", name: "Chonk Cat", emoji: "\uD83D\uDC08", frames: [
    " /\\    /\\ \n( .    . )\n(   ..   )\n `------´ ",
    " /\\    /\\ \n( ·    · )\n(   ..   )\n `------´ ",
    " /\\    /\\ \n( -    - )\n(   ..   )\n `------´ ",
  ]},
  { id: "goose", name: "Goose", emoji: "\uD83E\uDEBF", frames: [
    "  ( .> \n   || \n _(__)_\n  ^^^^ ",
    "  ( ·> \n   || \n _(__)_\n  ^^^^ ",
    "  ( -> \n   || \n _(__)_\n  ^^^^ ",
  ]},
];

// --- Eye variants ---
export const EYE_VARIANTS = ["·", "✦", "×", "◉", "@", "°"] as const;

// --- Hat variants ---
export interface Hat {
  id: string;
  name: string;
  art: string; // ASCII art placed above the pet
}

export const HATS: Hat[] = [
  { id: "none", name: "None", art: "" },
  { id: "crown", name: "Crown", art: "\\^^^/" },
  { id: "tophat", name: "Top Hat", art: "[___]" },
  { id: "propeller", name: "Propeller", art: " -+- " },
  { id: "halo", name: "Halo", art: "(   )" },
  { id: "wizard", name: "Wizard Hat", art: " /^\\\\ " },
  { id: "beanie", name: "Beanie", art: "(___)" },
  { id: "tinyduck", name: "Tiny Duck", art: "  ,> " },
];

// --- Rarity system ---
export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface RarityConfig {
  name: string;
  stars: number;
  probability: number; // cumulative threshold (0-100)
  baseStatMin: number;
  baseStatMax: number;
  canHaveHat: boolean;
}

export const RARITIES: Record<Rarity, RarityConfig> = {
  legendary: { name: "Legendary", stars: 5, probability: 1, baseStatMin: 80, baseStatMax: 100, canHaveHat: true },
  epic: { name: "Epic", stars: 4, probability: 5, baseStatMin: 60, baseStatMax: 90, canHaveHat: true },
  rare: { name: "Rare", stars: 3, probability: 15, baseStatMin: 40, baseStatMax: 70, canHaveHat: true },
  uncommon: { name: "Uncommon", stars: 2, probability: 40, baseStatMin: 20, baseStatMax: 50, canHaveHat: true },
  common: { name: "Common", stars: 1, probability: 100, baseStatMin: 5, baseStatMax: 30, canHaveHat: false },
};

const RARITY_ORDER: Rarity[] = ["legendary", "epic", "rare", "uncommon", "common"];

function rollRarity(): Rarity {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const rarity of RARITY_ORDER) {
    cumulative += (rarity === "common" ? 60 : rarity === "uncommon" ? 25 : rarity === "rare" ? 10 : rarity === "epic" ? 4 : 1);
    if (roll < cumulative) return rarity;
  }
  return "common";
}

// --- Attributes ---
export interface BuddyAttributes {
  debugging: number;
  patience: number;
  chaos: number;
  wisdom: number;
  snark: number;
}

function rollAttributes(rarity: Rarity): BuddyAttributes {
  const config = RARITIES[rarity];
  const attrs = ["debugging", "patience", "chaos", "wisdom", "snark"];
  const highIdx = Math.floor(Math.random() * attrs.length);
  let lowIdx = Math.floor(Math.random() * attrs.length);
  while (lowIdx === highIdx) lowIdx = Math.floor(Math.random() * attrs.length);

  const result: Record<string, number> = {};
  for (let i = 0; i < attrs.length; i++) {
    if (i === highIdx) {
      result[attrs[i]] = Math.floor(config.baseStatMax * 0.9 + Math.random() * config.baseStatMax * 0.1);
    } else if (i === lowIdx) {
      result[attrs[i]] = Math.floor(config.baseStatMin * 0.5 + Math.random() * config.baseStatMin * 0.5);
    } else {
      result[attrs[i]] = Math.floor(config.baseStatMin + Math.random() * (config.baseStatMax - config.baseStatMin));
    }
  }
  return result as unknown as BuddyAttributes;
}

// --- Speech bubbles ---
const IDLE_SPEECHES: Record<string, string[]> = {
  debugging: [
    "Found a bug! ...just kidding",
    "Have you tried console.log?",
    "That semicolon looks suspicious...",
    "Debugging is like being a detective",
    "Stack trace says: it's not my fault!",
  ],
  patience: [
    "Take your time, no rush~",
    "Deep breaths... compile... breathe...",
    "Rome wasn't built in one sprint",
    "Slow and steady wins the race",
    "Let's just wait for the build...",
  ],
  chaos: [
    "Let's delete node_modules!",
    "What if we rewrite it in Rust?",
    "YOLO deploy to production!",
    "Merge conflict? Just force push!",
    "*knocks over coffee*",
  ],
  wisdom: [
    "The best code is no code",
    "Premature optimization is the root...",
    "Have you read the docs?",
    "A wise coder once said...",
    "Consider the edge cases",
  ],
  snark: [
    "Oh, another meeting?",
    "That's... certainly one way to do it",
    "Works on my machine",
    "Have you tried turning it off and on?",
    "Sure, 'temporary' fix...",
  ],
  general: [
    "Writing code is fun!",
    "Need any help?",
    "Don't forget to save!",
    "Coffee break?",
    "*yawns*",
    "You're doing great!",
    "Let's ship it!",
    "Hmm, interesting...",
  ],
};

const CLICK_SPEECHES = [
  "Hey! That tickles!",
  "Boop!",
  "*purrs*",
  "What's up?",
  "Don't poke me!",
  "I'm working here!",
  "*wiggles*",
  "Hi there!",
  "Ow! Just kidding~",
  "*happy noises*",
];

// --- Economy ---
export const DRAW_COST = 10;
export const COINS_PER_CONVERSATION = 3;
export const WELCOME_BONUS = 30;

// --- Database record ---
export interface BuddyRecord {
  id: string;
  speciesId: string;
  name: string;
  rarity: Rarity;
  eyeVariant: string;
  hatId: string;
  isShiny: boolean;
  attributes: BuddyAttributes;
  obtainedAt: number;
}

export interface DrawResult {
  buddy: BuddyRecord;
  pawCoins: number;
}

// --- PetStore class ---

export class PetStore {
  constructor(private db: Database.Database) {
    this.initTable();
  }

  private initTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS buddies (
        id TEXT PRIMARY KEY,
        species_id TEXT NOT NULL,
        name TEXT NOT NULL,
        rarity TEXT NOT NULL,
        eye_variant TEXT NOT NULL,
        hat_id TEXT NOT NULL DEFAULT 'none',
        is_shiny INTEGER NOT NULL DEFAULT 0,
        attributes TEXT NOT NULL,
        obtained_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_stats (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS active_buddy (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        buddy_id TEXT REFERENCES buddies(id)
      );
    `);

    // Welcome bonus for first-time users
    const existing = this.db
      .prepare("SELECT value FROM user_stats WHERE key = 'paw_coins'")
      .get() as { value: string } | undefined;

    if (!existing) {
      this.db
        .prepare("INSERT INTO user_stats (key, value) VALUES ('paw_coins', ?)")
        .run(String(WELCOME_BONUS));
    }

    // Migrate: if old 'pets' table exists, drop it
    const oldTable = this.db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='pets'")
      .get();
    if (oldTable) {
      this.db.exec("DROP TABLE pets");
    }
  }

  listBuddies(): BuddyRecord[] {
    const rows = this.db
      .prepare("SELECT * FROM buddies ORDER BY obtained_at DESC")
      .all() as Array<{
        id: string;
        species_id: string;
        name: string;
        rarity: string;
        eye_variant: string;
        hat_id: string;
        is_shiny: number;
        attributes: string;
        obtained_at: number;
      }>;

    return rows.map((r) => ({
      id: r.id,
      speciesId: r.species_id,
      name: r.name,
      rarity: r.rarity as Rarity,
      eyeVariant: r.eye_variant,
      hatId: r.hat_id,
      isShiny: r.is_shiny === 1,
      attributes: JSON.parse(r.attributes),
      obtainedAt: r.obtained_at,
    }));
  }

  getCoins(): number {
    const row = this.db
      .prepare("SELECT value FROM user_stats WHERE key = 'paw_coins'")
      .get() as { value: string } | undefined;
    return row ? parseInt(row.value, 10) : 0;
  }

  private setCoins(amount: number): void {
    this.db
      .prepare("INSERT OR REPLACE INTO user_stats (key, value) VALUES ('paw_coins', ?)")
      .run(String(amount));
  }

  addCoins(amount: number): number {
    const current = this.getCoins();
    const next = current + amount;
    this.setCoins(next);
    return next;
  }

  getActiveBuddy(): BuddyRecord | null {
    const row = this.db
      .prepare("SELECT buddy_id FROM active_buddy WHERE id = 1")
      .get() as { buddy_id: string } | undefined;

    if (!row?.buddy_id) return null;

    const buddies = this.listBuddies();
    return buddies.find((b) => b.id === row.buddy_id) || null;
  }

  setActiveBuddy(buddyId: string | null): void {
    this.db
      .prepare("INSERT OR REPLACE INTO active_buddy (id, buddy_id) VALUES (1, ?)")
      .run(buddyId);
  }

  drawBuddy(): DrawResult {
    const coins = this.getCoins();
    if (coins < DRAW_COST) {
      throw new Error(`Not enough paw coins (have ${coins}, need ${DRAW_COST})`);
    }

    this.setCoins(coins - DRAW_COST);

    // Roll species, rarity, eye, hat, shiny
    const species = SPECIES[Math.floor(Math.random() * SPECIES.length)];
    const rarity = rollRarity();
    const eyeVariant = EYE_VARIANTS[Math.floor(Math.random() * EYE_VARIANTS.length)];
    const rarityConfig = RARITIES[rarity];
    const hatId = rarityConfig.canHaveHat
      ? HATS[Math.floor(Math.random() * HATS.length)].id
      : "none";
    const isShiny = Math.random() < 0.01; // 1% chance
    const attributes = rollAttributes(rarity);

    const buddy: BuddyRecord = {
      id: uuid(),
      speciesId: species.id,
      name: species.name,
      rarity,
      eyeVariant,
      hatId,
      isShiny,
      attributes,
      obtainedAt: Date.now(),
    };

    this.db
      .prepare(
        "INSERT INTO buddies (id, species_id, name, rarity, eye_variant, hat_id, is_shiny, attributes, obtained_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        buddy.id, buddy.speciesId, buddy.name, buddy.rarity,
        buddy.eyeVariant, buddy.hatId, buddy.isShiny ? 1 : 0,
        JSON.stringify(buddy.attributes), buddy.obtainedAt
      );

    // Auto-set as active if first buddy
    const count = (this.db.prepare("SELECT COUNT(*) as c FROM buddies").get() as { c: number }).c;
    if (count === 1) {
      this.setActiveBuddy(buddy.id);
    }

    return {
      buddy,
      pawCoins: coins - DRAW_COST,
    };
  }

  getRandomSpeech(): string {
    // Try to get personality-driven speech based on active buddy
    const active = this.getActiveBuddy();
    if (active) {
      const attrs = active.attributes;
      const entries = Object.entries(attrs) as [string, number][];
      entries.sort((a, b) => b[1] - a[1]);
      const topAttr = entries[0][0];
      const pool = IDLE_SPEECHES[topAttr] || IDLE_SPEECHES.general;
      // Mix personality speeches with general ones
      const combined = [...pool, ...IDLE_SPEECHES.general];
      return combined[Math.floor(Math.random() * combined.length)];
    }
    const general = IDLE_SPEECHES.general;
    return general[Math.floor(Math.random() * general.length)];
  }

  getClickSpeech(): string {
    return CLICK_SPEECHES[Math.floor(Math.random() * CLICK_SPEECHES.length)];
  }

  renameBuddy(id: string, name: string): void {
    this.db
      .prepare("UPDATE buddies SET name = ? WHERE id = ?")
      .run(name.trim(), id);
  }
}

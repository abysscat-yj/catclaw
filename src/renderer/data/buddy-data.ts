// Buddy species, hats, and rarity data for the renderer
// Mirrors the definitions in src/main/pet-store.ts

export interface Species {
  id: string;
  name: string;
  emoji: string;
  frames: string[];
}

export const SPECIES: Species[] = [
  { id: "duck", name: "Duck", emoji: "\uD83E\uDD86", frames: [
    "  __  \n<( . )_\n (  ._>\n `--\u00b4 ",
    "  __  \n<( \u00b7 )_\n (  ._>\n `--\u00b4 ",
    "  __  \n<( - )_\n (  ._>\n `--\u00b4 ",
  ]},
  { id: "cat", name: "Cat", emoji: "\uD83D\uDC31", frames: [
    " /\\_/\\ \n( .  .)\n(  w  )\n(\")\\_(\") ",
    " /\\_/\\ \n( \u00b7  \u00b7)\n(  w  )\n(\")\\_(\") ",
    " /\\_/\\ \n( -  -)\n(  w  )\n(\")\\_(\") ",
  ]},
  { id: "blob", name: "Blob", emoji: "\uD83E\uDEE7", frames: [
    " .----. \n( .  . )\n(      )\n `----\u00b4 ",
    " .----. \n( \u00b7  \u00b7 )\n(      )\n `----\u00b4 ",
    " .----. \n( -  - )\n(      )\n `----\u00b4 ",
  ]},
  { id: "dragon", name: "Dragon", emoji: "\uD83D\uDC09", frames: [
    " /^\\  /^\\ \n<  .  .  >\n(   ~~   )\n `-vvvv-\u00b4 ",
    " /^\\  /^\\ \n<  \u00b7  \u00b7  >\n(   ~~   )\n `-vvvv-\u00b4 ",
    " /^\\  /^\\ \n<  -  -  >\n(   ~~   )\n `-vvvv-\u00b4 ",
  ]},
  { id: "octopus", name: "Octopus", emoji: "\uD83D\uDC19", frames: [
    " .----. \n( .  . )\n(______)\n/\\/\\/\\/\\ ",
    " .----. \n( \u00b7  \u00b7 )\n(______)\n/\\/\\/\\/\\ ",
    " .----. \n( -  - )\n(______)\n/\\/\\/\\/\\ ",
  ]},
  { id: "owl", name: "Owl", emoji: "\uD83E\uDD89", frames: [
    " /\\  /\\ \n((.)(.))\n(  ><  )\n `----\u00b4 ",
    " /\\  /\\ \n((\u00b7)(\u00b7))\n(  ><  )\n `----\u00b4 ",
    " /\\  /\\ \n((-)(-))\n(  ><  )\n `----\u00b4 ",
  ]},
  { id: "penguin", name: "Penguin", emoji: "\uD83D\uDC27", frames: [
    "  .---.  \n (.>.) \n/(   )\\\n `---\u00b4 ",
    "  .---.  \n (\u00b7>\u00b7) \n/(   )\\\n `---\u00b4 ",
    "  .---.  \n (->-) \n/(   )\\\n `---\u00b4 ",
  ]},
  { id: "turtle", name: "Turtle", emoji: "\uD83D\uDC22", frames: [
    "  _,--._  \n ( .  . ) \n/[______]\\\n ``    `` ",
    "  _,--._  \n ( \u00b7  \u00b7 ) \n/[______]\\\n ``    `` ",
    "  _,--._  \n ( -  - ) \n/[______]\\\n ``    `` ",
  ]},
  { id: "ghost", name: "Ghost", emoji: "\uD83D\uDC7B", frames: [
    " .----. \n/ .  . \\\n|      |\n~`~``~`~ ",
    " .----. \n/ \u00b7  \u00b7 \\\n|      |\n~`~``~`~ ",
    " .----. \n/ -  - \\\n|      |\n~`~``~`~ ",
  ]},
  { id: "robot", name: "Robot", emoji: "\uD83E\uDD16", frames: [
    " .[||]. \n[ .  . ]\n[ ==== ]\n`------\u00b4 ",
    " .[||]. \n[ \u00b7  \u00b7 ]\n[ ==== ]\n`------\u00b4 ",
    " .[||]. \n[ -  - ]\n[ ==== ]\n`------\u00b4 ",
  ]},
  { id: "rabbit", name: "Rabbit", emoji: "\uD83D\uDC30", frames: [
    " (\\__/) \n( .  . )\n=( .. )=\n(\")__(\") ",
    " (\\__/) \n( \u00b7  \u00b7 )\n=( .. )=\n(\")__(\") ",
    " (\\__/) \n( -  - )\n=( .. )=\n(\")__(\") ",
  ]},
  { id: "mushroom", name: "Mushroom", emoji: "\uD83C\uDF44", frames: [
    ".-o-OO-o-.\n(__________)\n   |.  .|\n   |____| ",
    ".-o-OO-o-.\n(__________)\n   |\u00b7  \u00b7|\n   |____| ",
    ".-o-OO-o-.\n(__________)\n   |-  -|\n   |____| ",
  ]},
  { id: "capybara", name: "Capybara", emoji: "\uD83E\uDDAB", frames: [
    " n______n \n( .    . )\n(   oo   )\n `------\u00b4 ",
    " n______n \n( \u00b7    \u00b7 )\n(   oo   )\n `------\u00b4 ",
    " n______n \n( -    - )\n(   oo   )\n `------\u00b4 ",
  ]},
  { id: "cactus", name: "Cactus", emoji: "\uD83C\uDF35", frames: [
    "n  ____  n\n| |.  .| |\n|_|    |_|\n   |    | ",
    "n  ____  n\n| |\u00b7  \u00b7| |\n|_|    |_|\n   |    | ",
    "n  ____  n\n| |-  -| |\n|_|    |_|\n   |    | ",
  ]},
  { id: "snail", name: "Snail", emoji: "\uD83D\uDC0C", frames: [
    "     .--.\n  \\ ( @ )\n   \\_`--\u00b4\n  ~~~~~~~ ",
    "     .--.\n  \\ ( \u00b7 )\n   \\_`--\u00b4\n  ~~~~~~~ ",
    "     .--.\n  \\ ( - )\n   \\_`--\u00b4\n  ~~~~~~~ ",
  ]},
  { id: "axolotl", name: "Axolotl", emoji: "\uD83E\uDD8E", frames: [
    "}~(______)~{\n}~(. .. .)~{\n  ( .--. )\n  (_/  \\_) ",
    "}~(______)~{\n}~(\u00b7 \u00b7\u00b7 \u00b7)~{\n  ( .--. )\n  (_/  \\_) ",
    "}~(______)~{\n}~(- -- -)~{\n  ( .--. )\n  (_/  \\_) ",
  ]},
  { id: "chonk", name: "Chonk Cat", emoji: "\uD83D\uDC08", frames: [
    " /\\    /\\ \n( .    . )\n(   ..   )\n `------\u00b4 ",
    " /\\    /\\ \n( \u00b7    \u00b7 )\n(   ..   )\n `------\u00b4 ",
    " /\\    /\\ \n( -    - )\n(   ..   )\n `------\u00b4 ",
  ]},
  { id: "goose", name: "Goose", emoji: "\uD83E\uDEBF", frames: [
    "  ( .> \n   || \n _(__)_\n  ^^^^ ",
    "  ( \u00b7> \n   || \n _(__)_\n  ^^^^ ",
    "  ( -> \n   || \n _(__)_\n  ^^^^ ",
  ]},
];

export interface Hat {
  id: string;
  name: string;
  art: string;
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

export interface RarityConfig {
  name: string;
  stars: number;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

export const RARITIES: Record<string, RarityConfig> = {
  legendary: { name: "Legendary", stars: 5, color: "#f59e0b", bgClass: "rarity-legendary", borderClass: "rarity-border-legendary", textClass: "rarity-text-legendary" },
  epic: { name: "Epic", stars: 4, color: "#a855f7", bgClass: "rarity-epic", borderClass: "rarity-border-epic", textClass: "rarity-text-epic" },
  rare: { name: "Rare", stars: 3, color: "#3b82f6", bgClass: "rarity-rare", borderClass: "rarity-border-rare", textClass: "rarity-text-rare" },
  uncommon: { name: "Uncommon", stars: 2, color: "#22c55e", bgClass: "rarity-uncommon", borderClass: "rarity-border-uncommon", textClass: "rarity-text-uncommon" },
  common: { name: "Common", stars: 1, color: "#6b7280", bgClass: "rarity-common", borderClass: "rarity-border-common", textClass: "rarity-text-common" },
};

export function getSpeciesById(id: string): Species | undefined {
  return SPECIES.find((s) => s.id === id);
}

export function getHatById(id: string): Hat | undefined {
  return HATS.find((h) => h.id === id);
}

export function renderStars(count: number): string {
  return "\u2605".repeat(count) + "\u2606".repeat(5 - count);
}

// --- Personality system ---

export const PERSONALITY_TITLES: Record<string, string[]> = {
  debugging: ["Bug Hunter", "Code Detective", "Debug Master", "Lint Lord"],
  patience: ["Zen Master", "Calm Soul", "Patient One", "Chill Vibes"],
  chaos: ["Chaos Gremlin", "Wild Card", "Entropy Agent", "Mayhem Buddy"],
  wisdom: ["Wise Sage", "Knowledge Keeper", "Deep Thinker", "Oracle"],
  snark: ["Sassy One", "Shade Thrower", "Witty Pal", "Roast Master"],
};

export function getPersonalityTitle(attrs: BuddyAttributes): string {
  const entries = Object.entries(attrs) as [string, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const topAttr = entries[0][0];
  const titles = PERSONALITY_TITLES[topAttr] || ["Buddy"];
  // Deterministic pick based on total attribute sum
  const sum = entries.reduce((s, [, v]) => s + v, 0);
  return titles[sum % titles.length];
}

export function getTopAttributeName(attrs: BuddyAttributes): string {
  const entries = Object.entries(attrs) as [string, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const labels: Record<string, string> = {
    debugging: "Debugging",
    patience: "Patience",
    chaos: "Chaos",
    wisdom: "Wisdom",
    snark: "Snark",
  };
  return labels[entries[0][0]] || entries[0][0];
}

// --- Animation states ---

export type AnimState = "idle" | "sleep" | "excited" | "thinking";

export const SLEEP_OVERLAY = "  z Z z";
export const THINK_OVERLAY = "  . . .";
export const EXCITED_OVERLAY = " !! ";


type ClientWithProjects = {
  id: string;
  name: string;
  projects: { id: string; name: string }[];
};

type ParsedEntry = {
  hours: number;
  description: string;
  clientMatch: string | null;
  projectMatch: string | null;
  mileageKm: number | null;
  date: string | null;
};

export function parseVoiceEntry(
  text: string,
  clientsWithProjects: ClientWithProjects[]
): ParsedEntry {
  const lower = text.toLowerCase();

  // Parse hours
  const hours = parseHours(lower);

  // Parse mileage
  const mileageKm = parseMileage(lower);

  // Match client and project
  const { clientMatch, projectMatch } = matchClientProject(
    lower,
    clientsWithProjects
  );

  // Extract description — remove hours/mileage patterns, keep the rest
  const description = extractDescription(text, clientsWithProjects);

  return {
    hours,
    description,
    clientMatch,
    projectMatch,
    mileageKm,
    date: null, // Will be resolved by the caller
  };
}

const WORD_NUMBERS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100,
};

/**
 * Convert word-form numbers to digits.
 * Handles: "sixty", "forty five", "a hundred", "a hundred and sixty",
 * "one hundred and twenty", etc. Supports values up to ~200.
 */
function wordsToNumber(text: string): number | null {
  let lower = text.toLowerCase().trim();

  // Strip leading "a " (as in "a hundred")
  lower = lower.replace(/^a\s+/, "");
  // Strip "and" connectors
  lower = lower.replace(/\band\b/g, "").replace(/\s+/g, " ").trim();

  const parts = lower.split(/[\s-]+/);

  // Single word: "sixty", "twenty", "five", "hundred"
  if (parts.length === 1) {
    return WORD_NUMBERS[parts[0]] ?? null;
  }

  // "hundred sixty", "hundred twenty one"
  if (parts[0] === "hundred" || (parts.length >= 2 && WORD_NUMBERS[parts[0]] !== undefined && parts[1] === "hundred")) {
    // Handle "one hundred sixty" or "hundred sixty"
    let remainder: string[];
    if (parts[0] === "hundred") {
      remainder = parts.slice(1);
    } else {
      // e.g. "one hundred sixty" — first word is the hundreds multiplier
      remainder = parts.slice(2);
    }
    const hundreds = parts[0] === "hundred" ? 100 : (WORD_NUMBERS[parts[0]] ?? 1) * 100;
    if (remainder.length === 0) return hundreds;
    const rest = wordsToNumber(remainder.join(" "));
    return rest !== null ? hundreds + rest : null;
  }

  // Compound tens + ones: "forty five", "twenty one"
  if (parts.length === 2) {
    const tens = WORD_NUMBERS[parts[0]];
    const ones = WORD_NUMBERS[parts[1]];
    if (tens !== undefined && ones !== undefined && tens >= 20 && ones <= 9) {
      return tens + ones;
    }
  }

  return null;
}

function wordToNumber(word: string): number | null {
  return WORD_NUMBERS[word.toLowerCase()] ?? null;
}

function parseHours(text: string): number {
  // "all day" = 8 hours
  if (/\ball\s+day\b/.test(text)) return 8;

  // "half day" = 4 hours
  if (/\bhalf\s+day\b/.test(text)) return 4;

  // "X and a half hours" (digit form)
  const halfMatchDigit = text.match(/(\d+)\s+and\s+a\s+half\s+hour/);
  if (halfMatchDigit) return parseFloat(halfMatchDigit[1]) + 0.5;

  // "X and a half hours" (word form: "two and a half hours")
  const wordNames = Object.keys(WORD_NUMBERS).join("|");
  const halfMatchWord = text.match(new RegExp(`(${wordNames})\\s+and\\s+a\\s+half\\s+hour`, "i"));
  if (halfMatchWord) {
    const n = wordToNumber(halfMatchWord[1]);
    if (n !== null) return n + 0.5;
  }

  // "half hour" or "half an hour"
  if (/\bhalf\s+(an?\s+)?hour\b/.test(text)) return 0.5;

  // "X.Y hours" (digit form)
  const decimalMatch = text.match(/(\d+\.?\d*)\s+hours?/);
  if (decimalMatch) return parseFloat(decimalMatch[1]);

  // "X hours" (digit form)
  const intMatch = text.match(/(\d+)\s+hours?/);
  if (intMatch) return parseInt(intMatch[1]);

  // Compound word-form: "forty five hours", "a hundred and sixty hours", "two hundred hours"
  const compoundMatch = text.match(new RegExp(`((?:a\\s+)?(?:${wordNames})(?:\\s+(?:and\\s+)?(?:${wordNames})){0,3})\\s+hours?`, "i"));
  if (compoundMatch) {
    const n = wordsToNumber(compoundMatch[1]);
    if (n !== null) return n;
  }

  return 0;
}

function parseMileage(text: string): number | null {
  // "45 km" or "45km" or "45 kilometres"
  const kmMatch = text.match(/(\d+\.?\d*)\s*(?:km|kilometres?|kilometers?)/);
  if (kmMatch) return parseFloat(kmMatch[1]);
  return null;
}

/**
 * Levenshtein edit distance between two strings.
 * Counts minimum single-character edits (insert, delete, substitute).
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Fuzzy match two words using prefix matching + Levenshtein distance.
 * Handles speech-to-text variations, typos, and phonetic differences.
 *
 * Thresholds:
 *   3-4 char words: allow distance 1  (Acme ↔ Akme)
 *   5-6 char words: allow distance 2  (Tessie ↔ Teasie)
 *   7+ char words:  allow distance 2  (keeps it tight for longer words)
 */
function fuzzyWordMatch(textWord: string, nameWord: string): boolean {
  if (textWord === nameWord) return true;

  const shorter = Math.min(textWord.length, nameWord.length);
  if (shorter < 3) return false;

  // Prefix match: "tess" ↔ "tessie"
  if (textWord.startsWith(nameWord) || nameWord.startsWith(textWord)) {
    return true;
  }

  // Levenshtein distance match
  const dist = levenshtein(textWord, nameWord);
  const maxLen = Math.max(textWord.length, nameWord.length);

  if (maxLen <= 4) return dist <= 1;
  if (maxLen <= 6) return dist <= 2;
  return dist <= 2;
}

/**
 * Split a name into words, handling spaces, PascalCase, and camelCase.
 * "TessTantrums" → ["tess", "tantrums"]
 * "Acme Corp"    → ["acme", "corp"]
 * "ParnellHelloWorld" → ["parnell", "hello", "world"]
 */
function splitNameIntoWords(name: string): string[] {
  // First split on whitespace
  const spaceParts = name.split(/\s+/);
  const words: string[] = [];
  for (const part of spaceParts) {
    // Split PascalCase/camelCase: insert space before uppercase letters
    const camelWords = part
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      .toLowerCase()
      .split(/\s+/);
    words.push(...camelWords);
  }
  return words;
}

function matchWordInText(text: string, nameWord: string): boolean {
  if (nameWord.length <= 2) return false;
  // First try exact substring match
  if (text.includes(nameWord)) return true;
  // Then try fuzzy match against each word in the text
  const textWords = text.split(/[\s,.:;!?]+/).filter((w) => w.length > 0);
  return textWords.some((tw) => tw.length > 2 && fuzzyWordMatch(tw, nameWord));
}

function matchClientProject(
  text: string,
  clients: ClientWithProjects[]
): { clientMatch: string | null; projectMatch: string | null } {
  for (const client of clients) {
    // Split name handling PascalCase, camelCase, and spaces
    const clientWords = splitNameIntoWords(client.name);
    const clientMatches = clientWords.some((word) =>
      matchWordInText(text, word)
    );

    if (clientMatches) {
      // Try to match a project
      for (const project of client.projects) {
        const projectWords = splitNameIntoWords(project.name);
        const projectMatches = projectWords.some((word) =>
          matchWordInText(text, word)
        );
        if (projectMatches) {
          return { clientMatch: client.id, projectMatch: project.id };
        }
      }
      return { clientMatch: client.id, projectMatch: null };
    }
  }

  return { clientMatch: null, projectMatch: null };
}

function extractDescription(
  text: string,
  clients: ClientWithProjects[]
): string {
  let desc = text;

  // Remove hour patterns (digit and word forms)
  const wordNamePattern = Object.keys(WORD_NUMBERS).join("|");
  desc = desc.replace(
    new RegExp(`\\b(\\d+\\.?\\d*\\s+hours?|(?:${wordNamePattern})\\s+hours?|(?:${wordNamePattern})\\s+and\\s+a\\s+half\\s+hours?|half\\s+(?:an?\\s+)?hour|all\\s+day|half\\s+day|\\d+\\s+and\\s+a\\s+half\\s+hours?)\\b`, "gi"),
    ""
  );

  // Remove mileage
  desc = desc.replace(
    /\b\d+\.?\d*\s*(?:km|kilometres?|kilometers?)\b/gi,
    ""
  );

  // Remove time references
  desc = desc.replace(/\b(today|yesterday|this morning|this afternoon)\b/gi, "");

  // Remove client/project names
  for (const client of clients) {
    for (const word of client.name.split(/\s+/)) {
      if (word.length > 2) {
        desc = desc.replace(new RegExp(`\\b${word}\\b`, "gi"), "");
      }
    }
    for (const project of client.projects) {
      for (const word of project.name.split(/\s+/)) {
        if (word.length > 2) {
          desc = desc.replace(new RegExp(`\\b${word}\\b`, "gi"), "");
        }
      }
    }
  }

  // Clean up whitespace
  desc = desc.replace(/\s+/g, " ").trim();
  // Remove leading/trailing "for", "on", "at", etc.
  desc = desc.replace(/^(for|on|at|to|in)\s+/i, "").trim();
  desc = desc.replace(/\s+(for|on|at|to|in)$/i, "").trim();

  return desc || text.trim();
}

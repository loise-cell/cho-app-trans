/**
 * Extract player / speaker / ship-style entities from OCR chat text
 * so they can be excluded from the word cloud while still shown in source text.
 */

const ROMAN_NUMERAL = "(?:VIII|VII|VI|IV|IX|III|II|I|X|V)";

function normalizeEntity(value: string): string {
  return value.trim().replace(/^["'「『]+|["'」』.,:;!?]+$/g, "");
}

function addSpeakerParts(speaker: string, entities: Set<string>) {
  const cleaned = normalizeEntity(speaker);
  if (!cleaned) {
    return;
  }
  entities.add(cleaned.toLowerCase());

  const withoutShip = cleaned.replace(new RegExp(`^${ROMAN_NUMERAL}\\s+`, "i"), "").trim();
  if (withoutShip && withoutShip.toLowerCase() !== cleaned.toLowerCase()) {
    entities.add(withoutShip.toLowerCase());
  }

  const parts = cleaned.split(/[\s]+/).filter(Boolean);
  for (const part of parts) {
    entities.add(part.toLowerCase());
    if (part.includes("_")) {
      for (const chunk of part.split("_").filter(Boolean)) {
        if (chunk.length >= 2) {
          entities.add(chunk.toLowerCase());
        }
      }
    }
  }
}

export function extractChatEntities(text: string): Set<string> {
  const entities = new Set<string>();
  if (!text.trim()) {
    return entities;
  }

  const lines = text.split(/\n+/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const colonMatch = trimmed.match(/^(.+?)\s*[:：]\s*(.+)$/);
    if (colonMatch) {
      addSpeakerParts(colonMatch[1], entities);
    }

    const quoteMatch = trimmed.match(/^([A-Za-z0-9_.\-]+)\s*[「"']/);
    if (quoteMatch) {
      addSpeakerParts(quoteMatch[1], entities);
    }

    const shipTag = new RegExp(`\\b${ROMAN_NUMERAL}\\s+([A-Z][A-Za-z0-9_]{1,20})\\b`, "g");
    let shipHit: RegExpExecArray | null;
    while ((shipHit = shipTag.exec(trimmed)) !== null) {
      entities.add(shipHit[1].toLowerCase());
      entities.add(`${shipHit[0]}`.toLowerCase());
    }

    const romanHits = trimmed.match(new RegExp(`\\b(?:VIII|VII|VI|IV|IX|III|II|I|X|V)\\b`, "g"));
    if (romanHits) {
      for (const r of romanHits) {
        entities.add(r.toLowerCase());
      }
    }

    const idHits = trimmed.match(/\b[A-Za-z][A-Za-z0-9]*_{1,}[A-Za-z0-9_]+\b/g);
    if (idHits) {
      for (const id of idHits) {
        addSpeakerParts(id, entities);
      }
    }
  }

  return entities;
}

export function isExcludedWord(word: string, entities: Set<string>): boolean {
  const normalized = word.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "");
  if (!normalized) {
    return true;
  }
  if (entities.has(normalized)) {
    return true;
  }
  for (const entity of entities) {
    if (!entity.includes("_")) {
      continue;
    }
    if (entity === normalized || entity.split("_").includes(normalized)) {
      return true;
    }
  }
  return false;
}

/**
 * OCR often inserts line breaks from newspaper columns / phone screenshots.
 * Articles should read as continuous paragraphs; chat logs should keep one line per message.
 */

function looksLikeChatLog(lines: string[]): boolean {
  if (lines.length < 2) {
    return false;
  }
  let chatHits = 0;
  for (const line of lines) {
    if (/^.{1,48}\s*[:：]\s*.+/.test(line)) {
      chatHits += 1;
      continue;
    }
    if (/^[A-Za-z0-9_.\-]{2,32}\s*[「"']/.test(line)) {
      chatHits += 1;
    }
  }
  return chatHits >= 2 || chatHits / lines.length >= 0.4;
}

function endsWithHyphenatedBreak(line: string): boolean {
  return /[A-Za-z]-$/.test(line);
}

function joinTwoLines(prev: string, next: string): string {
  if (endsWithHyphenatedBreak(prev)) {
    return `${prev.slice(0, -1)}${next}`;
  }
  const prevCjk = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]$/.test(prev);
  const nextCjk = /^[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/.test(next);
  if (prevCjk || nextCjk) {
    return `${prev}${next}`;
  }
  return `${prev} ${next}`;
}

/**
 * Collapse soft line breaks into paragraphs.
 * Blank lines (or multiple newlines) become paragraph separators.
 * Chat-style logs keep per-line breaks.
 */
export function unwrapSoftLineBreaks(text: string): string {
  if (!text.trim()) {
    return "";
  }

  const rawLines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]{2,}/g, " ").trim());

  const lines = rawLines.filter((line, index, arr) => {
    if (line.length > 0) {
      return true;
    }
    // keep blank as paragraph marker only between content
    return index > 0 && index < arr.length - 1 && arr[index - 1].length > 0;
  });

  const contentLines = lines.filter((line) => line.length > 0);
  if (looksLikeChatLog(contentLines)) {
    return contentLines.join("\n");
  }

  const paragraphs: string[] = [];
  let current = "";

  for (const line of lines) {
    if (!line) {
      if (current) {
        paragraphs.push(current);
        current = "";
      }
      continue;
    }
    if (!current) {
      current = line;
      continue;
    }
    current = joinTwoLines(current, line);
  }

  if (current) {
    paragraphs.push(current);
  }

  return paragraphs.join("\n\n").trim();
}

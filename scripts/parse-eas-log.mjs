const buildId = process.argv[2];
if (!buildId) {
  console.error("usage: node scripts/parse-eas-log.mjs <build-id>");
  process.exit(1);
}

const { execSync } = await import("node:child_process");
const raw = execSync(`npx eas-cli build:view ${buildId} --json`, { encoding: "utf8" });
const json = JSON.parse(raw.replace(/^[^\{]*/, ""));
const log = await fetch(json.logFiles[0]).then((r) => r.text());
const msgs = log
  .split("\n")
  .map((line) => {
    try {
      return JSON.parse(line).msg;
    } catch {
      return null;
    }
  })
  .filter(Boolean)
  .filter((msg) => /^(e: |FAILURE|Execution failed|incompatible version|error:)/i.test(msg) || msg.includes("compileDebugKotlin FAILED"));

console.log(msgs.slice(0, 30).join("\n"));

#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { stdin, stdout, stderr } from "node:process";

const help = `node scripts/project.mjs analyze|build [--id UUID] < intake.json
node scripts/project.mjs status BUILD_UUID
node scripts/project.mjs revise BUILD_UUID [--id OPERATION_UUID] < revision.json

Set JUDGEHUMAN_BUILD_KEY to a key from JudgeHuman Settings.
JUDGEHUMAN_BASE_URL defaults to https://www.judgehuman.ai. Use http://localhost:3107 for local development.`;
const uuid = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;

async function readObject() {
  let length = 0;
  const chunks = [];
  if (stdin.isTTY) throw Error("Supply a JSON object on standard input.");
  for await (const chunk of stdin) {
    length += chunk.length;
    if (length > 50_000) throw Error("Input exceeds 50 KB.");
    chunks.push(chunk);
  }
  const object = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!object || typeof object !== "object" || Array.isArray(object)) throw Error("Expected one JSON object.");
  return object;
}

async function run(argv) {
  const [command, ...args] = argv;
  if (!command || command === "--help" || command === "-h") { stdout.write(help + "\n"); return; }
  if (!["analyze", "build", "status", "revise"].includes(command)) throw Error(help);
  const base = new URL(process.env.JUDGEHUMAN_BASE_URL || "https://www.judgehuman.ai");
  const local = base.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname);
  if ((!local && base.origin !== "https://www.judgehuman.ai") || base.href !== base.origin + "/") {
    throw Error("Use the production JudgeHuman origin or an HTTP loopback origin.");
  }
  const token = process.env.JUDGEHUMAN_BUILD_KEY?.trim();
  if (!token) throw Error("Set JUDGEHUMAN_BUILD_KEY to a product build key from Settings.");
  const existing = command === "status" || command === "revise";
  const buildId = existing ? args.shift() : undefined;
  if (existing && !uuid.test(buildId ?? "")) throw Error("Supply the UUID of the original build request.");
  let requestId;
  if (command !== "status") {
    if (args[0] === "--id") {
      args.shift();
      requestId = args.shift();
      if (!uuid.test(requestId ?? "")) throw Error("--id requires a UUID.");
    } else requestId = randomUUID();
  }
  if (args.length) throw Error(help);
  let path = "/api/v1/builds" + (buildId ? "/" + buildId : "");
  let body;
  if (command === "revise") {
    path += "/prototypes";
    body = { ...(await readObject()), requestId };
  } else if (command !== "status") {
    body = { requestId, intake: { ...(await readObject()), action: command } };
  }
  if (requestId) stderr.write("Request ID " + requestId + "\n");
  const response = await fetch(new URL(path, base), {
    method: body ? "POST" : "GET", redirect: "error", signal: AbortSignal.timeout(130_000),
    headers: { Authorization: "Bearer " + token, ...(body && { "Content-Type": "application/json" }) },
    body: body && JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw Error("HTTP " + response.status + " " + (result.error || "Build request failed"));
  stdout.write(JSON.stringify(result, null, 2) + "\n");
  if (result.error) process.exitCode = 2;
}

run(process.argv.slice(2)).catch(error => { stderr.write(error.message + "\n"); process.exitCode = 1; });

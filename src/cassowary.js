// Cassowary interpreter

import * as fs from "fs";
import parse from "./parser.js";
import interpret from "./interpreter.js";

// Check that the user has provided a filename as an argument
if (process.argv.length !== 3) {
  console.error("Usage: node src/cassowary.js FILENAME");
  process.exit(1);
}

try {
  const sourceCode = fs.readFileSync(process.argv[2], "utf8");
  const match = parse(sourceCode);
  interpret(match);
} catch (e) {
  console.error(e);
  process.exit(1);
}

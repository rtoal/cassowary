// Cassowary interpreter

import parse from "./parser.js";
import interpret from "./interpreter.js";

// Check that the user has provided a filename as an argument
if (process.argv.length !== 3) {
  console.error("Usage: node src/cassowary.js FILENAME");
  process.exit(1);
}

try {
  // Syntax
  const match = parse(process.argv[2]);
  // Semantics
  interpret(match);
} catch (e) {
  console.error(e);
  process.exit(1);
}

// Cassowary compiler

// Cassowary is completely statically typed language. Also it checks
// pretty much everything at compile time.

import * as fs from "fs";
import parse from "./parser.js";
import analyze from "./analyzer.js";
import translate from "./translator.js";

// Check that the user has provided a filename as an argument
if (process.argv.length !== 3) {
  console.error("Usage: node src/cassowary.js FILENAME");
  process.exit(1);
}

// try {
const sourceCode = fs.readFileSync(process.argv[2], "utf8");
const match = parse(sourceCode);
const program = analyze(match);
const target = translate(program);
// console.log(target.join("\n"));
// } catch (e) {
//   console.error(`${e}`);
//   process.exit(1);
// }

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";

// Programs expected to be syntactically correct
const syntaxChecks = [
  ["simplest syntactically correct program", "break;"],
  ["multiple statements", "print(1);\nbreak;\nx=5;\nbreak;\n++x;"],
  ["variable declarations", "let e=99*1;\nconst z=false;"],
  ["function with no params", "fnc f() = 3;"],
  ["function with one param", "fnc f(x: number) = x;"],
  ["function with two params", `fnc f(x: number, y: bool) = "hello";`],
  ["array type for param", "fnc f(x: bool[][][]) = 3;"],
  ["assignments", "++a; abc=9*3; a=1;"],
  ["assignment to array element", "c[2] = 100;"],
  ["array element increment", "++c[2];"],
  ["call in exp", "print(5 * f(x, y, 2 * y));"],
  ["short if", "if true { print(1); }"],
  ["longer if", "if true { print(1); } else { print(1); }"],
  ["even longer if", "if true { print(1); } else if false { print(1);}"],
  ["while with empty block", "while true {}"],
  ["while with one statement block", "while true { let x = 1; }"],
  ["relational operators", "a=1<2;a=1<=2;a=1==2;a=1!=2;a=1>=2;a=1>2;"],
  ["arithmetic", "print 2 * x + 3 / 5 - -1 % 7 ** 3 ** 3;"],
  ["length", "print #c; print #[1,2,3];"],
  ["boolean literals", "let x = false; x = true;"],
  ["all numeric literal forms", "print(8 * 89.123 * 1.3E5 * 1.3E+5 * 1.3E-5);"],
  ["empty array literal", "print([]);"],
  ["nonempty array literal", "print([1, 2, 3]);"],
  ["parentheses", "print(83 * ((((((((-(13 / 21))))))))) + 1 - 0);"],
  ["indexing array literals", "print([1,2,3][1]);"],
  ["non-Latin letters in identifiers", "let コンパイラ = 100;"],
  ["a simple string literal", 'print("hello😉😬💀🙅🏽‍♀️—`");'],
  ["end of program inside comment", "print(0); // yay"],
  ["comments with no text", "print(1);//\nprint(0);//"],
];

// Programs with syntax errors that the parser will detect
const syntaxErrors = [
  ["non-letter in an identifier", "let ab😭c = 2;", /Line 1, col 7:/],
  ["malformed number", "let x= 2.;", /Line 1, col 10:/],
  ["a float with an E but no exponent", "let x = 5E * 11;", /Line 1, col 11:/],
  ["a missing right operand", "print(5 -);", /Line 1, col 10:/],
  ["a non-operator", "print(7 * ((2 _ 3));", /Line 1, col 15:/],
  ["an expression starting with a )", "return );", /Line 1, col 8:/],
  ["a statement starting with expression", "x * 5;", /Line 1, col 3:/],
  ["an illegal statement on line 2", "print(5);\nx * 5;", /Line 2, col 3:/],
  ["a statement starting with a )", "print(5);\n)", /Line 2, col 1:/],
  ["an expression starting with a *", "let x = * 71;", /Line 1, col 9:/],
  ["negation before exponentiation", "print(-2**2);", /Line 1, col 10:/],
  ["associating relational operators", "print(1 < 2 < 3);", /Line 1, col 16:/],
  ["while without braces", "while true\nprint(1);", /Line 2, col 1/],
  ["if without braces", "if x < 3\nprint(1);", /Line 2, col 1/],
  ["while as identifier", "let while = 3;", /Line 1, col 5/],
  ["if as identifier", "let if = 8;", /Line 1, col 5/],
  ["unbalanced brackets", "fnc f() = [;", /Line 1, col 12/],
  ["bad array literal", "print([1,2,]);", /Line 1, col 12/],
  ["empty subscript", "print(a[]);", /Line 1, col 9/],
  ["true is not assignable", "true = 1;", /Line 1, col 5/],
  ["false is not assignable", "false = 1;", /Line 1, col 6/],
  ["numbers cannot be subscripted", "print(500[x]);", /Line 1, col 10/],
  ["numbers cannot be called", "print(500(x));", /Line 1, col 10/],
  ["string lit with quote", 'print("ok"computer");', /Line 1, col 11/],
];

describe("The parser", () => {
  for (const [scenario, source] of syntaxChecks) {
    it(`matches ${scenario}`, () => {
      assert(parse(source).succeeded());
    });
  }
  for (const [scenario, source, errorMessagePattern] of syntaxErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => parse(source), errorMessagePattern);
    });
  }
});

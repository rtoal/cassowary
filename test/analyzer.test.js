import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";

// Programs that are semantically correct
const semanticChecks = [
  ["variable declarations", 'let x = 1; let y = "false";'],
  ["complex array types", "fnc f(x: number[][]) = 3;"],
  ["increment", "let x = 10; ++x;"],
  ["initialize with empty array", "let a = [];"],
  ["assign arrays", "let a = [1,2,3]; let b=[10,20]; a=b; b=a;"],
  ["assign to array element", "let a = [1,2,3]; a[1]=100;"],
  ["simple break", "while true {break;}"],
  ["break in nested if", "while false {if true {break;}}"],
  ["long if", "if true {print(1);} else {print(3);}"],
  ["elsif", "if true {print(1);} else if true {print(0);} else {print(3);}"],
  ["relations", 'print(1<=2); print("x">"y");'],
  ["ok to == arrays", "print([1]==[5,8]);"],
  ["ok to != arrays", "print([1]!=[5,8]);"],
  ["arithmetic", "let x=1;print(2*3+5**-3/2-5%8);"],
  ["array length", "print(#[1,2,3]);"],
  ["variables", "let x=[[[[1]]]]; print(x[0][0][0][0]+2);"],
  ["subscript exp", "let a=[1,2];print(a[0]);"],
  ["simple calls", "print(1);"],
  [
    "type equivalence of nested arrays",
    "fnc f(x: number[][])=3; print(f([[1],[2]]));",
  ],
  ["outer variable", "let x=1; while(false) {print(x);}"],
];

// Programs that are syntactically correct but have semantic errors
const semanticErrors = [
  ["non-number increment", "let x=false;++x;", /Expected number/],
  ["undeclared id", "print(x);", /x not declared/],
  ["redeclared id", "let x = 1;let x = 1;", /Variable already declared: x/],
  ["assign to const", "const x = 1;x = 2;", /Assignment to immutable variable/],
  [
    "assign to function",
    "fnc f() = 3; fnc g() = 5; f = g;",
    /Assignment to immutable variable/,
  ],
  [
    "assign to const array element",
    "const a = [1];a[0] = 2;",
    /Assignment to immutable variable/,
  ],
  ["assign bad type", "let x=1;x=true;", /Operands must have the same type/],
  [
    "assign bad array type",
    "let x=1;x=[true];",
    /Operands must have the same type/,
  ],
  ["break outside loop", "break;", /Break can only appear in a loop/],
  ["non-boolean short if test", "if 1 {}", /Expected boolean/],
  ["non-boolean if test", "if 1 {} else {}", /Expected boolean/],
  ["non-boolean while test", "while 1 {}", /Expected boolean/],
  ["bad types for +", "print(false+1);", /Expected number or string/],
  ["bad types for -", "print(false-1);", /Expected number/],
  ["bad types for *", "print(false*1);", /Expected number/],
  ["bad types for /", "print(false/1);", /Expected number/],
  ["bad types for **", "print(false**1);", /Expected number/],
  ["bad types for <", "print(false<1);", /Expected number or string/],
  ["bad types for <=", "print(false<=1);", /Expected number or string/],
  ["bad types for >", "print(false>1);", /Expected number or string/],
  ["bad types for >=", "print(false>=1);", /Expected number or string/],
  ["bad types for ==", 'print(2=="x");', /Type mismatch/],
  ["bad types for !=", "print(false!=1);", /Type mismatch/],
  ["bad types for negation", "print(-true);", /Expected number/],
  ["bad types for length", "print(#false);", /Expected string or array/],
  ["bad types for not", 'print(!"hello");', /Expected boolean/],
  ["non-number index", "let a=[1];print(a[false]);", /Expected number/],
  [
    "diff type array elements",
    "print([3,false]);",
    /All elements must have the same type/,
  ],
  ["call of nonfunction", "let x = 1;\nprint(x());", /x not a function/],
  [
    "Too many args",
    "fnc f(x: number) = 3; print(f(1,2));",
    /Expected 1 argument\(s\) but 2 passed/,
  ],
  [
    "Too few args",
    "fnc f(x: number) = 3; print(f());",
    /Expected 1 argument\(s\) but 0 passed/,
  ],
  [
    "Parameter type mismatch",
    "fnc f(x: number) = 3; print(f(false));",
    /Operands must have the same type/,
  ],
];

describe("The analyzer", () => {
  for (const [scenario, source] of semanticChecks) {
    it(`recognizes ${scenario}`, () => {
      assert.ok(analyze(parse(source)));
    });
  }
  for (const [scenario, source, errorMessagePattern] of semanticErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => analyze(parse(source)), errorMessagePattern);
    });
  }
  //   it("produces the expected representation for a trivial program", () => {
  //     assert.deepEqual(
  //       analyze(parse("let x = π + 2.2;")),
  //       program([
  //         variableDeclaration(
  //           variable("x", true, floatType),
  //           binary("+", variable("π", false, floatType), 2.2, floatType)
  //         ),
  //       ])
  //     )
  //   })
});

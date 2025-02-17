import * as core from "./core.js";

export default function analyze(match) {
  const grammar = match.matcher.grammar;

  const locals = new Map(); // string -> entity
  const target = [];

  function emit(line) {
    target.push(line);
  }

  function check(condition, message, parseTreeNode) {
    if (!condition) {
      throw new Error(
        `${parseTreeNode.source.getLineAndColumnMessage()} ${message}`
      );
    }
  }

  function checkNumber(e, parseTreeNode) {
    check(e.type === "number", `Expected number`, parseTreeNode);
  }

  function checkBoolean(e, parseTreeNode) {
    check(e.type === "boolean", `Expected boolean`, parseTreeNode);
  }

  function checkNotDeclared(name, parseTreeNode) {
    check(
      !locals.has(name),
      `Variable already declared: ${name}`,
      parseTreeNode
    );
  }

  function checkDeclared(name, parseTreeNode) {
    check(locals.has(name), `Undeclared variable: ${name}`, parseTreeNode);
  }

  const translator = grammar.createSemantics().addOperation("analyze", {
    Program(statements) {
      return core.program(statements.children.map((s) => s.analyze()));
    },
    Stmt_increment(_op, id, _semi) {
      const variable = id.analyze();
      return core.incrementStatement(variable);
    },
    Stmt_break(_break, _semi) {
      return core.breakStatement();
    },
    VarDec(_let, id, _eq, exp, _semi) {
      checkNotDeclared(id.sourceString, id);
      const initializer = exp.analyze();
      const variable = core.variable(id.sourceString, initializer.type, true);
      locals.set(id.sourceString, variable);
      return core.variableDeclaration(variable, initializer);
    },
    PrintStmt(_print, exp, _semi) {
      const argument = exp.analyze();
      return core.printStatement(argument);
    },
    AssignmentStmt(id, _eq, exp, _semi) {
      const source = exp.analyze();
      const target = id.analyze();
      return core.assignmentStatement(source, target);
    },
    WhileStmt(_while, exp, block) {
      const test = exp.analyze();
      checkBoolean(test, exp);
      const body = block.analyze();
      return core.whileStatement(test, body);
    },
    Block(_open, statements, _close) {
      return statements.children.map((s) => s.analyze());
    },
    Exp_test(left, op, right) {
      // TODO: This badly needs type checking
      return core.binaryExpression(
        op.sourceString,
        left.analyze(),
        right.analyze(),
        "boolean"
      );
    },
    Condition_add(left, _op, right) {
      const x = left.analyze();
      const y = right.analyze();
      checkNumber(x, left);
      checkNumber(y, right);
      return core.binaryExpression("+", x, y, "number");
    },
    Condition_sub(left, _op, right) {
      const x = left.analyze();
      const y = right.analyze();
      checkNumber(x, left);
      checkNumber(y, right);
      return core.binaryExpression("-", x, y, "number");
    },
    Term_mul(left, _op, right) {
      const x = left.analyze();
      const y = right.analyze();
      checkNumber(x, left);
      checkNumber(y, right);
      return core.binaryExpression("*", x, y, "number");
    },
    Term_div(left, _op, right) {
      const x = left.analyze();
      const y = right.analyze();
      checkNumber(x, left);
      checkNumber(y, right);
      return core.binaryExpression("/", x, y, "number");
    },
    Term_mod(left, _op, right) {
      const x = left.analyze();
      const y = right.analyze();
      checkNumber(x, left);
      checkNumber(y, right);
      return core.binaryExpression("%", x, y, "number");
    },
    Primary_parens(_open, exp, _close) {
      return exp.analyze();
    },
    Factor_neg(_op, operand) {
      return unaryExpression("-", operand.analyze(), "number");
    },
    Factor_exp(left, _op, right) {
      return core.binaryExpression(
        "**",
        left.analyze(),
        right.analyze(),
        "number"
      );
    },
    numeral(digits, _dot, _fractional, _e, _sign, _exponent) {
      return Number(this.sourceString);
    },
    id(_first, _rest) {
      const entity = locals.get(this.sourceString);
      checkDeclared(this.sourceString, this);
      return entity;
    },
    true(_) {
      return true;
    },
    false(_) {
      return false;
    },
  });

  translator(match).analyze();
  return target;
}

Number.prototype.type = "number";
Boolean.prototype.type = "boolean";
String.prototype.type = "string";

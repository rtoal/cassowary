import * as core from "./core.js";

export default function analyze(match) {
  const grammar = match.matcher.grammar;

  class Context {
    constructor(parent = null) {
      this.locals = new Map();
      this.parent = parent;
    }
    add(name, entity) {
      this.locals.set(name, entity);
    }
    has(name) {
      return this.locals.has(name);
    }
    lookup(name) {
      return this.locals.get(name) ?? (this.parent && this.parent.lookup(name));
    }
    newChildContext() {
      return new Context(this);
    }
  }

  // THIS IS THE CURRENT CONTEXT THAT WE ARE TRACKING
  let context = new Context();

  const target = [];

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

  function checkNumberOrString(e, parseTreeNode) {
    check(
      e.type === "number" || e.type === "string",
      `Expected number or string`,
      parseTreeNode
    );
  }

  function checkArrayOrString(e, parseTreeNode) {
    check(
      // TODO FIX DISGUSTING HACK BELOW
      e.type === "string" || e.type.endsWith("[]"),
      `Expected string or array`,
      parseTreeNode
    );
  }

  function checkSameTypes(x, y, parseTreeNode) {
    check(x.type === y.type, `Operands must have the same type`, parseTreeNode);
  }

  function checkAllElementsHaveSameType(elements, parseTreeNode) {
    if (elements.length > 0) {
      const type = elements[0].type;
      for (const e of elements) {
        check(
          e.type === type,
          `All elements must have the same type`,
          parseTreeNode
        );
      }
    }
  }

  function checkNotDeclared(name, parseTreeNode) {
    check(
      !context.has(name),
      `Variable already declared: ${name}`,
      parseTreeNode
    );
  }

  function checkIsMutable(variable, parseTreeNode) {
    check(variable.mutable, `Assignment to immutable variable`, parseTreeNode);
  }

  const analyzer = grammar.createSemantics().addOperation("analyze", {
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
    VarDec(qualifier, id, _eq, exp, _semi) {
      checkNotDeclared(id.sourceString, id);
      const initializer = exp.analyze();
      const mutable = qualifier.sourceString === "let";
      const variable = core.variable(
        id.sourceString,
        initializer.type,
        mutable
      );
      context.add(id.sourceString, variable);
      return core.variableDeclaration(variable, initializer);
    },
    FunDec(_fun, id, params, _eq, exp, _semi) {
      checkNotDeclared(id.sourceString, id);
      context = context.newChildContext();
      const parameters = params.analyze();
      const body = exp.analyze();
      context = context.parent;
      const fun = core.función(id.sourceString, parameters, body.type);
      context.add(id.sourceString, fun);
      return core.functionDeclaration(fun, body);
    },
    Params(_open, params, _close) {
      return params.asIteration().children.map((p) => p.analyze());
    },
    Param(id, _colon, type) {
      checkNotDeclared(id.sourceString, id);
      const param = core.variable(id.sourceString, type.sourceString, false);
      context.add(id.sourceString, param);
      return param;
    },
    PrintStmt(_print, exp, _semi) {
      const argument = exp.analyze();
      return core.printStatement(argument);
    },
    AssignmentStmt(id, _eq, exp, _semi) {
      const source = exp.analyze();
      const target = id.analyze();
      checkSameTypes(source, target, id);
      checkIsMutable(target, id);
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
      const x = left.analyze();
      const y = right.analyze();
      // TODO: THIS IS GOOD FOR NOW BUT MUST CHANGE WHEN WE
      // ADD STRINGS, FUNCTIONS, ARRAYS, AND OBJECTS
      if (op.sourceString === "==" || op.sourceString === "!=") {
        check(x.type === y.type, `Type mismatch`, op);
      } else {
        checkNumber(x, left);
        checkNumber(y, right);
      }
      return core.binaryExpression(op.sourceString, x, y, "boolean");
    },
    Condition_add(left, _op, right) {
      const x = left.analyze();
      const y = right.analyze();
      checkNumberOrString(x, left);
      checkSameTypes(x, y, right);
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
      checkNumberOrString(x, left);
      checkNumber(y, right);
      return core.binaryExpression("*", x, y, x.type);
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
      checkNumber(operand.analyze(), operand);
      return unaryExpression("-", operand.analyze(), "number");
    },
    Factor_not(_op, operand) {
      checkBoolean(operand.analyze(), operand);
      return unaryExpression("!", operand.analyze(), "boolean");
    },
    Factor_len(_op, operand) {
      const e = operand.analyze();
      checkArrayOrString(e, operand);
      return core.unaryExpression("#", e, "number");
    },
    Factor_exp(left, _op, right) {
      return core.binaryExpression(
        "**",
        left.analyze(),
        right.analyze(),
        "number"
      );
    },
    Primary_array(open, elements, _close) {
      const contents = elements.asIteration().children.map((e) => e.analyze());
      checkAllElementsHaveSameType(contents, open);
      const elementType = contents.length > 0 ? contents[0].type : "any";
      return core.arrayExpression(contents, `${elementType}[]`);
    },
    Primary_subscript(array, _open, index, _close) {
      const e = array.analyze();
      checkArrayOrString(e, array);
      return core.subscriptExpression(e, index.analyze(), "number");
    },
    numeral(digits, _dot, _fractional, _e, _sign, _exponent) {
      return Number(this.sourceString);
    },
    id(_first, _rest) {
      const entity = context.lookup(this.sourceString);
      check(entity, `${this.sourceString} not declared`, this);
      return entity;
    },
    true(_) {
      return true;
    },
    false(_) {
      return false;
    },
    stringlit(_open, chars, _close) {
      return chars.sourceString;
    },
  });

  return analyzer(match).analyze();
}

Number.prototype.type = "number";
Boolean.prototype.type = "boolean";
String.prototype.type = "string";

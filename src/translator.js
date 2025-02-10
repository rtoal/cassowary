// Cassowary compiler

export default function translate(match) {
  const grammar = match.matcher.grammar;

  const locals = new Map();
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

  const translator = grammar.createSemantics().addOperation("translate", {
    Program(statements) {
      for (const statement of statements.children) {
        statement.translate();
      }
    },
    Stmt_increment(_op, id, _semi) {
      const variable = id.translate();
      emit(`${variable}++;`);
    },
    Stmt_break(_break, _semi) {
      emit("break;");
    },
    VarDec(_let, id, _eq, exp, _semi) {
      check(
        !locals.has(id.sourceString),
        `Variable already declared: ${id.sourceString}`,
        id
      );
      const initializer = exp.translate();
      locals.set(id.sourceString, "number");
      emit(`let ${id.sourceString} = ${initializer};`);
    },
    PrintStmt(_print, exp, _semi) {
      emit(`console.log(${exp.translate()});`);
    },
    AssignmentStmt(id, _eq, exp, _semi) {
      const value = exp.translate();
      const variable = id.translate();
      emit(`${variable} = ${value};`);
    },
    WhileStmt(_while, exp, block) {
      emit(`while (${exp.translate()}) {`);
      block.translate();
      emit("}");
    },
    Block(_open, statements, _close) {
      for (const statement of statements.children) {
        statement.translate();
      }
    },
    Exp_test(left, op, right) {
      const targetOp =
        { "==": "===", "!=": "!==" }?.[op.sourceString] ?? op.sourceString;
      return `${left.translate()} ${targetOp} ${right.translate()}`;
    },
    Condition_add(left, _op, right) {
      return `${left.translate()} + ${right.translate()}`;
    },
    Condition_sub(left, _op, right) {
      return `${left.translate()} - ${right.translate()}`;
    },
    Term_mul(left, _op, right) {
      return `${left.translate()} * ${right.translate()}`;
    },
    Term_div(left, _op, right) {
      return `${left.translate()} / ${right.translate()}`;
    },
    Term_mod(left, _op, right) {
      return `${left.translate()} % ${right.translate()}`;
    },
    Primary_parens(_open, exp, _close) {
      return exp.translate();
    },
    numeral(digits, _dot, _fractional, _e, _sign, _exponent) {
      return Number(this.sourceString);
    },
    id(_first, _rest) {
      const name = this.sourceString;
      check(locals.has(name), `Undeclared variable: ${name}`, this);
      return name;
    },
  });

  translator(match).translate();
  return target;
}

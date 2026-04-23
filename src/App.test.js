import {
  SYMBOLS,
  tokenizeFormula,
  parseFormulaAst,
  solvePropositionSafe,
  getAllowedEvaluationRedexes,
  reduceEvaluationStep,
  isBalanced,
  extractFormulaVariables,
  buildTruthTableRows,
  areExpressionsEquivalent,
  createCircuitChallenge,
} from './App';

describe('logic helpers', () => {
  test('tokenizes formulas with logical symbols and parentheses', () => {
    expect(tokenizeFormula('¬(P ∧ Q) ⇒ R')).toEqual([
      SYMBOLS.NOT,
      '(',
      'P',
      SYMBOLS.AND,
      'Q',
      ')',
      SYMBOLS.IMP,
      'R',
    ]);
  });

  test('rejects malformed formulas', () => {
    expect(parseFormulaAst('P ∧')).toBeNull();
    expect(isBalanced(['(', 'P', ')'])).toBe(true);
    expect(isBalanced(['(', 'P'])).toBe(false);
  });

  test('evaluates proposition formulas safely', () => {
    expect(
      solvePropositionSafe('(P ∧ Q) ⇒ R', { P: true, Q: true, R: false })
    ).toBe(false);
    expect(
      solvePropositionSafe('(P ∧ Q) ⇒ R', { P: true, Q: true, R: true })
    ).toBe(true);
  });

  test('allows only the highest-priority evaluation redex', () => {
    const tokens = tokenizeFormula('1 ∧ 0 ⇒ 1');
    const redexes = getAllowedEvaluationRedexes(tokens);

    expect(redexes).toHaveLength(1);
    expect(redexes[0]).toMatchObject({ op: SYMBOLS.AND, idx: 1 });
  });

  test('reduces parenthesized negation and binary expressions', () => {
    expect(reduceEvaluationStep(tokenizeFormula('¬(1)'), 0)).toEqual(['0']);
    expect(reduceEvaluationStep(tokenizeFormula('1 ∧ 0'), 1)).toEqual(['0']);
  });

  test('supports circuit helper flows', () => {
    expect(extractFormulaVariables('(A ∧ B) ∨ ¬C')).toEqual(['A', 'B', 'C']);

    const rows = buildTruthTableRows('(A ∧ B)', ['A', 'B']);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({ result: '1' });

    expect(areExpressionsEquivalent('(A ∧ B)', '(B ∧ A)', ['A', 'B'])).toMatchObject({
      valid: true,
      equivalent: true,
    });

    const challenge = createCircuitChallenge();
    expect(challenge.inputs.length).toBeGreaterThanOrEqual(2);
    expect(challenge.expression).toEqual(expect.any(String));
    expect(challenge.steps).toEqual(expect.any(Array));
  });
});

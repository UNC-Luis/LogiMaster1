import React, { useState, useEffect, useRef } from 'react';
import { BrainCircuit, Code, CheckSquare, Table, ArrowRight, CheckCircle, RefreshCw, Eraser, MousePointerClick, ChevronDown, Lock, AlertTriangle, Play, Edit3, Eye, AlertCircle } from 'lucide-react';
import CircuitSectionPro from './CircuitSectionPro';

// --- CONSTANTS & CONFIG ---
const SYMBOLS = {
    NOT: '¬',
    AND: '∧',
    OR: '∨',
    IMP: '⇒',
    IFF: '⇔'
};

const VARS = ['P', 'Q', 'R', 'S', 'T', 'U'];
const CIRCUIT_INPUTS = ['A', 'B', 'C'];

const PRECEDENCE = {
    [SYMBOLS.NOT]: 5,
    [SYMBOLS.AND]: 4,
    [SYMBOLS.OR]: 3,
    [SYMBOLS.IMP]: 2,
    [SYMBOLS.IFF]: 1
};

// Colors for parentheses based on the inner operator
const OP_COLORS = {
    [SYMBOLS.NOT]: 'text-red-600',
    [SYMBOLS.AND]: 'text-blue-600',
    [SYMBOLS.OR]: 'text-green-600',
    [SYMBOLS.IMP]: 'text-purple-600',
    [SYMBOLS.IFF]: 'text-orange-500',
    'DEFAULT': 'text-slate-400'
};

// --- LOGIC ENGINE ---

const getRandomVar = () => VARS[Math.floor(Math.random() * VARS.length)];

// Generates a random FLAT logical formula string (ambiguous without precedence)
const generateFlatFormula = (length = 3) => {
    let formula = [];
    formula.push(Math.random() < 0.3 ? `${SYMBOLS.NOT} ${getRandomVar()}` : getRandomVar());

    for (let i = 0; i < length; i++) {
        const opRand = Math.random();
        let op = SYMBOLS.AND;
        if (opRand < 0.25) op = SYMBOLS.OR;
        else if (opRand < 0.5) op = SYMBOLS.IMP;
        else if (opRand < 0.75) op = SYMBOLS.IFF;
        
        const nextTerm = Math.random() < 0.3 ? `${SYMBOLS.NOT} ${getRandomVar()}` : getRandomVar();
        formula.push(op);
        formula.push(nextTerm);
    }
    return formula.join(' ');
};

// Generates a deep recursive formula for Evaluation
const generateStructuredFormula = (depth = 0, maxDepth = 3) => {
    if (depth >= maxDepth || (depth > 0 && Math.random() < 0.2)) {
        return getRandomVar();
    }
    
    const type = Math.random();
    
    if (type < 0.3) {
        return `${SYMBOLS.NOT} (${generateStructuredFormula(depth + 1, maxDepth)})`;
    }
    
    const left = generateStructuredFormula(depth + 1, maxDepth);
    const right = generateStructuredFormula(depth + 1, maxDepth);
    const ops = [SYMBOLS.AND, SYMBOLS.OR, SYMBOLS.IMP, SYMBOLS.IFF];
    const op = ops[Math.floor(Math.random() * ops.length)];
    
    return `(${left} ${op} ${right})`;
};

// AST Node
class ASTNode {
    constructor(type, value, left = null, right = null) {
        this.type = type; 
        this.value = value;
        this.left = left;
        this.right = right;
    }
    
    toFullString() {
        if (this.type === 'ATOM') return this.value;
        if (this.type === 'NOT') return `(${SYMBOLS.NOT} ${this.left.toFullString()})`;
        return `(${this.left.toFullString()} ${this.value} ${this.right.toFullString()})`;
    }
}

// Robust Parser with Mixed Associativity
const parseToAST = (tokens) => {
    const findSplit = (toks) => {
        let balance = 0;
        let splitIdx = -1;
        let minPrec = 100;

        // Iterate Right to Left to find the main operator
        for (let i = toks.length - 1; i >= 0; i--) {
            const t = toks[i];
            if (t === ')') balance++;
            else if (t === '(') balance--;
            else if (balance === 0) {
                // Negation is unary, usually binds tightest, don't split binary tree here
                if (t === SYMBOLS.NOT) continue;

                const prec = PRECEDENCE[t] || 100;
                
                // STRICT HIERARCHY CHECK
                if (prec < minPrec) {
                    minPrec = prec;
                    splitIdx = i;
                } 
                // ASSOCIATIVITY HANDLING (When precedence is equal)
                else if (prec === minPrec) {
                    // IMP (⇒) and IFF (⇔) are RIGHT ASSOCIATIVE
                    // We want the split to be as far LEFT as possible to group (A => (B => C))
                    // Since we loop R->L, the last one found is the left-most.
                    if (t === SYMBOLS.IMP || t === SYMBOLS.IFF) {
                        splitIdx = i; 
                    }
                    // AND (∧) and OR (∨) are LEFT ASSOCIATIVE
                    // We want the split to be as far RIGHT as possible to group ((A & B) & C)
                    // Since we loop R->L, the first one found is the right-most. We keep it.
                }
            }
        }
        return splitIdx;
    };

    while (tokens[0] === '(' && tokens[tokens.length - 1] === ')' && isBalanced(tokens.slice(1, -1))) {
        tokens = tokens.slice(1, -1);
    }

    if (tokens.length === 0) return new ASTNode('ATOM', 'ERR');
    if (tokens.length === 1) return new ASTNode('ATOM', tokens[0]);
    
    if (tokens[0] === SYMBOLS.NOT) {
        const split = findSplit(tokens);
        if (split === -1) {
            return new ASTNode('NOT', SYMBOLS.NOT, parseToAST(tokens.slice(1)));
        }
    }

    const split = findSplit(tokens);
    if (split !== -1) {
        return new ASTNode('BIN', tokens[split], 
            parseToAST(tokens.slice(0, split)), 
            parseToAST(tokens.slice(split + 1))
        );
    }
    
    if (tokens[0] === SYMBOLS.NOT) {
        return new ASTNode('NOT', SYMBOLS.NOT, parseToAST(tokens.slice(1)));
    }
    
    return new ASTNode('ATOM', 'ERR');
};

const isBalanced = (toks) => {
    let bal = 0;
    for (let t of toks) {
        if (t === '(') bal++;
        if (t === ')') bal--;
        if (bal < 0) return false;
    }
    return bal === 0;
};

const getSubExpressions = (ast, list = new Set()) => {
    if (!ast) return list;
    if (ast.type === 'BIN') {
        list.add(ast.toFullString());
        getSubExpressions(ast.left, list);
        getSubExpressions(ast.right, list);
    } else if (ast.type === 'NOT') {
        list.add(ast.toFullString());
        getSubExpressions(ast.left, list);
    }
    return list;
};

// --- HIGHLIGHTER HELPER ---
const getParenthesisColors = (inputStr) => {
    const colors = Array(inputStr.length).fill(null);
    const stack = [];
    
    const findMainOp = (start, end) => {
        let minPrec = 100;
        let mainOp = 'DEFAULT';
        let balance = 0;
        
        for (let i = start + 1; i < end; i++) {
            const char = inputStr[i];
            if (char === '(') balance++;
            else if (char === ')') balance--;
            else if (balance === 0) {
                if (Object.values(SYMBOLS).includes(char)) {
                    const prec = PRECEDENCE[char] || 100;
                    if (prec <= minPrec) {
                        minPrec = prec;
                        mainOp = char;
                    }
                }
            }
        }
        return OP_COLORS[mainOp] || OP_COLORS['DEFAULT'];
    };

    for (let i = 0; i < inputStr.length; i++) {
        if (inputStr[i] === '(') {
            stack.push(i);
        } else if (inputStr[i] === ')') {
            if (stack.length > 0) {
                const start = stack.pop();
                const colorClass = findMainOp(start, i);
                colors[start] = colorClass;
                colors[i] = colorClass;
            }
        }
    }
    return colors;
};

// --- LOGIC HELPERS ---

const evaluateOp = (left, op, right) => {
    const l = left === '1';
    const r = right === '1';
    switch(op) {
        case SYMBOLS.AND: return (l && r) ? '1' : '0';
        case SYMBOLS.OR: return (l || r) ? '1' : '0';
        case SYMBOLS.IMP: return (!l || r) ? '1' : '0';
        case SYMBOLS.IFF: return (l === r) ? '1' : '0';
        default: return '0';
    }
};

const evaluateNot = (val) => val === '1' ? '0' : '1';

const tokenizeFormula = (formula) => formula.replace(/\s/g, '').split(/([¬∧∨⇒⇔()])/).filter(t => t);

const containsErrorNode = (node) => {
    if (!node) return true;
    if (node.type === 'ATOM') return node.value === 'ERR';
    if (node.type === 'NOT') return containsErrorNode(node.left);
    return containsErrorNode(node.left) || containsErrorNode(node.right);
};

const findMatchingParenIndex = (tokens, openIdx) => {
    let depth = 0;
    for (let i = openIdx; i < tokens.length; i++) {
        if (tokens[i] === '(') depth++;
        else if (tokens[i] === ')') {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
};

const isResolvedValueAst = (ast) => !containsErrorNode(ast) && ast?.type === 'ATOM' && (ast.value === '0' || ast.value === '1');

const getEvaluationRedexes = (tokens) => {
    const candidates = [];

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token === SYMBOLS.NOT) {
            const next = tokens[i + 1];

            if (next === '(') {
                const endIdx = findMatchingParenIndex(tokens, i + 1);
                if (endIdx !== -1) {
                    const inner = tokens.slice(i + 2, endIdx);
                    try {
                        const innerAst = parseToAST(inner);
                        if (isResolvedValueAst(innerAst)) {
                            candidates.push({ idx: i, op: token, prec: PRECEDENCE[token], kind: 'not-paren', endIdx });
                        }
                    } catch (e) {}
                }
            } else if (next === '0' || next === '1') {
                candidates.push({ idx: i, op: token, prec: PRECEDENCE[token], kind: 'not-value' });
            }
        }

        if ([SYMBOLS.AND, SYMBOLS.OR, SYMBOLS.IMP, SYMBOLS.IFF].includes(token)) {
            const prev = tokens[i - 1];
            const next = tokens[i + 1];
            if ((prev === '0' || prev === '1') && (next === '0' || next === '1')) {
                candidates.push({ idx: i, op: token, prec: PRECEDENCE[token], kind: 'binary' });
            }
        }
    }

    return candidates;
};

const getAllowedEvaluationRedexes = (tokens) => {
    const candidates = getEvaluationRedexes(tokens);
    if (candidates.length === 0) return [];

    const maxPrec = Math.max(...candidates.map(c => c.prec));
    const highest = candidates.filter(c => c.prec === maxPrec);
    const highestOp = highest[0].op;

    if (highestOp === SYMBOLS.NOT) {
        return highest;
    }

    if (highestOp === SYMBOLS.AND || highestOp === SYMBOLS.OR) {
        const chosen = highest.reduce((best, current) => (current.idx < best.idx ? current : best), highest[0]);
        return [chosen];
    }

    if (highestOp === SYMBOLS.IMP || highestOp === SYMBOLS.IFF) {
        const chosen = highest.reduce((best, current) => (current.idx > best.idx ? current : best), highest[0]);
        return [chosen];
    }

    return highest;
};

const reduceEvaluationStep = (tokens, idx) => {
    const token = tokens[idx];

    if (token === SYMBOLS.NOT) {
        const next = tokens[idx + 1];

        if (next === '(') {
            const endIdx = findMatchingParenIndex(tokens, idx + 1);
            if (endIdx !== -1) {
                const inner = tokens.slice(idx + 2, endIdx);
                const innerAst = parseToAST(inner);
                if (isResolvedValueAst(innerAst)) {
                    const result = evaluateNot(innerAst.value);
                    return [...tokens.slice(0, idx), result, ...tokens.slice(endIdx + 1)];
                }
            }
        }

        if (next === '0' || next === '1') {
            const result = evaluateNot(next);
            return [...tokens.slice(0, idx), result, ...tokens.slice(idx + 2)];
        }
    }

    if ([SYMBOLS.AND, SYMBOLS.OR, SYMBOLS.IMP, SYMBOLS.IFF].includes(token)) {
        const prev = tokens[idx - 1];
        const next = tokens[idx + 1];
        if ((prev === '0' || prev === '1') && (next === '0' || next === '1')) {
            const result = evaluateOp(prev, token, next);
            return [...tokens.slice(0, idx - 1), result, ...tokens.slice(idx + 2)];
        }
    }

    return tokens;
};

const solveProposition = (formula, values) => {
    try {
        const tokens = formula.replace(/\s/g, '').split(/([¬∧∨⇒⇔()])/).filter(t => t);
        const ast = parseToAST(tokens);
        
        const evalAST = (node) => {
            if (node.type === 'ATOM') {
                if (node.value === '1' || node.value === 'T') return true;
                if (node.value === '0' || node.value === 'F') return false;
                const key = node.value.toUpperCase();
                return !!values[key];
            }
            if (node.type === 'NOT') return !evalAST(node.left);
            
            const l = evalAST(node.left);
            const r = evalAST(node.right);
            
            if (node.value === SYMBOLS.AND) return l && r;
            if (node.value === SYMBOLS.OR) return l || r;
            if (node.value === SYMBOLS.IMP) return !l || r;
            if (node.value === SYMBOLS.IFF) return l === r;
            return false;
        };
        return evalAST(ast);
    } catch(e) {
        return false;
    }
};

const parseFormulaAst = (formula) => {
    const tokens = tokenizeFormula(formula);
    const ast = parseToAST(tokens);
    return containsErrorNode(ast) ? null : ast;
};

const isFormulaValid = (formula) => parseFormulaAst(formula) !== null;

const solvePropositionSafe = (formula, values) => {
    const ast = parseFormulaAst(formula);
    if (!ast) return false;

    const evalAST = (node) => {
        if (node.type === 'ATOM') {
            if (node.value === '1' || node.value === 'T') return true;
            if (node.value === '0' || node.value === 'F') return false;
            const key = node.value.toUpperCase();
            return !!values[key];
        }
        if (node.type === 'NOT') return !evalAST(node.left);

        const l = evalAST(node.left);
        const r = evalAST(node.right);

        if (node.value === SYMBOLS.AND) return l && r;
        if (node.value === SYMBOLS.OR) return l || r;
        if (node.value === SYMBOLS.IMP) return !l || r;
        if (node.value === SYMBOLS.IFF) return l === r;
        return false;
    };

    return evalAST(ast);
};

const shuffleArray = (items) => [...items].sort(() => Math.random() - 0.5);

const pickCircuitInputs = () => {
    const count = Math.random() < 0.6 ? 2 : 3;
    return shuffleArray(CIRCUIT_INPUTS).slice(0, count).sort();
};

const createCircuitLeaf = (name) => ({ kind: 'INPUT', name, outputLabel: name });

const createCircuitUnary = (child) => ({ kind: 'NOT', child, outputLabel: null });

const createCircuitBinary = (kind, left, right) => ({ kind, left, right, outputLabel: null });

const buildCircuitNode = (availableInputs, depth = 0, maxDepth = 2, forceGate = false) => {
    const shouldEnd = !forceGate && (depth >= maxDepth || (depth > 0 && Math.random() < 0.3));
    if (shouldEnd) {
        const input = availableInputs[Math.floor(Math.random() * availableInputs.length)];
        return createCircuitLeaf(input);
    }

    if (Math.random() < 0.25) {
        return createCircuitUnary(buildCircuitNode(availableInputs, depth + 1, maxDepth, false));
    }

    const gate = Math.random() < 0.5 ? 'AND' : 'OR';
    return createCircuitBinary(
        gate,
        buildCircuitNode(availableInputs, depth + 1, maxDepth, false),
        buildCircuitNode(availableInputs, depth + 1, maxDepth, false)
    );
};

const labelCircuitTree = (node, state = { counter: 1 }, isRoot = true) => {
    if (!node) return node;
    if (node.kind === 'INPUT') {
        return { ...node, outputLabel: node.name };
    }

    if (node.kind === 'NOT') {
        const child = labelCircuitTree(node.child, state, false);
        return {
            ...node,
            child,
            outputLabel: isRoot ? 'Q' : `Q${state.counter++}`,
        };
    }

    const left = labelCircuitTree(node.left, state, false);
    const right = labelCircuitTree(node.right, state, false);
    return {
        ...node,
        left,
        right,
        outputLabel: isRoot ? 'Q' : `Q${state.counter++}`,
    };
};

const circuitGateSymbol = (kind) => (kind === 'AND' ? SYMBOLS.AND : SYMBOLS.OR);

const circuitNodeRef = (node) => node?.outputLabel || '';

const circuitNodeToExpression = (node) => {
    if (!node) return '';
    if (node.kind === 'INPUT') return node.name;
    if (node.kind === 'NOT') return `${SYMBOLS.NOT} (${circuitNodeToExpression(node.child)})`;
    return `(${circuitNodeToExpression(node.left)} ${circuitGateSymbol(node.kind)} ${circuitNodeToExpression(node.right)})`;
};

const collectCircuitSteps = (node, steps = []) => {
    if (!node || node.kind === 'INPUT') return steps;

    if (node.kind === 'NOT') {
        collectCircuitSteps(node.child, steps);
        steps.push({
            label: node.outputLabel,
            expression: `${SYMBOLS.NOT} (${circuitNodeRef(node.child)})`,
        });
        return steps;
    }

    collectCircuitSteps(node.left, steps);
    collectCircuitSteps(node.right, steps);
    steps.push({
        label: node.outputLabel,
        expression: `(${circuitNodeRef(node.left)} ${circuitGateSymbol(node.kind)} ${circuitNodeRef(node.right)})`,
    });
    return steps;
};

const extractFormulaVariables = (formula) => {
    const matches = formula.match(/[A-Za-z]+/g) || [];
    return [...new Set(matches.map(v => v.toUpperCase()).filter(v => v !== 'T' && v !== 'F'))].sort();
};

const buildAssignments = (vars) => {
    const count = 1 << vars.length;
    const rows = [];

    for (let i = count - 1; i >= 0; i--) {
        const values = {};
        vars.forEach((v, idx) => {
            const shift = vars.length - 1 - idx;
            values[v] = (i >> shift) & 1 ? true : false;
        });
        rows.push(values);
    }

    return rows;
};

const buildTruthTableRows = (expr, vars) => buildAssignments(vars).map(values => ({
    values,
    result: solvePropositionSafe(expr, values) ? '1' : '0',
}));

const areExpressionsEquivalent = (expectedExpr, userExpr, vars) => {
    const userVars = extractFormulaVariables(userExpr);
    const unknownVars = userVars.filter(v => !vars.includes(v));

    if (unknownVars.length > 0) {
        return { valid: false, equivalent: false, reason: `Usa variables no permitidas: ${unknownVars.join(', ')}.` };
    }

    const parsedUser = parseFormulaAst(userExpr);
    if (!parsedUser) {
        return { valid: false, equivalent: false, reason: 'La fórmula tiene errores de sintaxis.' };
    }

    const parsedExpected = parseFormulaAst(expectedExpr);
    if (!parsedExpected) {
        return { valid: false, equivalent: false, reason: 'La solución generada no es válida.' };
    }

    const equivalent = buildAssignments(vars).every(values => (
        solvePropositionSafe(userExpr, values) === solvePropositionSafe(expectedExpr, values)
    ));

    return { valid: true, equivalent, reason: equivalent ? '' : 'Tu expresión no representa la misma salida lógica.' };
};

const createCircuitChallenge = () => {
    let tree = null;
    let inputs = pickCircuitInputs();
    let expression = '';

    for (let attempt = 0; attempt < 12; attempt++) {
        inputs = pickCircuitInputs();
        const candidate = labelCircuitTree(
            buildCircuitNode(inputs, 0, Math.random() < 0.5 ? 1 : 2, true)
        );
        const candidateExpr = circuitNodeToExpression(candidate);

        if (candidateExpr.length >= 5) {
            tree = candidate;
            expression = candidateExpr;
            break;
        }
    }

    if (!tree) {
        tree = labelCircuitTree({
            kind: 'AND',
            left: createCircuitLeaf('A'),
            right: createCircuitLeaf('B'),
            outputLabel: null,
        });
        inputs = ['A', 'B'];
        expression = circuitNodeToExpression(tree);
    }

    const steps = collectCircuitSteps(tree, []);
    const truthTable = buildTruthTableRows(expression, inputs);

    return {
        inputs,
        tree,
        expression,
        steps,
        truthTable,
    };
};

// --- COMPONENTS ---

const Header = () => (
    <header className="bg-slate-900 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BrainCircuit className="w-8 h-8 text-indigo-400" />
                    LogiMaster Pro by Luis Caballero
                </h1>
                <p className="text-slate-400 text-sm mt-1">Entrenador Avanzado de Lógica</p>
            </div>
            <div className="text-right text-xs text-slate-500 hidden md:block">
                <p>Prioridad: {SYMBOLS.NOT} &gt; {SYMBOLS.AND} &gt; {SYMBOLS.OR} &gt; {SYMBOLS.IMP} &gt; {SYMBOLS.IFF}</p>
            </div>
        </div>
    </header>
);

const LogicKeyboard = ({ onInsert, extras = [], vars = VARS }) => {
    const keys = [
        { char: SYMBOLS.NOT, label: 'NEG' },
        { char: SYMBOLS.AND, label: 'CONJ' },
        { char: SYMBOLS.OR, label: 'DISY' },
        { char: SYMBOLS.IMP, label: 'IMP' },
        { char: SYMBOLS.IFF, label: 'BIC' },
        { char: '(', label: '(' },
        { char: ')', label: ')' },
        ...vars.map(v => ({ char: v, label: v })),
        ...extras
    ];
    return (
        <div className="flex flex-wrap gap-2 my-2 p-2 bg-slate-100 rounded-lg border border-slate-200 justify-center">
            {keys.map((k) => (
                <button
                    key={k.char}
                    onClick={() => onInsert(k.char)}
                    className="bg-white hover:bg-indigo-50 text-slate-800 border border-slate-300 px-3 py-2 rounded shadow-sm text-base font-mono font-bold transition active:scale-95"
                >
                    {k.char}
                </button>
            ))}
        </div>
    );
};

// --- SECTIONS ---

const SyntaxSection = () => {
    const [problemRaw, setProblemRaw] = useState("");
    const [expected, setExpected] = useState("");
    const [input, setInput] = useState("");
    const [status, setStatus] = useState("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [showAnswer, setShowAnswer] = useState(false);
    const [mode, setMode] = useState("auto"); // auto | custom
    
    const inputRef = useRef(null);

    const newProblem = () => {
        let attempts = 0;
        let valid = false;
        let rawStr, fullStr;

        while(!valid && attempts < 10) {
            rawStr = generateFlatFormula(Math.floor(Math.random() * 2) + 3);
            const tokens = tokenizeFormula(rawStr);
            
            try {
                const ast = parseToAST(tokens);
                if (containsErrorNode(ast)) throw new Error();
                fullStr = ast.toFullString();
                if (fullStr.length > rawStr.length + 2) valid = true;
            } catch (e) {}
            attempts++;
        }
        if (!valid) {
            fullStr = rawStr;
        }
        setProblemRaw(rawStr);
        setExpected(fullStr);
        setInput(rawStr);
        setStatus("idle");
        setErrorMsg("");
        setShowAnswer(false);
    };

    const handleCustomCheck = () => {
        const ast = parseFormulaAst(input);
        try {
            if (!ast) throw new Error();
            
            const ideal = ast.toFullString().replace(/\s/g, '');
            const current = input.replace(/\s/g, '');
            
            if (current === ideal) {
                setStatus("correct");
                setErrorMsg("");
            } else {
                setStatus("custom_valid_but_loose");
                setErrorMsg("Sintaxis válida, pero no cumple con la agrupación estricta.");
            }
        } catch (e) {
            setStatus("error");
            setErrorMsg("Error de sintaxis: Estructura inválida.");
        }
    };

    useEffect(() => { if (mode === 'auto') newProblem(); }, [mode]);

    const check = () => {
        if (mode === 'custom') {
            handleCustomCheck();
            return;
        }

        const cleanInput = input.replace(/\s/g, '');
        const cleanExp = expected.replace(/\s/g, '');
        const rawContent = problemRaw.replace(/\s/g, '');
        const inputContent = cleanInput.replace(/[()]/g, '');

        if (cleanInput === cleanExp) {
            setStatus("correct");
            setErrorMsg("");
        } else {
            setStatus("error");
            if (!isBalanced(cleanInput.split(''))) {
                setErrorMsg("Paréntesis desbalanceados: Revisa que cada '(' tenga su ')'.");
            } else if (inputContent !== rawContent) {
                setErrorMsg("Has modificado las variables o conectores.");
            } else {
                setErrorMsg("La agrupación es incorrecta. Revisa la jerarquía y asociatividad.");
            }
        }
    };

    // --- CURSOR AWARE INSERT ---
    const handleInsert = (char) => {
        const el = inputRef.current;
        if (el) {
            const start = el.selectionStart;
            const end = el.selectionEnd;
            const text = el.value;
            const newVal = text.substring(0, start) + char + text.substring(end);
            setInput(newVal);
            // Restore focus and cursor position after React render
            setTimeout(() => {
                el.focus();
                el.setSelectionRange(start + char.length, start + char.length);
            }, 0);
        } else {
            setInput(prev => prev + char);
        }
        setStatus('idle');
        setErrorMsg("");
    };

    // --- RENDER COLORED INPUT ---
    const renderColoredText = () => {
        const colors = getParenthesisColors(input);
        return input.split('').map((char, i) => (
            <span key={i} className={colors[i] || 'text-slate-800'}>{char}</span>
        ));
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500 flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h3 className="text-blue-900 font-bold">Sintaxis y Precedencia</h3>
                    <p className="text-sm text-blue-800">
                        {mode === 'auto' ? "Agrega paréntesis para eliminar la ambigüedad." : "Escribe cualquier fórmula para verificar su sintaxis."}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setMode('auto')} className={`px-3 py-1 rounded text-sm font-bold ${mode === 'auto' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}>
                        Entrenamiento
                    </button>
                    <button onClick={() => { setMode('custom'); setInput(""); setStatus("idle"); setShowAnswer(false); }} className={`px-3 py-1 rounded text-sm font-bold ${mode === 'custom' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}>
                        Modo Libre
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-slate-200 text-center">
                <div className="flex justify-center mb-4">
                     <LogicKeyboard onInsert={handleInsert} />
                </div>

                {/* Input Container with Overlay */}
                <div className="relative w-full max-w-3xl mx-auto h-16 flex items-center justify-center">
                    {/* Background Layer (Colored) */}
                    <div className="absolute inset-0 pointer-events-none whitespace-pre font-mono text-xl flex items-center justify-center bg-white border-2 border-transparent" aria-hidden="true">
                        {renderColoredText()}
                    </div>
                    {/* Foreground Layer (Transparent Text, Visible Cursor) */}
                    <input 
                        ref={inputRef}
                        className={`absolute inset-0 w-full h-full text-center font-mono text-xl bg-transparent text-transparent caret-black border-2 rounded outline-none transition shadow-inner ${
                            status === 'correct' ? 'border-green-500' : 
                            status === 'error' ? 'border-red-500' : 
                            status === 'custom_valid_but_loose' ? 'border-yellow-500' : 'border-slate-300'
                        }`}
                        value={input}
                        onChange={e => { setInput(e.target.value); setStatus('idle'); setErrorMsg(""); }}
                        placeholder={mode === 'auto' ? "" : "Escribe tu fórmula..."}
                        autoComplete="off"
                        spellCheck="false"
                    />
                    {status === 'correct' && <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600" />}
                </div>
                
                <div className="min-h-[2rem] mt-4">
                    {status === 'correct' && <p className="text-green-600 font-bold text-lg animate-bounce">¡Perfecto! Agrupación correcta.</p>}
                    {status === 'error' && (
                        <div className="inline-flex items-center gap-2 text-red-600 font-bold bg-red-50 px-4 py-2 rounded animate-shake">
                            <AlertCircle className="w-5 h-5" />
                            <span>{errorMsg || "Error en la estructura."}</span>
                        </div>
                    )}
                    {status === 'custom_valid_but_loose' && (
                        <div className="text-yellow-700 font-bold bg-yellow-50 p-3 rounded">
                            <p>{errorMsg}</p>
                            <p className="text-xs mt-1 text-slate-500">Interpretación Estricta: {parseToAST(input.replace(/\s/g, '').split(/([¬∧∨⇒⇔()])/).filter(t => t)).toFullString()}</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-4">
                    <button onClick={check} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-bold transition shadow-lg transform active:scale-95">
                        {mode === 'auto' ? 'Verificar' : 'Analizar'}
                    </button>
                    {mode === 'auto' && (
                        <>
                            <button onClick={() => setShowAnswer(true)} className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-6 py-3 rounded-lg font-bold transition flex items-center gap-2">
                                <Eye className="w-4 h-4" /> {showAnswer ? 'Ocultar' : 'Ver Solución'}
                            </button>
                            <button onClick={newProblem} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-6 py-3 rounded-lg font-bold transition flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" /> Nuevo
                            </button>
                        </>
                    )}
                </div>

                {showAnswer && mode === 'auto' && (
                    <div className="mt-6 animate-fadeIn">
                        <p className="text-slate-500 text-sm uppercase font-bold mb-2">Respuesta Correcta:</p>
                        <div className="p-4 bg-slate-800 text-green-400 font-mono text-xl rounded-lg shadow-inner inline-block border border-slate-600">
                            {expected}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const EvaluationSection = () => {
    const [history, setHistory] = useState([]); 
    const [variables, setVariables] = useState({});
    const [msg, setMsg] = useState("");
    
    const generate = () => {
        let formula = "";
        while (formula.length < 15) {
            formula = generateStructuredFormula(0, 4);
        }
        const varsFound = [...new Set(formula.match(/[PQRSTU]/g))].sort();
        const varsObj = {};
        varsFound.forEach(v => varsObj[v] = Math.random() < 0.5 ? '1' : '0');
        setHistory([{ step: 0, content: formula, type: 'formula' }]);
        setVariables(varsObj);
        setMsg("");
    };

    useEffect(() => { generate(); }, []);

    const getTokens = (str) => {
        if (!str) return [];
        return str.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').trim().split(/\s+/);
    };

    const handleSubstitute = () => {
        if (history.length === 0 || history.length > 1) return;
        const current = history[0].content;
        let next = current;
        Object.keys(variables).forEach(k => {
            const regex = new RegExp(k, 'g');
            next = next.replace(regex, variables[k]);
        });
        setHistory(prev => [...prev, { step: 1, content: next, type: 'substituted' }]);
    };

    const handleInteraction = (idx, tokens) => {
        setMsg("");
        const token = tokens[idx];
        const allowed = getAllowedEvaluationRedexes(tokens);

        if (allowed.length === 0) return;

        const clicked = allowed.find(c => c.idx === idx);
        if (!clicked) {
            setMsg("⚠️ ¡Orden incorrecto! Resuelve primero los operadores de mayor jerarquía.");
            return;
        }

        const nextTokens = reduceEvaluationStep(tokens, idx);
        addToHistory(nextTokens.join(' '));
    };

    const addToHistory = (newStr) => {
        let clean = newStr;
        let changed = true;
        while(changed) {
            const temp = clean.replace(/\(\s*([01])\s*\)/g, '$1');
            if (temp === clean) changed = false;
            clean = temp;
        }
        setHistory(prev => [...prev, { step: prev.length, content: clean, type: 'reduction' }]);
    };

    if (history.length === 0) return <div className="p-10 text-center"><RefreshCw className="animate-spin mx-auto"/></div>;

    const currentStep = history[history.length - 1];
    const tokens = getTokens(currentStep.content);
    const allowedRedexes = getAllowedEvaluationRedexes(tokens);
    const isSolved = tokens.length === 1 && (tokens[0] === '1' || tokens[0] === '0');

    return (
        <div className="space-y-8">
            <div className="bg-emerald-50 p-4 rounded border-l-4 border-emerald-500">
                <h3 className="text-emerald-900 font-bold">Evaluación: Jerarquía Estricta</h3>
                <p className="text-sm text-emerald-800">
                    Resuelve paso a paso haciendo clic en los operadores. <br/>
                    <strong>Regla:</strong> Solo puedes resolver el operador con la mayor prioridad disponible en ese momento.
                </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                <div className="flex flex-wrap justify-center gap-3 mb-8 bg-slate-100 p-3 rounded-lg">
                    {Object.entries(variables).map(([k, v]) => (
                        <div key={k} className={`px-3 py-1 rounded font-mono font-bold border ${v === '1' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
                            {k} = {v}
                        </div>
                    ))}
                    {history.length === 1 && (
                        <button onClick={handleSubstitute} className="ml-4 px-4 py-1 bg-emerald-600 text-white rounded font-bold text-sm hover:bg-emerald-700 shadow-sm animate-pulse">
                            Sustituir Valores
                        </button>
                    )}
                </div>

                <div className="flex flex-col items-center gap-2 max-h-[400px] overflow-y-auto pr-2">
                    {history.map((h, i) => (
                        <div key={i} className={`flex items-center gap-2 ${i === history.length - 1 ? 'opacity-100' : 'opacity-40'}`}>
                            {i > 0 && <ChevronDown className="w-4 h-4 text-slate-300" />}
                            <div className={`font-mono text-lg p-2 rounded ${i === history.length - 1 ? 'bg-white shadow-md border border-indigo-100 text-slate-800 font-bold ring-2 ring-indigo-50' : 'text-slate-400'}`}>
                                {h.content}
                            </div>
                        </div>
                    ))}
                </div>

                {msg && <div className="mt-4 p-2 bg-red-100 text-red-700 text-center font-bold rounded animate-pulse">{msg}</div>}

                {!isSolved && history.length > 1 && (
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <div className="flex flex-wrap justify-center gap-2 font-mono text-3xl bg-slate-50 p-8 rounded-xl border-2 border-dashed border-slate-300 select-none">
                            {tokens.map((token, idx) => {
                                const interactable = allowedRedexes.some(candidate => candidate.idx === idx);

                                return (
                                    <span 
                                        key={idx}
                                        onClick={() => interactable && handleInteraction(idx, tokens)}
                                        className={`px-1 rounded transition-all duration-200 ${
                                            interactable 
                                                ? 'cursor-pointer hover:bg-indigo-600 hover:text-white hover:scale-110 text-indigo-700 font-bold' 
                                                : 'text-slate-400 cursor-default'
                                        } ${token === '1' ? 'text-green-600' : token === '0' ? 'text-red-600' : ''}`}
                                    >
                                        {token}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {isSolved && (
                    <div className="mt-8 text-center animate-bounce">
                        <div className={`inline-block px-8 py-4 rounded-full text-2xl font-bold shadow-lg ${tokens[0] === '1' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                            Resultado Final: {tokens[0]}
                        </div>
                        <div className="mt-6">
                            <button onClick={generate} className="bg-slate-800 text-white px-6 py-2 rounded font-bold hover:bg-slate-900 transition flex items-center gap-2 mx-auto">
                                <RefreshCw className="w-4 h-4" /> Siguiente Problema
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const SatisfactionSection = () => {
    const [formula, setFormula] = useState("");
    const [variables, setVariables] = useState([]);
    const [subExprs, setSubExprs] = useState([]);
    const [rows, setRows] = useState([]); 
    const inputRef = useRef(null); 

    const parseVars = (str) => {
        const found = new Set();
        const match = str.match(/[a-z]+/gi);
        if (match) {
            match.forEach(v => {
                const upper = v.toUpperCase();
                if (upper !== 'T' && upper !== 'F') found.add(upper);
            });
        }
        return Array.from(found).sort();
    };

    const generateTable = (expr) => {
        const vars = parseVars(expr);
        if (vars.length === 0) {
            setVariables([]); setRows([]); setSubExprs([]); return;
        }

        const tokens = tokenizeFormula(expr);
        const ast = parseToAST(tokens);
        if (containsErrorNode(ast)) {
            setVariables([]);
            setRows([]);
            setSubExprs([]);
            return;
        }

        setVariables(vars);

        let subs = [];
        try {
            const allSubs = getSubExpressions(ast);
            const fullStr = ast.toFullString();
            subs = Array.from(allSubs).filter(s => {
                const isAtom = /^[a-z]+$/i.test(s) || s === '1' || s === '0';
                return !isAtom && s !== fullStr;
            }).sort((a,b) => a.length - b.length);
        } catch(e) {}
        setSubExprs(subs);

        const count = 1 << vars.length; 
        const newRows = [];

        // Count DOWN (True First)
        for (let i = count - 1; i >= 0; i--) {
            const inputs = {};
            vars.forEach((v, idx) => {
                const shift = vars.length - 1 - idx;
                inputs[v] = (i >> shift) & 1 ? 1 : 0;
            });
            const subVals = {};
            subs.forEach(s => subVals[s] = "");
            
            newRows.push({ 
                inputs, 
                subVals, 
                finalVal: "", 
                statusSub: {}, 
                statusFinal: "idle" 
            });
        }
        setRows(newRows);
    };

    const handleGenerate = () => {
        const tableVars = ['P', 'Q', 'R'];
        const generateRestrictedFormula = (depth = 0, maxDepth = 3) => {
            if (depth >= maxDepth || (depth > 0 && Math.random() < 0.2)) {
                return tableVars[Math.floor(Math.random() * tableVars.length)];
            }
            const type = Math.random();
            if (type < 0.3) {
                return `${SYMBOLS.NOT} (${generateRestrictedFormula(depth + 1, maxDepth)})`;
            }
            const left = generateRestrictedFormula(depth + 1, maxDepth);
            const right = generateRestrictedFormula(depth + 1, maxDepth);
            const ops = [SYMBOLS.AND, SYMBOLS.OR, SYMBOLS.IMP, SYMBOLS.IFF];
            const op = ops[Math.floor(Math.random() * ops.length)];
            return `(${left} ${op} ${right})`;
        };

        let f = generateRestrictedFormula(0, 3);
        while (f.length < 5) {
             f = generateRestrictedFormula(0, 3);
        }
        setFormula(f);
        generateTable(f);
    };

    const handleManualChange = (val) => {
        setFormula(val);
        generateTable(val);
    };

    // --- CURSOR INSERT FOR TABLE INPUT (OPTIONAL) ---
    const handleInsert = (char) => {
        setFormula(prev => prev + char);
        generateTable(formula + char); 
    };

    const updateRow = (rowIdx, type, key, val) => {
        if (val !== '0' && val !== '1' && val !== '') return;
        setRows(prevRows => {
            const newRows = [...prevRows];
            const rowToUpdate = { ...newRows[rowIdx] };
            if (type === 'sub') {
                rowToUpdate.subVals = { ...rowToUpdate.subVals, [key]: val };
                rowToUpdate.statusSub = { ...rowToUpdate.statusSub, [key]: 'idle' };
            } else {
                rowToUpdate.finalVal = val;
                rowToUpdate.statusFinal = 'idle';
            }
            newRows[rowIdx] = rowToUpdate;
            return newRows;
        });
    };

    const checkTable = () => {
        const newRows = rows.map(r => {
            const boolInputs = {};
            Object.keys(r.inputs).forEach(k => boolInputs[k.toUpperCase()] = r.inputs[k] === 1);
            
            const expectedFinalBool = solvePropositionSafe(formula, boolInputs);
            const expectedFinal = expectedFinalBool ? '1' : '0';
            const statusFinal = r.finalVal === expectedFinal ? 'correct' : 'error';

            const statusSub = {};
            subExprs.forEach(sub => {
                const subRes = solvePropositionSafe(sub, boolInputs);
                const expSub = subRes ? '1' : '0';
                statusSub[sub] = r.subVals[sub] === expSub ? 'correct' : 'error';
            });

            return { ...r, statusFinal, statusSub };
        });
        setRows(newRows);
    };

    useEffect(() => { handleGenerate(); }, []);

    return (
        <div className="space-y-6">
            <div className="bg-amber-50 p-4 rounded border-l-4 border-amber-500">
                <h3 className="text-amber-900 font-bold">Tabla de Verdad Completa</h3>
                <p className="text-sm text-amber-800">
                    Orden: Verdadero (1) primero. Se han generado columnas para las sub-expresiones.
                </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex gap-2">
                        <input 
                            value={formula}
                            onChange={e => handleManualChange(e.target.value)}
                            className="flex-1 text-xl font-mono p-3 border-2 border-slate-300 rounded focus:border-indigo-500 outline-none"
                            placeholder="Ej: (P ∨ Q) ⇒ R"
                        />
                        <button onClick={handleGenerate} className="bg-amber-500 text-white px-4 rounded font-bold hover:bg-amber-600 transition flex items-center gap-2">
                            <RefreshCw className="w-5 h-5" /> Generar
                        </button>
                    </div>
                    <LogicKeyboard onInsert={handleInsert} />
                </div>

                {rows.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-slate-300">
                        <table className="w-full text-center text-sm md:text-base">
                            <thead className="bg-slate-800 text-white">
                                <tr>
                                    {variables.map(v => <th key={v} className="py-3 px-2 uppercase bg-slate-700">{v}</th>)}
                                    {subExprs.map(s => <th key={s} className="py-3 px-4 bg-slate-600 border-l border-slate-500 font-mono text-xs">{s}</th>)}
                                    <th className="py-3 px-4 bg-indigo-900 border-l border-indigo-700 font-bold">Final</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {rows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        {variables.map(v => (
                                            <td key={v} className="py-2 px-2 font-mono font-bold text-slate-600 bg-slate-50">
                                                {row.inputs[v]}
                                            </td>
                                        ))}
                                        
                                        {subExprs.map(sub => (
                                            <td key={sub} className={`p-2 border-l border-slate-200 ${row.statusSub[sub] === 'correct' ? 'bg-green-100' : row.statusSub[sub] === 'error' ? 'bg-red-100' : ''}`}>
                                                <input 
                                                    maxLength={1}
                                                    value={row.subVals[sub]}
                                                    onChange={e => updateRow(idx, 'sub', sub, e.target.value)}
                                                    className={`w-10 h-8 text-center font-bold font-mono border rounded outline-none focus:ring-1 focus:ring-blue-500 ${row.statusSub[sub] === 'correct' ? 'text-green-700 border-green-500' : row.statusSub[sub] === 'error' ? 'text-red-700 border-red-500' : 'border-slate-300'}`}
                                                />
                                            </td>
                                        ))}

                                        <td className={`p-2 border-l border-slate-300 ${row.statusFinal === 'correct' ? 'bg-indigo-100' : row.statusFinal === 'error' ? 'bg-red-200' : 'bg-indigo-50'}`}>
                                            <input 
                                                maxLength={1}
                                                value={row.finalVal}
                                                onChange={e => updateRow(idx, 'final', null, e.target.value)}
                                                className={`w-12 h-10 text-center font-bold font-mono text-xl border rounded outline-none focus:ring-2 focus:ring-indigo-600 ${row.statusFinal === 'correct' ? 'text-indigo-800 border-indigo-600' : row.statusFinal === 'error' ? 'text-red-800 border-red-600' : 'border-indigo-300'}`}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="text-center py-10 text-slate-400">Escribe una fórmula válida.</p>}

                {rows.length > 0 && (
                    <div className="mt-6 flex justify-end">
                        <button onClick={checkTable} className="bg-indigo-600 text-white px-8 py-3 rounded font-bold hover:bg-indigo-700 shadow-lg transition flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" /> Verificar Tabla
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const CircuitSection = () => {
    const [challenge, setChallenge] = useState(() => createCircuitChallenge());
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState('idle');
    const [feedback, setFeedback] = useState('');
    const [showSolution, setShowSolution] = useState(false);
    const [showTruthTable, setShowTruthTable] = useState(false);

    const resetChallenge = () => {
        setChallenge(createCircuitChallenge());
        setAnswer('');
        setStatus('idle');
        setFeedback('');
        setShowSolution(false);
        setShowTruthTable(false);
    };

    useEffect(() => {
        resetChallenge();
    }, []);

    const checkAnswer = () => {
        const trimmed = answer.trim();
        if (!trimmed) {
            setStatus('error');
            setFeedback('Escribe una expresión para la salida Q.');
            return;
        }

        const result = areExpressionsEquivalent(challenge.expression, trimmed, challenge.inputs);
        if (!result.valid) {
            setStatus('error');
            setFeedback(result.reason);
            return;
        }

        if (result.equivalent) {
            const exactMatch = trimmed.replace(/\s/g, '') === challenge.expression.replace(/\s/g, '');
            setStatus('correct');
            setFeedback(
                exactMatch
                    ? '¡Perfecto! Tu expresión coincide exactamente con la salida del circuito.'
                    : '¡Muy bien! Tu expresión representa la misma función lógica que el circuito.'
            );
            setShowSolution(true);
        } else {
            setStatus('error');
            setFeedback(result.reason);
        }
    };

    const CircuitNodeView = ({ node }) => {
        if (!node) return null;

        if (node.kind === 'INPUT') {
            return (
                <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full border-2 border-slate-300 bg-white shadow-sm flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-slate-800">{node.name}</span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400">Input</span>
                    </div>
                </div>
            );
        }

        const gateLabel = node.kind === 'NOT' ? 'NOT' : node.kind;

        return (
            <div className="flex flex-col items-center gap-4">
                <div className={`min-w-24 px-4 py-3 rounded-2xl border-2 shadow-md text-center ${
                    node.kind === 'NOT'
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : 'bg-indigo-50 border-indigo-300 text-indigo-900'
                }`}>
                    <div className="text-xs uppercase tracking-[0.2em] font-bold opacity-70">{gateLabel}</div>
                    <div className="text-2xl font-black">{node.outputLabel}</div>
                    <div className="text-[10px] uppercase tracking-wider mt-1 opacity-70">Salida</div>
                </div>

                <div className="flex flex-wrap justify-center gap-6 items-start">
                    {node.kind === 'NOT' ? (
                        <CircuitNodeView node={node.child} />
                    ) : (
                        <>
                            <CircuitNodeView node={node.left} />
                            <CircuitNodeView node={node.right} />
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-violet-50 p-4 rounded border-l-4 border-violet-500">
                <h3 className="text-violet-900 font-bold">Circuitos Digitales: de la puerta a la expresión</h3>
                <p className="text-sm text-violet-800">
                    Observa el circuito, nombra las salidas intermedias y escribe la expresión completa de la salida <strong>Q</strong>.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-bold">Reto de circuito</p>
                            <h4 className="text-2xl font-black text-slate-900 mt-1">Descubre la expresión de Q</h4>
                        </div>
                        <button
                            onClick={resetChallenge}
                            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-bold transition flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" /> Nuevo circuito
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {challenge.inputs.map(input => (
                            <div
                                key={input}
                                className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold"
                            >
                                Entrada {input}
                            </div>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <div className="min-w-[520px] bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-6">
                            <CircuitNodeView node={challenge.tree} />
                        </div>
                    </div>

                    <div className="mt-6 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                        <h5 className="font-bold text-slate-800 mb-2">Cómo pensar el circuito</h5>
                        <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
                            <li>Identifica las salidas intermedias de cada puerta.</li>
                            <li>Reemplaza cada bloque por su etiqueta, como Q1 o Q2.</li>
                            <li>Cuando termines, solo deben quedar las entradas A, B o C en la expresión final.</li>
                        </ol>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                        <h4 className="text-xl font-black text-slate-900">Escribe la salida</h4>
                        <p className="text-sm text-slate-500 mt-1">
                            Usa los símbolos {SYMBOLS.NOT}, {SYMBOLS.AND} y {SYMBOLS.OR}. La salida final se llama Q.
                        </p>

                        <div className="mt-4 space-y-3">
                            <input
                                value={answer}
                                onChange={e => {
                                    setAnswer(e.target.value);
                                    setStatus('idle');
                                    setFeedback('');
                                }}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        checkAnswer();
                                    }
                                }}
                                className={`w-full text-lg font-mono p-3 border-2 rounded outline-none transition ${
                                    status === 'correct'
                                        ? 'border-green-500'
                                        : status === 'error'
                                            ? 'border-red-500'
                                            : 'border-slate-300'
                                }`}
                                placeholder="Ej: (A ∧ B) ∨ ¬(C)"
                            />

                            <LogicKeyboard onInsert={char => setAnswer(prev => prev + char)} vars={challenge.inputs} />

                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={checkAnswer}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-bold transition"
                                >
                                    Comprobar
                                </button>
                                <button
                                    onClick={() => setShowSolution(prev => !prev)}
                                    className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-5 py-3 rounded-lg font-bold transition"
                                >
                                    {showSolution ? 'Ocultar solución' : 'Ver solución'}
                                </button>
                                <button
                                    onClick={() => setShowTruthTable(prev => !prev)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-5 py-3 rounded-lg font-bold transition"
                                >
                                    {showTruthTable ? 'Ocultar tabla' : 'Ver tabla'}
                                </button>
                            </div>
                        </div>

                        <div className="min-h-[4rem] mt-4">
                            {feedback && (
                                <div className={`p-3 rounded-lg font-medium ${
                                    status === 'correct'
                                        ? 'bg-green-50 text-green-800 border border-green-200'
                                        : 'bg-red-50 text-red-800 border border-red-200'
                                }`}>
                                    {feedback}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                        <h4 className="text-lg font-black text-slate-900">Desglose del circuito</h4>
                        <div className="mt-4 space-y-3">
                            {challenge.steps.length === 0 ? (
                                <p className="text-sm text-slate-400">Este circuito es directo: la salida Q sale de una sola puerta.</p>
                            ) : (
                                challenge.steps.map((step, idx) => (
                                    <div key={`${step.label}-${idx}`} className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-slate-900">{step.label}</div>
                                            <div className="font-mono text-sm bg-slate-50 border border-slate-200 rounded px-3 py-2 mt-1">
                                                {step.expression}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {showSolution && (
                        <div className="bg-slate-900 text-white p-6 rounded-lg shadow-lg border border-slate-700">
                            <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-bold">Solución</p>
                            <div className="mt-3 font-mono text-xl text-green-400 break-words">
                                Q = {challenge.expression}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showTruthTable && (
                <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                    <h4 className="text-xl font-black text-slate-900">Tabla de verdad rápida</h4>
                    <p className="text-sm text-slate-500 mt-1">
                        Úsala para verificar si tu expresión produce exactamente la misma salida que el circuito.
                    </p>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr className="bg-slate-800 text-white">
                                    {challenge.inputs.map(input => (
                                        <th key={input} className="px-4 py-3">{input}</th>
                                    ))}
                                    <th className="px-4 py-3 bg-indigo-900">Q</th>
                                </tr>
                            </thead>
                            <tbody>
                                {challenge.truthTable.map((row, idx) => (
                                    <tr key={idx} className="border-b border-slate-200">
                                        {challenge.inputs.map(input => (
                                            <td key={input} className="px-4 py-3 font-mono font-bold bg-slate-50">
                                                {row.values[input] ? '1' : '0'}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 font-mono font-black text-indigo-700">
                                            {row.result}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function App() {
    const [activeTab, setActiveTab] = useState("syntax");

    return (
        <div className="min-h-screen pb-12 bg-gray-100 font-sans text-slate-800">
            <Header />
            
            <main className="max-w-6xl mx-auto px-4 mt-8">
                {/* Navigation Tabs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
                    {[
                        { id: 'syntax', icon: Code, label: 'Sintaxis' },
                        { id: 'evaluation', icon: CheckSquare, label: 'Evaluación' },
                        { id: 'satisfaction', icon: Table, label: 'Tablas de Verdad' },
                        { id: 'circuits', icon: BrainCircuit, label: 'Circuitos' },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`p-3 rounded-lg font-bold text-sm md:text-base flex items-center justify-center gap-2 transition shadow-sm ${
                                activeTab === tab.id 
                                ? 'bg-indigo-600 text-white shadow-indigo-200 ring-2 ring-indigo-300 ring-offset-2' 
                                : 'bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
                            }`}
                        >
                            <tab.icon className="w-5 h-5" /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="min-h-[500px] transition-all duration-300">
                    {activeTab === 'syntax' && <SyntaxSection />}
                    {activeTab === 'evaluation' && <EvaluationSection />}
                    {activeTab === 'satisfaction' && <SatisfactionSection />}
                    {activeTab === 'circuits' && <CircuitSectionPro />}
                </div>
            </main>
        </div>
    );
}

export {
    SYMBOLS,
    tokenizeFormula,
    parseToAST,
    parseFormulaAst,
    solvePropositionSafe,
    getAllowedEvaluationRedexes,
    reduceEvaluationStep,
    isBalanced,
    extractFormulaVariables,
    buildTruthTableRows,
    areExpressionsEquivalent,
    createCircuitChallenge
};

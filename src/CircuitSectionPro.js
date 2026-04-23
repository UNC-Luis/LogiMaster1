import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Eye, Edit3, Play, RefreshCw } from 'lucide-react';

const SYMBOLS = {
    NOT: '¬',
    AND: '∧',
    OR: '∨',
};

const MODE_OPTIONS = {
    simple: {
        label: 'Simple',
        description: '2 entradas, 2-3 puertas',
        inputs: ['A', 'B'],
        gateRange: [2, 3],
        weights: { AND: 0.6, OR: 0.25, NOT: 0.15 },
    },
    complex: {
        label: 'Compleja',
        description: '3 entradas, 5-7 puertas',
        inputs: ['A', 'B', 'C'],
        gateRange: [5, 7],
        weights: { AND: 0.42, OR: 0.35, NOT: 0.23 },
    },
    mixed: {
        label: 'Mixta',
        description: 'Mezcla de simple y compleja',
    },
};

const LABEL_SUGGESTIONS = ['x', 'y', 'z', 'w', 'v', 'u', 't', 's', 'r', 'p'];

const NODE = {
    INPUT: 'INPUT',
    NOT: 'NOT',
    AND: 'AND',
    OR: 'OR',
};

const NODE_COUNTER = { value: 0 };

const resetNodeIds = () => {
    NODE_COUNTER.value = 0;
};

const nextId = (prefix) => `${prefix}-${++NODE_COUNTER.value}`;

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const pick = (items) => items[Math.floor(Math.random() * items.length)];

const pickModeConfig = (mode) => {
    if (mode === 'mixed') {
        return Math.random() < 0.5 ? MODE_OPTIONS.simple : MODE_OPTIONS.complex;
    }
    return MODE_OPTIONS[mode] || MODE_OPTIONS.simple;
};

const weightedGate = (weights, allowNot = true) => {
    const options = [
        [NODE.AND, weights.AND ?? 0.5],
        [NODE.OR, weights.OR ?? 0.3],
        [NODE.NOT, allowNot ? (weights.NOT ?? 0.2) : 0],
    ].filter(([, weight]) => weight > 0);

    const total = options.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = Math.random() * total;

    for (const [kind, weight] of options) {
        roll -= weight;
        if (roll <= 0) return kind;
    }

    return options[0][0];
};

const createInputNode = (name) => ({
    id: nextId('in'),
    kind: NODE.INPUT,
    name,
});

const createGateNode = (kind, props) => ({
    id: nextId('g'),
    kind,
    ...props,
});

const buildCircuitTree = (remainingGates, inputs, weights, depth = 0) => {
    if (remainingGates <= 0) {
        return createInputNode(pick(inputs));
    }

    const kind = weightedGate(weights, depth < 2);

    if (kind === NODE.NOT) {
        return createGateNode(NODE.NOT, {
            child: buildCircuitTree(remainingGates - 1, inputs, weights, depth + 1),
        });
    }

    const leftGates = randomInt(0, Math.max(0, remainingGates - 1));
    const rightGates = Math.max(0, remainingGates - 1 - leftGates);

    return createGateNode(kind, {
        left: buildCircuitTree(leftGates, inputs, weights, depth + 1),
        right: buildCircuitTree(rightGates, inputs, weights, depth + 1),
    });
};

const flattenInternalNodes = (node, list = []) => {
    if (!node || node.kind === NODE.INPUT) {
        return list;
    }

    if (node.kind === NODE.NOT) {
        flattenInternalNodes(node.child, list);
    } else {
        flattenInternalNodes(node.left, list);
        flattenInternalNodes(node.right, list);
    }

    list.push(node);
    return list;
};

const maxDepth = (node, depth = 0) => {
    if (!node || node.kind === NODE.INPUT) return depth;
    if (node.kind === NODE.NOT) return maxDepth(node.child, depth + 1);
    return Math.max(maxDepth(node.left, depth + 1), maxDepth(node.right, depth + 1));
};

const computeExpandedExpression = (node) => {
    if (node.kind === NODE.INPUT) return node.name;
    if (node.kind === NODE.NOT) return `${SYMBOLS.NOT}(${computeExpandedExpression(node.child)})`;
    const op = node.kind === NODE.AND ? SYMBOLS.AND : SYMBOLS.OR;
    return `(${computeExpandedExpression(node.left)} ${op} ${computeExpandedExpression(node.right)})`;
};

const computeNodeValues = (node, inputs, map = {}) => {
    if (node.kind === NODE.INPUT) {
        map[node.id] = !!inputs[node.name];
        return map[node.id];
    }

    if (node.kind === NODE.NOT) {
        map[node.id] = !computeNodeValues(node.child, inputs, map);
        return map[node.id];
    }

    const left = computeNodeValues(node.left, inputs, map);
    const right = computeNodeValues(node.right, inputs, map);
    map[node.id] = node.kind === NODE.AND ? left && right : left || right;
    return map[node.id];
};

const collectTruthTable = (expr, vars) => {
    const tokens = expr.replace(/\s+/g, '').split(/([¬∧∨()])/).filter(Boolean);

    let pos = 0;
    const parseAtom = () => {
        const token = tokens[pos];
        if (!token) throw new Error('Unexpected end');
        if (token === SYMBOLS.NOT) {
            pos += 1;
            return { type: 'NOT', child: parseAtom() };
        }
        if (token === '(') {
            pos += 1;
            const node = parseOr();
            if (tokens[pos] !== ')') throw new Error('Missing )');
            pos += 1;
            return node;
        }
        if (/^[A-Za-z]+$/.test(token)) {
            pos += 1;
            return { type: 'ATOM', value: token.toUpperCase() };
        }
        throw new Error(`Unexpected token: ${token}`);
    };

    const parseAnd = () => {
        let node = parseAtom();
        while (tokens[pos] === SYMBOLS.AND) {
            pos += 1;
            node = { type: 'BIN', op: SYMBOLS.AND, left: node, right: parseAtom() };
        }
        return node;
    };

    const parseOr = () => {
        let node = parseAnd();
        while (tokens[pos] === SYMBOLS.OR) {
            pos += 1;
            node = { type: 'BIN', op: SYMBOLS.OR, left: node, right: parseAnd() };
        }
        return node;
    };

    const root = parseOr();
    if (pos !== tokens.length) {
        throw new Error('Trailing tokens');
    }

    const evaluate = (node, values) => {
        if (node.type === 'ATOM') {
            if (node.value === '1' || node.value === 'T') return true;
            if (node.value === '0' || node.value === 'F') return false;
            return !!values[node.value];
        }
        if (node.type === 'NOT') return !evaluate(node.child, values);
        const left = evaluate(node.left, values);
        const right = evaluate(node.right, values);
        return node.op === SYMBOLS.AND ? left && right : left || right;
    };

    const count = 1 << vars.length;
    const rows = [];
    for (let i = count - 1; i >= 0; i--) {
        const values = {};
        vars.forEach((v, idx) => {
            const shift = vars.length - 1 - idx;
            values[v] = !!((i >> shift) & 1);
        });
        rows.push({
            values,
            result: evaluate(root, values) ? '1' : '0',
        });
    }
    return rows;
};

const extractVariables = (expr) => {
    const found = (expr.match(/[A-Za-z]+/g) || []).map(v => v.toUpperCase());
    return [...new Set(found.filter(v => !['T', 'F'].includes(v)))].sort();
};

const parseFormula = (expr) => {
    const tokens = expr.replace(/\s+/g, '').split(/([¬∧∨()])/).filter(Boolean);
    let pos = 0;

    const parseAtom = () => {
        const token = tokens[pos];
        if (!token) throw new Error('Unexpected end');
        if (token === SYMBOLS.NOT) {
            pos += 1;
            return { type: 'NOT', child: parseAtom() };
        }
        if (token === '(') {
            pos += 1;
            const node = parseOr();
            if (tokens[pos] !== ')') throw new Error('Missing )');
            pos += 1;
            return node;
        }
        if (/^[A-Za-z]+$/.test(token)) {
            pos += 1;
            return { type: 'ATOM', value: token.toUpperCase() };
        }
        throw new Error(`Unexpected token: ${token}`);
    };

    const parseAnd = () => {
        let node = parseAtom();
        while (tokens[pos] === SYMBOLS.AND) {
            pos += 1;
            node = { type: 'BIN', op: SYMBOLS.AND, left: node, right: parseAtom() };
        }
        return node;
    };

    const parseOr = () => {
        let node = parseAnd();
        while (tokens[pos] === SYMBOLS.OR) {
            pos += 1;
            node = { type: 'BIN', op: SYMBOLS.OR, left: node, right: parseAnd() };
        }
        return node;
    };

    const root = parseOr();
    if (pos !== tokens.length) throw new Error('Trailing tokens');
    return root;
};

const evaluateFormula = (expr, values) => {
    const ast = parseFormula(expr);
    const evaluate = (node) => {
        if (node.type === 'ATOM') {
            if (node.value === '1' || node.value === 'T') return true;
            if (node.value === '0' || node.value === 'F') return false;
            return !!values[node.value];
        }
        if (node.type === 'NOT') return !evaluate(node.child);
        const left = evaluate(node.left);
        const right = evaluate(node.right);
        return node.op === SYMBOLS.AND ? left && right : left || right;
    };
    return evaluate(ast);
};

const expressionsEquivalent = (expectedExpr, userExpr, vars) => {
    const userVars = extractVariables(userExpr);
    const disallowed = userVars.filter(v => !vars.includes(v));

    if (disallowed.length > 0) {
        return { valid: false, equivalent: false, reason: `Usa solo estas entradas: ${vars.join(', ')}.` };
    }

    try {
        parseFormula(expectedExpr);
    } catch (error) {
        return { valid: false, equivalent: false, reason: 'La solucion del circuito no es valida.' };
    }

    try {
        parseFormula(userExpr);
    } catch (error) {
        return { valid: false, equivalent: false, reason: 'Tu expresion tiene errores de sintaxis.' };
    }

    const count = 1 << vars.length;
    for (let i = 0; i < count; i++) {
        const values = {};
        vars.forEach((v, idx) => {
            const shift = vars.length - 1 - idx;
            values[v] = !!((i >> shift) & 1);
        });
        if (evaluateFormula(expectedExpr, values) !== evaluateFormula(userExpr, values)) {
            return { valid: true, equivalent: false, reason: 'Tu expresion no coincide con el circuito.' };
        }
    }

    return { valid: true, equivalent: true, reason: '' };
};

const labelSuggestion = (index) => {
    const base = LABEL_SUGGESTIONS[index % LABEL_SUGGESTIONS.length];
    const suffix = Math.floor(index / LABEL_SUGGESTIONS.length);
    return suffix === 0 ? base : `${base}${suffix + 1}`;
};

const collectEquations = (node, labels, state = { index: 0 }, equations = [], isRoot = false) => {
    if (node.kind === NODE.INPUT) {
        return { alias: node.name, expanded: node.name };
    }

    if (node.kind === NODE.NOT) {
        const child = collectEquations(node.child, labels, state, equations, false);
        const alias = isRoot ? 'Q' : (labels[node.id]?.trim() || labelSuggestion(state.index++));
        const equation = `${alias} = ${SYMBOLS.NOT}(${child.alias})`;
        const expanded = `${SYMBOLS.NOT}(${child.expanded})`;
        equations.push({ id: node.id, alias, equation, expanded, kind: node.kind });
        return { alias, expanded };
    }

    const left = collectEquations(node.left, labels, state, equations, false);
    const right = collectEquations(node.right, labels, state, equations, false);
    const alias = isRoot ? 'Q' : (labels[node.id]?.trim() || labelSuggestion(state.index++));
    const symbol = node.kind === NODE.AND ? SYMBOLS.AND : SYMBOLS.OR;
    const equation = `${alias} = (${left.alias} ${symbol} ${right.alias})`;
    const expanded = `(${left.expanded} ${symbol} ${right.expanded})`;
    equations.push({ id: node.id, alias, equation, expanded, kind: node.kind });
    return { alias, expanded };
};

const layoutCircuit = (root) => {
    const depths = new Map();
    const leaves = [];

    const assignDepths = (node, depth = 0) => {
        depths.set(node.id, depth);
        if (node.kind === NODE.INPUT) {
            leaves.push(node);
            return;
        }
        if (node.kind === NODE.NOT) {
            assignDepths(node.child, depth + 1);
            return;
        }
        assignDepths(node.left, depth + 1);
        assignDepths(node.right, depth + 1);
    };

    assignDepths(root);

    const leafY = new Map();
    const topMargin = 80;
    const leafGap = 110;
    leaves.forEach((leaf, index) => {
        leafY.set(leaf.id, topMargin + index * leafGap);
    });

    const maxTreeDepth = maxDepth(root);
    const leftMargin = 90;
    const layerGap = 170;
    const positions = new Map();
    const nodeWidths = new Map();

    const place = (node) => {
        if (node.kind === NODE.INPUT) {
            const y = leafY.get(node.id);
            const x = leftMargin;
            positions.set(node.id, { x, y, kind: node.kind });
            nodeWidths.set(node.id, 48);
            return y;
        }

        let childYs = [];
        if (node.kind === NODE.NOT) {
            childYs = [place(node.child)];
        } else {
            childYs = [place(node.left), place(node.right)];
        }

        const depth = depths.get(node.id);
        const x = leftMargin + (maxTreeDepth - depth) * layerGap;
        const y = childYs.reduce((a, b) => a + b, 0) / childYs.length;
        positions.set(node.id, { x, y, kind: node.kind });
        nodeWidths.set(node.id, 96);
        return y;
    };

    place(root);

    const width = leftMargin + maxTreeDepth * layerGap + 260;
    const height = Math.max(420, topMargin + Math.max(1, leaves.length - 1) * leafGap + 120);

    const edges = [];
    const addEdges = (node) => {
        if (node.kind === NODE.INPUT) return;
        if (node.kind === NODE.NOT) {
            edges.push({
                from: positions.get(node.child.id),
                to: positions.get(node.id),
                kind: NODE.NOT,
                value: null,
                childId: node.child.id,
            });
            addEdges(node.child);
            return;
        }
        edges.push({
            from: positions.get(node.left.id),
            to: positions.get(node.id),
            kind: NODE.AND,
            port: 'top',
            childId: node.left.id,
        });
        edges.push({
            from: positions.get(node.right.id),
            to: positions.get(node.id),
            kind: NODE.OR,
            port: 'bottom',
            childId: node.right.id,
        });
        addEdges(node.left);
        addEdges(node.right);
    };

    addEdges(root);

    return {
        positions,
        edges,
        width,
        height,
        leaves,
        maxTreeDepth,
    };
};

const generateCircuitChallenge = (mode = 'simple') => {
    resetNodeIds();
    const config = pickModeConfig(mode);
    const gateCount = randomInt(config.gateRange[0], config.gateRange[1]);
    const tree = buildCircuitTree(gateCount, config.inputs, config.weights);
    const expression = computeExpandedExpression(tree);
    const internalNodes = flattenInternalNodes(tree).filter(node => node.id !== tree.id);
    const labels = {};
    internalNodes.forEach((node) => {
        labels[node.id] = '';
    });

    return {
        mode,
        modeLabel: config.label,
        inputs: config.inputs,
        tree,
        expression,
        internalNodes,
        labels,
        truthTable: collectTruthTable(expression, config.inputs),
    };
};

const GateSymbol = ({ node, value }) => {
    const stroke = value ? '#10b981' : '#64748b';
    const fill = value ? '#ecfdf5' : '#ffffff';

    if (node.kind === NODE.INPUT) {
        return (
            <g>
                <circle cx="24" cy="24" r="22" fill={fill} stroke={stroke} strokeWidth="3" />
                <text x="24" y="29" textAnchor="middle" fontSize="18" fontWeight="800" fill={stroke}>
                    {node.name}
                </text>
            </g>
        );
    }

    if (node.kind === NODE.NOT) {
        return (
            <g>
                <polygon
                    points="10,8 62,30 10,52"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="3"
                    strokeLinejoin="round"
                />
                <circle cx="72" cy="30" r="6" fill={fill} stroke={stroke} strokeWidth="3" />
                <text x="28" y="34" textAnchor="middle" fontSize="12" fontWeight="800" fill={stroke}>
                    NOT
                </text>
            </g>
        );
    }

    if (node.kind === NODE.AND) {
        return (
            <g>
                <path
                    d="M 12 8 H 44 C 63 8 78 20 78 30 C 78 40 63 52 44 52 H 12 Z"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="3"
                    strokeLinejoin="round"
                />
                <text x="34" y="34" textAnchor="middle" fontSize="12" fontWeight="800" fill={stroke}>
                    AND
                </text>
            </g>
        );
    }

    return (
        <g>
            <path
                d="M 12 8 C 32 8 46 16 58 30 C 46 44 32 52 12 52 C 18 40 18 20 12 8 Z"
                fill={fill}
                stroke={stroke}
                strokeWidth="3"
                strokeLinejoin="round"
            />
            <path
                d="M 12 8 C 6 20 6 40 12 52"
                fill="none"
                stroke={stroke}
                strokeWidth="3"
                strokeLinecap="round"
            />
            <text x="34" y="34" textAnchor="middle" fontSize="12" fontWeight="800" fill={stroke}>
                OR
            </text>
        </g>
    );
};

const wireStroke = (value) => (value ? '#10b981' : '#cbd5e1');

const CircuitSectionPro = () => {
    const [mode, setMode] = useState('simple');
    const [challenge, setChallenge] = useState(() => generateCircuitChallenge('simple'));
    const [inputValues, setInputValues] = useState({});
    const [labels, setLabels] = useState({});
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState('idle');
    const [feedback, setFeedback] = useState('');
    const [showSolution, setShowSolution] = useState(false);
    const [showTruthTable, setShowTruthTable] = useState(false);

    const makeRandomInputs = (inputs) => {
        const values = {};
        inputs.forEach(input => {
            values[input] = Math.random() < 0.5;
        });
        return values;
    };

    const loadChallenge = (nextMode = mode) => {
        const generated = generateCircuitChallenge(nextMode);
        setChallenge(generated);
        setInputValues(makeRandomInputs(generated.inputs));
        setLabels(generated.labels);
        setAnswer('');
        setStatus('idle');
        setFeedback('');
        setShowSolution(false);
        setShowTruthTable(false);
    };

    useEffect(() => {
        loadChallenge('simple');
    }, []);

    const currentLayout = useMemo(() => layoutCircuit(challenge.tree), [challenge]);
    const liveValues = useMemo(() => {
        const values = {};
        computeNodeValues(challenge.tree, inputValues, values);
        return values;
    }, [challenge, inputValues]);

    const equationLines = useMemo(() => {
        const lines = [];
        collectEquations(challenge.tree, labels, { index: 0 }, lines, true);
        return lines;
    }, [challenge, labels]);

    const topLevelEquation = equationLines.find(line => line.alias === 'Q')?.expanded || challenge.expression;

    const internalLabelNodes = challenge.internalNodes.filter(node => node.id !== challenge.tree.id);

    const checkAnswer = () => {
        const trimmed = answer.trim();
        if (!trimmed) {
            setStatus('error');
            setFeedback('Escribe una expresion para la salida Q.');
            return;
        }

        const result = expressionsEquivalent(challenge.expression, trimmed, challenge.inputs);
        if (!result.valid) {
            setStatus('error');
            setFeedback(result.reason);
            return;
        }

        if (result.equivalent) {
            const exact = trimmed.replace(/\s+/g, '') === challenge.expression.replace(/\s+/g, '');
            setStatus('correct');
            setFeedback(
                exact
                    ? 'Perfecto. Tu expresion coincide exactamente con el circuito.'
                    : 'Muy bien. Tu expresion es equivalente al circuito.'
            );
            setShowSolution(true);
        } else {
            setStatus('error');
            setFeedback(result.reason);
        }
    };

    const fillSuggestedLabels = () => {
        setLabels(prev => {
            const next = { ...prev };
            internalLabelNodes.forEach((node, index) => {
                next[node.id] = next[node.id]?.trim() || labelSuggestion(index);
            });
            return next;
        });
    };

    const randomizeInputs = () => {
        setInputValues(makeRandomInputs(challenge.inputs));
    };

    const toggleInput = (inputName) => {
        setInputValues(prev => ({ ...prev, [inputName]: !prev[inputName] }));
    };

    const rootValue = liveValues[challenge.tree.id] ? '1' : '0';

    return (
        <div className="space-y-6">
            <div className="bg-violet-50 p-4 rounded border-l-4 border-violet-500">
                <h3 className="text-violet-900 font-bold">Circuitos digitales</h3>
                <p className="text-sm text-violet-800">
                    Observa el circuito como en un esquema real, usa los interruptores para cambiar las entradas y nombra las salidas intermedias con letras como x, y o z.
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-violet-700 border border-violet-200">
                    <AlertCircle className="w-4 h-4" />
                    Primero elige la complejidad y luego genera un circuito nuevo.
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="bg-white rounded-lg shadow border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold">Generador</p>
                            <h4 className="text-2xl font-black text-slate-900">Selecciona la complejidad</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(MODE_OPTIONS).map(([key, option]) => (
                                <button
                                    key={key}
                                    onClick={() => setMode(key)}
                                    className={`px-3 py-2 rounded-lg text-sm font-bold transition ${
                                        mode === key
                                            ? 'bg-violet-600 text-white shadow'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <button
                            onClick={() => loadChallenge(mode)}
                            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-bold transition flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" /> Generar circuito
                        </button>
                        <button
                            onClick={randomizeInputs}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-lg font-bold transition flex items-center gap-2"
                        >
                            <Play className="w-4 h-4" /> Aleatorizar entradas
                        </button>
                        <button
                            onClick={fillSuggestedLabels}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-lg font-bold transition flex items-center gap-2"
                        >
                            <Edit3 className="w-4 h-4" /> Sugerir x, y, z
                        </button>
                    </div>

                    <div className="mb-4 text-sm text-slate-500">
                        {MODE_OPTIONS[mode].description}
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        <span className="rounded-full bg-slate-100 px-3 py-1 border border-slate-200">
                            Generado: {challenge.modeLabel}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 border border-slate-200">
                            {challenge.inputs.length} entradas
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 border border-slate-200">
                            {challenge.internalNodes.length} puertas
                        </span>
                    </div>

                    <div className="relative overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50">
                        <div className="relative" style={{ width: currentLayout.width, height: currentLayout.height }}>
                            <svg
                                className="absolute inset-0"
                                width={currentLayout.width}
                                height={currentLayout.height}
                                viewBox={`0 0 ${currentLayout.width} ${currentLayout.height}`}
                            >
                                <defs>
                                    <pattern id="circuit-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                                        <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#circuit-grid)" />

                                {currentLayout.edges.map((edge, index) => {
                                    const from = edge.from;
                                    const to = edge.to;
                                    const startX = from.x + (edge.childId && liveValues[edge.childId] ? 24 : 24);
                                    const startY = from.y;
                                    const endX = to.x - 48;
                                    const endY = edge.port === 'top' ? to.y - 14 : edge.port === 'bottom' ? to.y + 14 : to.y;
                                    const elbowX = (startX + endX) / 2;
                                    const childValue = liveValues[edge.childId];

                                    return (
                                        <path
                                            key={`${edge.childId}-${index}`}
                                            d={`M ${startX} ${startY} H ${elbowX} V ${endY} H ${endX}`}
                                            fill="none"
                                            stroke={wireStroke(childValue)}
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    );
                                })}

                                {challenge.tree && (
                                    <g>
                                        {challenge.tree && (
                                            <circle
                                                cx={currentLayout.positions.get(challenge.tree.id).x + 50}
                                                cy={currentLayout.positions.get(challenge.tree.id).y}
                                                r="10"
                                                fill={rootValue === '1' ? '#dcfce7' : '#fff1f2'}
                                                stroke={rootValue === '1' ? '#10b981' : '#fb7185'}
                                                strokeWidth="3"
                                            />
                                        )}
                                    </g>
                                )}

                                {challenge.tree && (
                                    <g>
                                        {Array.from(currentLayout.positions.entries()).map(([id, pos]) => {
                                            const node = [challenge.tree, ...challenge.internalNodes].find(n => n.id === id) || null;
                                            if (!node) return null;
                                            const value = liveValues[id];
                                            const isInput = node.kind === NODE.INPUT;
                                            const x = isInput ? pos.x : pos.x;
                                            const y = pos.y;
                                            const gateStroke = value ? '#10b981' : '#64748b';

                                            return (
                                                <g key={id}>
                                                    <g transform={`translate(${x - (isInput ? 24 : 48)}, ${y - (isInput ? 24 : 30)})`}>
                                                        <GateSymbol node={node} value={value} />
                                                    </g>
                                                    {!isInput && (
                                                        <circle
                                                            cx={x + 44}
                                                            cy={y}
                                                            r="8"
                                                            fill={value ? '#ecfdf5' : '#ffffff'}
                                                            stroke={gateStroke}
                                                            strokeWidth="3"
                                                        />
                                                    )}
                                                </g>
                                            );
                                        })}
                                    </g>
                                )}
                            </svg>

                            {challenge.inputs.map(inputName => {
                                const inputNode = findNodeByName(challenge.tree, inputName);
                                const nodePos = inputNode ? currentLayout.positions.get(inputNode.id) : null;
                                if (!nodePos) return null;

                                return (
                                    <div
                                        key={inputName}
                                        className="absolute"
                                        style={{ left: nodePos.x - 44, top: nodePos.y - 58, width: 120 }}
                                    >
                                        <div className="text-xs font-bold text-slate-500 mb-1">{inputName}</div>
                                        <button
                                            type="button"
                                            onClick={() => toggleInput(inputName)}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-full border-2 transition ${
                                                inputValues[inputName]
                                                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                                                    : 'bg-slate-100 border-slate-300 text-slate-600'
                                            }`}
                                        >
                                            <span className="font-black text-sm">{inputValues[inputName] ? '1' : '0'}</span>
                                            <span className="text-[10px] uppercase tracking-[0.2em]">
                                                {inputValues[inputName] ? 'ON' : 'OFF'}
                                            </span>
                                        </button>
                                    </div>
                                );
                            })}

                            {internalLabelNodes.map((node, index) => {
                                const pos = currentLayout.positions.get(node.id);
                                if (!pos) return null;
                                return (
                                    <div
                                        key={node.id}
                                        className="absolute"
                                        style={{ left: pos.x - 56, top: pos.y - 76, width: 112 }}
                                    >
                                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-1 text-center">
                                            Salida {index + 1}
                                        </div>
                                        <input
                                            value={labels[node.id] || ''}
                                            onChange={e => setLabels(prev => ({ ...prev, [node.id]: e.target.value }))}
                                            placeholder={labelSuggestion(index)}
                                            className="w-full rounded-full border border-slate-300 bg-white px-3 py-2 text-center font-mono text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                        />
                                    </div>
                                );
                            })}

                            <div
                                className="absolute"
                                style={{ left: currentLayout.positions.get(challenge.tree.id).x + 72, top: currentLayout.positions.get(challenge.tree.id).y - 18 }}
                            >
                                <div className={`px-4 py-2 rounded-full font-black shadow ${
                                    rootValue === '1'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-rose-500 text-white'
                                }`}>
                                    Q = {rootValue}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow border border-slate-200 p-4">
                        <h4 className="text-xl font-black text-slate-900">Escribe la expresion total</h4>
                        <p className="text-sm text-slate-500 mt-1">
                            La respuesta final debe usar solo las entradas del circuito. Primero usa las etiquetas intermedias para pensar el circuito.
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
                                className={`w-full rounded-xl border-2 px-4 py-3 font-mono text-lg outline-none transition ${
                                    status === 'correct'
                                        ? 'border-emerald-500'
                                        : status === 'error'
                                            ? 'border-rose-500'
                                            : 'border-slate-300'
                                }`}
                                placeholder="Ej: (A ∧ B) ∨ ¬(C)"
                            />

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={checkAnswer}
                                    className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-3 rounded-xl font-bold transition flex items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" /> Comprobar
                                </button>
                                <button
                                    onClick={() => setShowSolution(prev => !prev)}
                                    className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-5 py-3 rounded-xl font-bold transition flex items-center gap-2"
                                >
                                    <Eye className="w-4 h-4" /> {showSolution ? 'Ocultar' : 'Ver solucion'}
                                </button>
                                <button
                                    onClick={() => setShowTruthTable(prev => !prev)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-5 py-3 rounded-xl font-bold transition"
                                >
                                    {showTruthTable ? 'Ocultar tabla' : 'Ver tabla'}
                                </button>
                            </div>
                        </div>

                        <div className="min-h-[4rem] mt-4">
                            {feedback && (
                                <div className={`p-3 rounded-lg border font-medium ${
                                    status === 'correct'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : 'bg-rose-50 text-rose-800 border-rose-200'
                                }`}>
                                    {feedback}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow border border-slate-200 p-4">
                        <h4 className="text-lg font-black text-slate-900">Expresiones por etiqueta</h4>
                        <p className="text-sm text-slate-500 mt-1">
                            Estas lineas cambian segun las etiquetas que escribas.
                        </p>

                        <div className="mt-4 space-y-3">
                            {equationLines.map((line) => (
                                <div key={line.id} className={`rounded-xl border px-3 py-2 ${
                                    line.alias === 'Q'
                                        ? 'bg-violet-50 border-violet-200'
                                        : 'bg-slate-50 border-slate-200'
                                }`}>
                                    <div className="font-black text-slate-900 font-mono break-words">{line.equation}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {showSolution && (
                        <div className="bg-slate-900 text-white rounded-lg shadow-lg p-4">
                            <div className="text-xs uppercase tracking-[0.3em] text-slate-400 font-bold">Solucion</div>
                            <div className="mt-3 font-mono text-lg text-emerald-400 break-words">
                                Q = {topLevelEquation}
                            </div>
                        </div>
                    )}

                    {showTruthTable && (
                        <div className="bg-white rounded-lg shadow border border-slate-200 p-4">
                            <h4 className="text-lg font-black text-slate-900">Tabla de verdad</h4>
                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full text-center border-collapse">
                                    <thead>
                                        <tr className="bg-slate-800 text-white">
                                            {challenge.inputs.map(input => (
                                                <th key={input} className="px-3 py-2">{input}</th>
                                            ))}
                                            <th className="px-3 py-2 bg-violet-900">Q</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {challenge.truthTable.map((row, index) => (
                                            <tr key={index} className="border-b border-slate-200">
                                                {challenge.inputs.map(input => (
                                                    <td key={input} className="px-3 py-2 font-mono font-bold bg-slate-50">
                                                        {row.values[input] ? '1' : '0'}
                                                    </td>
                                                ))}
                                                <td className="px-3 py-2 font-mono font-black text-violet-700">{row.result}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const findNodeByName = (node, name) => {
    if (!node) return null;
    if (node.kind === NODE.INPUT && node.name === name) return node;
    if (node.kind === NODE.NOT) return findNodeByName(node.child, name);
    return findNodeByName(node.left, name) || findNodeByName(node.right, name);
};

export default CircuitSectionPro;

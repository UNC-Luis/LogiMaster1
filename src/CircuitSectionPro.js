import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Eye, Edit3, Play, RefreshCw } from 'lucide-react';

const SYMBOLS = {
    NOT: '¬',
    AND: '∧',
    OR: '∨',
    XOR: '⊕',
};

const MODE_OPTIONS = {
    simple: {
        label: 'Simple',
        description: '2 entradas, 2-4 puertas',
        inputs: ['A', 'B'],
        gateRange: [2, 4],
        weights: { AND: 0.44, OR: 0.2, XOR: 0.2, NOT: 0.16 },
    },
    complex: {
        label: 'Compleja',
        description: '3 entradas, 5-8 puertas',
        inputs: ['A', 'B', 'C'],
        gateRange: [5, 8],
        weights: { AND: 0.32, OR: 0.24, XOR: 0.26, NOT: 0.18 },
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
    XOR: 'XOR',
};

const NODE_SPECS = {
    INPUT: { width: 84, height: 42 },
    NOT: { width: 96, height: 58 },
    AND: { width: 104, height: 58 },
    OR: { width: 104, height: 58 },
    XOR: { width: 112, height: 58 },
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
        [NODE.XOR, weights.XOR ?? 0.2],
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

const gateSymbol = (kind) => {
    if (kind === NODE.AND) return SYMBOLS.AND;
    if (kind === NODE.OR) return SYMBOLS.OR;
    if (kind === NODE.XOR) return SYMBOLS.XOR;
    return SYMBOLS.OR;
};

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
    const op = gateSymbol(node.kind);
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
    map[node.id] = node.kind === NODE.AND
        ? left && right
        : node.kind === NODE.OR
            ? left || right
            : left !== right;
    return map[node.id];
};

const normalizeLogicExpression = (expr) => expr.replace(/\^/g, SYMBOLS.XOR);

const collectTruthTable = (expr, vars) => {
    const tokens = normalizeLogicExpression(expr).replace(/\s+/g, '').split(/([¬∧∨⊕()])/).filter(Boolean);

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

    const parseXor = () => {
        let node = parseAnd();
        while (tokens[pos] === SYMBOLS.XOR) {
            pos += 1;
            node = { type: 'BIN', op: SYMBOLS.XOR, left: node, right: parseAnd() };
        }
        return node;
    };

    const parseOr = () => {
        let node = parseXor();
        while (tokens[pos] === SYMBOLS.OR) {
            pos += 1;
            node = { type: 'BIN', op: SYMBOLS.OR, left: node, right: parseXor() };
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
        if (node.op === SYMBOLS.AND) return left && right;
        if (node.op === SYMBOLS.OR) return left || right;
        return left !== right;
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
    const tokens = normalizeLogicExpression(expr).replace(/\s+/g, '').split(/([¬∧∨⊕()])/).filter(Boolean);
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

    const parseXor = () => {
        let node = parseAnd();
        while (tokens[pos] === SYMBOLS.XOR) {
            pos += 1;
            node = { type: 'BIN', op: SYMBOLS.XOR, left: node, right: parseAnd() };
        }
        return node;
    };

    const parseOr = () => {
        let node = parseXor();
        while (tokens[pos] === SYMBOLS.OR) {
            pos += 1;
            node = { type: 'BIN', op: SYMBOLS.OR, left: node, right: parseXor() };
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
        if (node.op === SYMBOLS.AND) return left && right;
        if (node.op === SYMBOLS.OR) return left || right;
        return left !== right;
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
    const symbol = gateSymbol(node.kind);
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
    const leftMargin = 110;
    const layerGap = 190;
    const positions = new Map();

    const place = (node) => {
        if (node.kind === NODE.INPUT) {
            const y = leafY.get(node.id);
            const x = leftMargin;
            positions.set(node.id, { x, y, kind: node.kind });
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
        return y;
    };

    place(root);

    const width = leftMargin + maxTreeDepth * layerGap + 340;
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

const getNodeSpec = (kind) => NODE_SPECS[kind] || NODE_SPECS.OR;

const getNodeFrame = (node, pos) => {
    const { width, height } = getNodeSpec(node.kind);
    return {
        x: pos.x - width / 2,
        y: pos.y - height / 2,
        width,
        height,
    };
};

const getNodePorts = (node, pos) => {
    const frame = getNodeFrame(node, pos);
    const midY = frame.y + frame.height / 2;

    if (node.kind === NODE.INPUT) {
        return {
            output: { x: frame.x + frame.width - 8, y: midY },
        };
    }

    if (node.kind === NODE.NOT) {
        return {
            input: { x: frame.x, y: midY },
            output: { x: frame.x + frame.width - 10, y: midY },
        };
    }

    const branchOffset = frame.height * 0.22;
    return {
        inputTop: { x: frame.x, y: midY - branchOffset },
        inputBottom: { x: frame.x, y: midY + branchOffset },
        output: { x: frame.x + frame.width, y: midY },
    };
};

const GateSymbol = ({ node, value, interactive = false, onToggle = null }) => {
    const stroke = value ? '#10b981' : '#64748b';
    const fill = value ? '#ecfdf5' : '#ffffff';
    const { width, height } = getNodeSpec(node.kind);
    const midY = height / 2;
    const handleKeyDown = (event) => {
        if (!interactive || !onToggle) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggle();
        }
    };

    if (node.kind === NODE.INPUT) {
        return (
            <g
                onClick={interactive && onToggle ? onToggle : undefined}
                onKeyDown={handleKeyDown}
                role={interactive ? 'button' : undefined}
                aria-label={interactive ? `Toggle ${node.name}` : undefined}
                tabIndex={interactive ? 0 : undefined}
                style={{ cursor: interactive ? 'pointer' : 'default' }}
            >
                <rect
                    x="4"
                    y="8"
                    width={width - 16}
                    height={height - 16}
                    rx="16"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="3"
                />
                <line x1="20" y1={midY} x2={width - 26} y2={midY} stroke={stroke} strokeWidth="4" strokeLinecap="round" />
                <circle
                    cx={value ? width - 30 : 28}
                    cy={midY}
                    r="9"
                    fill={value ? '#10b981' : '#ffffff'}
                    stroke={stroke}
                    strokeWidth="3"
                />
                <circle cx={width - 8} cy={midY} r="5" fill={fill} stroke={stroke} strokeWidth="3" />
                <text x="24" y={midY + 6} textAnchor="middle" fontSize="18" fontWeight="800" fill={stroke}>
                    {node.name}
                </text>
                <text x={width - 30} y={midY + 5} textAnchor="middle" fontSize="11" fontWeight="900" fill={stroke}>
                    {value ? 'ON' : 'OFF'}
                </text>
            </g>
        );
    }

    if (node.kind === NODE.NOT) {
        return (
            <g>
                <polygon
                    points={`14,8 ${width - 20},${midY} 14,${height - 8}`}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="3"
                    strokeLinejoin="round"
                />
                <circle cx={width - 10} cy={midY} r="6" fill={fill} stroke={stroke} strokeWidth="3" />
                <circle cx="0" cy={midY} r="4" fill={fill} stroke={stroke} strokeWidth="3" />
                <text x="30" y={midY + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill={stroke}>
                    NOT
                </text>
            </g>
        );
    }

    if (node.kind === NODE.AND) {
        return (
            <g>
                <path
                    d={`M 14 8 H ${width - 38} C ${width - 14} 8 ${width - 6} ${midY - 10} ${width - 6} ${midY} C ${width - 6} ${midY + 10} ${width - 14} ${height - 8} ${width - 38} ${height - 8} H 14 Z`}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="3"
                    strokeLinejoin="round"
                />
                <circle cx="0" cy={midY - height * 0.18} r="4" fill={fill} stroke={stroke} strokeWidth="3" />
                <circle cx="0" cy={midY + height * 0.18} r="4" fill={fill} stroke={stroke} strokeWidth="3" />
                <circle cx={width} cy={midY} r="6" fill={fill} stroke={stroke} strokeWidth="3" />
                <text x="36" y={midY + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill={stroke}>
                    AND
                </text>
            </g>
        );
    }

    if (node.kind === NODE.OR) {
        return (
            <g>
                <path
                    d={`M 12 8 C ${width * 0.36} 8 ${width * 0.54} 16 ${width * 0.64} ${midY} C ${width * 0.54} ${height - 16} ${width * 0.36} ${height - 8} 12 ${height - 8} C 18 ${height - 20} 18 ${midY + 18} 12 8 Z`}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="3"
                    strokeLinejoin="round"
                />
                <path
                    d={`M 12 8 C 5 ${midY - 12} 5 ${midY + 12} 12 ${height - 8}`}
                    fill="none"
                    stroke={stroke}
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                <circle cx="0" cy={midY - height * 0.18} r="4" fill={fill} stroke={stroke} strokeWidth="3" />
                <circle cx="0" cy={midY + height * 0.18} r="4" fill={fill} stroke={stroke} strokeWidth="3" />
                <circle cx={width} cy={midY} r="6" fill={fill} stroke={stroke} strokeWidth="3" />
                <text x="34" y={midY + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill={stroke}>
                    OR
                </text>
            </g>
        );
    }

    return (
        <g>
            <path
                d={`M 12 8 C ${width * 0.36} 8 ${width * 0.54} 16 ${width * 0.64} ${midY} C ${width * 0.54} ${height - 16} ${width * 0.36} ${height - 8} 12 ${height - 8} C 18 ${height - 20} 18 ${midY + 18} 12 8 Z`}
                fill={fill}
                stroke={stroke}
                strokeWidth="3"
                strokeLinejoin="round"
            />
            <path
                d={`M 12 8 C 5 ${midY - 12} 5 ${midY + 12} 12 ${height - 8}`}
                fill="none"
                stroke={stroke}
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d={`M 4 ${midY - 12} C 18 ${midY - 18} 28 ${midY - 18} 40 ${midY - 4}`}
                fill="none"
                stroke={stroke}
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <circle cx="0" cy={midY - height * 0.18} r="4" fill={fill} stroke={stroke} strokeWidth="3" />
            <circle cx="0" cy={midY + height * 0.18} r="4" fill={fill} stroke={stroke} strokeWidth="3" />
            <circle cx={width} cy={midY} r="6" fill={fill} stroke={stroke} strokeWidth="3" />
            <text x="44" y={midY + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill={stroke}>
                XOR
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

    const currentLayout = useMemo(() => layoutCircuit(challenge.tree), [challenge.tree]);
    const liveValues = useMemo(() => {
        const values = {};
        computeNodeValues(challenge.tree, inputValues, values);
        return values;
    }, [challenge.tree, inputValues]);

    const nodesById = useMemo(() => {
        const map = new Map();

        const visit = (node) => {
            if (!node || map.has(node.id)) return;
            map.set(node.id, node);

            if (node.kind === NODE.NOT) {
                visit(node.child);
            } else if (node.kind !== NODE.INPUT) {
                visit(node.left);
                visit(node.right);
            }
        };

        visit(challenge.tree);
        return map;
    }, [challenge.tree]);

    const equationLines = useMemo(() => {
        const lines = [];
        collectEquations(challenge.tree, labels, { index: 0 }, lines, true);
        return lines;
    }, [challenge.tree, labels]);

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

    const appendAnswerToken = (token) => {
        setAnswer(prev => `${prev}${token}`);
    };

    const rootValue = liveValues[challenge.tree.id] ? '1' : '0';
    const rootPosition = currentLayout.positions.get(challenge.tree.id);
    const rootPorts = rootPosition ? getNodePorts(challenge.tree, rootPosition) : null;

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

                    <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold">
                                    Interactua con el circuito
                                </p>
                                <p className="text-sm text-slate-500">
                                    Haz clic en A, B o C dentro del esquema para cambiar su estado. Tambien puedes usar ⊕ o ^ como XOR al escribir la expresion.
                                </p>
                            </div>
                        </div>
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
                                    const startPorts = getNodePorts({ kind: edge.from.kind }, edge.from);
                                    const targetPorts = getNodePorts({ kind: edge.to.kind }, edge.to);
                                    const start = startPorts.output;
                                    const target = edge.port === 'top'
                                        ? targetPorts.inputTop
                                        : edge.port === 'bottom'
                                            ? targetPorts.inputBottom
                                            : targetPorts.input;
                                    const elbowX = start.x + Math.max(28, (target.x - start.x) * 0.55);
                                    const childValue = liveValues[edge.childId];

                                    return (
                                        <path
                                            key={`${edge.childId}-${index}`}
                                            d={`M ${start.x} ${start.y} H ${elbowX} V ${target.y} H ${target.x}`}
                                            fill="none"
                                            stroke={wireStroke(childValue)}
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    );
                                })}

                                {rootPosition && rootPorts && (
                                    <g>
                                        <circle
                                            cx={rootPorts.output.x + 18}
                                            cy={rootPorts.output.y}
                                            r="10"
                                            fill={rootValue === '1' ? '#dcfce7' : '#fff1f2'}
                                            stroke={rootValue === '1' ? '#10b981' : '#fb7185'}
                                            strokeWidth="3"
                                        />
                                    </g>
                                )}

                                <g>
                                    {Array.from(currentLayout.positions.entries()).map(([id, pos]) => {
                                        const node = nodesById.get(id);
                                        if (!node) return null;
                                        const value = liveValues[id];
                                        const frame = getNodeFrame(node, pos);
                                        const isInput = node.kind === NODE.INPUT;

                                        return (
                                            <g key={id} transform={`translate(${frame.x}, ${frame.y})`}>
                                                <GateSymbol
                                                    node={node}
                                                    value={value}
                                                    interactive={isInput}
                                                    onToggle={isInput ? () => toggleInput(node.name) : null}
                                                />
                                            </g>
                                        );
                                    })}
                                </g>
                            </svg>

                            {internalLabelNodes.map((node, index) => {
                                const pos = currentLayout.positions.get(node.id);
                                if (!pos) return null;
                                const frame = getNodeFrame(node, pos);
                                return (
                                    <div
                                        key={node.id}
                                        className="absolute"
                                        style={{ left: frame.x - 16, top: frame.y - 82, width: frame.width + 32 }}
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

                            {rootPosition && rootPorts && (
                                <div
                                    className="absolute"
                                    style={{ left: rootPorts.output.x + 30, top: rootPorts.output.y - 18 }}
                                >
                                    <div className={`px-4 py-2 rounded-full font-black shadow ${
                                        rootValue === '1'
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-rose-500 text-white'
                                    }`}>
                                        Q = {rootValue}
                                    </div>
                                </div>
                            )}
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
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { char: SYMBOLS.NOT, label: 'NOT' },
                                    { char: SYMBOLS.AND, label: 'AND' },
                                    { char: SYMBOLS.OR, label: 'OR' },
                                    { char: SYMBOLS.XOR, label: 'XOR' },
                                    { char: '(', label: '(' },
                                    { char: ')', label: ')' },
                                    ...challenge.inputs.map(input => ({ char: input, label: input })),
                                ].map(key => (
                                    <button
                                        key={`${key.char}-${key.label}`}
                                        type="button"
                                        onClick={() => appendAnswerToken(key.char)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-2 rounded-lg shadow-sm text-sm font-bold transition active:scale-95"
                                    >
                                        {key.label}
                                    </button>
                                ))}
                            </div>

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
                                placeholder="Ej: (A ∧ B) ⊕ ¬(C)"
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

export default CircuitSectionPro;

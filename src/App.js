import React, { useState, useEffect, useRef } from 'react';
import { BrainCircuit, Code, CheckSquare, Table, ArrowRight, CheckCircle, RefreshCw, Eraser, MousePointerClick, ChevronDown, Lock, AlertTriangle, Play, Edit3, Eye, AlertCircle } from 'lucide-react';

// --- CONSTANTS & CONFIG ---
const SYMBOLS = {
    NOT: '¬',
    AND: '∧',
    OR: '∨',
    IMP: '⇒',
    IFF: '⇔'
};

const VARS = ['P', 'Q', 'R', 'S', 'T', 'U'];

const PRECEDENCE = {
    [SYMBOLS.NOT]: 5,
    [SYMBOLS.AND]: 4,
    [SYMBOLS.OR]: 3,
    [SYMBOLS.IMP]: 2,
    [SYMBOLS.IFF]: 1
};

// Map operators to tailwind text colors for parentheses
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

// Robust Parser
const parseToAST = (tokens) => {
    const findSplit = (toks) => {
        let balance = 0;
        let splitIdx = -1;
        let minPrec = 100;

        for (let i = toks.length - 1; i >= 0; i--) {
            const t = toks[i];
            if (t === ')') balance++;
            else if (t === '(') balance--;
            else if (balance === 0) {
                if (t === SYMBOLS.NOT) continue;
                const prec = PRECEDENCE[t] || 100;
                if (prec < 100 && prec < minPrec) {
                    minPrec = prec;
                    splitIdx = i;
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

// --- COMPONENTS ---

const Header = () => (
    <header className="bg-slate-900 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BrainCircuit className="w-8 h-8 text-indigo-400" />
                    LogiMaster Pro
                </h1>
                <p className="text-slate-400 text-sm mt-1">Entrenador Avanzado de Lógica</p>
            </div>
            <div className="text-right text-xs text-slate-500 hidden md:block">
                <p>Prioridad: {SYMBOLS.NOT} &gt; {SYMBOLS.AND} &gt; {SYMBOLS.OR} &gt; {SYMBOLS.IMP} &gt; {SYMBOLS.IFF}</p>
            </div>
        </div>
    </header>
);

const LogicKeyboard = ({ onInsert }) => {
    const keys = [
        { char: SYMBOLS.NOT, label: 'NEG' },
        { char: SYMBOLS.AND, label: 'CONJ' },
        { char: SYMBOLS.OR, label: 'DISY' },
        { char: SYMBOLS.IMP, label: 'IMP' },
        { char: SYMBOLS.IFF, label: 'BIC' },
        { char: '(', label: '(' },
        { char: ')', label: ')' },
        ...VARS.map(v => ({ char: v, label: v }))
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

// --- HIGHLIGHTER HELPER ---
const getParenthesisColors = (inputStr) => {
    const colors = Array(inputStr.length).fill(null);
    const stack = [];
    
    // Helper to find the main operator within a range (exclusive of nested parens)
    const findMainOp = (start, end) => {
        let minPrec = 100;
        let mainOp = 'DEFAULT';
        let balance = 0;
        
        // Scan inside the parenthesis pair
        for (let i = start + 1; i < end; i++) {
            const char = inputStr[i];
            if (char === '(') balance++;
            else if (char === ')') balance--;
            else if (balance === 0) {
                // If it's an operator
                if (Object.values(SYMBOLS).includes(char)) {
                    // Specific logic: NOT is unary, usually binds tight, but if it's the ONLY thing, it colors the parens
                    // If we have ( P & Q ), main is &. If we have (~P), main is ~.
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

// --- SECTIONS ---

const SyntaxSection = () => {
    const [problemRaw, setProblemRaw] = useState("");
    const [expected, setExpected] = useState("");
    const [input, setInput] = useState("");
    const [status, setStatus] = useState("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [showAnswer, setShowAnswer] = useState(false);
    const [mode, setMode] = useState("auto"); 
    
    const inputRef = useRef(null);

    const newProblem = () => {
        let attempts = 0;
        let valid = false;
        let rawStr, fullStr;

        while(!valid && attempts < 10) {
            rawStr = generateFlatFormula(Math.floor(Math.random() * 2) + 3);
            const tokens = rawStr.replace(/\s/g, '').split(/([¬∧∨⇒⇔])/).filter(t => t);
            try {
                const ast = parseToAST(tokens);
                fullStr = ast.toFullString();
                if (fullStr.length > rawStr.length + 2) valid = true;
            } catch (e) {}
            attempts++;
        }
        setProblemRaw(rawStr);
        setExpected(fullStr);
        setInput(rawStr);
        setStatus("idle");
        setErrorMsg("");
        setShowAnswer(false);
    };

    const handleCustomCheck = () => {
        const tokens = input.replace(/\s/g, '').split(/([¬∧∨⇒⇔()])/).filter(t => t);
        try {
            const ast = parseToAST(tokens);
            if (ast.type === 'ERR') throw new Error();
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
                setErrorMsg("Paréntesis desbalanceados.");
            } else if (inputContent !== rawContent) {
                setErrorMsg("Has modificado las variables o conectores.");
            } else {
                setErrorMsg("Agrupación incorrecta. Revisa la jerarquía.");
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
                        {mode === 'auto' ? "Agrega paréntesis para eliminar la ambigüedad." : "Escribe cualquier fórmula."}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setMode('auto')} className={`px-3 py-1 rounded text-sm font-bold ${mode === 'auto' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}>Entrenamiento</button>
                    <button onClick={() => { setMode('custom'); setInput(""); setStatus("idle"); setShowAnswer(false); }} className={`px-3 py-1 rounded text-sm font-bold ${mode === 'custom' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}>Modo Libre</button>
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
        const prev = tokens[idx - 1];
        const next = tokens[idx + 1];

        const candidates = [];
        tokens.forEach((t, i) => {
            const isVal = (v) => v === '1' || v === '0';
            if (t === SYMBOLS.NOT && isVal(tokens[i+1])) {
                candidates.push({ idx: i, op: t, prec: PRECEDENCE[t] });
            }
            if ([SYMBOLS.AND, SYMBOLS.OR, SYMBOLS.IMP, SYMBOLS.IFF].includes(t) && isVal(tokens[i-1]) && isVal(tokens[i+1])) {
                candidates.push({ idx: i, op: t, prec: PRECEDENCE[t] });
            }
        });

        if (candidates.length === 0) return;

        const maxPrec = Math.max(...candidates.map(c => c.prec));
        const clickedPrec = PRECEDENCE[token];
        
        if (clickedPrec < maxPrec) {
            setMsg("⚠️ ¡Orden incorrecto! Resuelve primero los operadores de mayor jerarquía.");
            return;
        }

        if (token === SYMBOLS.NOT) {
            const res = evaluateNot(next);
            const prePart = tokens.slice(0, idx).join(' ');
            const postPart = tokens.slice(idx + 2).join(' ');
            addToHistory(`${prePart} ${res} ${postPart}`.trim());
        } else {
            const res = evaluateOp(prev, token, next);
            const prePart = tokens.slice(0, idx - 1).join(' ');
            const postPart = tokens.slice(idx + 2).join(' ');
            addToHistory(`${prePart} ${res} ${postPart}`.trim());
        }
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
    const isSolved = tokens.length === 1 && (tokens[0] === '1' || tokens[0] === '0');

    return (
        <div className="space-y-8">
            <div className="bg-emerald-50 p-4 rounded border-l-4 border-emerald-500">
                <h3 className="text-emerald-900 font-bold">Evaluación: Jerarquía Estricta</h3>
                <p className="text-sm text-emerald-800">
                    Resuelve paso a paso haciendo clic en los operadores. <br/>
                    <strong>Regla:</strong> Solo puedes resolver el operador con la mayor prioridad disponible.
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
                                const isVal = (v) => v === '0' || v === '1';
                                const isUnary = token === SYMBOLS.NOT && isVal(tokens[idx+1]);
                                const isBinary = [SYMBOLS.AND, SYMBOLS.OR, SYMBOLS.IMP, SYMBOLS.IFF].includes(token) && isVal(tokens[idx-1]) && isVal(tokens[idx+1]);
                                const interactable = isUnary || isBinary;

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
    const inputRef = useRef(null); // Just for cursor handling if needed, though keyboard insert logic is manual here

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

        setVariables(vars);
        
        const tokens = expr.replace(/\s/g, '').split(/([¬∧∨⇒⇔()])/).filter(t => t);
        let subs = [];
        try {
            const ast = parseToAST(tokens);
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
    // Reusing the same manual logic for formula editing in Table mode
    const handleInsert = (char) => {
        // Table section input ref is not strictly bound to cursor logic in original request, 
        // but we can apply simple append or basic cursor logic if we added a ref.
        // For simplicity based on prompt, applying cursor logic to "Parenthesis thing" (Syntax).
        // Standard append here for safety unless requested.
        setFormula(prev => prev + char);
        // generateTable is called via useEffect dependency or manual call? 
        // Better to call generateTable inside a useEffect on formula change debounce, or directly.
        // Direct call:
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
            
            const expectedFinalBool = solveProposition(formula, boolInputs);
            const expectedFinal = expectedFinalBool ? '1' : '0';
            const statusFinal = r.finalVal === expectedFinal ? 'correct' : 'error';

            const statusSub = {};
            subExprs.forEach(sub => {
                const subRes = solveProposition(sub, boolInputs);
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

export default function App() {
    const [activeTab, setActiveTab] = useState("syntax");

    return (
        <div className="min-h-screen pb-12 bg-gray-100 font-sans text-slate-800">
            <Header />
            
            <main className="max-w-6xl mx-auto px-4 mt-8">
                {/* Navigation Tabs */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-8">
                    {[
                        { id: 'syntax', icon: Code, label: 'Sintaxis' },
                        { id: 'evaluation', icon: CheckSquare, label: 'Evaluación' },
                        { id: 'satisfaction', icon: Table, label: 'Tablas de Verdad' },
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
                </div>
            </main>
        </div>
    );
}

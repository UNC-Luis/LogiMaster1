import React, { useState } from 'react';
import { BookOpen, CheckCircle, Edit3, RefreshCw } from 'lucide-react';

const LOGIC = {
    NOT: '\u00AC',
    AND: '\u2227',
    OR: '\u2228',
    IMP: '\u2192',
    IFF: '\u2194',
};

const SET_SYMBOLS = {
    UNION: '\u222A',
    INTERSECTION: '\u2229',
    DIFFERENCE: '\u2212',
    SYMDIFF: '\u2295',
    EMPTY: '\u2205',
};

const TOPICS = [
    {
        id: 'equivalences',
        label: 'Equivalencias',
        description: 'Simplify expressions by picking the equivalent result.',
        accent: 'from-sky-600 via-cyan-500 to-teal-500',
    },
    {
        id: 'laws',
        label: 'Leyes',
        description: 'Memorize the law names until they feel automatic.',
        accent: 'from-violet-600 via-fuchsia-500 to-pink-500',
    },
    {
        id: 'quantifiers',
        label: 'Cuantificadores',
        description: 'Train universal and existential statements with tables.',
        accent: 'from-amber-500 via-orange-500 to-rose-500',
    },
    {
        id: 'sets',
        label: 'Conjuntos',
        description: 'Build set results by toggling the universe elements.',
        accent: 'from-emerald-600 via-lime-500 to-yellow-400',
    },
];

const ATOMS = ['P', 'Q', 'R', 'S'];
const QUANTIFIER_DOMAIN = ['a', 'b', 'c'];
const SET_UNIVERSE_POOL = ['1', '2', '3', '4', '5', '6', '7'];
const LAW_FAMILY_ORDER = [
    'Identidad',
    'Dominacion',
    'Idempotencia',
    'Doble negacion',
    'Constantes',
    'Tercero excluido',
    'Contradiccion',
    'Conmutativa',
    'Asociativa',
    'Distributiva',
    'De Morgan',
    'Absorcion',
    'Implicacion',
    'Bicondicional',
];

const LAW_LIBRARY = [
    {
        id: 'identity_and',
        family: 'Identidad',
        source: `__A__ ${LOGIC.AND} T`,
        target: '__A__',
        explanation: 'T is the neutral element of conjunction.',
    },
    {
        id: 'identity_or',
        family: 'Identidad',
        source: `__A__ ${LOGIC.OR} F`,
        target: '__A__',
        explanation: 'F is the neutral element of disjunction.',
    },
    {
        id: 'domination_or',
        family: 'Dominacion',
        source: `__A__ ${LOGIC.OR} T`,
        target: 'T',
        explanation: 'T dominates disjunction.',
    },
    {
        id: 'domination_and',
        family: 'Dominacion',
        source: `__A__ ${LOGIC.AND} F`,
        target: 'F',
        explanation: 'F dominates conjunction.',
    },
    {
        id: 'idempotence_and',
        family: 'Idempotencia',
        source: `__A__ ${LOGIC.AND} __A__`,
        target: '__A__',
        explanation: 'Repeating the same proposition does not change the result.',
    },
    {
        id: 'idempotence_or',
        family: 'Idempotencia',
        source: `__A__ ${LOGIC.OR} __A__`,
        target: '__A__',
        explanation: 'Repeating the same proposition does not change the result.',
    },
    {
        id: 'double_negation',
        family: 'Doble negacion',
        source: `${LOGIC.NOT}${LOGIC.NOT}__A__`,
        target: '__A__',
        explanation: 'Two negations cancel each other out.',
    },
    {
        id: 'neg_true',
        family: 'Constantes',
        source: `${LOGIC.NOT}T`,
        target: 'F',
        explanation: 'The negation of true is false.',
    },
    {
        id: 'neg_false',
        family: 'Constantes',
        source: `${LOGIC.NOT}F`,
        target: 'T',
        explanation: 'The negation of false is true.',
    },
    {
        id: 'excluded_middle',
        family: 'Tercero excluido',
        source: `__A__ ${LOGIC.OR} ${LOGIC.NOT}__A__`,
        target: 'T',
        explanation: 'A proposition or its negation is always true.',
    },
    {
        id: 'contradiction',
        family: 'Contradiccion',
        source: `__A__ ${LOGIC.AND} ${LOGIC.NOT}__A__`,
        target: 'F',
        explanation: 'A proposition and its negation cannot both be true.',
    },
    {
        id: 'commutative_and',
        family: 'Conmutativa',
        source: `__A__ ${LOGIC.AND} __B__`,
        target: `__B__ ${LOGIC.AND} __A__`,
        explanation: 'The order of AND does not matter.',
    },
    {
        id: 'commutative_or',
        family: 'Conmutativa',
        source: `__A__ ${LOGIC.OR} __B__`,
        target: `__B__ ${LOGIC.OR} __A__`,
        explanation: 'The order of OR does not matter.',
    },
    {
        id: 'associative_and',
        family: 'Asociativa',
        source: `(__A__ ${LOGIC.AND} __B__) ${LOGIC.AND} __C__`,
        target: `__A__ ${LOGIC.AND} (__B__ ${LOGIC.AND} __C__)`,
        explanation: 'Grouping does not matter when the operator is the same.',
    },
    {
        id: 'associative_or',
        family: 'Asociativa',
        source: `(__A__ ${LOGIC.OR} __B__) ${LOGIC.OR} __C__`,
        target: `__A__ ${LOGIC.OR} (__B__ ${LOGIC.OR} __C__)`,
        explanation: 'Grouping does not matter when the operator is the same.',
    },
    {
        id: 'distributive_and',
        family: 'Distributiva',
        source: `__A__ ${LOGIC.AND} (__B__ ${LOGIC.OR} __C__)`,
        target: `(__A__ ${LOGIC.AND} __B__) ${LOGIC.OR} (__A__ ${LOGIC.AND} __C__)`,
        explanation: 'AND distributes over OR.',
    },
    {
        id: 'distributive_or',
        family: 'Distributiva',
        source: `__A__ ${LOGIC.OR} (__B__ ${LOGIC.AND} __C__)`,
        target: `(__A__ ${LOGIC.OR} __B__) ${LOGIC.AND} (__A__ ${LOGIC.OR} __C__)`,
        explanation: 'OR distributes over AND.',
    },
    {
        id: 'de_morgan_and',
        family: 'De Morgan',
        source: `${LOGIC.NOT}(__A__ ${LOGIC.AND} __B__)`,
        target: `${LOGIC.NOT}__A__ ${LOGIC.OR} ${LOGIC.NOT}__B__`,
        explanation: 'Negating AND changes it into OR and negates each side.',
    },
    {
        id: 'de_morgan_or',
        family: 'De Morgan',
        source: `${LOGIC.NOT}(__A__ ${LOGIC.OR} __B__)`,
        target: `${LOGIC.NOT}__A__ ${LOGIC.AND} ${LOGIC.NOT}__B__`,
        explanation: 'Negating OR changes it into AND and negates each side.',
    },
    {
        id: 'absorption_or',
        family: 'Absorcion',
        source: `__A__ ${LOGIC.OR} (__A__ ${LOGIC.AND} __B__)`,
        target: '__A__',
        explanation: 'A absorbs A AND B in OR form.',
    },
    {
        id: 'absorption_and',
        family: 'Absorcion',
        source: `__A__ ${LOGIC.AND} (__A__ ${LOGIC.OR} __B__)`,
        target: '__A__',
        explanation: 'A absorbs A OR B in AND form.',
    },
    {
        id: 'implication',
        family: 'Implicacion',
        source: `__A__ ${LOGIC.IMP} __B__`,
        target: `${LOGIC.NOT}__A__ ${LOGIC.OR} __B__`,
        explanation: 'Implication is equivalent to NOT A OR B.',
    },
    {
        id: 'biconditional',
        family: 'Bicondicional',
        source: `__A__ ${LOGIC.IFF} __B__`,
        target: `(__A__ ${LOGIC.AND} __B__) ${LOGIC.OR} (${LOGIC.NOT}__A__ ${LOGIC.AND} ${LOGIC.NOT}__B__)`,
        explanation: 'A biconditional is true when both sides match.',
    },
];

const shuffleArray = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const pick = (items) => items[Math.floor(Math.random() * items.length)];

const unique = (items) => [...new Set(items)];

const sample = (items, count) => shuffleArray(items).slice(0, count);

const isAtomic = (expr) => /^[A-ZTF]$/.test(expr);

const makeBindingExpr = () => {
    const roll = Math.random();
    if (roll < 0.45) return pick(ATOMS);
    if (roll < 0.75) return `${LOGIC.NOT}${pick(ATOMS)}`;

    const left = pick(ATOMS);
    const right = pick(ATOMS);
    const op = pick([LOGIC.AND, LOGIC.OR]);
    return `(${left} ${op} ${right})`;
};

const buildBindings = () => ({
    A: makeBindingExpr(),
    B: makeBindingExpr(),
    C: makeBindingExpr(),
});

const replacePlaceholders = (template, bindings) => template.replace(/__([ABC])__/g, (_, key) => bindings[key] || `__${key}__`);

const instantiateLawCard = (card) => {
    const bindings = buildBindings();
    return {
        ...card,
        source: replacePlaceholders(card.source, bindings),
        target: replacePlaceholders(card.target, bindings),
        bindings,
    };
};

const mutateExpression = (expr) => {
    if (expr.includes(LOGIC.AND)) return expr.replace(LOGIC.AND, LOGIC.OR);
    if (expr.includes(LOGIC.OR)) return expr.replace(LOGIC.OR, LOGIC.AND);
    if (expr.includes(LOGIC.IMP)) return expr.replace(LOGIC.IMP, LOGIC.IFF);
    if (expr.includes(LOGIC.IFF)) return expr.replace(LOGIC.IFF, LOGIC.IMP);
    if (expr.includes('T')) return expr.replace('T', 'F');
    if (expr.includes('F')) return expr.replace('F', 'T');
    if (isAtomic(expr)) return `${LOGIC.NOT}${expr}`;
    return expr.startsWith(LOGIC.NOT) ? expr.slice(1) : `${LOGIC.NOT}(${expr})`;
};

const buildAnswerOptions = (correct, pool = []) => {
    const options = unique([correct, ...pool].filter(Boolean));
    const extras = [
        mutateExpression(correct),
        `${LOGIC.NOT}(${correct})`,
        `${correct} ${LOGIC.OR} T`,
        `${correct} ${LOGIC.AND} F`,
    ];

    extras.forEach((item) => {
        if (options.length < 4 && !options.includes(item)) {
            options.push(item);
        }
    });

    while (options.length < 4) {
        const fallback = makeBindingExpr();
        if (!options.includes(fallback)) options.push(fallback);
    }

    return shuffleArray(options.slice(0, 4));
};

const buildLawNameOptions = (correctFamily) => {
    const pool = LAW_FAMILY_ORDER.filter((family) => family !== correctFamily);
    return shuffleArray([correctFamily, ...sample(pool, 3)]);
};

const makeEquivalenceChallenge = () => {
    const card = instantiateLawCard(pick(LAW_LIBRARY));
    const otherTargets = sample(LAW_LIBRARY.filter((item) => item.id !== card.id), 3).map((item) => replacePlaceholders(item.target, card.bindings));
    const options = buildAnswerOptions(card.target, [card.source, ...otherTargets]);

    return {
        id: card.id,
        family: card.family,
        source: card.source,
        target: card.target,
        explanation: card.explanation,
        options,
    };
};

const makeLawChallenge = () => {
    const card = instantiateLawCard(pick(LAW_LIBRARY));
    const options = buildLawNameOptions(card.family);

    return {
        id: card.id,
        family: card.family,
        source: card.source,
        target: card.target,
        explanation: card.explanation,
        options,
    };
};

const makeUnaryTruthChallenge = () => {
    const predicate = {};
    QUANTIFIER_DOMAIN.forEach((element) => {
        predicate[element] = Math.random() < 0.5;
    });

    const quantifier = pick(['∀', '∃']);
    const statement = `${quantifier}x P(x)`;
    const answer = quantifier === '∀'
        ? QUANTIFIER_DOMAIN.every((element) => predicate[element])
        : QUANTIFIER_DOMAIN.some((element) => predicate[element]);

    return {
        kind: 'truth',
        title: 'Truth Check',
        prompt: `Is ${statement} true in this domain?`,
        statement,
        answer: answer ? 'True' : 'False',
        options: ['True', 'False'],
        explanation: quantifier === '∀'
            ? 'A universal statement is true only if every element satisfies the predicate.'
            : 'An existential statement is true if at least one element satisfies the predicate.',
        domain: QUANTIFIER_DOMAIN,
        predicate,
    };
};

const makeEmptyDomainChallenge = () => {
    const quantifier = pick(['∀', '∃']);
    const statement = `${quantifier}x P(x)`;
    const answer = quantifier === '∀' ? 'True' : 'False';

    return {
        kind: 'empty',
        title: 'Empty Domain',
        prompt: `What is the truth value of ${statement} when the domain is empty?`,
        statement,
        answer,
        options: ['True', 'False'],
        explanation: 'Universal statements over an empty domain are true, while existential statements are false.',
        domain: [],
        predicate: {},
    };
};

const makeNegationChallenge = () => {
    const statement = pick([`¬∀x P(x)`, `¬∃x P(x)`]);
    const answer = statement === '¬∀x P(x)'
        ? '∃x ¬P(x)'
        : '∀x ¬P(x)';
    const options = buildAnswerOptions(answer, [
        '∀x ¬P(x)',
        '∃x ¬P(x)',
        '¬∀x ¬P(x)',
        '¬∃x ¬P(x)',
    ]);

    return {
        kind: 'negation',
        title: 'De Morgan for Quantifiers',
        prompt: `Choose the equivalent form of ${statement}.`,
        statement,
        answer,
        options,
        explanation: 'Negating a universal becomes existential, and negating an existential becomes universal.',
    };
};

const makeNestedQuantifierChallenge = () => {
    const matrix = QUANTIFIER_DOMAIN.map(() => QUANTIFIER_DOMAIN.map(() => Math.random() < 0.5));
    const statement = pick(['∀x ∃y R(x,y)', '∃y ∀x R(x,y)']);
    const answer = statement === '∀x ∃y R(x,y)'
        ? matrix.every((row) => row.some(Boolean))
        : QUANTIFIER_DOMAIN.some((_, columnIndex) => matrix.every((row) => row[columnIndex]));

    return {
        kind: 'nested',
        title: 'Nested Quantifiers',
        prompt: `Is ${statement} true for the relation shown?`,
        statement,
        answer: answer ? 'True' : 'False',
        options: ['True', 'False'],
        explanation: statement === '∀x ∃y R(x,y)'
            ? 'Every row needs at least one true cell.'
            : 'Some column must be true for every row.',
        matrix,
    };
};

const makeQuantifierChallenge = () => pick([
    makeUnaryTruthChallenge,
    makeEmptyDomainChallenge,
    makeNegationChallenge,
    makeNestedQuantifierChallenge,
])();

const makeSubset = (universe, minSize = 1, maxSize = universe.length - 1) => {
    const targetSize = Math.max(minSize, Math.min(maxSize, Math.floor(Math.random() * universe.length) + 1));
    const shuffled = shuffleArray(universe);
    const subset = shuffled.slice(0, targetSize);
    return subset.sort();
};

const SET_OPERATIONS = [
    {
        id: 'union',
        label: 'Union',
        symbol: SET_SYMBOLS.UNION,
        description: 'Element belongs if it is in A or B.',
        compute: (A, B) => unique([...A, ...B]).sort(),
        question: (A, B) => `Build A ${SET_SYMBOLS.UNION} B.`,
    },
    {
        id: 'intersection',
        label: 'Intersection',
        symbol: SET_SYMBOLS.INTERSECTION,
        description: 'Element belongs only if it is in both sets.',
        compute: (A, B) => A.filter((value) => B.includes(value)).sort(),
        question: (A, B) => `Build A ${SET_SYMBOLS.INTERSECTION} B.`,
    },
    {
        id: 'difference_ab',
        label: 'Difference',
        symbol: `${SET_SYMBOLS.DIFFERENCE} B`,
        description: 'Keep the elements that are in A but not in B.',
        compute: (A, B) => A.filter((value) => !B.includes(value)).sort(),
        question: (A, B) => `Build A ${SET_SYMBOLS.DIFFERENCE} B.`,
    },
    {
        id: 'difference_ba',
        label: 'Difference',
        symbol: `${SET_SYMBOLS.DIFFERENCE} A`,
        description: 'Keep the elements that are in B but not in A.',
        compute: (A, B) => B.filter((value) => !A.includes(value)).sort(),
        question: (A, B) => `Build B ${SET_SYMBOLS.DIFFERENCE} A.`,
    },
    {
        id: 'symmetric',
        label: 'Symmetric diff',
        symbol: SET_SYMBOLS.SYMDIFF,
        description: 'Keep the elements that are in exactly one set.',
        compute: (A, B) => unique([
            ...A.filter((value) => !B.includes(value)),
            ...B.filter((value) => !A.includes(value)),
        ]).sort(),
        question: (A, B) => `Build A ${SET_SYMBOLS.SYMDIFF} B.`,
    },
    {
        id: 'complement_a',
        label: 'Complement',
        symbol: "A'",
        description: 'Keep the elements of the universe that are not in A.',
        compute: (A, _B, universe) => universe.filter((value) => !A.includes(value)).sort(),
        question: (A) => `Build the complement of A.`,
    },
    {
        id: 'complement_b',
        label: 'Complement',
        symbol: "B'",
        description: 'Keep the elements of the universe that are not in B.',
        compute: (_A, B, universe) => universe.filter((value) => !B.includes(value)).sort(),
        question: (A, B) => `Build the complement of B.`,
    },
];

const makeSetChallenge = () => {
    const universe = sample(SET_UNIVERSE_POOL, 5).sort();
    const A = makeSubset(universe, 1, 4);
    const B = makeSubset(universe, 1, 4);

    let operation = pick(SET_OPERATIONS);
    let answer = operation.compute(A, B, universe);

    let attempts = 0;
    while ((attempts < 8) && (answer.length === 0 || JSON.stringify(answer) === JSON.stringify(A) || JSON.stringify(answer) === JSON.stringify(B))) {
        operation = pick(SET_OPERATIONS);
        answer = operation.compute(A, B, universe);
        attempts += 1;
    }

    return {
        universe,
        A,
        B,
        operation,
        answer,
        prompt: operation.question(A, B, universe),
        explanation: operation.description,
    };
};

const formatSet = (items) => (items.length ? `{ ${items.join(', ')} }` : SET_SYMBOLS.EMPTY);

const StatPill = ({ label, value }) => (
    <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]">
        <span className="opacity-80">{label}</span>
        <span className="ml-2 text-white">{value}</span>
    </div>
);

const TopicButton = ({ topic, active, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`rounded-2xl border px-4 py-3 text-left transition shadow-sm ${
            active
                ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
        }`}
    >
        <div className="text-sm font-black">{topic.label}</div>
        <div className={`mt-1 text-xs ${active ? 'text-slate-200' : 'text-slate-500'}`}>
            {topic.description}
        </div>
    </button>
);

const GameShell = ({ topic, title, description, stats, action, children }) => (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className={`bg-gradient-to-r ${topic.accent} px-6 py-5 text-white`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.35em] text-white/80">{title}</p>
                    <p className="mt-2 max-w-3xl text-sm text-white/95">{description}</p>
                </div>
                {action}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                {stats.map((stat) => (
                    <StatPill key={stat.label} label={stat.label} value={stat.value} />
                ))}
            </div>
        </div>
        <div className="p-6">{children}</div>
    </section>
);

const ChoiceGrid = ({ options, onPick, disabled, selected }) => (
    <div className="grid gap-3 md:grid-cols-2">
        {options.map((option) => (
            <button
                key={option}
                type="button"
                onClick={() => onPick(option)}
                disabled={disabled}
                className={`rounded-2xl border-2 px-4 py-3 text-left font-mono text-sm transition ${
                    selected === option
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
            >
                {option}
            </button>
        ))}
    </div>
);

const EquivalenceGame = ({ visible }) => {
    const [challenge, setChallenge] = useState(() => makeEquivalenceChallenge());
    const [feedback, setFeedback] = useState('');
    const [selected, setSelected] = useState('');
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [solved, setSolved] = useState(false);

    const newChallenge = () => {
        setChallenge(makeEquivalenceChallenge());
        setFeedback('');
        setSelected('');
        setSolved(false);
    };

    const submit = (choice) => {
        if (solved) return;
        setSelected(choice);

        if (choice === challenge.target) {
            setSolved(true);
            setScore((current) => current + 1);
            setStreak((current) => current + 1);
            setFeedback(`Correct. ${challenge.family} gives ${challenge.target}. ${challenge.explanation}`);
            return;
        }

        setStreak(0);
        setFeedback('Not yet. Try a different equivalent result.');
    };

    return (
        <div className={visible ? 'block' : 'hidden'}>
            <GameShell
                topic={TOPICS[0]}
                title="Quick Equivalence Run"
                description="Pick the expression that is equivalent to the one on screen. This keeps the simplification drill short, repeatable, and fast."
                stats={[
                    { label: 'Score', value: score },
                    { label: 'Streak', value: streak },
                    { label: 'Type', value: 'Pick the result' },
                ]}
                action={(
                    <button
                        type="button"
                        onClick={newChallenge}
                        className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/25"
                    >
                        <RefreshCw className="h-4 w-4" />
                        New puzzle
                    </button>
                )}
            >
                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Expression</div>
                            <div className="mt-3 rounded-2xl bg-white px-4 py-5 font-mono text-lg font-black text-slate-900 shadow-sm">
                                {challenge.source}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">Goal: simplify</span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Law family: {challenge.family}</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-black text-slate-900">Why this is good practice</div>
                            <p className="mt-2 text-sm text-slate-600">
                                The same small laws appear again and again. This drill keeps them moving fast so students memorize the shape and the result.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">Choose the equivalent result</div>
                        <ChoiceGrid
                            options={challenge.options}
                            onPick={submit}
                            disabled={false}
                            selected={selected}
                        />

                        <div className={`rounded-2xl border p-4 text-sm font-medium ${
                            solved
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : feedback
                                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                                    : 'border-slate-200 bg-slate-50 text-slate-500'
                        }`}>
                            {feedback || 'Pick an answer to start the drill.'}
                        </div>

                        {solved && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Answer</div>
                                <div className="mt-2 font-mono text-sm text-slate-900">{challenge.source}  =  {challenge.target}</div>
                            </div>
                        )}
                    </div>
                </div>
            </GameShell>
        </div>
    );
};

const LawGame = ({ visible }) => {
    const [challenge, setChallenge] = useState(() => makeLawChallenge());
    const [feedback, setFeedback] = useState('');
    const [selected, setSelected] = useState('');
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [solved, setSolved] = useState(false);

    const newChallenge = () => {
        setChallenge(makeLawChallenge());
        setFeedback('');
        setSelected('');
        setSolved(false);
    };

    const submit = (choice) => {
        if (solved) return;
        setSelected(choice);

        if (choice === challenge.family) {
            setSolved(true);
            setScore((current) => current + 1);
            setStreak((current) => current + 1);
            setFeedback(`Yes. This is the law of ${challenge.family}. ${challenge.explanation}`);
            return;
        }

        setStreak(0);
        setFeedback('Not quite. Keep the law names moving until they stick.');
    };

    return (
        <div className={visible ? 'block' : 'hidden'}>
            <GameShell
                topic={TOPICS[1]}
                title="Law Memory Sprint"
                description="See a law pattern and identify the law family. The repetition helps students memorize the whole list without getting bored."
                stats={[
                    { label: 'Score', value: score },
                    { label: 'Streak', value: streak },
                    { label: 'Focus', value: 'Law name' },
                ]}
                action={(
                    <button
                        type="button"
                        onClick={newChallenge}
                        className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/25"
                    >
                        <RefreshCw className="h-4 w-4" />
                        New card
                    </button>
                )}
            >
                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Law card</div>
                            <div className="mt-3 rounded-2xl bg-white px-4 py-5 font-mono text-lg font-black text-slate-900 shadow-sm">
                                {challenge.source}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">Target: {challenge.target}</span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Family: {challenge.family}</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-black text-slate-900">Teacher tip</div>
                            <p className="mt-2 text-sm text-slate-600">
                                Read the pattern out loud. Students remember laws better when they say the form and the name together.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">Which law is it?</div>
                        <ChoiceGrid
                            options={challenge.options}
                            onPick={submit}
                            disabled={false}
                            selected={selected}
                        />

                        <div className={`rounded-2xl border p-4 text-sm font-medium ${
                            solved
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : feedback
                                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                                    : 'border-slate-200 bg-slate-50 text-slate-500'
                        }`}>
                            {feedback || 'Pick the law family that matches the formula.'}
                        </div>
                    </div>
                </div>
            </GameShell>
        </div>
    );
};

const QuantifierVisual = ({ challenge }) => {
    if (challenge.kind === 'negation') {
        return (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Rule card</div>
                <div className="mt-3 rounded-2xl bg-white px-4 py-5 font-mono text-lg font-black text-slate-900 shadow-sm">
                    {challenge.statement}
                </div>
                <div className="mt-3 rounded-2xl bg-violet-50 p-4 text-sm text-violet-800">
                    De Morgan for quantifiers swaps universal and existential statements.
                </div>
            </div>
        );
    }

    if (challenge.kind === 'empty') {
        return (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Empty universe</div>
                <div className="mt-3 rounded-2xl bg-white px-4 py-5 font-mono text-lg font-black text-slate-900 shadow-sm">
                    U = {SET_SYMBOLS.EMPTY}
                </div>
                <div className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                    Universal statements are true here, existential statements are false.
                </div>
            </div>
        );
    }

    if (challenge.kind === 'nested') {
        return (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Relation matrix</div>
                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-center text-sm">
                        <thead className="bg-slate-800 text-white">
                            <tr>
                                <th className="px-3 py-2">R(x,y)</th>
                                {QUANTIFIER_DOMAIN.map((column) => (
                                    <th key={column} className="px-3 py-2 uppercase">{column}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {challenge.matrix.map((row, rowIndex) => (
                                <tr key={QUANTIFIER_DOMAIN[rowIndex]} className="border-t border-slate-200">
                                    <th className="bg-slate-50 px-3 py-2 uppercase text-slate-600">
                                        {QUANTIFIER_DOMAIN[rowIndex]}
                                    </th>
                                    {row.map((cell, cellIndex) => (
                                        <td key={`${rowIndex}-${cellIndex}`} className={`px-3 py-2 font-black ${cell ? 'text-emerald-700' : 'text-rose-500'}`}>
                                            {cell ? '1' : '0'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Domain view</div>
            <div className="mt-3 flex flex-wrap gap-2">
                {challenge.domain.map((element) => (
                    <div
                        key={element}
                        className={`rounded-full border px-3 py-2 text-sm font-bold ${
                            challenge.predicate[element]
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                : 'border-slate-200 bg-white text-slate-500'
                        }`}
                    >
                        {element}: {challenge.predicate[element] ? 'P' : 'not P'}
                    </div>
                ))}
            </div>
        </div>
    );
};

const QuantifierGame = ({ visible }) => {
    const [challenge, setChallenge] = useState(() => makeQuantifierChallenge());
    const [feedback, setFeedback] = useState('');
    const [selected, setSelected] = useState('');
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [solved, setSolved] = useState(false);

    const newChallenge = () => {
        setChallenge(makeQuantifierChallenge());
        setFeedback('');
        setSelected('');
        setSolved(false);
    };

    const submit = (choice) => {
        if (solved) return;
        setSelected(choice);

        if (choice === challenge.answer) {
            setSolved(true);
            setScore((current) => current + 1);
            setStreak((current) => current + 1);
            setFeedback(`Correct. ${challenge.explanation}`);
            return;
        }

        setStreak(0);
        setFeedback('Not yet. Read the domain again and try the statement one more time.');
    };

    return (
        <div className={visible ? 'block' : 'hidden'}>
            <GameShell
                topic={TOPICS[2]}
                title="Quantifier Lab"
                description="Practice universal and existential statements with quick, repeated questions. The goal is to make the symbols feel natural."
                stats={[
                    { label: 'Score', value: score },
                    { label: 'Streak', value: streak },
                    { label: 'Mode', value: challenge.kind },
                ]}
                action={(
                    <button
                        type="button"
                        onClick={newChallenge}
                        className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/25"
                    >
                        <RefreshCw className="h-4 w-4" />
                        New round
                    </button>
                )}
            >
                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-4">
                        <QuantifierVisual challenge={challenge} />
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-black text-slate-900">Prompt</div>
                            <p className="mt-2 text-sm text-slate-600">{challenge.prompt}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">Answer</div>
                        <ChoiceGrid
                            options={challenge.options}
                            onPick={submit}
                            disabled={false}
                            selected={selected}
                        />

                        <div className={`rounded-2xl border p-4 text-sm font-medium ${
                            solved
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : feedback
                                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                                    : 'border-slate-200 bg-slate-50 text-slate-500'
                        }`}>
                            {feedback || 'Choose the truth value or the equivalent formula.'}
                        </div>
                    </div>
                </div>
            </GameShell>
        </div>
    );
};

const SetToggleChip = ({ value, active, onToggle }) => (
    <button
        type="button"
        onClick={() => onToggle(value)}
        className={`rounded-full border px-3 py-2 text-sm font-bold transition ${
            active
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
        }`}
    >
        {value}
    </button>
);

const SetGame = ({ visible }) => {
    const [challenge, setChallenge] = useState(() => makeSetChallenge());
    const [selected, setSelected] = useState([]);
    const [feedback, setFeedback] = useState('');
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [solved, setSolved] = useState(false);

    const toggle = (value) => {
        if (solved) return;
        setSelected((current) => (
            current.includes(value)
                ? current.filter((item) => item !== value)
                : [...current, value].sort()
        ));
    };

    const newChallenge = () => {
        setChallenge(makeSetChallenge());
        setSelected([]);
        setFeedback('');
        setSolved(false);
    };

    const checkAnswer = () => {
        const sortedSelected = [...selected].sort();
        const sortedAnswer = [...challenge.answer].sort();
        const correct = JSON.stringify(sortedSelected) === JSON.stringify(sortedAnswer);

        if (correct) {
            setSolved(true);
            setScore((current) => current + 1);
            setStreak((current) => current + 1);
            setFeedback(`Correct. ${challenge.explanation}`);
            return;
        }

        setStreak(0);
        setFeedback('Not yet. Compare the operation with the membership of each element.');
    };

    return (
        <div className={visible ? 'block' : 'hidden'}>
            <GameShell
                topic={TOPICS[3]}
                title="Set Builder"
                description="Choose the elements that belong to the target set. This is a very visual way to learn unions, intersections, differences, complements, and symmetric difference."
                stats={[
                    { label: 'Score', value: score },
                    { label: 'Streak', value: streak },
                    { label: 'Universe', value: challenge.universe.length },
                ]}
                action={(
                    <button
                        type="button"
                        onClick={newChallenge}
                        className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/25"
                    >
                        <RefreshCw className="h-4 w-4" />
                        New set
                    </button>
                )}
            >
                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Source sets</div>
                            <div className="mt-3 space-y-3">
                                <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3">
                                    <div className="text-sm font-black text-sky-800">A = {formatSet(challenge.A)}</div>
                                </div>
                                <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-3">
                                    <div className="text-sm font-black text-fuchsia-800">B = {formatSet(challenge.B)}</div>
                                </div>
                            </div>
                            <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                                <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Operation</div>
                                <div className="mt-2 text-lg font-black text-slate-900">
                                    {challenge.prompt}
                                </div>
                                <div className="mt-2 text-sm text-slate-500">
                                    {challenge.operation.description}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-black text-slate-900">Build the answer set</div>
                            <p className="mt-1 text-sm text-slate-500">
                                Click the elements that should belong to the result. Then press check.
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {challenge.universe.map((value) => (
                                    <SetToggleChip
                                        key={value}
                                        value={value}
                                        active={selected.includes(value)}
                                        onToggle={toggle}
                                    />
                                ))}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={checkAnswer}
                                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Check answer
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelected([])}
                                    className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                                >
                                    <Edit3 className="h-4 w-4" />
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div className={`rounded-2xl border p-4 text-sm font-medium ${
                            solved
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : feedback
                                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                                    : 'border-slate-200 bg-slate-50 text-slate-500'
                        }`}>
                            {feedback || 'Select the result elements and check your set.'}
                        </div>

                        {solved && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Answer</div>
                                <div className="mt-2 font-mono text-sm text-slate-900">{formatSet(challenge.answer)}</div>
                            </div>
                        )}
                    </div>
                </div>
            </GameShell>
        </div>
    );
};

export default function StudyGuide2Section() {
    const [activeTopic, setActiveTopic] = useState('equivalences');

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl">
                <div className="relative px-6 py-6 sm:px-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.35),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.22),transparent_30%)]" />
                    <div className="relative flex flex-wrap items-start justify-between gap-6">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-white/80">
                                <BookOpen className="h-4 w-4" />
                                Guia de Estudio 2
                            </div>
                            <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                                Equivalencias, leyes, cuantificadores y conjuntos
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                                I read the guide and turned the three topics into four small games. The drills stay simple and repetitive on purpose so the laws, quantifiers, and set ideas start to feel automatic.
                            </p>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            <StatPill label="Games" value="4" />
                            <StatPill label="Goal" value="Practice" />
                            <StatPill label="Style" value="Repetitive" />
                            <StatPill label="Focus" value="Memorize" />
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {TOPICS.map((topic) => (
                    <TopicButton
                        key={topic.id}
                        topic={topic}
                        active={activeTopic === topic.id}
                        onClick={() => setActiveTopic(topic.id)}
                    />
                ))}
            </div>

            <div className="space-y-8">
                <EquivalenceGame visible={activeTopic === 'equivalences'} />
                <LawGame visible={activeTopic === 'laws'} />
                <QuantifierGame visible={activeTopic === 'quantifiers'} />
                <SetGame visible={activeTopic === 'sets'} />
            </div>
        </div>
    );
}

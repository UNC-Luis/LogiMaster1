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
        description: 'Simplifica expresiones eligiendo el resultado equivalente.',
        accent: 'from-sky-600 via-cyan-500 to-teal-500',
    },
    {
        id: 'laws',
        label: 'Leyes',
        description: 'Decide si cada igualdad es verdadera o falsa y memoriza las leyes.',
        accent: 'from-violet-600 via-fuchsia-500 to-pink-500',
    },
    {
        id: 'quantifiers',
        label: 'Cuantificadores',
        description: 'Practica enunciados universales y existenciales con tablas.',
        accent: 'from-amber-500 via-orange-500 to-rose-500',
    },
    {
        id: 'sets',
        label: 'Conjuntos',
        description: 'Construye resultados de conjuntos activando los elementos del universo.',
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
        explanation: 'T es el elemento neutro de la conjunción.',
    },
    {
        id: 'identity_or',
        family: 'Identidad',
        source: `__A__ ${LOGIC.OR} F`,
        target: '__A__',
        explanation: 'F es el elemento neutro de la disyunción.',
    },
    {
        id: 'domination_or',
        family: 'Dominación',
        source: `__A__ ${LOGIC.OR} T`,
        target: 'T',
        explanation: 'T domina la disyunción.',
    },
    {
        id: 'domination_and',
        family: 'Dominación',
        source: `__A__ ${LOGIC.AND} F`,
        target: 'F',
        explanation: 'F domina la conjunción.',
    },
    {
        id: 'idempotence_and',
        family: 'Idempotencia',
        source: `__A__ ${LOGIC.AND} __A__`,
        target: '__A__',
        explanation: 'Repetir la misma proposición no cambia el resultado.',
    },
    {
        id: 'idempotence_or',
        family: 'Idempotencia',
        source: `__A__ ${LOGIC.OR} __A__`,
        target: '__A__',
        explanation: 'Repetir la misma proposición no cambia el resultado.',
    },
    {
        id: 'double_negation',
        family: 'Doble negación',
        source: `${LOGIC.NOT}${LOGIC.NOT}__A__`,
        target: '__A__',
        explanation: 'Dos negaciones se cancelan.',
    },
    {
        id: 'neg_true',
        family: 'Constantes',
        source: `${LOGIC.NOT}T`,
        target: 'F',
        explanation: 'La negación de verdadero es falso.',
    },
    {
        id: 'neg_false',
        family: 'Constantes',
        source: `${LOGIC.NOT}F`,
        target: 'T',
        explanation: 'La negación de falso es verdadero.',
    },
    {
        id: 'excluded_middle',
        family: 'Tercero excluido',
        source: `__A__ ${LOGIC.OR} ${LOGIC.NOT}__A__`,
        target: 'T',
        explanation: 'Una proposición o su negación siempre es verdadera.',
    },
    {
        id: 'contradiction',
        family: 'Contradicción',
        source: `__A__ ${LOGIC.AND} ${LOGIC.NOT}__A__`,
        target: 'F',
        explanation: 'Una proposición y su negación no pueden ser verdaderas a la vez.',
    },
    {
        id: 'commutative_and',
        family: 'Conmutativa',
        source: `__A__ ${LOGIC.AND} __B__`,
        target: `__B__ ${LOGIC.AND} __A__`,
        explanation: 'El orden de AND no importa.',
    },
    {
        id: 'commutative_or',
        family: 'Conmutativa',
        source: `__A__ ${LOGIC.OR} __B__`,
        target: `__B__ ${LOGIC.OR} __A__`,
        explanation: 'El orden de OR no importa.',
    },
    {
        id: 'associative_and',
        family: 'Asociativa',
        source: `(__A__ ${LOGIC.AND} __B__) ${LOGIC.AND} __C__`,
        target: `__A__ ${LOGIC.AND} (__B__ ${LOGIC.AND} __C__)`,
        explanation: 'El agrupamiento no importa cuando el operador es el mismo.',
    },
    {
        id: 'associative_or',
        family: 'Asociativa',
        source: `(__A__ ${LOGIC.OR} __B__) ${LOGIC.OR} __C__`,
        target: `__A__ ${LOGIC.OR} (__B__ ${LOGIC.OR} __C__)`,
        explanation: 'El agrupamiento no importa cuando el operador es el mismo.',
    },
    {
        id: 'distributive_and',
        family: 'Distributiva',
        source: `__A__ ${LOGIC.AND} (__B__ ${LOGIC.OR} __C__)`,
        target: `(__A__ ${LOGIC.AND} __B__) ${LOGIC.OR} (__A__ ${LOGIC.AND} __C__)`,
        explanation: 'AND distribuye sobre OR.',
    },
    {
        id: 'distributive_or',
        family: 'Distributiva',
        source: `__A__ ${LOGIC.OR} (__B__ ${LOGIC.AND} __C__)`,
        target: `(__A__ ${LOGIC.OR} __B__) ${LOGIC.AND} (__A__ ${LOGIC.OR} __C__)`,
        explanation: 'OR distribuye sobre AND.',
    },
    {
        id: 'de_morgan_and',
        family: 'De Morgan',
        source: `${LOGIC.NOT}(__A__ ${LOGIC.AND} __B__)`,
        target: `${LOGIC.NOT}__A__ ${LOGIC.OR} ${LOGIC.NOT}__B__`,
        explanation: 'Negar AND lo convierte en OR y niega cada lado.',
    },
    {
        id: 'de_morgan_or',
        family: 'De Morgan',
        source: `${LOGIC.NOT}(__A__ ${LOGIC.OR} __B__)`,
        target: `${LOGIC.NOT}__A__ ${LOGIC.AND} ${LOGIC.NOT}__B__`,
        explanation: 'Negar OR lo convierte en AND y niega cada lado.',
    },
    {
        id: 'absorption_or',
        family: 'Absorción',
        source: `__A__ ${LOGIC.OR} (__A__ ${LOGIC.AND} __B__)`,
        target: '__A__',
        explanation: 'A absorbe A AND B en forma OR.',
    },
    {
        id: 'absorption_and',
        family: 'Absorción',
        source: `__A__ ${LOGIC.AND} (__A__ ${LOGIC.OR} __B__)`,
        target: '__A__',
        explanation: 'A absorbe A OR B en forma AND.',
    },
    {
        id: 'implication',
        family: 'Implicación',
        source: `__A__ ${LOGIC.IMP} __B__`,
        target: `${LOGIC.NOT}__A__ ${LOGIC.OR} __B__`,
        explanation: 'La implicación es equivalente a NOT A OR B.',
    },
    {
        id: 'biconditional',
        family: 'Bicondicional',
        source: `__A__ ${LOGIC.IFF} __B__`,
        target: `(__A__ ${LOGIC.AND} __B__) ${LOGIC.OR} (${LOGIC.NOT}__A__ ${LOGIC.AND} ${LOGIC.NOT}__B__)`,
        explanation: 'Una bicondicional es verdadera cuando ambos lados coinciden.',
    },
];

const LAW_TRUE_FALSE_LIBRARY = [
    {
        left: `T ${LOGIC.AND} T`,
        right: 'T',
        answer: 'Verdadero',
        law: 'Identidad',
        explanation: 'T ∧ T sigue siendo verdadero.',
    },
    {
        left: `T ${LOGIC.OR} F`,
        right: 'T',
        answer: 'Verdadero',
        law: 'Dominación',
        explanation: 'Con T en una disyunción, el resultado queda verdadero.',
    },
    {
        left: `F ${LOGIC.AND} F`,
        right: 'F',
        answer: 'Verdadero',
        law: 'Idempotencia',
        explanation: 'F ∧ F sigue siendo falso.',
    },
    {
        left: `F ${LOGIC.OR} F`,
        right: 'F',
        answer: 'Verdadero',
        law: 'Idempotencia',
        explanation: 'F ∨ F sigue siendo falso.',
    },
    {
        left: `P ${LOGIC.AND} T`,
        right: 'P',
        answer: 'Verdadero',
        law: 'Identidad',
        explanation: 'P ∧ T deja a P igual.',
    },
    {
        left: `P ${LOGIC.OR} F`,
        right: 'P',
        answer: 'Verdadero',
        law: 'Identidad',
        explanation: 'P ∨ F deja a P igual.',
    },
    {
        left: `P ${LOGIC.AND} F`,
        right: 'F',
        answer: 'Verdadero',
        law: 'Dominación',
        explanation: 'P ∧ F siempre da falso.',
    },
    {
        left: `P ${LOGIC.OR} T`,
        right: 'T',
        answer: 'Verdadero',
        law: 'Dominación',
        explanation: 'P ∨ T siempre da verdadero.',
    },
    {
        left: `P ${LOGIC.AND} ${LOGIC.NOT}P`,
        right: 'F',
        answer: 'Verdadero',
        law: 'Contradicción',
        explanation: 'P y no P no pueden ser verdaderos al mismo tiempo.',
    },
    {
        left: `P ${LOGIC.OR} ${LOGIC.NOT}P`,
        right: 'T',
        answer: 'Verdadero',
        law: 'Tercero excluido',
        explanation: 'P o no P siempre es verdadero.',
    },
    {
        left: `P ${LOGIC.AND} F`,
        right: 'P',
        correctRight: 'F',
        answer: 'Falso',
        law: 'Dominación',
        explanation: 'P ∧ F no puede quedarse como P; el resultado correcto es F.',
    },
    {
        left: `P ${LOGIC.OR} T`,
        right: 'P',
        correctRight: 'T',
        answer: 'Falso',
        law: 'Dominación',
        explanation: 'P ∨ T no puede quedarse como P; el resultado correcto es T.',
    },
    {
        left: `P ${LOGIC.AND} T`,
        right: 'T',
        correctRight: 'P',
        answer: 'Falso',
        law: 'Identidad',
        explanation: 'P ∧ T no se convierte en T; se queda en P.',
    },
    {
        left: `P ${LOGIC.OR} F`,
        right: 'F',
        correctRight: 'P',
        answer: 'Falso',
        law: 'Identidad',
        explanation: 'P ∨ F no se convierte en F; se queda en P.',
    },
    {
        left: `__A__ ${LOGIC.AND} T`,
        right: '__A__',
        answer: 'Verdadero',
        law: 'Identidad',
        explanation: 'T es el elemento neutro de la conjunción.',
    },
    {
        left: `__A__ ${LOGIC.OR} F`,
        right: '__A__',
        answer: 'Verdadero',
        law: 'Identidad',
        explanation: 'F es el elemento neutro de la disyunción.',
    },
    {
        left: `__A__ ${LOGIC.AND} F`,
        right: 'F',
        answer: 'Verdadero',
        law: 'Dominación',
        explanation: 'F domina la conjunción.',
    },
    {
        left: `__A__ ${LOGIC.OR} T`,
        right: 'T',
        answer: 'Verdadero',
        law: 'Dominación',
        explanation: 'T domina la disyunción.',
    },
    {
        left: `__A__ ${LOGIC.AND} F`,
        right: '__A__',
        correctRight: 'F',
        answer: 'Falso',
        law: 'Dominación',
        explanation: 'Con F al lado, la conjunción vale F, no la proposición sola.',
    },
    {
        left: `__A__ ${LOGIC.OR} T`,
        right: '__A__',
        correctRight: 'T',
        answer: 'Falso',
        law: 'Dominación',
        explanation: 'Con T al lado, la disyunción vale T, no la proposición sola.',
    },
    {
        left: `${LOGIC.NOT}${LOGIC.NOT}__A__`,
        right: '__A__',
        answer: 'Verdadero',
        law: 'Doble negación',
        explanation: 'Dos negaciones se cancelan.',
    },
    {
        left: `${LOGIC.NOT}T`,
        right: 'F',
        answer: 'Verdadero',
        law: 'Constantes',
        explanation: 'La negación de verdadero es falso.',
    },
    {
        left: `${LOGIC.NOT}F`,
        right: 'T',
        answer: 'Verdadero',
        law: 'Constantes',
        explanation: 'La negación de falso es verdadero.',
    },
    {
        left: `__A__ ${LOGIC.OR} ${LOGIC.NOT}__A__`,
        right: 'T',
        answer: 'Verdadero',
        law: 'Tercero excluido',
        explanation: 'Una proposición o su negación siempre es verdadera.',
    },
    {
        left: `__A__ ${LOGIC.AND} ${LOGIC.NOT}__A__`,
        right: 'F',
        answer: 'Verdadero',
        law: 'Contradicción',
        explanation: 'Una proposición y su negación no pueden ser verdaderas a la vez.',
    },
    {
        left: `__A__ ${LOGIC.AND} ${LOGIC.NOT}__A__`,
        right: 'T',
        correctRight: 'F',
        answer: 'Falso',
        law: 'Contradicción',
        explanation: 'La conjunción con una negación opuesta da falso.',
    },
    {
        left: `__A__ ${LOGIC.AND} __B__`,
        right: `__B__ ${LOGIC.AND} __A__`,
        answer: 'Verdadero',
        law: 'Conmutativa',
        explanation: 'El orden de AND no importa.',
    },
    {
        left: `(__A__ ${LOGIC.AND} __B__) ${LOGIC.AND} __C__`,
        right: `__A__ ${LOGIC.AND} (__B__ ${LOGIC.AND} __C__)`,
        answer: 'Verdadero',
        law: 'Asociativa',
        explanation: 'El agrupamiento no importa cuando el operador es el mismo.',
    },
    {
        left: `__A__ ${LOGIC.AND} (__B__ ${LOGIC.OR} __C__)`,
        right: `(__A__ ${LOGIC.AND} __B__) ${LOGIC.OR} (__A__ ${LOGIC.AND} __C__)`,
        answer: 'Verdadero',
        law: 'Distributiva',
        explanation: 'AND distribuye sobre OR.',
    },
    {
        left: `__A__ ${LOGIC.OR} (__A__ ${LOGIC.AND} __B__)`,
        right: '__A__',
        answer: 'Verdadero',
        law: 'Absorción',
        explanation: 'A absorbe A AND B en forma OR.',
    },
    {
        left: `__A__ ${LOGIC.AND} (__A__ ${LOGIC.OR} __B__)`,
        right: '__A__',
        answer: 'Verdadero',
        law: 'Absorción',
        explanation: 'A absorbe A OR B en forma AND.',
    },
    {
        left: `${LOGIC.NOT}(__A__ ${LOGIC.AND} __B__)`,
        right: `${LOGIC.NOT}__A__ ${LOGIC.OR} ${LOGIC.NOT}__B__`,
        answer: 'Verdadero',
        law: 'De Morgan',
        explanation: 'Negar AND lo convierte en OR y niega cada lado.',
    },
    {
        left: `${LOGIC.NOT}(__A__ ${LOGIC.OR} __B__)`,
        right: `${LOGIC.NOT}__A__ ${LOGIC.AND} ${LOGIC.NOT}__B__`,
        answer: 'Verdadero',
        law: 'De Morgan',
        explanation: 'Negar OR lo convierte en AND y niega cada lado.',
    },
    {
        left: `__A__ ${LOGIC.IMP} __B__`,
        right: `${LOGIC.NOT}__A__ ${LOGIC.OR} __B__`,
        answer: 'Verdadero',
        law: 'Implicación',
        explanation: 'La implicación es equivalente a NOT A OR B.',
    },
    {
        left: `__A__ ${LOGIC.IMP} __B__`,
        right: `${LOGIC.NOT}__A__ ${LOGIC.AND} __B__`,
        correctRight: `${LOGIC.NOT}__A__ ${LOGIC.OR} __B__`,
        answer: 'Falso',
        law: 'Implicación',
        explanation: 'La implicación no usa AND; usa OR con la negación del antecedente.',
    },
    {
        left: `__A__ ${LOGIC.IFF} __B__`,
        right: `(__A__ ${LOGIC.AND} __B__) ${LOGIC.OR} (${LOGIC.NOT}__A__ ${LOGIC.AND} ${LOGIC.NOT}__B__)`,
        answer: 'Verdadero',
        law: 'Bicondicional',
        explanation: 'Una bicondicional es verdadera cuando ambos lados coinciden.',
    },
    {
        left: `__A__ ${LOGIC.IFF} __B__`,
        right: `__A__ ${LOGIC.AND} __B__`,
        correctRight: `(__A__ ${LOGIC.AND} __B__) ${LOGIC.OR} (${LOGIC.NOT}__A__ ${LOGIC.AND} ${LOGIC.NOT}__B__)`,
        answer: 'Falso',
        law: 'Bicondicional',
        explanation: 'La bicondicional no es solo AND; también incluye el caso en que ambos son falsos.',
    },
];

const LAW_TRUE_FALSE_BEGINNER_LIBRARY = LAW_TRUE_FALSE_LIBRARY.slice(0, 14);

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
    const pool = Math.random() < 0.8 ? LAW_TRUE_FALSE_BEGINNER_LIBRARY : LAW_TRUE_FALSE_LIBRARY;
    const card = pick(pool);
    const bindings = buildBindings();
    const left = replacePlaceholders(card.left, bindings);
    const right = replacePlaceholders(card.right, bindings);
    const correctRight = card.correctRight
        ? replacePlaceholders(card.correctRight, bindings)
        : right;
    const statement = `${left} = ${right}`;
    const correctStatement = card.answer === 'Verdadero'
        ? statement
        : `${left} = ${correctRight}`;

    return {
        id: card.id || statement,
        statement,
        correctStatement,
        law: card.law,
        answer: card.answer,
        options: ['Verdadero', 'Falso'],
        explanation: card.explanation,
        bindings,
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
        title: 'Comprobación de verdad',
        prompt: `¿Es ${statement} verdadera en este dominio?`,
        statement,
        answer: answer ? 'Verdadero' : 'Falso',
        options: ['Verdadero', 'Falso'],
        explanation: quantifier === '∀'
            ? 'Un enunciado universal es verdadero solo si cada elemento satisface el predicado.'
            : 'Un enunciado existencial es verdadero si al menos un elemento satisface el predicado.',
        domain: QUANTIFIER_DOMAIN,
        predicate,
    };
};

const makeEmptyDomainChallenge = () => {
    const quantifier = pick(['∀', '∃']);
    const statement = `${quantifier}x P(x)`;
    const answer = quantifier === '∀' ? 'Verdadero' : 'Falso';

    return {
        kind: 'empty',
        title: 'Dominio vacío',
        prompt: `¿Cuál es el valor de verdad de ${statement} cuando el dominio está vacío?`,
        statement,
        answer,
        options: ['Verdadero', 'Falso'],
        explanation: 'Las universales sobre un dominio vacío son verdaderas; las existenciales son falsas.',
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
        title: 'De Morgan para cuantificadores',
        prompt: `Elige la forma equivalente de ${statement}.`,
        statement,
        answer,
        options,
        explanation: 'Negar una universal la convierte en existencial, y negar una existencial la convierte en universal.',
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
        title: 'Cuantificadores anidados',
        prompt: `¿Es ${statement} verdadera para la relación mostrada?`,
        statement,
        answer: answer ? 'Verdadero' : 'Falso',
        options: ['Verdadero', 'Falso'],
        explanation: statement === '∀x ∃y R(x,y)'
            ? 'Cada fila necesita al menos una celda verdadera.'
            : 'Alguna columna debe ser verdadera para cada fila.',
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
        description: 'El elemento pertenece solo si está en ambos conjuntos.',
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
        description: 'Conserva los elementos que están en exactamente un conjunto.',
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
    <section className="glass-panel overflow-hidden">
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
                title="Reto rápido de equivalencias"
                description="Elige la expresión equivalente a la que aparece en pantalla. Este ejercicio mantiene la simplificación corta, repetible y ágil."
                stats={[
                    { label: 'Puntaje', value: score },
                    { label: 'Racha', value: streak },
                    { label: 'Tipo', value: 'Elige el resultado' },
                ]}
                action={(
                    <button
                        type="button"
                        onClick={newChallenge}
                        className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/25"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Nuevo reto
                    </button>
                )}
            >
                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Expresión</div>
                            <div className="mt-3 rounded-2xl bg-white px-4 py-5 font-mono text-lg font-black text-slate-900 shadow-sm">
                                {challenge.source}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">Meta: simplificar</span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Familia de ley: {challenge.family}</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-black text-slate-900">Por qué sirve</div>
                            <p className="mt-2 text-sm text-slate-600">
                                Las mismas leyes pequeñas aparecen una y otra vez. Este ejercicio las repite rápido para que los estudiantes memoricen la forma y el resultado.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">Elige el resultado equivalente</div>
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
                            {feedback || 'Elige una respuesta para empezar.'}
                        </div>

                        {solved && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Respuesta</div>
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

        if (choice === challenge.answer) {
            setSolved(true);
            setScore((current) => current + 1);
            setStreak((current) => current + 1);
            setFeedback(`Correcto. ${challenge.correctStatement}. ${challenge.explanation}`);
            return;
        }

        setStreak(0);
        setFeedback('Todavía no. Lee ambos lados y vuelve a intentarlo.');
    };

    return (
        <div className={visible ? 'block' : 'hidden'}>
            <GameShell
                topic={TOPICS[1]}
                title="Verdadero o falso"
                description="Lee la igualdad y decide si es verdadera o falsa. Muchas tarjetas son cortas para repetir leyes básicas y memorizar la forma correcta."
                stats={[
                    { label: 'Puntaje', value: score },
                    { label: 'Racha', value: streak },
                    { label: 'Enfoque', value: 'V / F' },
                ]}
                action={(
                    <button
                        type="button"
                        onClick={newChallenge}
                        className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/25"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Nueva igualdad
                    </button>
                )}
            >
                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Enunciado</div>
                            <div className="mt-3 rounded-2xl bg-white px-4 py-5 font-mono text-lg font-black text-slate-900 shadow-sm">
                                {challenge.statement}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">Responde V/F</span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Ley: {challenge.law}</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-black text-slate-900">Consejo del profe</div>
                            <p className="mt-2 text-sm text-slate-600">
                                Lee la igualdad en voz alta. Repetir el patrón y decir si es verdadero o falso ayuda a memorizar la ley.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">¿Verdadero o falso?</div>
                        <ChoiceGrid
                            options={challenge.options}
                            onPick={submit}
                            disabled={solved}
                            selected={selected}
                        />

                        <div className={`rounded-2xl border p-4 text-sm font-medium ${
                            solved
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : feedback
                                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                                    : 'border-slate-200 bg-slate-50 text-slate-500'
                        }`}>
                            {feedback || 'Piensa si ambos lados son equivalentes y elige Verdadero o Falso.'}
                        </div>

                        {solved && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Corrección</div>
                                <div className="mt-2 font-mono text-sm text-slate-900">{challenge.correctStatement}</div>
                            </div>
                        )}
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
                <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Tarjeta de regla</div>
                <div className="mt-3 rounded-2xl bg-white px-4 py-5 font-mono text-lg font-black text-slate-900 shadow-sm">
                    {challenge.statement}
                </div>
                <div className="mt-3 rounded-2xl bg-violet-50 p-4 text-sm text-violet-800">
                    De Morgan para cuantificadores intercambia enunciados universales y existenciales.
                </div>
            </div>
        );
    }

    if (challenge.kind === 'empty') {
        return (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Universo vacío</div>
                <div className="mt-3 rounded-2xl bg-white px-4 py-5 font-mono text-lg font-black text-slate-900 shadow-sm">
                    U = {SET_SYMBOLS.EMPTY}
                </div>
                <div className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                    Las universales son verdaderas aquí; las existenciales son falsas.
                </div>
            </div>
        );
    }

    if (challenge.kind === 'nested') {
        return (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Matriz de relación</div>
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
            <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Vista del dominio</div>
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
                title="Laboratorio de cuantificadores"
                description="Practica enunciados universales y existenciales con preguntas cortas y repetidas. El objetivo es que los símbolos se sientan naturales."
                stats={[
                    { label: 'Puntaje', value: score },
                    { label: 'Racha', value: streak },
                    { label: 'Modo', value: challenge.kind },
                ]}
                action={(
                    <button
                        type="button"
                        onClick={newChallenge}
                        className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/25"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Nueva ronda
                    </button>
                )}
            >
                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-4">
                        <QuantifierVisual challenge={challenge} />
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-black text-slate-900">Consigna</div>
                            <p className="mt-2 text-sm text-slate-600">{challenge.prompt}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">Respuesta</div>
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
                            {feedback || 'Elige el valor de verdad o la fórmula equivalente.'}
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
                title="Constructor de conjuntos"
                description="Elige los elementos que pertenecen al conjunto objetivo. Es una forma muy visual de aprender uniones, intersecciones, diferencias, complementos y diferencia simétrica."
                stats={[
                    { label: 'Puntaje', value: score },
                    { label: 'Racha', value: streak },
                    { label: 'Universo', value: challenge.universe.length },
                ]}
                action={(
                    <button
                        type="button"
                        onClick={newChallenge}
                        className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/25"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Nuevo conjunto
                    </button>
                )}
            >
                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Conjuntos fuente</div>
                            <div className="mt-3 space-y-3">
                                <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3">
                                    <div className="text-sm font-black text-sky-800">A = {formatSet(challenge.A)}</div>
                                </div>
                                <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-3">
                                    <div className="text-sm font-black text-fuchsia-800">B = {formatSet(challenge.B)}</div>
                                </div>
                            </div>
                            <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                                <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Operación</div>
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
                            <div className="text-sm font-black text-slate-900">Construye el conjunto respuesta</div>
                            <p className="mt-1 text-sm text-slate-500">
                                Haz clic en los elementos que deben pertenecer al resultado. Luego presiona comprobar.
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
                                    Comprobar respuesta
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelected([])}
                                    className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                                >
                                    <Edit3 className="h-4 w-4" />
                                    Limpiar
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
                            {feedback || 'Selecciona los elementos del resultado y comprueba tu conjunto.'}
                        </div>

                        {solved && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Respuesta</div>
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
                                Guía de estudio 2
                            </div>
                            <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                                Equivalencias, leyes, cuantificadores y conjuntos
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                                Leí la guía y convertí los tres temas en cuatro juegos pequeños. Los ejercicios se mantienen simples y repetitivos a propósito para que las leyes, los cuantificadores y los conjuntos se vuelvan automáticos.
                            </p>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            <StatPill label="Juegos" value="4" />
                            <StatPill label="Objetivo" value="Práctica" />
                            <StatPill label="Estilo" value="Repetitivo" />
                            <StatPill label="Enfoque" value="Memorizar" />
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

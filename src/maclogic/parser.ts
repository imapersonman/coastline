/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { is_array, is_empty, is_object, is_string } from '../utilities'
import P from 'parsimmon'
import { S } from './s'
import { ErrorInAssumptions, ErrorInConclusion, SequentError } from './generic_sequent_error'

const bin_op = (ac: string, factor: P.Parser<unknown>, connector: P.Parser<unknown>) =>
    P.seq(factor, connector.wrap(P.optWhitespace, P.optWhitespace), factor).map(([l,, r]) => [ac, l, r])

const LFOL = P.createLanguage({
    Expression: (r) => P.alt(r.And, r.Or, r.Implies, r.Iff, r.Factor, r.Individual),
    Factor: (r) => P.alt(r.Exists, r.Forall, r.Not, r.Predicate, r.Expression.wrap(P.string('('), P.string(')'))),
    Absurd: () =>
        P.alt(
            P.string('⊥'),
            P.string('\\F'),
            P.regexp(/absurd/i)
        ).map(() => ['⊥']),
    Individual: () => P.regexp(/[a-z]/),
    Predicate: (r) =>
        P.alt(
            r.Absurd,
            P.seq(
                P.regexp(/[A-Z]/),
                r.Individual.sepBy(P.string(''))).map(([p, xs]) => [p, ...xs])
        ),
    Not: (r) => P.alt(P.string('~'), P.string('¬')).skip(P.optWhitespace).then(r.Factor).map((f) => ['~', f]),
    And: (r) => bin_op('&', r.Factor, P.alt(P.string('&'), P.string('^'), P.string('/\\'), P.string('∧'))),
    Or: (r) => bin_op('∨', r.Factor, P.alt(P.string('\\/'), P.string('∨'))),
    Implies: (r) => bin_op('→', r.Factor, P.alt(P.string('->'), P.string('→'))),
    Iff: (r) => bin_op('↔', r.Factor, P.alt(P.string('<->'), P.string('↔'))),
    Forall: (r) => P.seq(P.alt(P.string('\\A'), P.string('\\U'), P.string('∀')), r.Individual, r.Factor).map(([, x, f]) => ['∀', x, f]),
    Exists: (r) => P.seq(P.alt(P.string('\\E'), P.string('∃')), r.Individual, r.Factor).map(([, x, f]) => ['∃', x, f])
})

export const is_parse_failure = (f: S | P.Failure): f is P.Failure => is_object(f) && 'status' in f && !f.status

export const parse = (t: string): S | P.Failure => {
    const result = LFOL.Expression.parse(t)
    if (result.status)
        return result.value
    return result
}

export const parse_sequent = (assumptions_t: string, conclusion_t: string): [S[], S] | SequentError<P.Failure> => {
    const assumption_strings = assumptions_t.split(',').map((s) => s.trim())
    const parsed_assumptions: S[] = []
    for (const [index, assumption_s] of assumption_strings.entries()) {
        if (assumption_s === '')
            continue
        const parsed = parse(assumption_s)
        if (is_parse_failure(parsed))
            return new ErrorInAssumptions(parsed, index)
        parsed_assumptions.push(parsed)
    }

    const parsed_conclusion = parse(conclusion_t)
    if (is_parse_failure(parsed_conclusion))
        return new ErrorInConclusion(parsed_conclusion)

    return [parsed_assumptions, parsed_conclusion]
}

export const unparse = (s: S): string => {
    const is_factor = (s: S): boolean =>
        is_string(s)
        || s.length === 1
        || (s.length > 0 && is_string(s[0]) && !['&', '∨', '→', '↔'].some((c) => c === s[0]))
    const wrap_if_not_factor = (s: S): string => is_factor(s) ? unparse(s) : `(${unparse(s)})`
    const is_individual = (s: S): s is string => is_string(s) && s === s.toLowerCase()
    if (is_individual(s))   
        return s
    const is_negation = (s: S): s is S[] => is_array(s) && s.length === 2 && is_string(s[0]) && s[0] === '~'
    if (is_negation(s))
        return `~${wrap_if_not_factor(s[1])}`
    const is_quantifier = (s: S): s is S[] => is_array(s) && s.length === 3 && is_string(s[1]) && is_string(s[0]) && ['∃', '∀'].some((q) => q === s[0])
    if (is_quantifier(s))
        return `${s[0] as string}${s[1] as string}${wrap_if_not_factor(s[2])}`
    const is_bin_op = (s: S): s is S[] => is_array(s) && s.length === 3 && is_string(s[0]) && ['&', '∨', '→', '↔'].some((c) => c === s[0])
    if (is_bin_op(s)) {
        return `${wrap_if_not_factor(s[1])} ${s[0] as string} ${wrap_if_not_factor(s[2])}`
    }
    const is_predicate = (s: S): s is S[] => is_array(s) && s.length > 0 && is_string(s[0]) && s[0] === s[0].toUpperCase()
    if (is_predicate(s))
        return `${s[0] as string}${(s as S[]).slice(1).map(unparse).join('')}`
    throw new Error(`unimplemented: ${JSON.stringify(s)}`)
}

export const unparse_sequent = (assumptions_s: S[], conclusion_s: S): string => {
    const assumptions_string = is_empty(assumptions_s) ? '' : `${assumptions_s.map(unparse).join(', ')} `
    const conclusion_string = unparse(conclusion_s)
    return `${assumptions_string}⊢ ${conclusion_string}`
}
import { Application, Ast, Lambda } from '../../src/lambda_pi/ast'
import { app, con, flapp, iv, mv, mvlist, ov } from '../..//src/lambda_pi/shorthands'
import { Ctx } from '../../src/logical_framework/ctx'
import { ctx_union, is_incompatible_ctxs } from '../../src/logical_framework/ctx_union'
import { Sort } from '../../src/logical_framework/sort'
import { is_redeclared_variable, RedeclaredVariable } from '../../src/logical_framework/sort_errors'
import { map_lookup_key_not_found, mk_map } from '../../src/map/RecursiveMap'
import { declare, is_array, is_string } from '../../src/utilities'
import { sequent, Sequent } from '../../src/construction/sequent'
import { absurd, and, exists, forall, i, iff, imp, ml, not, o, or, pred } from './maclogic_shorthands'
import { S } from './s'
import { ErrorInAssumptions, ErrorInConclusion, SequentError } from './generic_sequent_error'
import { unify_clauses, match_clause } from '../unification/first_order_match_clauses'
import { is_constant, is_variable } from '../lambda_pi/utilities'
import { SubProblem } from '../construction/check_proof_insert'

export interface ProvenSequent { assumptions: Ctx, proof: Ast, sort: Sort }
export const proven_sequent = (assumptions: Ctx, proof: Ast, sort: Sort): ProvenSequent => ({ assumptions, proof, sort })

// Is only capable of elaborating the output of parse.
export const elaborate_s = (s: S): ProvenSequent | RedeclaredVariable => {
    const get_ctx_from_args = (ctx: Ctx, args: S[]): [Ctx, Ast[]] | RedeclaredVariable =>
        args.reduce<[Ctx, Ast[]] | RedeclaredVariable>((acc: [Ctx, Ast[]] | RedeclaredVariable, arg): [Ctx, Ast[]] | RedeclaredVariable => {
            // sort from arg elaboration should be i.
            if (is_redeclared_variable(acc))
                return acc
            const elaborated = elaborate_s_with_ctx(acc[0], arg)
            if (is_redeclared_variable(elaborated))
                return elaborated
            const { assumptions, proof } = elaborated
            const unioned = ctx_union(acc[0], assumptions)
            if (is_incompatible_ctxs(unioned))
                // Should never occur
                throw new Error(`IncompatibleCtxs in elaborate_s_with_ctx: ${JSON.stringify(unioned)}`)
            return [unioned, [...acc[1], proof]]
        }, [ctx, []])

    // Important Cases:
    // - Individuals
    const elaborate_s_with_ctx = (ctx: Ctx, s: S): ProvenSequent | RedeclaredVariable => {
        const is_individual = (s: S): s is string => is_string(s) && s === s.toLowerCase()
        if (is_individual(s)) {
            const type = ctx.lookup(s)
            if (map_lookup_key_not_found(type))
                return proven_sequent(ctx.add(s, i), ov(s), i)
            // We trust the given ctx because we trust all the output ctxs.
            return proven_sequent(ctx, ov(s), i)
        }
        // - Negations
        const is_negation = (s: S): s is S[] => is_array(s) && s.length === 2 && is_string(s[0]) && s[0] === '~'
        if (is_negation(s)) {
            const arg = s[1]
            const ctx_from_arg = get_ctx_from_args(ctx, [arg])
            if (is_redeclared_variable(ctx_from_arg))
                return ctx_from_arg
            return proven_sequent(
                ctx_from_arg[0],
                not(ctx_from_arg[1][0]),
                o
            )
        }
        // - Quantifiers
        const is_quantifier = (s: S): s is S[] => is_array(s) && s.length === 3 && is_string(s[0]) && ['∃', '∀'].some((q) => q === s[0])
        // ['∃', 'x', ['F']]
        if (is_quantifier(s)) {
            const bound_id = s[1] as string
            const body_s = s[2]
            if (ctx.contains(bound_id))
                return new RedeclaredVariable(ov(bound_id))
            const mod_ctx = ctx.add(bound_id, i)
            const ctx_from_arg = get_ctx_from_args(mod_ctx, [body_s])
            const q = s[0] === '∃' ? exists : forall
            if (is_redeclared_variable(ctx_from_arg))
                return ctx_from_arg
            return proven_sequent(
                // removing the entry with bound_id as key is a bit of a hack but it works and simplifies things.
                ctx_from_arg[0].remove(bound_id),
                q(ov(bound_id), ctx_from_arg[1][0]),
                o
            )
        }
        // - Binary Operators
        const is_bin_op = (s: S): s is S[] => is_array(s) && s.length === 3 && is_string(s[0]) && ['&', '∨', '→', '↔'].some((c) => c === s[0])
        if (is_bin_op(s)) {
            const c = s[0] as string
            const args = (s as S[]).slice(1)
            const ctx_from_args = get_ctx_from_args(ctx, args)
            if (is_redeclared_variable(ctx_from_args))
                return ctx_from_args
            const bin_op =
                c === '&' ? and
                : c === '∨' ? or
                : c === '→' ? imp
                : iff
            return proven_sequent(
                ctx_from_args[0],
                bin_op(ctx_from_args[1][0], ctx_from_args[1][1]),
                o
            )
        }
        // - Predicates
        const is_predicate = (s: S): s is S[] => is_array(s) && s.length > 0 && is_string(s[0]) && s[0] === s[0].toUpperCase()
        if (is_predicate(s)) {
            const head = s[0] as string
            const args = (s as S[]).slice(1) as string[]
            if (head === '⊥')
                return proven_sequent(ctx, absurd, o)
            const ctx_from_args = get_ctx_from_args(ctx, args)
            if (is_redeclared_variable(ctx_from_args))
                return ctx_from_args
            const as_ast = args.length === 0 ? ov(head) : flapp(ov(head), ov(args[0]), ...args.slice(1).map(ov))
            if (map_lookup_key_not_found(head))
                return proven_sequent(ctx_from_args[0], as_ast, o)
            const unioned = ctx_union(ctx.add(head, pred(args.length)), ctx_from_args[0])
            if (is_incompatible_ctxs(unioned))
                throw new Error(`IncompatibleCtxs in elaborate_s_with_ctx: ${JSON.stringify(unioned)}`)
            return proven_sequent(unioned, as_ast, o)
        }
        throw new Error('undefined')
    }
    return elaborate_s_with_ctx(mk_map(), s)
}

export const elaborate_sequent = (assumptions: S[], conclusion: S): Sequent | SequentError<RedeclaredVariable> => {
    const elaborated_assumptions = assumptions.map(elaborate_s)
    let individual_and_formulae_ctx = mk_map<Ast>()
    let proof_ctx = mk_map<Ast>()
    for (const [index, ea] of elaborated_assumptions.entries()) {
        if (is_redeclared_variable(ea))
            return new ErrorInAssumptions(ea, index)
        const ifctx_unioned = ctx_union(individual_and_formulae_ctx, ea.assumptions)
        if (is_incompatible_ctxs(ifctx_unioned))
            throw new Error('Elaborated assumptions ctxs are incompatible')
        individual_and_formulae_ctx = ifctx_unioned
        proof_ctx = proof_ctx.add(iv(index).id, ml(ea.proof))
    }

    const elaborated_conclusion = elaborate_s(conclusion)
    if (is_redeclared_variable(elaborated_conclusion))
        return new ErrorInConclusion(elaborated_conclusion)
    const ifctx_unioned = ctx_union(individual_and_formulae_ctx, elaborated_conclusion.assumptions)
    if (is_incompatible_ctxs(ifctx_unioned))
        throw new Error('Elaborated individual and formula ctx is incompatible with conclusion ctx')
    individual_and_formulae_ctx = ifctx_unioned
    const full_ctx = ctx_union(individual_and_formulae_ctx, proof_ctx)
    if (is_incompatible_ctxs(full_ctx))
        // should never happen
        throw new Error('Elaborated individual and formulae ctx is incompatible with the elaborated proof ctx')
    const proof_conclusion = ml(elaborated_conclusion.proof)

    return sequent(full_ctx, proof_conclusion)
}

export const unelaborate = (ast: Ast): S => {
    const [X, Y] = mvlist('X', 'Y')
    if (is_constant(ast) && ast.id === 'absurd')
        return ['⊥']
    if (is_variable(ast))
        if (ast.id === ast.id.toLowerCase())
            return ast.id
        else
            return [ast.id]
    return unify_clauses(ast, [
        match_clause(not(X), (u) => ['~', unelaborate(u('X'))]),
        match_clause(and(X, Y), (u) => ['&', unelaborate(u('X')), unelaborate(u('Y'))]),
        match_clause(imp(X, Y), (u) => ['→', unelaborate(u('X')), unelaborate(u('Y'))]),
        match_clause(or(X, Y), (u) => ['∨', unelaborate(u('X')), unelaborate(u('Y'))]),
        match_clause(iff(X, Y), (u) => ['↔', unelaborate(u('X')), unelaborate(u('Y'))]),
        match_clause(app(con('exists'), X), (u) => declare(u('X') as Lambda, (l) => ['∃', l.bound.id, unelaborate(l.scope)])),
        match_clause(app(con('forall'), X), (u) => declare(u('X') as Lambda, (l) => ['∀', l.bound.id, unelaborate(l.scope)])),
        match_clause(app(X, Y), (u) => [...unelaborate(u('X')), unelaborate(u('Y'))])
    ], () => ['cool: ' + JSON.stringify(ast)])
}

export const unelaborate_sequent = (s: Sequent): [S[], S] => {
    const X = mv('X')
    const assumptions_s: S[] = []
    for (const [,type] of s.assumptions.entries()) {
        unify_clauses(type, [
            match_clause(ml(X), (u) => assumptions_s.push(unelaborate(u('X'))))
        // if no match, don't do anything
        ], () => undefined)
    }

    const conclusion_s = (s.conclusion as Application).arg
    return [assumptions_s, unelaborate(conclusion_s)]
}

export const unelaborate_sub_problem = (sub_problem: SubProblem): { id: number, sequent: [S[], S] } => ({
    id: sub_problem.meta_variable.get_index(),
    sequent: unelaborate_sequent(sub_problem.sequent)
})
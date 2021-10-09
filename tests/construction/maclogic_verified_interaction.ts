import { try_parse } from "../../src/lambda_pi/parsers/parser"
import { app, clist, con, flapp, la, mvlist, nary, ov, type_k } from "../../src/lambda_pi/shorthands"
import { mk_map } from "../../src/map/RecursiveMap"
import { is_unification_error } from "../../src/unification/first_order"
import { insert } from "../../src/construction/insert"
import { find_unifying_assumptions, UnifyingAssumption } from "../../src/construction/unifying_assumptions"
import { unify_in_tactic } from "../../src/construction/unify_in_tactic"
import { user_error } from "../../src/construction/user_error"
import { VerifiedInteractionSpecification } from "../../src/construction/verified_interaction_specification"
import { Ast, Variable } from "../../src/lambda_pi/ast"
import { declare, defined, is_integer, is_number, is_string, rest } from "../../src/utilities"
import { request } from "../../src/construction/request"
import { possibly_beta_reduce } from "../../src/lambda_pi/to_beta_normal_form"
import { request_definition } from "../../src/construction/request_definition"
import { tactic_error } from "../../src/construction/tactic_error"
import { Ctx } from "../../src/logical_framework/ctx"
import { is_map } from "../../src/map/is_map"
import { ThrowingUnifyingAssumption, throwing_unifying_assumption } from "../../src/construction/throwing_unifying_assumption"
import { is_ast, is_variable } from "../../src/lambda_pi/utilities"

const [o, i] = clist("o", "i")
const [ml, and, imp, or, iff] = [nary<[]>("ml"), nary<[Ast]>("and"), nary<[Ast]>("imp"), nary<[Ast]>("or"), nary<[Ast]>("iff")]
const andi = nary<[Ast, Ast, Ast]>("andi")
const [andel, ander] = [nary<[Ast, Ast]>("andel"), nary<[Ast, Ast]>("ander")]
const impi = nary<[Ast, Ast]>("impi")
const impe = nary<[Ast, Ast, Ast]>("impe")
const individuali = nary<[Ast]>("individuali")
const existsi = nary<[Ast, Ast]>("existsi")
const existse = nary<[Ast, Ast, Ast]>("existse")
const foralli = nary<[Ast]>("foralli")
const foralle = nary<[Ast, Ast]>("foralli")

const [X, Y] = mvlist("X", "Y")

export const maclogic_specification: VerifiedInteractionSpecification = {
    sig: mk_map(
        // o, i,
        ["o", type_k],
        ["i", type_k],
        // ml
        ["ml", try_parse("P(p: o).Type")],
        // absurd
        ["absurd", o],
        // not, noti, note
        ["not", try_parse("P(q: o).o")],
        ["noti", try_parse("P(A: o).P(p: P(x: ml A).ml absurd).ml (not A)")],
        ["note", try_parse("P(A: o).P(maj: ml (not A)).P(min: ml A).ml absurd")],
        // and, andi, andel, ander
        ["and", try_parse("P(x: o).P(y: o).o")],
        ["andi", try_parse("P(A: o).P(B: o).P(l: ml A).P(r: ml B).ml (and A B)")],
        ["andel", try_parse("P(A: o).P(B: o).P(p: ml (and A B)).ml A")],
        ["ander", try_parse("P(A: o).P(B: o).P(p: ml (and A B)).ml B")],
        // individuali
        ["individuali", try_parse("P(A: o).P(if: P(a: i).ml A).ml A")],
        // imp, impi, impe
        ["imp", try_parse("P(x: o).P(y: o).o")],
        ["impi", try_parse("P(A: o).P(B: o).P(p: P(x: ml A).ml B).ml (imp A B)")],
        ["impe", try_parse("P(A: o).P(B: o).P(maj: ml (imp A B)).P(min: ml A).ml B")],
        // forall, foralli, foralle
        ["forall", try_parse("P(b: P(x: i).o).o")],
        ["foralli", try_parse("P(phi: P(x: i).o).P(p: P(t: i).ml (phi t)).ml (forall phi)")],
        ["foralle", try_parse("P(phi: P(x: i).o).P(t: i).P(p: ml (forall phi)).ml (phi t)")],
        // exists, existsi, existse
        ["exists", try_parse("P(b: P(x: i).o).o")],
        ["existsi", try_parse("P(phi: P(x: i).o).P(t: i).P(p: ml (phi t)).ml (exists phi)")],
        ["existse", try_parse("P(phi: P(a: i).o).P(A: o).P(e: ml (exists phi)).P(p: P(x: i).P(y: ml (phi x)).ml A).ml A")],
        // iff, dfl, dfr
        ["iff", try_parse("P(x: o).P(y: o).o")],
        ["dfl", try_parse("P(A: o).P(B: o).P(iff: ml (iff A B)).ml (and (imp A B) (imp B A))")],
        ["dfr", try_parse("P(A: o).P(B: o).P(andp: ml (and (imp A B) (imp B A))).ml (iff A B)")],
    ),
    tactics: {
        // close
        "close": function* ({ assumptions, conclusion }) {
            const uas = find_unifying_assumptions(assumptions, conclusion)
            if (uas.length === 0) return user_error("no_unifying_assumptions_found", conclusion)
            return insert([], () => uas[0].variable)
        },
        // andi
        "andi": function* ({ conclusion }) {
            const u = unify_in_tactic(ml(and(X, Y)), conclusion)
            if (is_unification_error(u)) return user_error("unification_error", u)
            return insert([ml(u("X")), ml(u("Y"))], (m, v) => andi(u("X"), u("Y"), m(0), m(1)))
        },
        // ande
        "ande": function* ({ assumptions, conclusion }) {
            const { unifier: u, variable: a } = yield request("unifying_assumption", { assumptions, pattern: ml(and(X, Y)) })
            return insert([conclusion], (m, v) => flapp(la(v(0), ml(u("X")), la(v(1), ml(u("Y")), m(0))), andel(u("X"), u("Y"), a), ander(u("X"), u("Y"), a)))
        },
        // impi
        "impi": function* ({ conclusion }) {
            const u = unify_in_tactic(ml(imp(X, Y)), conclusion)
            if (is_unification_error(u)) return user_error("unification_error", u)
            return insert([ml(u("Y"))], (m, v) => impi(u("X"), u("Y"), la(v(0), ml(u("X")), m(0))))
        },
        // impe
        "impe": function* ({ assumptions, conclusion }) {
            const { unifier: u, variable: a } = yield request("unifying_assumption", { assumptions, pattern: ml(imp(X, Y)) })
            return insert([ml(u("X")), conclusion], (m, v) => flapp(la(v(0), ml(u("Y")), m(1)), impe(u("X"), u("Y"), a, m(0))))
        },
        // existsi
        "existsi": function* ({ assumptions, conclusion }) {
            const cu = unify_in_tactic(ml(X), conclusion)
            if (is_unification_error(cu)) return user_error("unification_error", cu)
            const u = unify_in_tactic(app(con("exists"), X), cu("X"))
            if (is_unification_error(u)) return user_error("unification_error", u)
            const new_v = yield request("any_variable", undefined)
            const new_c = ml(possibly_beta_reduce(u("X"), new_v))
            if (assumptions.contains(new_v.id))
                return insert([new_c], (m, v) => existsi(u("X"), new_v, m(0)))
            return insert([new_c], (m, v) => individuali(cu("X"), la(new_v, i, existsi(u("X"), new_v, m(0)))))
        },
        // existse
        "existse": function* ({ assumptions, conclusion }) {
            const cu = unify_in_tactic(ml(X), conclusion)
            if (is_unification_error(cu)) return user_error("unification_error", cu)
            const { unifier: u, variable: a } = yield request("unifying_assumption", { assumptions, pattern: ml(app(con("exists"), X)) })
            const new_v = yield request("unused_variable", assumptions)
            const instance = possibly_beta_reduce(u("X"), new_v)
            return insert([ml(cu("X"))], (m, v) => existse(u("X"), cu("X"), a, la(new_v, i, la(v(0), ml(instance), m(0)))))
        },
        // foralli
        "foralli": function* ({ assumptions, conclusion }) {
            const u = unify_in_tactic(ml(app(con("forall"), X)), conclusion)
            if (is_unification_error(u)) return user_error("unification_error", u)
            const new_v = yield request("unused_variable", assumptions)
            const instance = possibly_beta_reduce(u("X"), new_v)
            return insert([ml(instance)], (m, v) => foralli(u("X"), la(new_v, i, m(0))))
        },
        // foralle
        "foralle": function* ({ assumptions, conclusion }) {
            const cu = unify_in_tactic(ml(X), conclusion)
            if (is_unification_error(cu)) return user_error("unification_error", cu)
            const { unifier: u, variable: forall_v } = yield request("unifying_assumption", { assumptions, pattern: ml(app(con("forall"), X)) })
            const new_v = yield request("any_variable", undefined)
            const instance = possibly_beta_reduce(u("X"), new_v)
            if (assumptions.contains(new_v.id))
                return insert([ml(cu("X"))], (m, v) => app(la(v(0), ml(instance), m(0)), foralle(u("X"), new_v, forall_v)))
            return insert([ml(cu("X"))], (m, v) => individuali(cu("X"), la(new_v, i, app(la(v(0), ml(instance), m(0)), foralle(u("X"), new_v, forall_v)))))
        }
        // df
    },
    requests: {
        // any_variable
        "any_variable": request_definition<undefined, undefined, string, Variable>({
            parameter: (v) => defined(v) ? tactic_error("any_variable parameter is defined") : v,
            response: ({ r: id }) => !is_string(id) ? user_error("not_a_variable_name", id) : ov(id)
        }),
        // used_variable
        "used_variable": request_definition<Ctx, Ctx, string, Variable>({
            parameter: (ctx) =>
                !is_map(ctx) ? tactic_error("used_variable parameter should be a Ctx")
                : ctx,
            response: ({ tp: ctx, r: id }) =>
                !is_string(id) ? user_error("not_a_string", id)
                : !ctx.contains(id) ? user_error("variable_does_not_exist", ov(id))
                : ov(id)
        }),
        // unused_variable
        "unused_variable": request_definition<Ctx, Ctx, string, Variable>({
            parameter: (ctx) =>
                !is_map(ctx) ? tactic_error("unused_variable parameter should be a Ctx")
                : ctx,
            response: ({ tp: ctx, r: id }) =>
                !is_string(id) ? user_error("not_a_string", id)
                : ctx.contains(id) ? user_error("variable_exists", ov(id))
                : ov(id)
        }),
        // unifying_assumption
        "unifying_assumption": request_definition<{ assumptions: Ctx, pattern: Ast }, UnifyingAssumption[], number, ThrowingUnifyingAssumption>({
            parameter: ({ assumptions, pattern }) =>
                !is_map(assumptions) ? user_error("not_a_ctx", assumptions)
                : !is_ast(pattern) ? user_error("not_an_ast", pattern)
                : declare(find_unifying_assumptions(assumptions, pattern), (uas) =>
                    uas.length === 0 ? user_error("no_unifying_assumptions_found", pattern)
                    : uas),
            response: ({ tp: uas, r: index }) =>
                !is_number(index) || !is_integer(index) ? user_error("not_an_integer", index)
                : index < 0 || uas.length <= index ? user_error("index_out_of_bounds", { index, upper_bound: uas.length })
                // Changing the unifying assumption so that an exception is thrown if the unifier is given an incorrect index.
                : throwing_unifying_assumption(uas[index]),
        })
        // unifying_assumption_or_conclusion
    },
    errors: {
        // not_a_string
        "not_a_string": (payload) => !is_string(payload),
        // not_an_integer
        "not_an_integer": (payload) => !is_number(payload) || !is_integer(payload),
        // not_a_variable_name
        "not_a_variable_name": (payload) => !is_string(payload),
        // not_a_ctx
        "not_a_ctx": (payload) => !is_map(payload),
        // not_an_ast
        "not_an_ast": (payload) => !is_ast(payload),
        // variable_does_not_exist
        "variable_does_not_exist": is_variable,
        // variable_exists
        "variable_exists": is_variable,
        // unification_error
        "unification_error": is_unification_error,
        // no_unifying_assumptions_found
        "no_unifying_assumptions_found": (payload) => !is_ast(payload),
        // no_unifying_assumptions_or_conclusion_found
        "no_unifying_assumptions_or_conclusion_found": (payload) => true
    }
}
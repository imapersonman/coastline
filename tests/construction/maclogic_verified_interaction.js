"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maclogic_specification = void 0;
const lambda_pi_parser_1 = require("../../src/lambda_pi/parsers/lambda_pi_parser");
const shorthands_1 = require("../../src/lambda_pi/shorthands");
const RecursiveMap_1 = require("../../src/map/RecursiveMap");
const first_order_1 = require("../../src/unification/first_order");
const insert_1 = require("../../src/construction/insert");
const unifying_assumptions_1 = require("../../src/construction/unifying_assumptions");
const unify_in_tactic_1 = require("../../src/construction/unify_in_tactic");
const user_error_1 = require("../../src/construction/user_error");
const utilities_1 = require("../../src/utilities");
const request_1 = require("../../src/construction/request");
const to_beta_normal_form_1 = require("../../src/lambda_pi/to_beta_normal_form");
const request_definition_1 = require("../../src/construction/request_definition");
const tactic_error_1 = require("../../src/construction/tactic_error");
const is_map_1 = require("../../src/map/is_map");
const throwing_unifying_assumption_1 = require("../../src/construction/throwing_unifying_assumption");
const utilities_2 = require("../../src/lambda_pi/utilities");
const [o, i] = (0, shorthands_1.clist)("o", "i");
const [ml, and, imp, or, iff] = [(0, shorthands_1.nary)("ml"), (0, shorthands_1.nary)("and"), (0, shorthands_1.nary)("imp"), (0, shorthands_1.nary)("or"), (0, shorthands_1.nary)("iff")];
const andi = (0, shorthands_1.nary)("andi");
const [andel, ander] = [(0, shorthands_1.nary)("andel"), (0, shorthands_1.nary)("ander")];
const impi = (0, shorthands_1.nary)("impi");
const impe = (0, shorthands_1.nary)("impe");
const individuali = (0, shorthands_1.nary)("individuali");
const existsi = (0, shorthands_1.nary)("existsi");
const existse = (0, shorthands_1.nary)("existse");
const foralli = (0, shorthands_1.nary)("foralli");
const foralle = (0, shorthands_1.nary)("foralli");
const [X, Y] = (0, shorthands_1.mvlist)("X", "Y");
exports.maclogic_specification = {
    sig: (0, RecursiveMap_1.mk_map)(
    // o, i,
    ["o", shorthands_1.type_k], ["i", shorthands_1.type_k], 
    // ml
    ["ml", (0, lambda_pi_parser_1.safe_parse)("P(p: o).Type")], 
    // absurd
    ["absurd", o], 
    // not, noti, note
    ["not", (0, lambda_pi_parser_1.safe_parse)("P(q: o).o")], ["noti", (0, lambda_pi_parser_1.safe_parse)("P(A: o).P(p: P(x: ml A).ml absurd).ml (not A)")], ["note", (0, lambda_pi_parser_1.safe_parse)("P(A: o).P(maj: ml (not A)).P(min: ml A).ml absurd")], 
    // and, andi, andel, ander
    ["and", (0, lambda_pi_parser_1.safe_parse)("P(x: o).P(y: o).o")], ["andi", (0, lambda_pi_parser_1.safe_parse)("P(A: o).P(B: o).P(l: ml A).P(r: ml B).ml (and A B)")], ["andel", (0, lambda_pi_parser_1.safe_parse)("P(A: o).P(B: o).P(p: ml (and A B)).ml A")], ["ander", (0, lambda_pi_parser_1.safe_parse)("P(A: o).P(B: o).P(p: ml (and A B)).ml B")], 
    // individuali
    ["individuali", (0, lambda_pi_parser_1.safe_parse)("P(A: o).P(if: P(a: i).ml(A)).ml(A)")], 
    // imp, impi, impe
    ["imp", (0, lambda_pi_parser_1.safe_parse)("P(x: o).P(y: o).o")], ["impi", (0, lambda_pi_parser_1.safe_parse)("P(A: o).P(B: o).P(p: P(x: ml A).ml B).ml (imp A B)")], ["impe", (0, lambda_pi_parser_1.safe_parse)("P(A: o).P(B: o).P(maj: ml (imp A B)).P(min: ml A).ml B")], 
    // forall, foralli, foralle
    ["forall", (0, lambda_pi_parser_1.safe_parse)("P(b: P(x: i).o).o")], ["foralli", (0, lambda_pi_parser_1.safe_parse)("P(phi: P(x: i).o).P(p: P(t: i).ml (phi t)).ml (forall phi)")], ["foralle", (0, lambda_pi_parser_1.safe_parse)("P(phi: P(x: i).o).P(t: i).P(p: ml (forall phi)).ml (phi t)")], 
    // exists, existsi, existse
    ["exists", (0, lambda_pi_parser_1.safe_parse)("P(b: P(x: i).o).o")], ["existsi", (0, lambda_pi_parser_1.safe_parse)("P(phi: P(x: i).o).P(t: i).P(p: ml (phi t)).ml (exists phi)")], ["existse", (0, lambda_pi_parser_1.safe_parse)("P(phi: P(a: i).o).P(A: o).P(e: ml (exists phi)).P(p: P(x: i).P(y: ml (phi x)).ml A).ml A")], 
    // iff, dfl, dfr
    ["iff", (0, lambda_pi_parser_1.safe_parse)("P(x: o).P(y: o).o")], ["dfl", (0, lambda_pi_parser_1.safe_parse)("P(A: o).P(B: o).P(iff: ml (iff A B)).ml (and (imp A B) (imp B A))")], ["dfr", (0, lambda_pi_parser_1.safe_parse)("P(A: o).P(B: o).P(andp: ml (and (imp A B) (imp B A))).ml (iff A B)")]),
    tactics: {
        // close
        "close": function* ({ assumptions, conclusion }) {
            const uas = (0, unifying_assumptions_1.find_unifying_assumptions)(assumptions, conclusion);
            if (uas.length === 0)
                return (0, user_error_1.user_error)("no_unifying_assumptions_found", conclusion);
            return (0, insert_1.insert)([], () => uas[0].variable);
        },
        // andi
        "andi": function* ({ conclusion }) {
            const u = (0, unify_in_tactic_1.unify_in_tactic)(ml(and(X, Y)), conclusion);
            if ((0, first_order_1.is_unification_error)(u))
                return (0, user_error_1.user_error)("unification_error", u);
            return (0, insert_1.insert)([ml(u("X")), ml(u("Y"))], (m, v) => andi(u("X"), u("Y"), m(0), m(1)));
        },
        // ande
        "ande": function* ({ assumptions, conclusion }) {
            const { unifier: u, variable: a } = yield (0, request_1.request)("unifying_assumption", { assumptions, pattern: ml(and(X, Y)) });
            return (0, insert_1.insert)([conclusion], (m, v) => (0, shorthands_1.flapp)((0, shorthands_1.la)(v(0), ml(u("X")), (0, shorthands_1.la)(v(1), ml(u("Y")), m(0))), andel(u("X"), u("Y"), a), ander(u("X"), u("Y"), a)));
        },
        // impi
        "impi": function* ({ conclusion }) {
            const u = (0, unify_in_tactic_1.unify_in_tactic)(ml(imp(X, Y)), conclusion);
            if ((0, first_order_1.is_unification_error)(u))
                return (0, user_error_1.user_error)("unification_error", u);
            return (0, insert_1.insert)([ml(u("Y"))], (m, v) => impi(u("X"), u("Y"), (0, shorthands_1.la)(v(0), ml(u("X")), m(0))));
        },
        // impe
        "impe": function* ({ assumptions, conclusion }) {
            const { unifier: u, variable: a } = yield (0, request_1.request)("unifying_assumption", { assumptions, pattern: ml(imp(X, Y)) });
            return (0, insert_1.insert)([ml(u("X")), conclusion], (m, v) => (0, shorthands_1.flapp)((0, shorthands_1.la)(v(0), ml(u("Y")), m(1)), impe(u("X"), u("Y"), a, m(0))));
        },
        // existsi
        "existsi": function* ({ assumptions, conclusion }) {
            const cu = (0, unify_in_tactic_1.unify_in_tactic)(ml(X), conclusion);
            if ((0, first_order_1.is_unification_error)(cu))
                return (0, user_error_1.user_error)("unification_error", cu);
            const u = (0, unify_in_tactic_1.unify_in_tactic)((0, shorthands_1.app)((0, shorthands_1.con)("exists"), X), cu("X"));
            if ((0, first_order_1.is_unification_error)(u))
                return (0, user_error_1.user_error)("unification_error", u);
            const new_v = yield (0, request_1.request)("any_variable", undefined);
            const new_c = ml((0, to_beta_normal_form_1.possibly_beta_reduce)(u("X"), new_v));
            if (assumptions.contains(new_v.id))
                return (0, insert_1.insert)([new_c], (m, v) => existsi(u("X"), new_v, m(0)));
            return (0, insert_1.insert)([new_c], (m, v) => individuali(cu("X"), (0, shorthands_1.la)(new_v, i, existsi(u("X"), new_v, m(0)))));
        },
        // existse
        "existse": function* ({ assumptions, conclusion }) {
            const cu = (0, unify_in_tactic_1.unify_in_tactic)(ml(X), conclusion);
            if ((0, first_order_1.is_unification_error)(cu))
                return (0, user_error_1.user_error)("unification_error", cu);
            const { unifier: u, variable: a } = yield (0, request_1.request)("unifying_assumption", { assumptions, pattern: ml((0, shorthands_1.app)((0, shorthands_1.con)("exists"), X)) });
            const new_v = yield (0, request_1.request)("unused_variable", assumptions);
            const instance = (0, to_beta_normal_form_1.possibly_beta_reduce)(u("X"), new_v);
            return (0, insert_1.insert)([ml(cu("X"))], (m, v) => existse(u("X"), cu("X"), a, (0, shorthands_1.la)(new_v, i, (0, shorthands_1.la)(v(0), ml(instance), m(0)))));
        },
        // foralli
        "foralli": function* ({ assumptions, conclusion }) {
            const u = (0, unify_in_tactic_1.unify_in_tactic)(ml((0, shorthands_1.app)((0, shorthands_1.con)("forall"), X)), conclusion);
            if ((0, first_order_1.is_unification_error)(u))
                return (0, user_error_1.user_error)("unification_error", u);
            const new_v = yield (0, request_1.request)("unused_variable", assumptions);
            const instance = (0, to_beta_normal_form_1.possibly_beta_reduce)(u("X"), new_v);
            return (0, insert_1.insert)([ml(instance)], (m, v) => foralli(u("X"), (0, shorthands_1.la)(new_v, i, m(0))));
        },
        // foralle
        "foralle": function* ({ assumptions, conclusion }) {
            const cu = (0, unify_in_tactic_1.unify_in_tactic)(ml(X), conclusion);
            if ((0, first_order_1.is_unification_error)(cu))
                return (0, user_error_1.user_error)("unification_error", cu);
            const { unifier: u, variable: forall_v } = yield (0, request_1.request)("unifying_assumption", { assumptions, pattern: ml((0, shorthands_1.app)((0, shorthands_1.con)("forall"), X)) });
            const new_v = yield (0, request_1.request)("any_variable", undefined);
            const instance = (0, to_beta_normal_form_1.possibly_beta_reduce)(u("X"), new_v);
            if (assumptions.contains(new_v.id))
                return (0, insert_1.insert)([ml(cu("X"))], (m, v) => (0, shorthands_1.app)((0, shorthands_1.la)(v(0), ml(instance), m(0)), foralle(u("X"), new_v, forall_v)));
            return (0, insert_1.insert)([ml(cu("X"))], (m, v) => individuali(cu("X"), (0, shorthands_1.la)(new_v, i, (0, shorthands_1.app)((0, shorthands_1.la)(v(0), ml(instance), m(0)), foralle(u("X"), new_v, forall_v)))));
        }
        // df
    },
    requests: {
        // any_variable
        "any_variable": (0, request_definition_1.request_definition)({
            parameter: (v) => (0, utilities_1.defined)(v) ? (0, tactic_error_1.tactic_error)("any_variable parameter is defined") : v,
            response: ({ r: id }) => !(0, utilities_1.is_string)(id) ? (0, user_error_1.user_error)("not_a_variable_name", id) : (0, shorthands_1.ov)(id)
        }),
        // used_variable
        "used_variable": (0, request_definition_1.request_definition)({
            parameter: (ctx) => !(0, is_map_1.is_map)(ctx) ? (0, tactic_error_1.tactic_error)("used_variable parameter should be a Ctx")
                : ctx,
            response: ({ tp: ctx, r: id }) => !(0, utilities_1.is_string)(id) ? (0, user_error_1.user_error)("not_a_string", id)
                : !ctx.contains(id) ? (0, user_error_1.user_error)("variable_does_not_exist", (0, shorthands_1.ov)(id))
                    : (0, shorthands_1.ov)(id)
        }),
        // unused_variable
        "unused_variable": (0, request_definition_1.request_definition)({
            parameter: (ctx) => !(0, is_map_1.is_map)(ctx) ? (0, tactic_error_1.tactic_error)("unused_variable parameter should be a Ctx")
                : ctx,
            response: ({ tp: ctx, r: id }) => !(0, utilities_1.is_string)(id) ? (0, user_error_1.user_error)("not_a_string", id)
                : ctx.contains(id) ? (0, user_error_1.user_error)("variable_exists", (0, shorthands_1.ov)(id))
                    : (0, shorthands_1.ov)(id)
        }),
        // unifying_assumption
        "unifying_assumption": (0, request_definition_1.request_definition)({
            parameter: ({ assumptions, pattern }) => !(0, is_map_1.is_map)(assumptions) ? (0, user_error_1.user_error)("not_a_ctx", assumptions)
                : !(0, utilities_2.is_ast)(pattern) ? (0, user_error_1.user_error)("not_an_ast", pattern)
                    : (0, utilities_1.declare)((0, unifying_assumptions_1.find_unifying_assumptions)(assumptions, pattern), (uas) => uas.length === 0 ? (0, user_error_1.user_error)("no_unifying_assumptions_found", pattern)
                        : uas),
            response: ({ tp: uas, r: index }) => !(0, utilities_1.is_number)(index) || !(0, utilities_1.is_integer)(index) ? (0, user_error_1.user_error)("not_an_integer", index)
                : index < 0 || uas.length <= index ? (0, user_error_1.user_error)("index_out_of_bounds", { index, upper_bound: uas.length })
                    // Changing the unifying assumption so that an exception is thrown if the unifier is given an incorrect index.
                    : (0, throwing_unifying_assumption_1.throwing_unifying_assumption)(uas[index]),
        })
        // unifying_assumption_or_conclusion
    },
    errors: {
        // not_a_string
        "not_a_string": (payload) => !(0, utilities_1.is_string)(payload),
        // not_an_integer
        "not_an_integer": (payload) => !(0, utilities_1.is_number)(payload) || !(0, utilities_1.is_integer)(payload),
        // not_a_variable_name
        "not_a_variable_name": (payload) => !(0, utilities_1.is_string)(payload),
        // not_a_ctx
        "not_a_ctx": (payload) => !(0, is_map_1.is_map)(payload),
        // not_an_ast
        "not_an_ast": (payload) => !(0, utilities_2.is_ast)(payload),
        // variable_does_not_exist
        "variable_does_not_exist": utilities_2.is_variable,
        // variable_exists
        "variable_exists": utilities_2.is_variable,
        // unification_error
        "unification_error": first_order_1.is_unification_error,
        // no_unifying_assumptions_found
        "no_unifying_assumptions_found": (payload) => !(0, utilities_2.is_ast)(payload),
        // no_unifying_assumptions_or_conclusion_found
        "no_unifying_assumptions_or_conclusion_found": (payload) => true
    }
};

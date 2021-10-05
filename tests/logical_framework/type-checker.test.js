"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sort_1 = require("../../src/logical_framework/sort");
const ast_1 = require("../../src/lambda_pi/ast");
const lambda_pi_parser_1 = require("../../src/lambda_pi/parsers/lambda_pi_parser");
const RecursiveMap_1 = require("../../src/map/RecursiveMap");
const synthesize_type_1 = require("../../src/logical_framework/synthesize_type");
const env_1 = require("../../src/logical_framework/env");
const sort_errors_1 = require("../../src/logical_framework/sort_errors");
const ctx_errors_1 = require("../../src/logical_framework/ctx_errors");
const mt_map = RecursiveMap_1.RecursiveMap.empty();
function test_synthesize(name, sig, ctx, ast, output) {
    const result = (0, synthesize_type_1.synthesize)(new env_1.Env(sig, ctx, mt_map), ast);
    test(`synthesize ${name}`, () => expect(result).toEqual(output));
}
function test_check_sig(name, sig, output) {
    test(`check sig ${name}`, () => expect((0, synthesize_type_1.check_sig)(sig)).toEqual(output));
}
function test_check_ctx(name, sig, ctx, output) {
    test(`check ctx ${name}`, () => expect((0, synthesize_type_1.check_ctx)(sig, ctx)).toEqual(output));
}
const gv = (base, index) => new ast_1.GeneratedVariable(base, index);
const P = (b, t, s) => new ast_1.Pi(b, t, s);
const L = (b, t, s) => new ast_1.Lambda(b, t, s);
const A = (h, a) => new ast_1.Application(h, a);
const type_k = new ast_1.TypeKind;
const kind_s = new sort_1.KindSort;
const [a, c, b] = [new ast_1.Constant("a"), new ast_1.Constant("c"), new ast_1.Constant("b")];
const [x, y, z] = [new ast_1.Variable("x"), new ast_1.Variable("y"), new ast_1.Variable("z")];
// SuccessMap([])
test_check_sig("mt", (0, RecursiveMap_1.mk_map)(), true);
// SuccessMap([])
test_check_ctx("mt", (0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)(), true);
// Kind
test_synthesize("Type", (0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)(), type_k, kind_s);
// SuccessMap([SuccessEntry("c", Ann(Type, Kind))])
test_check_sig("valid nmt", (0, RecursiveMap_1.mk_map)(["c", type_k]), true);
// FailureMap([FailureEntry("c", Ann(b, UnknownSort))])
test_check_sig("nmt bad sort", (0, RecursiveMap_1.mk_map)(["c", b]), false);
// SuccessMap([SuccessEntry("c", Ann(Type, Kind)), SuccessEntry("b", Ann(Type, Kind))])
test_check_sig("nmt with 2", (0, RecursiveMap_1.mk_map)(["c", type_k], ["b", type_k]), true);
// FailureMap([RedeclarationEntry("c", Type), SuccessEntry("c", Type)])
test_check_sig("nmt redeclaration", (0, RecursiveMap_1.mk_map)(["c", type_k], ["c", type_k]), false);
// Type
test_synthesize("constant family", (0, RecursiveMap_1.mk_map)(["c", type_k]), (0, RecursiveMap_1.mk_map)(), c, type_k);
// UndeclaredConstant(c)
test_synthesize("constant not in sig", (0, RecursiveMap_1.mk_map)(["b", type_k]), (0, RecursiveMap_1.mk_map)(), c, new sort_errors_1.UndeclaredConstant(c));
test_check_sig("family as sort", (0, RecursiveMap_1.mk_map)(["c", type_k], ["b", c]), true);
test_check_sig("family as invalid sort", (0, RecursiveMap_1.mk_map)(["b", c], ["c", type_k]), false);
test_check_sig("family as sort not in map", (0, RecursiveMap_1.mk_map)(["c", type_k], ["b", a]), false);
test_check_sig("redeclared constant good sort", (0, RecursiveMap_1.mk_map)(["a", type_k], ["b", type_k], ["a", b]), false);
test_check_ctx("nmt", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(["x", a]), true);
test_check_ctx("nmt bad sort", (0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)(["x", type_k]), false);
test_check_ctx("nmt with 2", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(["x", a], ["y", a]), true);
test_check_ctx("family as invalid sort", (0, RecursiveMap_1.mk_map)(["c", type_k], ["b", c]), (0, RecursiveMap_1.mk_map)(["y", c], ["x", b]), false);
test_check_ctx("family as invalid sort not at the end", (0, RecursiveMap_1.mk_map)(["c", type_k], ["b", c]), (0, RecursiveMap_1.mk_map)(["y", c], ["x", b], ["z", c]), false);
test_check_ctx("redeclaration", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(["x", a], ["x", a]), false);
test_check_ctx("redeclaration after the first one", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(["y", a], ["b", a], ["z", a], ["x", a], ["z", a], ["p", a]), false);
const test_check_ctx_and_report = (name, sig, ctx, output) => test(`check ctx and report ${name}`, () => expect((0, synthesize_type_1.check_ctx_and_report)(sig, ctx)).toEqual(output));
test_check_ctx_and_report("mt", (0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)(), []);
test_check_ctx_and_report("nmt", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(["x", a]), []);
// BadEntry("x", FailedCheck(type_k, type_k, kind_s))
test_check_ctx_and_report("nmt bad sort", (0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)(["x", type_k]), new ctx_errors_1.BadEntry("x", new sort_errors_1.FailedCheck(type_k, type_k, kind_s)));
test_check_ctx_and_report("nmt with 2", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(["x", a], ["y", a]), []);
// BadEntry("y", FailedCheck(b, type_k, c))
test_check_ctx_and_report("family as invalid sort", (0, RecursiveMap_1.mk_map)(["c", type_k], ["b", c]), (0, RecursiveMap_1.mk_map)(["x", c], ["y", b]), new ctx_errors_1.BadEntry("y", new sort_errors_1.FailedCheck(b, type_k, c)));
test_check_ctx_and_report("family as invalid sort not at the end", (0, RecursiveMap_1.mk_map)(["c", type_k], ["b", c]), (0, RecursiveMap_1.mk_map)(["y", c], ["x", b], ["z", c]), new ctx_errors_1.BadEntry("x", new sort_errors_1.FailedCheck(b, type_k, c)));
// RedeclaredVariable("x")
test_check_ctx_and_report("redeclaration", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(["x", a], ["x", a]), new sort_errors_1.RedeclaredVariable("x"));
test_check_ctx_and_report("redeclaration after the first one", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(["y", a], ["b", a], ["z", a], ["x", a], ["z", a], ["p", a]), new sort_errors_1.RedeclaredVariable("z"));
// Kind
test_synthesize("pi kind", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(), P(x, a, type_k), kind_s);
// Kind
test_synthesize("pi kind nested", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(), P(x, a, P(y, a, type_k)), kind_s);
// BadChild(P(z:x).Type, FailedCheck(x, Type, a))
test_synthesize("pi bad var sort", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(["x", a]), P(z, x, type_k), new sort_errors_1.BadChildSort(P(z, x, type_k), new sort_errors_1.FailedCheck(x, type_k, a)));
// BadChild(P(x:a).Type, VariableRedeclared(x))
test_synthesize("pi var in ctx", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(["x", a]), P(x, a, type_k), new sort_errors_1.BadChildSort(P(x, a, type_k), new sort_errors_1.RedeclaredVariable(x)));
// BadChild(P(x:a).b, FailedCheckFamilyOrKind(b, a))
test_synthesize("pi bad scope sort", (0, RecursiveMap_1.mk_map)(["a", type_k], ["b", a]), (0, RecursiveMap_1.mk_map)(), P(x, a, b), new sort_errors_1.BadChildSort(P(x, a, b), new sort_errors_1.FailedCheckFamilyOrKind(b, a)));
const synthed = (0, synthesize_type_1.synthesize)(new env_1.Env((0, RecursiveMap_1.mk_map)(["a", type_k], ["b", a]), (0, RecursiveMap_1.mk_map)(), mt_map), P(x, a, b));
// Type
test_synthesize("pi family", (0, RecursiveMap_1.mk_map)(["a", type_k], ["b", type_k]), (0, RecursiveMap_1.mk_map)(), P(x, a, b), type_k);
// Type
test_synthesize("pi family nested", (0, RecursiveMap_1.mk_map)(["a", type_k], ["b", type_k]), (0, RecursiveMap_1.mk_map)(), P(x, P(y, b, a), P(y, a, b)), type_k);
// BadChild(P(x:Type).a, FailedCheck(Type, Type, Kind))
test_synthesize("pi invalid var family", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(), P(x, type_k, a), new sort_errors_1.BadChildSort(P(x, type_k, a), new sort_errors_1.FailedCheck(type_k, type_k, kind_s)));
// BadChild(P(x:a).a, VariableRedeclared(x))
test_synthesize("pi var in ctx", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(["x", a]), P(x, a, a), new sort_errors_1.BadChildSort(P(x, a, a), new sort_errors_1.RedeclaredVariable(x)));
test_check_sig("complex kind", (0, RecursiveMap_1.mk_map)(["a", type_k], ["b", P(x, a, type_k)]), true);
// BadChild(P(x:a).b, FailedCheckFamilyOrKind(b, P(x:a).Type))
test_synthesize("pi neither kind nor family", (0, RecursiveMap_1.mk_map)(["a", type_k], ["b", P(x, a, type_k)]), (0, RecursiveMap_1.mk_map)(), P(x, a, b), new sort_errors_1.BadChildSort(P(x, a, b), new sort_errors_1.FailedCheckFamilyOrKind(b, P(x, a, type_k))));
// P(x:a).Type
test_synthesize("lambda family", (0, RecursiveMap_1.mk_map)(["a", type_k], ["b", type_k]), (0, RecursiveMap_1.mk_map)(), L(x, a, b), P(x, a, type_k));
// Px:b.Px:a.Type
test_synthesize("lambda rename", (0, RecursiveMap_1.mk_map)(["b", type_k], ["a", P(x, a, type_k)]), (0, RecursiveMap_1.mk_map)(), L(x, b, a), P(x, b, P(x, a, type_k)));
// BadChild(L(x:b).a, FailedCheck(b, Type, a))
test_synthesize("lambda bad var family", (0, RecursiveMap_1.mk_map)(["a", type_k], ["b", a]), (0, RecursiveMap_1.mk_map)(), L(x, b, a), new sort_errors_1.BadChildSort(L(x, b, a), new sort_errors_1.FailedCheck(b, type_k, a)));
// BadChild(L(x:b).a, VariableRedeclared(x))
test_synthesize("lambda var in ctx", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(["x", a]), L(x, b, a), new sort_errors_1.BadChildSort(L(x, b, a), new sort_errors_1.RedeclaredVariable(x)));
// P(x:a).Type
test_synthesize("lambda var not in ctx", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(["y", a]), L(x, a, a), P(x, a, type_k));
// a
test_synthesize("variable in ctx", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(["x", a]), x, a);
// UndeclaredVariable(x)
test_synthesize("variable not in ctx", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(["y", a]), x, new sort_errors_1.UndeclaredVariable(x));
// a
test_synthesize("constant variable same id", (0, RecursiveMap_1.mk_map)(["x", type_k], ["a", type_k]), (0, RecursiveMap_1.mk_map)(["x", a]), x, a);
// Type
test_synthesize("variable constant same id", (0, RecursiveMap_1.mk_map)(["x", type_k], ["a", type_k]), (0, RecursiveMap_1.mk_map)(["x", a]), new ast_1.Constant("x"), type_k);
// [a: Type, b: Type], [x: Px:a.b, y: a], x(y) |-> b
test_synthesize("app", (0, RecursiveMap_1.mk_map)(["a", type_k], ["b", type_k]), (0, RecursiveMap_1.mk_map)(["x", P(x, a, b)], ["y", a]), A(x, y), b);
// [a: Type, b: Type], [y: a], (Lx:a.b)(y) |-> Type
test_synthesize("app beta redex", (0, RecursiveMap_1.mk_map)(["a", type_k], ["b", type_k]), (0, RecursiveMap_1.mk_map)(["y", a]), A(L(x, a, b), y), type_k);
// BadChild(a y, FailedCheckPi(a, Type))
test_synthesize("app bad major", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(["y", a]), A(a, y), new sort_errors_1.BadChildSort(A(a, y), new sort_errors_1.FailedCheckPi(a, type_k)));
// BadChild(x b, FailedCheck(b, a, Type))
test_synthesize("app bad minor", (0, RecursiveMap_1.mk_map)(["a", type_k], ["b", type_k]), (0, RecursiveMap_1.mk_map)(["x", P(x, a, b)], ["y", a]), A(x, b), new sort_errors_1.BadChildSort(A(x, b), new sort_errors_1.FailedCheck(b, a, type_k)));
// More complex tests
const type_checking_examples_1 = __importDefault(require("../../src/logical_framework/type_checking_examples"));
for (const example of type_checking_examples_1.default) {
    let sig = example.sig;
    if (example.ast instanceof ast_1.Constant) {
        sig = example.sig.add(example.ast.id, example.sort);
        test_check_sig(`check sig ${example.name}`, sig, true);
    }
    test_synthesize(example.name, sig, example.ctx, example.ast, example.sort);
}
function safe_parse(input) {
    const parsed = (0, lambda_pi_parser_1.parse)(input);
    if (parsed === undefined)
        throw new Error("Trying to parse unparseable!");
    return parsed;
}
const maclogic_sig_1 = __importDefault(require("../../src/logical_framework/maclogic_sig"));
test_synthesize("(A & B) \\/ (A & C) |- A", maclogic_sig_1.default, (0, RecursiveMap_1.mk_map)(), safe_parse("L(A: o).L(B: o).L(C: o).L(u1 : ml (or (and A B) (and A C))).ore (and A B) (and A C) A u1 (L(u2: ml (and A B)).andel A B u2) (L(u2: ml (and A C)).andel A C u2)"), (0, lambda_pi_parser_1.parse)("P(A: o).P(B: o).P(C: o).P(u1: ml (or (and A B) (and A C))).ml A"));
function test_check_and_report(name, sig, ctx, ast, sort, output) {
    const result = (0, synthesize_type_1.check_and_report)(new env_1.Env(sig, ctx, mt_map), ast, sort);
    test(`check_and_report ${name}`, () => expect(result).toEqual(output));
}
test_check_and_report("doesn't synth", (0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)(), x, type_k, new sort_errors_1.UndeclaredVariable(x));
test_check_and_report("equality fails", (0, RecursiveMap_1.mk_map)(["a", type_k], ["b", type_k]), (0, RecursiveMap_1.mk_map)(["x", b]), x, type_k, new sort_errors_1.FailedCheck(x, type_k, b));
test_check_and_report("success", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(), a, type_k, true);
function test_check_mctx(name, sig, ctx, mctx, output) {
    const result = (0, synthesize_type_1.check_meta_ctx)(sig, ctx, mctx);
    test(`check_meta_ctx ${name}`, () => expect(result).toEqual(output));
}
test_check_mctx("empty everything", (0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)(), true);
test_check_mctx("empty mctx", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(["x", a]), (0, RecursiveMap_1.mk_map)(), true);
test_check_mctx("successful non-empty", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(["x", a]), (0, RecursiveMap_1.mk_map)(["X0", a]), true);
test_check_mctx("unsuccessful sort doesn't synthesize", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)(["X0", x]), false);
test_check_mctx("successful sort synthesizes Kind", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)(["X0", a], ["X2", type_k]), true);
test_check_mctx("unsuccessful redeclaration", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)(["X0", a], ["X2", type_k], ["X0", x]), false);
test_check_mctx("unsuccessful sort synthesizes to non-Type/Kind", (0, RecursiveMap_1.mk_map)(["a", type_k]), (0, RecursiveMap_1.mk_map)(["b", a]), (0, RecursiveMap_1.mk_map)(["X0", a], ["X2", b]), false);
const test_env_synthesis = (name, env, ast, output) => test(`check_env_synthesis ${name}`, () => expect((0, synthesize_type_1.synthesize)(env, ast)).toEqual(output));
const X0 = new ast_1.MetaVariable("X0");
test_env_synthesis("undeclared metavariable", new env_1.Env((0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)()), X0, new sort_errors_1.UndeclaredMetaVariable(X0));
test_env_synthesis("declared metavariable", new env_1.Env((0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)(["X0", type_k])), X0, type_k);

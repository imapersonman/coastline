import { KindSort, Sort } from "../../src/logical_framework/sort";
import { Application, Ast, Constant, GeneratedVariable, Lambda, MetaVariable, Pi, TypeKind, Variable } from "../../src/lambda_pi/ast";
import { parse } from "../../src/lambda_pi/parsers/lambda_pi_parser";
import { mk_map, RecursiveMap } from "../../src/map/RecursiveMap";
import { check_and_report, check_ctx, check_meta_ctx, check_sig, synthesize, check_ctx_and_report } from "../../src/logical_framework/synthesize_type";
import { Env } from "../../src/logical_framework/env"
import { BadChildSort, FailedCheck, FailedCheckFamilyOrKind, FailedCheckPi, RedeclaredVariable, SortError, UndeclaredConstant, UndeclaredMetaVariable, UndeclaredVariable } from "../../src/logical_framework/sort_errors";
import { BadEntry, FailedCtxCheck } from "../../src/logical_framework/ctx_errors"

type Sig = RecursiveMap<Ast>
type Ctx = RecursiveMap<Ast>

const mt_map = RecursiveMap.empty<Ast>()

function test_synthesize(name: string, sig: Sig, ctx: Ctx, ast: Ast, output: Sort | SortError) {
    const result = synthesize(new Env(sig, ctx, mt_map), ast)
    test(`synthesize ${name}`, () => expect(result).toEqual(output))
}

function test_check_sig(name: string, sig: Sig, output: boolean) {
    test(`check sig ${name}`, () => expect(check_sig(sig)).toEqual(output))
}

function test_check_ctx(name: string, sig: Sig, ctx: Ctx, output: boolean) {
    test(`check ctx ${name}`, () => expect(check_ctx(sig, ctx)).toEqual(output))
}

const gv = (base: string, index: number) => new GeneratedVariable(base, index)
const P = (b: Variable, t: Ast, s: Ast) => new Pi(b, t, s)
const L = (b: Variable, t: Ast, s: Ast) => new Lambda(b, t, s)
const A = (h: Ast, a: Ast) => new Application(h, a)
const type_k = new TypeKind
const kind_s = new KindSort
const [a, c, b] = [new Constant("a"), new Constant("c"), new Constant("b")]
const [x, y, z] = [new Variable("x"), new Variable("y"), new Variable("z")]
// SuccessMap([])
test_check_sig("mt", mk_map(), true)
// SuccessMap([])
test_check_ctx("mt", mk_map(), mk_map(), true)
// Kind
test_synthesize("Type", mk_map(), mk_map(), type_k, kind_s)
// SuccessMap([SuccessEntry("c", Ann(Type, Kind))])
test_check_sig("valid nmt", mk_map(["c", type_k]), true)
// FailureMap([FailureEntry("c", Ann(b, UnknownSort))])
test_check_sig("nmt bad sort", mk_map(["c", b]), false)
// SuccessMap([SuccessEntry("c", Ann(Type, Kind)), SuccessEntry("b", Ann(Type, Kind))])
test_check_sig("nmt with 2", mk_map(["c", type_k], ["b", type_k]), true)
// FailureMap([RedeclarationEntry("c", Type), SuccessEntry("c", Type)])
test_check_sig("nmt redeclaration", mk_map(["c", type_k], ["c", type_k]), false)
// Type
test_synthesize("constant family", mk_map(["c", type_k]), mk_map(), c, type_k)
// UndeclaredConstant(c)
test_synthesize("constant not in sig", mk_map(["b", type_k]), mk_map(), c, new UndeclaredConstant(c))
test_check_sig("family as sort", mk_map(["c", type_k], ["b", c]), true)
test_check_sig("family as invalid sort", mk_map(["b", c], ["c", type_k]), false)
test_check_sig("family as sort not in map", mk_map(["c", type_k], ["b", a]), false)
test_check_sig("redeclared constant good sort", mk_map(["a", type_k], ["b", type_k], ["a", b]), false)
test_check_ctx("nmt", mk_map(["a", type_k]), mk_map(["x", a]), true)
test_check_ctx("nmt bad sort", mk_map(), mk_map(["x", type_k]), false)
test_check_ctx("nmt with 2", mk_map(["a", type_k]), mk_map(["x", a], ["y", a]), true)
test_check_ctx("family as invalid sort", mk_map(["c", type_k], ["b", c]), mk_map(["y", c], ["x", b]), false)
test_check_ctx("family as invalid sort not at the end", mk_map(["c", type_k], ["b", c]), mk_map(["y", c], ["x", b], ["z", c]), false)
test_check_ctx("redeclaration", mk_map(["a", type_k]), mk_map(["x", a], ["x", a]), false)
test_check_ctx("redeclaration after the first one", mk_map(["a", type_k]), mk_map(["y", a], ["b", a], ["z", a], ["x", a], ["z", a], ["p", a]), false)

const test_check_ctx_and_report = (name: string, sig: Sig, ctx: Ctx, output: [] | FailedCtxCheck) =>
    test(`check ctx and report ${name}`, () => expect(check_ctx_and_report(sig, ctx)).toEqual(output))
test_check_ctx_and_report("mt", mk_map(), mk_map(), [])
test_check_ctx_and_report("nmt", mk_map(["a", type_k]), mk_map(["x", a]), [])
// BadEntry("x", FailedCheck(type_k, type_k, kind_s))
test_check_ctx_and_report("nmt bad sort", mk_map(), mk_map(["x", type_k]), new BadEntry("x", new FailedCheck(type_k, type_k, kind_s)))
test_check_ctx_and_report("nmt with 2", mk_map(["a", type_k]), mk_map(["x", a], ["y", a]), [])
// BadEntry("y", FailedCheck(b, type_k, c))
test_check_ctx_and_report("family as invalid sort", mk_map(["c", type_k], ["b", c]), mk_map(["x", c], ["y", b]), new BadEntry("y", new FailedCheck(b, type_k, c)))
test_check_ctx_and_report("family as invalid sort not at the end", mk_map(["c", type_k], ["b", c]), mk_map(["y", c], ["x", b], ["z", c]), new BadEntry("x", new FailedCheck(b, type_k, c)))
// RedeclaredVariable("x")
test_check_ctx_and_report("redeclaration", mk_map(["a", type_k]), mk_map(["x", a], ["x", a]), new RedeclaredVariable("x"))
test_check_ctx_and_report("redeclaration after the first one", mk_map(["a", type_k]), mk_map(["y", a], ["b", a], ["z", a], ["x", a], ["z", a], ["p", a]), new RedeclaredVariable("z"))


// Kind
test_synthesize("pi kind", mk_map(["a", type_k]), mk_map(), P(x, a, type_k), kind_s)
// Kind
test_synthesize("pi kind nested", mk_map(["a", type_k]), mk_map(), P(x, a, P(y, a, type_k)), kind_s)
// BadChild(P(z:x).Type, FailedCheck(x, Type, a))
test_synthesize("pi bad var sort", mk_map(["a", type_k]), mk_map(["x", a]), P(z, x, type_k), new BadChildSort(P(z, x, type_k), new FailedCheck(x, type_k, a)))
// BadChild(P(x:a).Type, VariableRedeclared(x))
test_synthesize("pi var in ctx", mk_map(["a", type_k]), mk_map(["x", a]), P(x, a, type_k), new BadChildSort(P(x, a, type_k), new RedeclaredVariable(x)))
// BadChild(P(x:a).b, FailedCheckFamilyOrKind(b, a))
test_synthesize("pi bad scope sort", mk_map(["a", type_k], ["b", a]), mk_map(), P(x, a, b), new BadChildSort(P(x, a, b), new FailedCheckFamilyOrKind(b, a)))
const synthed = synthesize(new Env(mk_map(["a", type_k], ["b", a]), mk_map(), mt_map), P(x, a, b))
// Type
test_synthesize("pi family", mk_map(["a", type_k], ["b", type_k]), mk_map(), P(x, a, b), type_k)
// Type
test_synthesize("pi family nested", mk_map(["a", type_k], ["b", type_k]), mk_map(), P(x, P(y, b, a), P(y, a, b)), type_k)
// BadChild(P(x:Type).a, FailedCheck(Type, Type, Kind))
test_synthesize("pi invalid var family", mk_map(["a", type_k]), mk_map(), P(x, type_k, a), new BadChildSort(P(x, type_k, a), new FailedCheck(type_k, type_k, kind_s)))
// BadChild(P(x:a).a, VariableRedeclared(x))
test_synthesize("pi var in ctx", mk_map(["a", type_k]), mk_map(["x", a]), P(x, a, a), new BadChildSort(P(x, a, a), new RedeclaredVariable(x)))
test_check_sig("complex kind", mk_map(["a", type_k], ["b", P(x, a, type_k)]), true)
// BadChild(P(x:a).b, FailedCheckFamilyOrKind(b, P(x:a).Type))
test_synthesize("pi neither kind nor family", mk_map(["a", type_k], ["b", P(x, a, type_k)]), mk_map(), P(x, a, b), new BadChildSort(P(x, a, b), new FailedCheckFamilyOrKind(b, P(x, a, type_k))))
// P(x:a).Type
test_synthesize("lambda family", mk_map(["a", type_k], ["b", type_k]), mk_map(), L(x, a, b), P(x, a, type_k))
// Px:b.Px:a.Type
test_synthesize("lambda rename", mk_map(["b", type_k], ["a", P(x, a, type_k)]), mk_map(), L(x, b, a), P(x, b, P(x, a, type_k)))
// BadChild(L(x:b).a, FailedCheck(b, Type, a))
test_synthesize("lambda bad var family", mk_map(["a", type_k], ["b", a]), mk_map(), L(x, b, a), new BadChildSort(L(x, b, a), new FailedCheck(b, type_k, a)))
// BadChild(L(x:b).a, VariableRedeclared(x))
test_synthesize("lambda var in ctx", mk_map(["a", type_k]), mk_map(["x", a]), L(x, b, a), new BadChildSort(L(x, b, a), new RedeclaredVariable(x)))
// P(x:a).Type
test_synthesize("lambda var not in ctx", mk_map(["a", type_k]), mk_map(["y", a]), L(x, a, a), P(x, a, type_k))
// a
test_synthesize("variable in ctx", mk_map(["a", type_k]), mk_map(["x", a]), x, a)
// UndeclaredVariable(x)
test_synthesize("variable not in ctx", mk_map(["a", type_k]), mk_map(["y", a]), x, new UndeclaredVariable(x))
// a
test_synthesize("constant variable same id", mk_map(["x", type_k], ["a", type_k]), mk_map(["x", a]), x, a)
// Type
test_synthesize("variable constant same id", mk_map(["x", type_k], ["a", type_k]), mk_map(["x", a]), new Constant("x"), type_k)
// [a: Type, b: Type], [x: Px:a.b, y: a], x(y) |-> b
test_synthesize("app", mk_map(["a", type_k], ["b", type_k]), mk_map<Ast>(["x", P(x, a, b)], ["y", a]), A(x, y), b)
// [a: Type, b: Type], [y: a], (Lx:a.b)(y) |-> Type
test_synthesize("app beta redex", mk_map(["a", type_k], ["b", type_k]), mk_map(["y", a]), A(L(x, a, b), y), type_k)
// BadChild(a y, FailedCheckPi(a, Type))
test_synthesize("app bad major", mk_map(["a", type_k]), mk_map(["y", a]), A(a, y), new BadChildSort(A(a, y), new FailedCheckPi(a, type_k)))
// BadChild(x b, FailedCheck(b, a, Type))
test_synthesize("app bad minor", mk_map(["a", type_k], ["b", type_k]), mk_map<Ast>(["x", P(x, a, b)], ["y", a]), A(x, b), new BadChildSort(A(x, b), new FailedCheck(b, a, type_k)))

// More complex tests
import examples from "../../src/logical_framework/type_checking_examples"
for (const example of examples) {
    let sig = example.sig
    if (example.ast instanceof Constant) {
        sig = example.sig.add(example.ast.id, example.sort)
        test_check_sig(`check sig ${example.name}`, sig, true)
    }
    test_synthesize(example.name, sig, example.ctx, example.ast, example.sort)
}

function safe_parse(input: string): Ast {
    const parsed = parse(input)
    if (parsed === undefined) throw new Error("Trying to parse unparseable!")
    return parsed
}

import MacLogic from "../../src/logical_framework/maclogic_sig"

test_synthesize("(A & B) \\/ (A & C) |- A", MacLogic, mk_map(), safe_parse("L(A: o).L(B: o).L(C: o).L(u1 : ml (or (and A B) (and A C))).ore (and A B) (and A C) A u1 (L(u2: ml (and A B)).andel A B u2) (L(u2: ml (and A C)).andel A C u2)"),
    parse("P(A: o).P(B: o).P(C: o).P(u1: ml (or (and A B) (and A C))).ml A"))

function test_check_and_report(name: string, sig: Sig, ctx: Ctx, ast: Ast, sort: Sort, output: true | SortError) {
    const result = check_and_report(new Env(sig, ctx, mt_map), ast, sort)
    test(`check_and_report ${name}`, () => expect(result).toEqual(output))
}

test_check_and_report("doesn't synth", mk_map(), mk_map(), x, type_k, new UndeclaredVariable(x))
test_check_and_report("equality fails", mk_map(["a", type_k], ["b", type_k]), mk_map(["x", b]), x, type_k, new FailedCheck(x, type_k, b))
test_check_and_report("success", mk_map(["a", type_k]), mk_map(), a, type_k, true)

function test_check_mctx(name: string, sig: Sig, ctx: Ctx, mctx: Ctx, output: boolean) {
    const result = check_meta_ctx(sig, ctx, mctx)
    test(`check_meta_ctx ${name}`, () => expect(result).toEqual(output))
}

test_check_mctx("empty everything", mk_map(), mk_map(), mk_map(), true)
test_check_mctx("empty mctx", mk_map(["a", type_k]), mk_map(["x", a]), mk_map(), true)
test_check_mctx("successful non-empty", mk_map(["a", type_k]), mk_map(["x", a]), mk_map(["X0", a]), true)
test_check_mctx("unsuccessful sort doesn't synthesize", mk_map(["a", type_k]), mk_map(), mk_map(["X0", x]), false)
test_check_mctx("successful sort synthesizes Kind", mk_map(["a", type_k]), mk_map(), mk_map(["X0", a], ["X2", type_k]), true)
test_check_mctx("unsuccessful redeclaration", mk_map(["a", type_k]), mk_map(), mk_map(["X0", a], ["X2", type_k], ["X0", x]), false)
test_check_mctx("unsuccessful sort synthesizes to non-Type/Kind", mk_map(["a", type_k]), mk_map(["b", a]), mk_map(["X0", a], ["X2", b]), false)

const test_env_synthesis = (name: string, env: Env, ast: Ast, output: Sort | SortError) =>
    test(`check_env_synthesis ${name}`, () => expect(synthesize(env, ast)).toEqual(output))

const X0 = new MetaVariable("X0")
test_env_synthesis("undeclared metavariable", new Env(mk_map(), mk_map(), mk_map()), X0, new UndeclaredMetaVariable(X0))
test_env_synthesis("declared metavariable", new Env(mk_map(), mk_map(), mk_map(["X0", type_k])), X0, type_k)
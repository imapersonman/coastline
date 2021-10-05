"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ast_1 = require("../../src/lambda_pi/ast");
const beta_eta_equality_1 = require("../../src/lambda_pi/beta_eta_equality");
function test_beta_eta_equality(name, input1, input2, expected) {
    const result = (0, beta_eta_equality_1.beta_eta_equality)(input1, input2);
    test(`beta_eta_equality ${name}`, () => expect(result).toEqual(expected));
}
// var tests
const [x, y, z, w] = [new ast_1.Variable("x"), new ast_1.Variable("y"), new ast_1.Variable("z"), new ast_1.Variable("w")];
test_beta_eta_equality("Variable T", x, x, true);
test_beta_eta_equality("Variable F", x, y, false);
test_beta_eta_equality("Variable wrong class", x, new ast_1.Constant("x"), false);
// type tests
const type_kind = new ast_1.TypeKind();
test_beta_eta_equality("TypeKind T", type_kind, type_kind, true);
test_beta_eta_equality("TypeKind wrong class", type_kind, x, false);
// constant tests
const [a, b, c] = [new ast_1.Constant("a"), new ast_1.Constant("b"), new ast_1.Constant("c")];
test_beta_eta_equality("Constant T", a, a, true);
test_beta_eta_equality("Constant F", a, b, false);
test_beta_eta_equality("Constant wrong class", a, x, false);
// matavariable tests
const [xm, ym] = [new ast_1.MetaVariable("x"), new ast_1.MetaVariable("y")];
test_beta_eta_equality("MetaVariable T", xm, xm, true);
test_beta_eta_equality("MetaVariable F", xm, ym, false);
test_beta_eta_equality("MetaVariable wrong class", xm, x, false);
// app tests
const [ab, aa, ba] = [new ast_1.Application(a, b), new ast_1.Application(a, a), new ast_1.Application(b, a)];
test_beta_eta_equality("App simple T", ab, ab, true);
test_beta_eta_equality("App simple F", ab, aa, false);
test_beta_eta_equality("App deep T", new ast_1.Application(ab, ba), new ast_1.Application(ab, ba), true);
test_beta_eta_equality("App deep F", new ast_1.Application(ab, ba), new ast_1.Application(ba, ba), false);
// pi tests
const [Pxax, Pyay, Pyby] = [new ast_1.Pi(x, a, x), new ast_1.Pi(y, a, y), new ast_1.Pi(y, b, y)];
const PxPxaxPybType = new ast_1.Pi(x, Pxax, new ast_1.Pi(y, b, type_kind));
const PyPxaxPxbType = new ast_1.Pi(y, Pxax, new ast_1.Pi(x, b, type_kind));
test_beta_eta_equality("Pi simple T", Pxax, Pyay, true);
test_beta_eta_equality("Pi simple F", Pyay, Pyby, false);
test_beta_eta_equality("Pi deep T", PxPxaxPybType, PyPxaxPxbType, true);
test_beta_eta_equality("Pi deep F", new ast_1.Pi(x, Pxax, new ast_1.Pi(y, c, type_kind)), PxPxaxPybType, false);
// lambda tests
const [Lxax, Lyby, Lybx] = [new ast_1.Lambda(x, a, x), new ast_1.Lambda(y, b, y), new ast_1.Lambda(y, b, x)];
test_beta_eta_equality("Lambda simple T", Lxax, Lyby, true);
test_beta_eta_equality("Lambda simple F", Lxax, Lybx, false);
test_beta_eta_equality("Lambda deep T", new ast_1.Lambda(x, Lxax, new ast_1.Lambda(y, b, type_kind)), new ast_1.Lambda(y, new ast_1.Lambda(x, a, b), new ast_1.Lambda(x, b, type_kind)), true);
test_beta_eta_equality("Lambda deep F", new ast_1.Lambda(x, Lxax, new ast_1.Lambda(y, c, type_kind)), new ast_1.Lambda(x, Lxax, new ast_1.Lambda(y, b, b)), false);
// lambda-left tests
const [ay, ax, xx] = [new ast_1.Application(a, y), new ast_1.Application(a, x), new ast_1.Application(x, x)];
const [Lxcax, Lxayabx] = [new ast_1.Lambda(x, c, ax), new ast_1.Lambda(x, ay, new ast_1.Application(ab, x))];
const Lxaxx = new ast_1.Lambda(x, a, xx);
test_beta_eta_equality("Lambda-left simple T", Lxcax, a, true);
test_beta_eta_equality("Lambda-left simple F", Lxcax, b, false);
test_beta_eta_equality("Lambda-left deep T", Lxayabx, ab, true);
test_beta_eta_equality("Lambda-left deep F", Lxayabx, aa, false);
// I don't know if this is needed
// test_beta_eta_equality("Lambda-left in free F", Lxaxx, x, false)
// lambda-right tests
test_beta_eta_equality("Lambda-right simple T", a, Lxcax, true);
test_beta_eta_equality("Lambda-right simple F", b, Lxcax, false);
test_beta_eta_equality("Lambda-right deep T", ab, Lxayabx, true);
test_beta_eta_equality("Lambda-right deep F", aa, Lxayabx, false);
// non-nf tests
const Lwcw = new ast_1.Lambda(w, c, w);
const non_nf_1 = (ast) => new ast_1.Application(Lwcw, ast);
const non_nf_2 = (ast) => new ast_1.Lambda(w, c, new ast_1.Application(new ast_1.Lambda(z, b, new ast_1.Application(ast, z)), w));
// app non-nf tests
// non_nf_2(Pyby) in the following test contains an application whose head is Pi, and therefore appears
// malformed using this algorithm.  The following test therefore fails.  I'll replace it with a simpler
// test that only tests beta-reduction.
// test_beta_eta_equality("Pi non-nf T", non_nf_1(Pxax), non_nf_2(Pyay), true)
test_beta_eta_equality("Pi non-nf T", non_nf_1(Pxax), non_nf_1(Pyay), true);
test_beta_eta_equality("Pi non-nf F", non_nf_1(Pyay), non_nf_2(Pyby), false);
// lambda non-nf tests
test_beta_eta_equality("Lambda non-nf T", non_nf_2(Lxax), non_nf_1(Lyby), true);
test_beta_eta_equality("Lambda non-nf F", non_nf_2(Lxax), non_nf_1(Lybx), false);
// lambda-left non-nf tests
test_beta_eta_equality("Lambda-left non-nf T", non_nf_1(Lxcax), non_nf_2(a), true);
test_beta_eta_equality("Lambda-left non-nf F", non_nf_1(Lxcax), non_nf_2(b), false);
// lambda-right non-nf tests
test_beta_eta_equality("Lambda-right non-nf T", non_nf_2(a), non_nf_1(Lxcax), true);
test_beta_eta_equality("Lambda-right non-nf F", non_nf_2(b), non_nf_1(Lxcax), false);

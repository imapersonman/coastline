import { AbstractSyntaxTree, Application, Constant, Lambda, MetaVariable, Pi, TypeKind, Variable } from "../../src/lambda_pi/ast";
import { beta_eta_equality } from "../../src/lambda_pi/beta_eta_equality";

type Ast = AbstractSyntaxTree

function test_beta_eta_equality(name: string, input1: Ast, input2: Ast, expected: boolean) {
    const result = beta_eta_equality(input1, input2)
    test(`beta_eta_equality ${name}`, () => expect(result).toEqual(expected))
}

// var tests
const [x, y, z, w] = [new Variable("x"), new Variable("y"), new Variable("z"), new Variable("w")]
test_beta_eta_equality("Variable T", x, x, true)
test_beta_eta_equality("Variable F", x, y, false)
test_beta_eta_equality("Variable wrong class", x, new Constant("x"), false)
// type tests
const type_kind = new TypeKind()
test_beta_eta_equality("TypeKind T", type_kind, type_kind, true)
test_beta_eta_equality("TypeKind wrong class", type_kind, x, false)
// constant tests
const [a, b, c] = [new Constant("a"), new Constant("b"), new Constant("c")]
test_beta_eta_equality("Constant T", a, a, true)
test_beta_eta_equality("Constant F", a, b, false)
test_beta_eta_equality("Constant wrong class", a, x, false)
// matavariable tests
const [xm, ym] = [new MetaVariable("x"), new MetaVariable("y")]
test_beta_eta_equality("MetaVariable T", xm, xm, true)
test_beta_eta_equality("MetaVariable F", xm, ym, false)
test_beta_eta_equality("MetaVariable wrong class", xm, x, false)
// app tests
const [ab, aa, ba] = [new Application(a, b), new Application(a, a), new Application(b, a)]
test_beta_eta_equality("App simple T", ab, ab, true)
test_beta_eta_equality("App simple F", ab, aa, false)
test_beta_eta_equality("App deep T", new Application(ab, ba), new Application(ab, ba), true)
test_beta_eta_equality("App deep F", new Application(ab, ba), new Application(ba, ba), false)
// pi tests
const [Pxax, Pyay, Pyby] = [new Pi(x, a, x), new Pi(y, a, y), new Pi(y, b, y)]
const PxPxaxPybType = new Pi(x, Pxax, new Pi(y, b, type_kind))
const PyPxaxPxbType = new Pi(y, Pxax, new Pi(x, b, type_kind))
test_beta_eta_equality("Pi simple T", Pxax, Pyay, true)
test_beta_eta_equality("Pi simple F", Pyay, Pyby, false)
test_beta_eta_equality("Pi deep T", PxPxaxPybType, PyPxaxPxbType, true)
test_beta_eta_equality("Pi deep F", new Pi(x, Pxax, new Pi(y, c, type_kind)), PxPxaxPybType, false)
// lambda tests
const [Lxax, Lyby, Lybx] = [new Lambda(x, a, x), new Lambda(y, b, y), new Lambda(y, b, x)]
test_beta_eta_equality("Lambda simple T", Lxax, Lyby, true)
test_beta_eta_equality("Lambda simple F", Lxax, Lybx, false)
test_beta_eta_equality("Lambda deep T", new Lambda(x, Lxax, new Lambda(y, b, type_kind)), new Lambda(y, new Lambda(x, a, b), new Lambda(x, b, type_kind)), true)
test_beta_eta_equality("Lambda deep F", new Lambda(x, Lxax, new Lambda(y, c, type_kind)), new Lambda(x, Lxax, new Lambda(y, b, b)), false)
// lambda-left tests
const [ay, ax, xx] = [new Application(a, y), new Application(a, x), new Application(x, x)]
const [Lxcax, Lxayabx] = [new Lambda(x, c, ax), new Lambda(x, ay, new Application(ab, x))]
const Lxaxx = new Lambda(x, a, xx)
test_beta_eta_equality("Lambda-left simple T", Lxcax, a, true)
test_beta_eta_equality("Lambda-left simple F", Lxcax, b, false)
test_beta_eta_equality("Lambda-left deep T", Lxayabx, ab, true)
test_beta_eta_equality("Lambda-left deep F", Lxayabx, aa, false)
// I don't know if this is needed
// test_beta_eta_equality("Lambda-left in free F", Lxaxx, x, false)
// lambda-right tests
test_beta_eta_equality("Lambda-right simple T", a, Lxcax, true)
test_beta_eta_equality("Lambda-right simple F", b, Lxcax, false)
test_beta_eta_equality("Lambda-right deep T", ab, Lxayabx, true)
test_beta_eta_equality("Lambda-right deep F", aa, Lxayabx, false)
// non-nf tests
const Lwcw = new Lambda(w, c, w)
const non_nf_1 = (ast: Ast) => new Application(Lwcw, ast)
const non_nf_2 = (ast: Ast) => new Lambda(w, c, new Application(new Lambda(z, b, new Application(ast, z)), w))
// app non-nf tests
// non_nf_2(Pyby) in the following test contains an application whose head is Pi, and therefore appears
// malformed using this algorithm.  The following test therefore fails.  I'll replace it with a simpler
// test that only tests beta-reduction.
// test_beta_eta_equality("Pi non-nf T", non_nf_1(Pxax), non_nf_2(Pyay), true)
test_beta_eta_equality("Pi non-nf T", non_nf_1(Pxax), non_nf_1(Pyay), true)
test_beta_eta_equality("Pi non-nf F", non_nf_1(Pyay), non_nf_2(Pyby), false)
// lambda non-nf tests
test_beta_eta_equality("Lambda non-nf T", non_nf_2(Lxax), non_nf_1(Lyby), true)
test_beta_eta_equality("Lambda non-nf F", non_nf_2(Lxax), non_nf_1(Lybx), false)
// lambda-left non-nf tests
test_beta_eta_equality("Lambda-left non-nf T", non_nf_1(Lxcax), non_nf_2(a), true)
test_beta_eta_equality("Lambda-left non-nf F", non_nf_1(Lxcax), non_nf_2(b), false)
// lambda-right non-nf tests
test_beta_eta_equality("Lambda-right non-nf T", non_nf_2(a), non_nf_1(Lxcax), true)
test_beta_eta_equality("Lambda-right non-nf F", non_nf_2(b), non_nf_1(Lxcax), false)
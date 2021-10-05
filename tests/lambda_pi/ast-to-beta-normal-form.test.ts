import { AbstractSyntaxTree, Application, Constant, Lambda, MetaVariable, Pi, TypeKind, Variable } from "../../src/lambda_pi/ast";
import { to_beta_normal_form } from "../../src/lambda_pi/to_beta_normal_form";

type Ast = AbstractSyntaxTree

function test_to_beta_normal_form(name: string, input: Ast, expected: Ast) {
    const result = to_beta_normal_form(input)
    test(`to_beta_normal_form ${name}`, () => expect(result).toEqual(expected))
}

// Atomic tests
const [a, b, c] = [new Constant("a"), new Constant("b"), new Constant("c")]
test_to_beta_normal_form("Constant", c, c)
const [x, y, z] = [new Variable("x"), new Variable("y"), new Variable("z")]
test_to_beta_normal_form("Variable", x, x)
const type_kind = new TypeKind()
test_to_beta_normal_form("TypeKind", type_kind, type_kind)
test_to_beta_normal_form("MetaVariable", new MetaVariable("x"), new MetaVariable("x"))
// Shallow non-redex tests
const [cx, ya] = [new Application(c, x), new Application(y, a)]
test_to_beta_normal_form("shallow application", cx, cx)
const [lambda_constant, lambda_identity] = [new Lambda(x, a, c), new Lambda(x, a, x)]
test_to_beta_normal_form("shallow lambda", lambda_constant, lambda_constant)
const pi_constant = new Pi(x, a, c)
test_to_beta_normal_form("shallow pi", pi_constant, pi_constant)
// Deep no redex tests
const cx_ya = new Application(cx, ya)
test_to_beta_normal_form("deep application no-redex", cx_ya, cx_ya)
const Lx_cxya_cxya = new Lambda(x, cx_ya, cx_ya)
test_to_beta_normal_form("deep lambda no-redex", Lx_cxya_cxya, Lx_cxya_cxya)
const Px_cxya_cxya = new Pi(x, cx_ya, cx_ya)
test_to_beta_normal_form("deep pi no-redex", Px_cxya_cxya, Px_cxya_cxya)
// Beta-redex tests no redex
const redex_shallow_constant = new Application(lambda_constant, b)
test_to_beta_normal_form("beta-redex shallow constant", redex_shallow_constant, c)
const redex_shallow_identity = new Application(lambda_identity, b)
test_to_beta_normal_form("beta-redex shallow variable", redex_shallow_identity, b)
const not_redex_pi = new Application(pi_constant, b)
test_to_beta_normal_form("pi not beta-redex", not_redex_pi, not_redex_pi)
const redex_deep_no_redex = new Application(new Lambda(y, cx, ya), ya)
test_to_beta_normal_form("beta redex deep no redex", redex_deep_no_redex, new Application(ya, a))
// Deep Asts with redexes
const deep_application_redexes = new Application(redex_shallow_constant, redex_shallow_identity)
test_to_beta_normal_form("deep apps redexes", deep_application_redexes, new Application(c, b))
const deep_lambda_redexes = new Lambda(z, redex_shallow_constant, redex_shallow_identity)
test_to_beta_normal_form("deep lambda redexes", deep_lambda_redexes, new Lambda(z, c, b))
const deep_pi_redexes = new Pi(z, redex_shallow_constant, redex_shallow_identity)
test_to_beta_normal_form("deep pi redexes", deep_pi_redexes, new Pi(z, c, b))
// Beta redex with redex
const weird_lambda = new Lambda(x, lambda_constant, new Application(new Lambda(y, a, y), x))
const weird_app = new Application(weird_lambda, z)
test_to_beta_normal_form("Beta redex with sub redex", weird_app, z)
// Currying test
const curried = new Lambda(x, a, new Lambda(y, b, new Application(y, x)))
const bz = new Application(b, z)
const curried_app = new Application(new Application(curried, bz), a)
test_to_beta_normal_form("curried beta redex deep 3 redex", curried_app, new Application(a, bz))

// Failed during eliminate experimentation for some reason.
// (L(x: a).x: y) (L(x: b).x:)
const failed = new Application(new Lambda(x, a, new Application(x, y)), new Lambda(x, b, x))
test_to_beta_normal_form("failed example from eliminate testing", failed, y)
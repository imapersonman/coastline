import { AbstractSyntaxTree, Application, Constant, Lambda, MetaVariable, Pi, TypeKind, Variable } from "../../src/lambda_pi/ast";
import { differentiate, free_variables } from "../../src/lambda_pi/free_variables";

type Ast = AbstractSyntaxTree

// differentiate Tests
const v_string = "Atomic Variable"
const fv_string = (v: Variable) => v_string
const a_string = "Atomic Non-Variable"
const fa_string = () => a_string 
const b_string = "Non-Atomic Binder"
const fb_string = (b: Variable, t: Ast, s: Ast) => b_string
const nb_string = "Non-Atomic Non-Binder"
const fnb_string = (...sub_asts: Ast[]) => nb_string
function test_differentiate(name: string, input: Ast, expected: string) {
    const result = differentiate(input, fv_string, fa_string, fb_string, fnb_string)
    test(`differentiate ${name}`, () => expect(result).toEqual(expected))
}

const [x, y, z] = [new Variable("x"), new Variable("y"), new Variable("z")]
test_differentiate("Variable", x, v_string)
test_differentiate("TypeKind", new TypeKind(), a_string)
test_differentiate("Constant", new Constant("a"), a_string)
test_differentiate("MetaVariable", new MetaVariable("x"), a_string)
test_differentiate("Lambda", new Lambda(x, y, z), b_string)
test_differentiate("Pi", new Pi(x, y, z), b_string)
test_differentiate("Application", new Application(x, y), nb_string)

// free_variables Tests
function test_free_variables(name: string, bound: Variable[], ast: Ast, expected: Variable[]) {
    const result = free_variables(bound, ast)
    test(`free_variables ${name}`, () => expect(result).toEqual(expected))
}

test_free_variables("V not in non-empty set", [x, y], z, [z])
test_free_variables("V in non-empty set", [x, y], x, [])
test_free_variables("A empty set", [], new TypeKind(), [])
test_free_variables("A non-empty set", [x, y], new TypeKind(), [])
const b_rep = (b: Variable, t: Ast, s: Ast) => new Lambda(b, t, s)
test_free_variables("B empty set Bx:y.x", [], b_rep(x, y, x), [y])
test_free_variables("B empty set Bx:x.x", [], b_rep(x, x, x), [x])
test_free_variables("B empty set Bx:z.y", [], b_rep(x, z, y), [z, y])
test_free_variables("B non-empty set [z] Bx:z.y", [z], b_rep(x, z, y), [y])
test_free_variables("B non-empty set [y] Bx:z.y 2", [y], b_rep(x, z, y), [z])
test_free_variables("B deep", [], b_rep(z, b_rep(x, y, x), b_rep(new Variable("w"), z, x)), [y, x])
const nb_rep = (head: Ast, arg: Ast) => new Application(head, arg)
test_free_variables("NB empty set", [], nb_rep(x, y), [x, y])
test_free_variables("NB non-empty set", [x, y], nb_rep(x, y), [])
test_free_variables("NB deep", [x], nb_rep(nb_rep(x, y), nb_rep(x, y)), [y])
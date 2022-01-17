import { bound_variables } from "../../src/lambda_pi/bound_variables"
import { app, con, la, ovlist, pi, type_k } from "../../src/lambda_pi/shorthands"

describe('bound_variables', () => {
    const [a, b, c, w, x, y, z] = ovlist("a", "b", "c", "w", "x", "y", "z")
    const d = con("d")
    test('Type', () => expect(bound_variables(type_k)).toEqual([]))
    test('Constant d', () => expect(bound_variables(d)).toEqual([]))
    test('Variable x', () => expect(bound_variables(x)).toEqual([]))
    test('Variable y', () => expect(bound_variables(y)).toEqual([]))
    test('Application x y', () => expect(bound_variables(app(x, y))).toEqual([]))
    test('Application (x z) y', () => expect(bound_variables(app(app(x, z), y))).toEqual([]))
    test('Lambda L(x: y).z', () => expect(bound_variables(la(x, y, z))).toEqual([x]))
    test('Lambda L(a: L(b: c).w).L(x: y).z', () => expect(bound_variables(la(a, la(b, c, w), la(x, y, z)))).toEqual([a, b, x]))
    test('Pi P(x: y).z', () => expect(bound_variables(pi(x, y, z))).toEqual([x]))
    test('Pi P(a: P(b: c).w).P(x: y).z', () => expect(bound_variables(pi(a, pi(b, c, w), pi(x, y, z)))).toEqual([a, b, x]))
    test('Application (L(a: b).c) (P(x: y).z)', () => expect(bound_variables(app(la(a, b, c), pi(x, y, z)))).toEqual([a, x]))
})
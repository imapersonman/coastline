import { bound_variables_in_sequent } from "../../src/construction/bound_variables_in_sequent"
import { sequent } from "../../src/construction/sequent"
import { ovlist, pi, type_k } from "../../src/lambda_pi/shorthands"
import { mk_map } from "../../src/map/RecursiveMap"

describe('bound_variables_in_sequent', () => {
    const [a, b, c, w, x, y, z] = ovlist("a", "b", "c", "w", "x", "y", "z")
    /*
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
    */
   test('empty ctx, lame conclusion', () => expect(bound_variables_in_sequent(sequent(mk_map(), type_k))).toEqual([]))
   test('non-empty ctx without bounds, lame conclusion', () => expect(bound_variables_in_sequent(sequent(mk_map(['a', type_k]), type_k))).toEqual([]))
   test('non-empty ctx with bounds, lame conclusion', () => expect(
       bound_variables_in_sequent(sequent(mk_map(['a', pi(x, y, z)], ['b', pi(a, pi(b, c, w), pi(x, y, z))]), type_k)
    )).toEqual(
        [x, a, b]
    ))
   test('non-empty ctx with bounds, non-lame conclusion', () => expect(
       bound_variables_in_sequent(sequent(mk_map(['a', pi(x, y, z)], ['b', pi(a, pi(b, c, w), pi(x, y, z))]), pi(w, x, y))
    )).toEqual(
        [x, a, b, w]
    ))
})
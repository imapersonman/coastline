import { apply_permutation_to_ast, disagreement_set, perm, permutation, variables_in_permutation } from "../../src/lambda_pi/permutation"
import { app, con, la, mvlist, ovlist, pi, sus, type_k } from "../../src/lambda_pi/shorthands"
import { concat_linked_lists, linked_list } from "../../src/linked_list"

const [a, b, c, d, e] = ovlist('a', 'b', 'c', 'd', 'e')

describe('variables in permutation', () => {
    test('empty', () => expect(
        variables_in_permutation(permutation())
    ).toEqual(
        linked_list()
    ))
    test('(a a)', () => expect(
        variables_in_permutation(permutation([a, a]))
    ).toEqual(
        linked_list(a)
    ))
    test('(a b)', () => expect(
        variables_in_permutation(permutation([a, b]))
    ).toEqual(
        linked_list(a, b)
    ))
    test('(a b)(c d)', () => expect(
        variables_in_permutation(permutation([a, b], [c, d]))
    ).toEqual(
        linked_list(a, b, c, d)
    ))
    test('(a b)(c a)', () => expect(
        variables_in_permutation(permutation([a, b], [c, a]))
    ).toEqual(
        linked_list(a, b, c)
    ))
})

describe('apply_permutation_to_ast', () => {
    const empty = permutation()
    const arbitrary = permutation([a, b], [c, d])
    const duplicate_swaps = permutation([a, b], [c, a])
    const two_swaps = permutation([b, c], [c, a])
    const [X, Y] = mvlist('X', 'Y')
    // TypeKind
    test('arbitrary to typek', () => expect(apply_permutation_to_ast(arbitrary, type_k)).toEqual( type_k))
    // Constant
    test('arbitrary to constant', () => expect(apply_permutation_to_ast(arbitrary, con('a'))).toEqual(con('a')))
    // Variable
    test('empty to variable', () => expect(apply_permutation_to_ast(empty, a)).toEqual(a))
    test('arbitrary to irrelevant variable', () => expect(apply_permutation_to_ast(arbitrary, e)).toEqual(e))
    test('arbitrary to relevant variable in first swap', () => expect(apply_permutation_to_ast(arbitrary, b)).toEqual(a))
    test('arbitrary to relevant variable in second swap', () => expect(apply_permutation_to_ast(arbitrary, c)).toEqual(d))
    test('swap twice', () => expect(apply_permutation_to_ast(duplicate_swaps, a)).toEqual(c))
    test('swap twice', () => expect(apply_permutation_to_ast(two_swaps, a)).toEqual(b))
    // MetaVariable
    test('empty to meta variable', () => expect(apply_permutation_to_ast(perm(), Y)).toEqual(sus(perm(), Y)))  // all permutations suspend on meta variables!
    test('arbitrary to meta variable', () => expect(apply_permutation_to_ast(arbitrary, X)).toEqual(sus(arbitrary, X)))
    // Suspension
    test('arbitrary to suspension', () => expect(apply_permutation_to_ast(arbitrary, sus(two_swaps, X))).toEqual(sus(concat_linked_lists(arbitrary, two_swaps), X)))
    // Application
    test('arbitrary to nested application', () => expect(
        apply_permutation_to_ast(arbitrary, app(app(sus(empty, X), sus(arbitrary, Y)), app(sus(duplicate_swaps, Y), sus(two_swaps, X))))
    ).toEqual(
        app(
            app(sus(arbitrary, X), sus(concat_linked_lists(arbitrary, arbitrary), Y)),
            app(sus(concat_linked_lists(arbitrary, duplicate_swaps), Y), sus(concat_linked_lists(arbitrary, two_swaps), X))
        )
    ))
    // Lambda
    test('arbitrary to nested lambda with relevant bound', () => expect(
        apply_permutation_to_ast(
            arbitrary,
            la(a, app(sus(empty, X), sus(arbitrary, Y)), app(sus(duplicate_swaps, Y), sus(two_swaps, X)))
        )
    ).toEqual(
        la(
            b, 
            app(sus(arbitrary, X), sus(concat_linked_lists(arbitrary, arbitrary), Y)),
            app(sus(concat_linked_lists(arbitrary, duplicate_swaps), Y), sus(concat_linked_lists(arbitrary, two_swaps), X))
        )
    ))
    // Pi
    test('arbitrary to nested lambda with relevant bound', () => expect(
        apply_permutation_to_ast(
            arbitrary,
            pi(a, app(sus(empty, X), sus(arbitrary, Y)), app(sus(duplicate_swaps, Y), sus(two_swaps, X)))
        )
    ).toEqual(
        pi(
            b, 
            app(sus(arbitrary, X), sus(concat_linked_lists(arbitrary, arbitrary), Y)),
            app(sus(concat_linked_lists(arbitrary, duplicate_swaps), Y), sus(concat_linked_lists(arbitrary, two_swaps), X))
        )
    ))
})

describe('disagreement_set', () => {
    test('empty, empty', () => expect(
        disagreement_set(permutation(), permutation())
    ).toEqual(
        linked_list()
    ))
    test('empty, non-empty nop', () => expect(
        disagreement_set(permutation(), permutation([a, a]))
    ).toEqual(
        linked_list()
    ))
    test('empty, non-empty', () => expect(
        disagreement_set(permutation(), permutation([a, b]))
    ).toEqual(
        linked_list(a, b)
    ))
    test('non-empty nop, empty', () => expect(
        disagreement_set(permutation([a, a]), permutation())
    ).toEqual(
        linked_list()
    ))
    test('non-empty, empty', () => expect(
        disagreement_set(permutation([a, b]), permutation())
    ).toEqual(
        linked_list(a, b)
    ))
    test('non-empty, empty', () => expect(
        disagreement_set(permutation([a, b]), permutation())
    ).toEqual(
        linked_list(a, b)
    ))
    test('(a c)(a b), (b c)', () => expect(
        disagreement_set(permutation([a, c], [a, b]), permutation([b, c]))
    ).toEqual(
        linked_list(a, c)
    ))
    test('(b c), (a c)(a b)', () => expect(
        disagreement_set(permutation([a, c], [a, b]), permutation([b, c]))
    ).toEqual(
        linked_list(a, c)
    ))
})
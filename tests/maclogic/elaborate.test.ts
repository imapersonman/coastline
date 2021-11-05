import { absurd, and, exists, forall, i, iff, imp, ml, not, o, or, pred } from '../../src/maclogic/maclogic_shorthands'
import { app, flapp, imv, ovlist } from '../../src/lambda_pi/shorthands'
import { Ast, Variable } from '../../src/lambda_pi/ast'
import { RedeclaredVariable } from '../../src/logical_framework/sort_errors'
import { elaborate_s, elaborate_sequent, proven_sequent, unelaborate, unelaborate_sequent, unelaborate_sub_problem } from '../../src/maclogic/elaborate'
import { mk_map } from '../../src/map/RecursiveMap'
import { sequent } from '../../src/construction/sequent'
import { ErrorInAssumptions, ErrorInConclusion } from '../../src/maclogic/generic_sequent_error'
import { sub_problem } from '../../src/construction/check_proof_insert'

const [A, Z, P, x, y, z, R, B, C, D, F, w, a, G] = ovlist('A', 'Z', 'P', 'x', 'y', 'z', 'R', 'B', 'C', 'D', 'F', 'w', 'a', 'G')

describe('elaborate_s', () => {
    test('x', () => expect(
        elaborate_s(
            'x'
        )
    ).toEqual(
        proven_sequent(
            mk_map(['x', i]),
            x,
            i
        )
    ))

    test('⊥', () => expect(
        elaborate_s(
            ['⊥']
        )
    ).toEqual(
        proven_sequent(
            mk_map(),
            absurd,
            o
        )
    ))

    test('A', () => expect(
        elaborate_s(
            ['A']
        )
    ).toEqual(
        proven_sequent(
            mk_map(['A', o]),
            A,
            o
        )
    ))

    test('Z', () => expect(
        elaborate_s(
            ['Z']
        )
    ).toEqual(
        proven_sequent(
            mk_map(['Z', o]),
            Z,
            o
        )
    ))

    test('Px', () => expect(
        elaborate_s(
            ['P', 'x']
        )
    ).toEqual(
        proven_sequent(
            mk_map(['P', pred(1)], ['x', i]),
            app(P, x),
            o
        )
    ))

    test('Rxyz', () => expect(
        elaborate_s(
            ['R', 'x', 'y', 'z']
        )
    ).toEqual(
        proven_sequent(
            mk_map(['R', pred(3)], ['x', i], ['y', i], ['z', i]),
            flapp(R, x, y, z),
            o
        )
    ))

    test('Rxyz', () => expect(
        elaborate_s(
            ['R', 'x', 'x', 'x']
        )
    ).toEqual(
        proven_sequent(
            mk_map(['R', pred(3)], ['x', i]),
            flapp(R, x, x, x),
            o
        )
    ))

    const test_binary_operator = (c: string, op_f: (l: Ast, r: Ast) => Ast) => {
        test(`A ${c} B`, () => expect(
            elaborate_s(
                [c, ['A'], ['B']]
            )
        ).toEqual(
            proven_sequent(
                mk_map(['A', o], ['B', o]),
                op_f(A, B),
                o
            )
        ))

        test(`A ${c} A`, () => expect(
            elaborate_s(
                [c, ['A'], ['A']]
            )
        ).toEqual(
            proven_sequent(
                mk_map(['A', o]),
                op_f(A, A),
                o
            )
        ))

        test(`(A ${c} B) ${c} (C ${c} D)`, () => expect(
            elaborate_s(
                [c, [c, ['A'], ['B']], [c, ['C'], ['D']]]
            )
        ).toEqual(
            proven_sequent(
                mk_map(['A', o], ['B', o], ['C', o], ['D', o]),
                op_f(op_f(A, B), op_f(C, D)),
                o
            )
        ))

        test(`(A ${c} B) ${c} (C ${c} A)`, () => expect(
            elaborate_s(
                [c, [c, ['A'], ['B']], [c, ['C'], ['A']]]
            )
        ).toEqual(
            proven_sequent(
                mk_map(['A', o], ['B', o], ['C', o]),
                op_f(op_f(A, B), op_f(C, A)),
                o
            )
        ))
    }

    test_binary_operator('&', and)
    test_binary_operator('∨', or)
    test_binary_operator('→', imp)
    test_binary_operator('↔', iff)

    test('~P', () => expect(
        elaborate_s(
            ['~', ['P']]
        )
    ).toEqual(
        proven_sequent(
            mk_map(['P', o]),
            not(P),
            o
        )
    ))

    test('~~~P', () => expect(
        elaborate_s(
            ['~', ['~', ['~', ['P']]]]
        )
    ).toEqual(
        proven_sequent(
            mk_map(['P', o]),
            not(not(not(P))),
            o
        )
    ))

    const test_quantifier = (q: string, q_f: (x: Variable, scope: Ast) => Ast) => {
        test(`${q}xF`, () => expect(
            elaborate_s(
                [q, 'x', ['F']]
            )
        ).toEqual(
            proven_sequent(
                mk_map(['F', o]),
                q_f(x, F),
                o
            )
        ))

        test(`${q}xFx`, () => expect(
            elaborate_s(
                [q, 'x', ['F', 'x']]
            )
        ).toEqual(
            proven_sequent(
                mk_map(['F', pred(1)]),
                q_f(x, app(F, x)),
                o
            )
        ))

        test(`${q}xFy`, () => expect(
            elaborate_s(
                [q, 'x', ['F', 'y']]
            )
        ).toEqual(
            proven_sequent(
                mk_map(['F', pred(1)], ['y', i]),
                q_f(x, app(F, y)),
                o
            )
        ))

        test(`${q}x${q}y${q}zRxyzw`, () => expect(
            elaborate_s(
                [q, 'x', [q, 'y', [q, 'z', ['R', 'x', 'y', 'z', 'w']]]]
            )
        ).toEqual(
            proven_sequent(
                mk_map(['R', pred(4)], ['w', i]),
                q_f(x, q_f(y, q_f(z, flapp(R, x, y, z, w)))),
                o
            )
        ))

        test(`${q}x${q}y${q}yRxwyz redeclared y`, () => expect(
            elaborate_s(
                [q, 'x', [q, 'y', [q, 'y', ['R', 'x', 'w', 'y', 'z']]]]
            )
        ).toEqual(
            new RedeclaredVariable(y)
        ))
    }

    test_quantifier('∃', exists)
    test_quantifier('∀', forall)

})

describe('unelaborate', () => {
    test('x', () => expect(unelaborate(x)).toEqual('x'))
    test('⊥', () => expect(unelaborate(absurd)).toEqual(['⊥']))
    test('A', () => expect(unelaborate(A)).toEqual(['A']))
    test('Z', () => expect(unelaborate(Z)).toEqual(['Z']))
    test('Px', () => expect(unelaborate(app(P, x))).toEqual(['P', 'x']))
    test('Rxyz', () => expect(unelaborate(flapp(R, x, y, z))).toEqual(['R', 'x', 'y', 'z']))

    const test_binary_operator = (c: string, op_f: (l: Ast, r: Ast) => Ast) => {
        test(`A ${c} B`, () => expect(unelaborate(op_f(A, B),)).toEqual([c, ['A'], ['B']]))
        test(`A ${c} A`, () => expect(unelaborate(op_f(A, A),)).toEqual( [c, ['A'], ['A']]))
        test(`(A ${c} B) ${c} (C ${c} D)`, () => expect(unelaborate(op_f(op_f(A, B), op_f(C, D)),)).toEqual([c, [c, ['A'], ['B']], [c, ['C'], ['D']]]))
        test(`(A ${c} B) ${c} (C ${c} A)`, () => expect(unelaborate(op_f(op_f(A, B), op_f(C, A)),)).toEqual([c, [c, ['A'], ['B']], [c, ['C'], ['A']]]))
    }

    test_binary_operator('&', and)
    test_binary_operator('∨', or)
    test_binary_operator('→', imp)
    test_binary_operator('↔', iff)

    test('~P', () => expect(unelaborate( not(P),)).toEqual(['~', ['P']]))
    test('~~~P', () => expect(unelaborate(not(not(not(P))))).toEqual(['~', ['~', ['~', ['P']]]]))

    const test_quantifier = (q: string, q_f: (x: Variable, scope: Ast) => Ast) => {
        test(`${q}xF`, () => expect(unelaborate(q_f(x, F),)).toEqual([q, 'x', ['F']]))
        test(`${q}xFx`, () => expect(unelaborate(q_f(x, app(F, x)))).toEqual( [q, 'x', ['F', 'x']]))
        test(`${q}xFy`, () => expect(unelaborate( q_f(x, app(F, y)),)).toEqual([q, 'x', ['F', 'y']]))
        test(`${q}x${q}y${q}zRxyzw`, () => expect(unelaborate(q_f(x, q_f(y, q_f(z, flapp(R, x, y, z, w)))),)).toEqual([q, 'x', [q, 'y', [q, 'z', ['R', 'x', 'y', 'z', 'w']]]]))
    }

    test_quantifier('∃', exists)
    test_quantifier('∀', forall)
})

describe('unelaborate_sequent', () => {
    test('⊢ A', () => expect(
        unelaborate_sequent(sequent(mk_map(['A', o]), ml(A)))
    ).toEqual(
        [[], ['A']]
    ))

    test('⊢ B', () => expect(
        unelaborate_sequent(sequent(mk_map(['B', o]), ml(B)))
    ).toEqual(
        [[], ['B']]
    ))

    test('A ⊢ A', () => expect(
        unelaborate_sequent(sequent(mk_map<Ast>(['A', o], ['$_0', ml(A)]), ml(A)))
    ).toEqual(
        [[['A']], ['A']]
    ))

    test('A, B ⊢ A', () => expect(
        unelaborate_sequent(sequent(mk_map<Ast>(['A', o], ['B', o], ['$_0', ml(A)], ['$_1', ml(B)]), ml(A)))
    ).toEqual(
        [[['A'], ['B']], ['A']]
    ))

    test('A, A ⊢ A', () => expect(
        unelaborate_sequent(sequent(mk_map<Ast>(['A', o], ['$_0', ml(A)], ['$_1', ml(A)]), ml(A)))
    ).toEqual(
        // I'm allowing for duplicates within the elaboration process because maclogic allows for duplicates.
        [[['A'], ['A']], ['A']]
    ))

    test('A & B, C & A ⊢ B & C', () => expect(
        unelaborate_sequent(sequent(mk_map<Ast>(['A', o], ['B', o], ['C', o], ['$_0', ml(and(A, B))], ['$_1', ml(and(C, A))]), ml(and(B, C))))
    ).toEqual(
        [[['&', ['A'], ['B']], ['&', ['C'], ['A']]], ['&', ['B'], ['C']]]
    ))

    test('∀xFx ⊢ Fa', () => expect(
        unelaborate_sequent(sequent(mk_map<Ast>(['F', pred(1)], ['a', i], ['$_0', ml(forall(x, app(F, x)))]), ml(app(F, a))))
    ).toEqual(
        [[['∀', 'x', ['F', 'x']]], ['F', 'a']]
    ))

    test('A, ∀yFy, ∀yGy, B ⊢ A & Fa', () => expect(
        unelaborate_sequent(sequent(mk_map<Ast>(['A', o], ['F', pred(1)], ['G', pred(1)], ['B', o], ['a', i], ['$_0', ml(A)], ['$_1', ml(forall(y, app(F, y)))], ['$_2', ml(forall(y, app(G, y)))], ['$_3', ml(B)]), ml(and(A, app(F, a)))))
    ).toEqual(
        [[['A'], ['∀', 'y', ['F', 'y']], ['∀', 'y', ['G', 'y']], ['B']], ['&', ['A'], ['F', 'a']]]
    ))

})

describe('elaborate_sequent', () => {
    test('⊢ A', () => expect(
        elaborate_sequent([], ['A'])
    ).toEqual(
        sequent(mk_map(['A', o]), ml(A))
    ))

    test('⊢ ∀x∀xFx', () => expect(
        elaborate_sequent([], ['∀', 'x', ['∀', 'x', ['F', 'x']]])
    ).toEqual(
        new ErrorInConclusion(new RedeclaredVariable(x))
    ))

    test('⊢ B', () => expect(
        elaborate_sequent([], ['B'])
    ).toEqual(
        sequent(mk_map(['B', o]), ml(B))
    ))

    test('A ⊢ A', () => expect(
        elaborate_sequent([['A']], ['A'])
    ).toEqual(
        sequent(mk_map<Ast>(['A', o], ['$_0', ml(A)]), ml(A))
    ))

    test('A, B ⊢ A', () => expect(
        elaborate_sequent([['A'], ['B']], ['A'])
    ).toEqual(
        sequent(mk_map<Ast>(['A', o], ['B', o], ['$_0', ml(A)], ['$_1', ml(B)]), ml(A))
    ))

    test('A, A ⊢ A', () => expect(
        elaborate_sequent([['A'], ['A']], ['A'])
    ).toEqual(
        // I'm allowing for duplicates within the elaboration process because maclogic allows for duplicates.
        sequent(mk_map<Ast>(['A', o], ['$_0', ml(A)], ['$_1', ml(A)]), ml(A))
    ))

    test('A & B, C & A ⊢ B & C', () => expect(
        elaborate_sequent([['&', ['A'], ['B']], ['&', ['C'], ['A']]], ['&', ['B'], ['C']])
    ).toEqual(
        sequent(mk_map<Ast>(['A', o], ['B', o], ['C', o], ['$_0', ml(and(A, B))], ['$_1', ml(and(C, A))]), ml(and(B, C)))
    ))

    test('∀xFx ⊢ Fa', () => expect(
        elaborate_sequent([['∀', 'x', ['F', 'x']]], ['F', 'a'])
    ).toEqual(
        sequent(mk_map<Ast>(['F', pred(1)], ['a', i], ['$_0', ml(forall(x, app(F, x)))]), ml(app(F, a)))
    ))

    test('∀x∀xFx ⊢ Fa', () => expect(
        elaborate_sequent([['∀', 'x', ['∀', 'x', ['F', 'x']]]], ['F', 'a'])
    ).toEqual(
        new ErrorInAssumptions(new RedeclaredVariable(x), 0)
    ))

    test('A, ∀y∀yFx, B ⊢ A & Fa', () => expect(
        elaborate_sequent([['A'], ['∀', 'y', ['∀', 'y', ['F', 'x']]], ['B']], ['&', ['A'], ['F', 'a']])
    ).toEqual(
        new ErrorInAssumptions(new RedeclaredVariable(y), 1)
    ))

    test('A, ∀y∀yFx, ∀x∀xFy, B ⊢ A & Fa', () => expect(
        elaborate_sequent([['A'], ['∀', 'y', ['∀', 'y', ['F', 'x']]], ['∀', 'x', ['∀', 'x', ['F', 'y']]], ['B']], ['&', ['A'], ['F', 'a']])
    ).toEqual(
        new ErrorInAssumptions(new RedeclaredVariable(y), 1)
    ))

    test('∀y∀yFx ⊢ ∀x∀xFx', () => expect(
        elaborate_sequent([['∀', 'y', ['∀', 'y', ['F', 'x']]]], ['∀', 'x', ['∀', 'x', ['F', 'x']]])
    ).toEqual(
        new ErrorInAssumptions(new RedeclaredVariable(y), 0)
    ))

    test('A, ∀yFy, ∀yGy, B ⊢ A & Fa', () => expect(
        elaborate_sequent([['A'], ['∀', 'y', ['F', 'y']], ['∀', 'y', ['G', 'y']], ['B']], ['&', ['A'], ['F', 'a']])
    ).toEqual(
        sequent(mk_map<Ast>(['A', o], ['F', pred(1)], ['G', pred(1)], ['B', o], ['a', i], ['$_0', ml(A)], ['$_1', ml(forall(y, app(F, y)))], ['$_2', ml(forall(y, app(G, y)))], ['$_3', ml(B)]), ml(and(A, app(F, a))))
    ))

})

describe('unelaborate_sub_problem', () => {
    test('with meta variable index 0 and no assumptions', () => expect(
        unelaborate_sub_problem(sub_problem(imv(0), sequent(mk_map(), ml(A))))
    ).toEqual(
        { id: 0, sequent: [[], ['A']] }
    ))

    test('with meta variable index -12 and some assumptions', () => expect(
        unelaborate_sub_problem(sub_problem(imv(-12), sequent(mk_map<Ast>(['A', o], ['B', o], ['C', o], ['D', o], ['$_0', ml(and(A, B))], ['$_1', ml(C)]), ml(D))))
    ).toEqual(
        { id: -12, sequent: [[['&', ['A'], ['B']], ['C']], ['D']] }
    ))
})
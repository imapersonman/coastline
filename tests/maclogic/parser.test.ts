import { parse, parse_sequent, unparse, unparse_sequent } from '../../src/maclogic/parser'

describe('parse', () => {
    // Individual
    test('x', () => expect(parse('x')).toEqual('x'))
    test('a', () => expect(parse('a')).toEqual('a'))
    // Absurdity
    test('\\F', () => expect(parse('\\F')).toEqual(['⊥']))
    test('⊥', () => expect(parse('⊥')).toEqual(['⊥']))
    test('absurd', () => expect(parse('absurd')).toEqual(['⊥']))
    test('AbsUrd', () => expect(parse('AbsUrd')).toEqual(['⊥']))
    // 0-place predicates
    test('A', () => expect(parse('A')).toEqual(['A']))
    test('B', () => expect(parse('B')).toEqual(['B']))
    test('Z', () => expect(parse('Z')).toEqual(['Z']))
    // 1-place predicates
    test('Aa', () => expect(parse('Aa')).toEqual(['A', 'a']))
    test('Px', () => expect(parse('Px')).toEqual(['P', 'x']))
    test('Gb', () => expect(parse('Gb')).toEqual(['G', 'b']))
    // 2-place predicates
    test('Fgc', () => expect(parse('Fgc')).toEqual(['F', 'g', 'c']))
    test('Jxx', () => expect(parse('Jxx')).toEqual(['J', 'x', 'x']))
    // n-place predicates
    test('Jxxyyaoskhaisd', () => expect(parse('Jxxyyaoskhaisd')).toEqual(['J', 'x', 'x', 'y', 'y', 'a', 'o', 's', 'k', 'h', 'a', 'i', 's', 'd']))
    // Not
    test('~J', () => expect(parse('~J')).toEqual(['~', ['J']]))
    test('~~~~~J', () => expect(parse('~~~~~J')).toEqual(['~', ['~', ['~', ['~', ['~', ['J']]]]]]))
    test('¬J', () => expect(parse('¬J')).toEqual(['~', ['J']]))
    test('¬¬¬¬¬J', () => expect(parse('¬¬¬¬¬J')).toEqual(['~', ['~', ['~', ['~', ['~', ['J']]]]]]))

    const test_bin_op = (ac: string, c: string) => {
        test(`A ${c} B`, () => expect(parse(`A ${c} B`)).toEqual([ac, ['A'], ['B']]))
        test(`A${c}B`, () => expect(parse(`A${c}B`)).toEqual([ac, ['A'], ['B']]))
        test(`C ${c}D`, () => expect(parse(`C ${c}D`)).toEqual([ac, ['C'], ['D']]))
        test(`C${c} D`, () => expect(parse(`C${c} D`)).toEqual([ac, ['C'], ['D']]))
        test(`(X ${c} Y) ${c} P`, () => expect(parse(`(X ${c} Y) ${c} P`)).toEqual([ac, [ac, ['X'], ['Y']], ['P']]))
        test(`P ${c} (X ${c} Y)`, () => expect(parse(`P ${c} (X ${c} Y)`)).toEqual([ac, ['P'], [ac, ['X'], ['Y']]]))
        test(`(P ${c} (X ${c} Y))`, () => expect(parse(`(P ${c} (X ${c} Y))`)).toEqual([ac, ['P'], [ac, ['X'], ['Y']]]))
        test(`((A ${c} B) ${c} C) ${c} (D ${c} (E ${c} F))`, () =>
            expect(parse(`((A ${c} B) ${c} C) ${c} (D ${c} (E ${c} F))`))
            .toEqual([ac, [ac, [ac, ['A'], ['B']], ['C']], [ac, ['D'], [ac, ['E'], ['F']]]]))
        test(`Pxy${c}Ryxz`, () => expect(parse(`Pxy${c}Ryxz`)).toEqual([ac, ['P', 'x', 'y'], ['R', 'y', 'x', 'z']]))
        test(`Pxy  ${c}    Ryxz`, () => expect(parse(`Pxy${c}Ryxz`)).toEqual([ac, ['P', 'x', 'y'], ['R', 'y', 'x', 'z']]))
        test(`~~A ${c} ~~B`, () => expect(parse(`~~A ${c} ~~B`)).toEqual([ac, ['~', ['~', ['A']]], ['~', ['~', ['B']]]]))
    }

    test_bin_op('&', '&')
    test_bin_op('&', '/\\')
    test_bin_op('&', '^')
    test_bin_op('&', '∧')

    test_bin_op('∨', '∨')
    test_bin_op('∨', '\\/')

    test_bin_op('→', '→')
    test_bin_op('→', '->')

    test_bin_op('↔', '↔')
    test_bin_op('↔', '<->')

    const test_quantifier = (aq: string, q: string) => {
        test(`${q}xFx`, () => expect(parse(`${q}xFx`)).toEqual([aq, 'x', ['F', 'x']]))
        test(`${q}x${q}y${q}zFxyz`, () => expect(parse(`${q}x${q}y${q}zFxyz`)).toEqual([aq, 'x', [aq, 'y', [aq, 'z', ['F', 'x', 'y', 'z']]]]))
        test(`${q}xFxyz&B`, () => expect(parse(`${q}xFxyz&B`)).toEqual(['&', [aq, 'x', ['F', 'x', 'y', 'z']], ['B']]))
    }

    test_quantifier('∃', '∃')
    test_quantifier('∃', '\\E')

    test_quantifier('∀', '∀')
    test_quantifier('∀', '\\A')
    test_quantifier('∀', '\\U')
})

describe('parse_sequent', () => {
    test('⊢ A', () => expect(parse_sequent('', 'A')).toEqual([[], ['A']]))
    test('A ⊢ A', () => expect(parse_sequent('A', 'A')).toEqual([[['A']], ['A']]))
    test('A,B ⊢ A', () => expect(parse_sequent('A,B', 'A')).toEqual([[['A'], ['B']], ['A']]))
    test('A   , B ⊢ A', () => expect(parse_sequent('A  , B', 'A')).toEqual([[['A'], ['B']], ['A']]))
    test('A&B,C & D ,E & B ⊢ C & D', () => expect(parse_sequent('A&B,C & D ,E & B', 'A')).toEqual([[['&', ['A'], ['B']], ['&', ['C'], ['D']], ['&', ['E'], ['B']]], ['A']]))
})

describe('unparse', () => {
    // Individual
    test('"x"', () => expect(unparse('x')).toEqual('x'))
    test('"a"', () => expect(unparse('a')).toEqual('a'))
    // Absurdity
    test('["⊥"]', () => expect(unparse(['⊥'])).toEqual('⊥'))
    // 0-place predicates
    test('["A"]', () => expect(unparse(['A'])).toEqual('A'))
    test('["B"]', () => expect(unparse(['B'])).toEqual('B'))
    test('["Z"]', () => expect(unparse(['Z'])).toEqual('Z'))
    // 1-place predicates
    test('["A", "a"]', () => expect(unparse(['A', 'a'])).toEqual('Aa'))
    test('["P", "x"]', () => expect(unparse(['P', 'x'])).toEqual('Px'))
    test('["G", "b"]', () => expect(unparse(['G', 'b'])).toEqual('Gb'))
    // 2-place predicates
    test('["F", "g", "c"]', () => expect(unparse(['F', 'g', 'c'])).toEqual('Fgc'))
    test('["J", "x", "x"]', () => expect(unparse(['J', 'x', 'x'])).toEqual('Jxx'))
    // n-place predicates
    test('["J", "x", "x", "y", "y", "a", "o", "s", "k", "h", "a", "i", "s", "d"]', () => expect(unparse(['J', 'x', 'x', 'y', 'y', 'a', 'o', 's', 'k', 'h', 'a', 'i', 's', 'd'])).toEqual('Jxxyyaoskhaisd'))
    // Not
    test('["~", ["J"]]', () => expect(unparse(['~', ['J']])).toEqual('~J'))
    test('["~", ["~", ["~", ["~", ["~", ["J"]]]]]]', () => expect(unparse(['~', ['~', ['~', ['~', ['~', ['J']]]]]])).toEqual('~~~~~J'))
    test('["¬", ["J"]]', () => expect(unparse(['~', ['J']])).toEqual('~J'))
    test('["¬", ["¬", ["¬", ["¬", ["¬", ["J"]]]]]]', () => expect(unparse(['¬', ['¬', ['¬', ['¬', ['¬', ['J']]]]]])).toEqual('¬¬¬¬¬J'))

    const test_bin_op = (ac: string) => {
        test(`['${ac}', ['A'], ['B']]`, () => expect(unparse([ac, ['A'], ['B']])).toEqual(`A ${ac} B`))
        test(`['${ac}', ['${ac}', ['X'], ['Y']], ['P']]`, () => expect(unparse([ac, [ac, ['X'], ['Y']], ['P']])).toEqual(`(X ${ac} Y) ${ac} P`))
        test(`['${ac}', ['P'], ['${ac}', ['X'], ['Y']]]`, () => expect(unparse([ac, ['P'], [ac, ['X'], ['Y']]])).toEqual(`P ${ac} (X ${ac} Y)`))
        test(`['${ac}', ['${ac}', ['${ac}', ['A'], ['B']], ['C']], ['${ac}', ['D'], ['${ac}', ['E'], ['F']]]]`, () =>
            expect(unparse([ac, [ac, [ac, ['A'], ['B']], ['C']], [ac, ['D'], [ac, ['E'], ['F']]]]))
            .toEqual(`((A ${ac} B) ${ac} C) ${ac} (D ${ac} (E ${ac} F))`))
        test(`['${ac}', ['P', 'x', 'y'], ['R', 'y', 'x', 'z']]`, () => expect(unparse([ac, ['P', 'x', 'y'], ['R', 'y', 'x', 'z']])).toEqual(`Pxy ${ac} Ryxz`))
    }

    test_bin_op('&')
    test_bin_op('∨')
    test_bin_op('→')
    test_bin_op('↔')

    const test_quantifier = (aq: string) => {
        test(`['${aq}', 'x', ['F', 'x']]`, () => expect(unparse([aq, 'x', ['F', 'x']])).toEqual(`${aq}xFx`))
        test(`['${aq}', 'x', ['${aq}', 'y', ['${aq}', 'z', ['F', 'x', 'y', 'z']]]]`, () => expect(unparse([aq, 'x', [aq, 'y', [aq, 'z', ['F', 'x', 'y', 'z']]]])).toEqual(`${aq}x${aq}y${aq}zFxyz`))
        test(`['${aq}', 'x', ['&', ['F', 'x', 'y', 'z'], ['B']]]`, () => expect(unparse([aq, 'x', ['&', ['F', 'x', 'y', 'z'], ['B']]])).toEqual(`${aq}x(Fxyz & B)`))
    }

    test_quantifier('∃')
    test_quantifier('∀')
})

describe('unparse_sequent', () => {
    test('⊢ A', () => expect(unparse_sequent([], ['A'])).toEqual('⊢ A'))
    test('A ⊢ A', () => expect(unparse_sequent([['A']], ['A'])).toEqual('A ⊢ A'))
    test('A,B ⊢ A', () => expect(unparse_sequent([['A'], ['B']], ['A'])).toEqual('A, B ⊢ A'))
    test('A&B,C & D ,E & B ⊢ C & D', () => expect(unparse_sequent([['&', ['A'], ['B']], ['&', ['C'], ['D']], ['&', ['E'], ['B']]], ['&', ['C'], ['D']])).toEqual('A & B, C & D, E & B ⊢ C & D'))
})
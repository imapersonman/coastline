import { sequent } from "../../src/construction/sequent"
import { ovlist, type_k } from "../../src/lambda_pi/shorthands"
import { SequentMap } from "../../src/logical_framework/sequent_map"
import { mk_map } from "../../src/map/RecursiveMap"

describe('sequent map', () => {
    const [a, b, c, d, e] = ovlist('a', 'b', 'c', 'd', 'e')
    const empty = new SequentMap<number>()
    const empty_tk_seq = sequent(mk_map(), type_k)
    const single_with_empty_ctx = new SequentMap([empty_tk_seq, 1])
    const empty_d_seq = sequent(mk_map(), d)
    const different_single_with_empty_ctx = new SequentMap([empty_d_seq, 1])
    const two_with_empty_ctxs_different_conclusion = new SequentMap([empty_d_seq, 1], [empty_tk_seq, 2])
    const Aa_Bb_c_seq = sequent(mk_map(['A', a], ['B', b]), c)
    const Bb_Aa_c_seq = sequent(mk_map(['B', b], ['A', a]), c)
    const single_with_non_empty_ctx = new SequentMap([Aa_Bb_c_seq, 3])
    const two_with_ctxs_permuted_and_same_conclusion = new SequentMap([Aa_Bb_c_seq, 3], [Bb_Aa_c_seq, 4])
    const Ba_Ab_c_seq = sequent(mk_map(['B', a], ['A', b]), c)
    const Bc_Aa_c_seq = sequent(mk_map(['B', c], ['A', a]), c)
    const two_with_ctx_names_not_types_permuted_and_same_conclusion = new SequentMap([Aa_Bb_c_seq, 11], [Ba_Ab_c_seq, 4])

    describe('contains', () => {
        test('empty does not contain 1', () => expect(empty.contains(empty_tk_seq)).toBeFalsy())
        test('empty does not contain 2', () => expect(empty.contains(Bc_Aa_c_seq)).toBeFalsy())
        test('non-empty does not contain', () => expect(two_with_ctx_names_not_types_permuted_and_same_conclusion.contains(Ba_Ab_c_seq)).toBeTruthy())
        test('non-empty contains but given sequent with different ids', () => expect(single_with_non_empty_ctx.contains(sequent(mk_map(['B', a], ['A', b]), c))).toBeTruthy())
    })

    describe('get', () => {
        test('from empty', () => expect(empty.get(sequent(mk_map(), type_k))).toEqual(undefined))
        test('non-existent value from non-empty with empty ctx', () => expect(single_with_empty_ctx.get(empty_d_seq)).toEqual(undefined))
        test('existing value from non-empty', () => expect(different_single_with_empty_ctx.get(empty_d_seq)).toEqual(1))
        test('correct value from two with same ctxs and different conclusions', () => expect(two_with_empty_ctxs_different_conclusion.get(empty_tk_seq)).toEqual(2))
        test('non-existing value from non-empty with non-empty ctx', () => expect(single_with_non_empty_ctx.get(sequent(mk_map(['A', a], ['C', e]), c))).toEqual(undefined))
        test('existing value from non-empty with non-empty ctx', () => expect(single_with_non_empty_ctx.get(Aa_Bb_c_seq)).toEqual(3))
        test('permuted ctxs should be treated as the same if the conclusions are the same', () => expect(two_with_ctxs_permuted_and_same_conclusion.get(Bb_Aa_c_seq)).toEqual(3))
        test('permuted ctxs but different conclusions should be treated as different', () => expect(two_with_ctx_names_not_types_permuted_and_same_conclusion.get(Ba_Ab_c_seq)).toEqual(11))
    })

    describe('set', () => {
        test('in empty', () => expect(empty.set(sequent(mk_map(), type_k), 1)).toEqual(single_with_empty_ctx))
        test('by overriding existing value in single with empty ctx', () => expect(different_single_with_empty_ctx.set(sequent(mk_map(), d), 12)).toEqual(new SequentMap([sequent(mk_map(), d), 12])))
        test('by overriding existing value in single with non-empty ctx', () => expect(single_with_non_empty_ctx.set(Aa_Bb_c_seq, 10)).toEqual(new SequentMap([Aa_Bb_c_seq, 10])))
        test('by overriding existing with permuted ctx', () => expect(single_with_non_empty_ctx.set(Bb_Aa_c_seq, 4)).toEqual(new SequentMap([Aa_Bb_c_seq, 4])))
        test('by adding to double', () => expect(two_with_ctx_names_not_types_permuted_and_same_conclusion.set(Bc_Aa_c_seq, 7)).toEqual(new SequentMap([Aa_Bb_c_seq, 11], [Ba_Ab_c_seq, 4], [Bc_Aa_c_seq, 7])))
    })

    describe('merge', () => {
        test('two empties', () => expect(empty.merge(empty)).toEqual(empty))
        test('only left empty', () => expect(empty.merge(single_with_empty_ctx)).toEqual(single_with_empty_ctx))
        test('only right empty', () => expect(two_with_ctx_names_not_types_permuted_and_same_conclusion.merge(empty)).toEqual(two_with_ctx_names_not_types_permuted_and_same_conclusion))
        test('disjoint and non-empty', () => expect(two_with_ctx_names_not_types_permuted_and_same_conclusion.merge(two_with_empty_ctxs_different_conclusion)).toEqual(new SequentMap([Aa_Bb_c_seq, 11], [Ba_Ab_c_seq, 4], [empty_d_seq, 1], [empty_tk_seq, 2])))
        // .merge throws away the second value upon conflict
        test('non-disjoint 1 (takes equivalent entry from first)', () => expect(two_with_ctx_names_not_types_permuted_and_same_conclusion.merge(two_with_ctxs_permuted_and_same_conclusion)).toEqual(new SequentMap([Aa_Bb_c_seq, 11], [Ba_Ab_c_seq, 4])))
        test('non-disjoint 2 (takes equivalent entry from first)', () => expect(two_with_ctxs_permuted_and_same_conclusion.merge(two_with_ctx_names_not_types_permuted_and_same_conclusion)).toEqual(new SequentMap([Aa_Bb_c_seq, 3], [Ba_Ab_c_seq, 4])))
    })

    describe('remove', () => {
        test('from empty', () => expect(empty.remove(Ba_Ab_c_seq)).toEqual(empty))
        test('from non-empty not containing', () => expect(two_with_ctxs_permuted_and_same_conclusion.remove(empty_tk_seq)).toEqual(two_with_ctxs_permuted_and_same_conclusion))
        test('from non-empty containing', () => expect(two_with_empty_ctxs_different_conclusion.remove(empty_tk_seq)).toEqual(different_single_with_empty_ctx))
    })
})
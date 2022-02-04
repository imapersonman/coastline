import { clist, nat } from "../../src/lambda_pi/shorthands"
import { mk_sig, nn_key } from "../../src/logical_framework/sig2"

describe('Sig2', () => {
    const empty_sig2 = mk_sig()
    const [a, b, c, d] = clist('a', 'b', 'c', 'd')
    describe('lookup', () => {
        test('constant not in empty', () => expect(empty_sig2.lookup(a)).toEqual(undefined))
        test('natural number not in empty', () => expect(empty_sig2.lookup(nat(16))).toEqual(undefined))
        test('constant not in non-empty', () => expect(mk_sig([a, b], [c, d]).lookup(b)).toEqual(undefined))
        test('natural number not in empty', () => expect(mk_sig([a, b], [c, d]).lookup(nat(16))).toEqual(undefined))
        test('constant in non-empty', () => expect(mk_sig([a, b], [nn_key, b], [c, d]).lookup(c)).toEqual(d))
        test('constant number 0 in empty', () => expect(mk_sig([a, b], [nn_key, b], [c, d]).lookup(nat(0))).toEqual(b))
        test('natural number 102 in empty', () => expect(mk_sig([a, b], [nn_key, a], [c, d]).lookup(nat(102))).toEqual(a))
    })
})

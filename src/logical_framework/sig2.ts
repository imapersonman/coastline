import { Ast, Constant } from "../lambda_pi/ast"
import { nat } from "../lambda_pi/shorthands"
import { is_natural_number } from "../lambda_pi/utilities"
import { all_but_last, first, is_empty, last, rest } from "../utilities"
import { Sort } from "./sort"

export interface Sig2 {
    is_empty(): boolean
    lookup(key: Constant | 'N'): Ast | undefined
    add(key: Constant | 'N', sort: Ast): Sig2
    head(): [Constant, Ast]
    tail(): Sig2
}

const add_to_sig = (sig: Sig2, key: Constant | 'N', sort: Ast): Sig2 => {
    if (key === 'N')
        return new NaturalNumberSig(sort, sig)
    return new ConstantSig(key, sort, sig)
}

export class EmptySig implements Sig2 {
    is_empty(): boolean { return true }
    lookup(_key: Constant): Sort | undefined { return undefined }
    add(key: Constant | 'N', sort: Ast): Sig2 { return add_to_sig(this, key, sort) }
    head(): [Constant, Ast] { throw new Error('EmptySig does not contain a head!') }
    tail(): Sig2 { throw new Error('EmptySig does not contain a tail!') }
}

export class ConstantSig implements Sig2 {
    constructor(readonly key: Constant, readonly sort: Ast, readonly rest: Sig2) {}

    is_empty(): boolean {
        return false
    }

    add(key: Constant | 'N', sort: Ast): Sig2 { return add_to_sig(this, key, sort) }

    lookup(key: Constant): Sort | undefined {
        if (key.id === this.key.id)
            return this.sort
        return this.rest.lookup(key)
    }

    head(): [Constant, Ast] { return [this.key, this.sort] }

    tail(): Sig2 { return this.rest }
}

export class NaturalNumberSig implements Sig2 {
    constructor(readonly nn_sort: Ast, readonly rest: Sig2) {}

    is_empty(): boolean {
        return false
    }

    lookup(key: Constant): Ast | undefined {
        if (is_natural_number(key))
            return this.nn_sort
        return this.rest.lookup(key)
    }

    add(key: Constant | 'N', sort: Ast): Sig2 { return add_to_sig(this, key, sort) }

    // The choice to simply return nat(0) may come back to haunt me but not yet so we're good.
    head(): [Constant, Ast] { return [nat(0), this.nn_sort] }

    tail(): Sig2 { return this.rest }
}

// [fc, ft], [sc, st]
// [sc, st] ([fc, ft] ())
export const mk_sig = (...entries: ([Constant | 'N', Sort][])): Sig2 => {
    if (is_empty(entries))
        return new EmptySig
    const key = last(entries)[0]
    if (key === 'N')
        return new NaturalNumberSig(last(entries)[1], mk_sig(...all_but_last(entries)))
    return new ConstantSig(key, last(entries)[1], mk_sig(...all_but_last(entries)))
}

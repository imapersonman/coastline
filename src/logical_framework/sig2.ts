import { Ast, Constant } from "../lambda_pi/ast"
import { nat } from "../lambda_pi/shorthands"
import { ast_to_string, is_constant, is_natural_number } from "../lambda_pi/utilities"
import { all_but_last, defined, first, is_empty, last, rest } from "../utilities"
import { Sort } from "./sort"

export type NaturalNumbersKey = 'N'
export const nn_key = 'N'

export type SigKey = Constant | NaturalNumbersKey

export const display_sig_key = (s: SigKey) => {
    if (is_constant(s))
        return ast_to_string(s)
    return s
}

export interface Sig2 {
    is_empty(): boolean
    contains(key: SigKey): boolean
    lookup(key: SigKey): Ast | undefined
    add(key: SigKey, sort: Ast): Sig2
    head(): [SigKey, Ast]
    tail(): Sig2
}

const add_to_sig = (sig: Sig2, key: SigKey, sort: Ast): Sig2 => {
    return new ConstantSig(key, sort, sig)
}

export class EmptySig implements Sig2 {
    is_empty(): boolean { return true }
    contains(key: SigKey): boolean { return false }
    lookup(_key: Constant): Sort | undefined { return undefined }
    add(key: SigKey, sort: Ast): Sig2 { return add_to_sig(this, key, sort) }
    head(): [SigKey, Ast] { throw new Error('EmptySig does not contain a head!') }
    tail(): Sig2 { throw new Error('EmptySig does not contain a tail!') }
}

export class ConstantSig implements Sig2 {
    constructor(readonly key: SigKey, readonly sort: Ast, readonly rest: Sig2) {}

    is_empty(): boolean {
        return false
    }

    contains(key: SigKey): boolean { return defined(this.lookup(key)) }

    add(key: SigKey, sort: Ast): Sig2 { return add_to_sig(this, key, sort) }

    lookup(key: SigKey): Sort | undefined {
        if ((this.key === nn_key && (key === nn_key || is_natural_number(key))) || (is_constant(this.key) && is_constant(key) && this.key.id === key.id))
            return this.sort
        return this.rest.lookup(key)
    }

    head(): [SigKey, Ast] { return [this.key, this.sort] }

    tail(): Sig2 { return this.rest }
}

export const mk_sig = (...entries: ([SigKey, Sort][])): Sig2 => {
    if (is_empty(entries))
        return new EmptySig
    const key = last(entries)[0]
    return new ConstantSig(key, last(entries)[1], mk_sig(...all_but_last(entries)))
}
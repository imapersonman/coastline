import { Variable } from "../lambda_pi/ast"
import { ov } from "../lambda_pi/shorthands"
import { v_union } from "../lambda_pi/utilities"
import { Ctx } from "../logical_framework/ctx"
import { defined } from "../utilities"

export class MapLookupKeyNotFound {
    constructor(readonly key: string) {}
}

export const map_contains_variable = (ctx: Ctx, v: Variable) => !(ctx.lookup(v.id) instanceof MapLookupKeyNotFound)

export abstract class RecursiveMap<V> {
    add(k: string, v: V): RecursiveMap<V> {
        return new ConsRecursiveMap(k, v, this)
    }

    is_empty(): boolean {
        return this instanceof MtRecursiveMap
    }

    head(): [string, V] {
        if (this instanceof ConsRecursiveMap)
            return [this.k, this.v]
        throw new Error("Can't get head of empty map")
    }

    tail(): RecursiveMap<V> {
        if (this instanceof ConsRecursiveMap)
            return this.rest
        throw new Error("Can't get head of empty map")
    }

    domain(): Variable[] {
        if (this instanceof ConsRecursiveMap)
            return v_union(this.rest.domain(), [ov(this.k).parse()])
        return []
    }

    entries(): [string, V][] {
        if (this instanceof ConsRecursiveMap)
            return [...this.rest.entries(), [this.k, this.v]]
        return []
    }

    union(other: RecursiveMap<V>): RecursiveMap<V> {
        if (this instanceof MtRecursiveMap)
            return other
        return new ConsRecursiveMap(this.head()[0], this.head()[1], this.tail().union(other))
    }

    remove(k: string): RecursiveMap<V> {
        if (this instanceof MtRecursiveMap)
            return this
        if (this.head()[0] === k)
            return this.tail()
        return new ConsRecursiveMap(this.head()[0], this.head()[1], this.tail().remove(k))
    }

    reduce<Returned>(reducer: (acc: Returned, k: string, v: V) => Returned, identity: Returned): Returned {
        if (this.is_empty())
            return identity
        return reducer(this.tail().reduce(reducer, identity), this.head()[0], this.head()[1])
    }

    map<Returned>(mapper: (k: string, v: V) => Returned): Returned[] {
        return this.reduce((acc: Returned[], key: string, value: V) => [...acc, mapper(key, value)], [])
    }

    contains(k: string): boolean {
        return !(this.lookup(k) instanceof MapLookupKeyNotFound)
    }

    abstract lookup(k: string): V | MapLookupKeyNotFound

    static empty<V>(): RecursiveMap<V> {
        return new MtRecursiveMap<V>()
    }
}

class ConsRecursiveMap<V> extends RecursiveMap<V> {
    constructor(readonly k: string, readonly v: V, readonly rest: RecursiveMap<V>) {
        super()
    }

    lookup(k: string): V | MapLookupKeyNotFound {
        if (k === this.k)
            return this.v
        return this.rest.lookup(k)
    }

    head(): [string, V] {
        return [this.k, this.v]
    }

    tail(): RecursiveMap<V> {
        return this.rest
    }
}

class MtRecursiveMap<V> extends RecursiveMap<V> {
    lookup(k: string): V | MapLookupKeyNotFound {
        return new MapLookupKeyNotFound(k)
    }

    head(): [string, V] {
        throw new Error("Cannot get head of an empty map")
    }

    tail(): RecursiveMap<V> {
        throw new Error("Cannot get tail of an empty map")
    }
}

export function mk_map<V>(...entries: [string, V][]): RecursiveMap<V> {
    if (entries.length === 0)
        return RecursiveMap.empty()
    const last = entries[entries.length - 1]
    return mk_map(...entries.slice(0, -1)).add(last[0], last[1])
}

export function map_lookup_key_not_found<V>(result: V | MapLookupKeyNotFound): result is MapLookupKeyNotFound {
    return result instanceof MapLookupKeyNotFound
}

export const display_recursive_map = <V, D>(map: RecursiveMap<V>, display_value?: (v: V) => D) => {
    if (map.is_empty())
        return []
    const [key, value] = map.head()
    const dvf = defined(display_value) ? display_value : (v: V) => v
    return [[key, dvf(value)], ...display_recursive_map(map.tail())]
}
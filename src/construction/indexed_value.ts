import { declare } from "../utilities"

export type IndexedValue<V> = (idx: number) => V

export const make_indexed_value_avoiding_indices = <Value>(index_from_value: (v: Value) => number, old_indexed_value: IndexedValue<Value>, indices: number[]) =>
    declare(Math.max(...indices), (max_of_indices) =>
        max_of_indices >= index_from_value(old_indexed_value(0))
            ? (i: number) => old_indexed_value(1 + i + max_of_indices)
            : old_indexed_value)
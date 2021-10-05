import { RecursiveMap } from "./RecursiveMap";

type RM<V> = RecursiveMap<V>

export function submap_of<V>(sm: RM<V>, of: RM<V>, v_eq: (v1: V, v2: V) => boolean): boolean {
    const of_entries = of.entries()
    return sm.entries().filter((sm_e) => !of_entries.some((of_e) => sm_e[0] === of_e[0] && v_eq(sm_e[1], of_e[1]))).length === 0
}

export function map_eq<V>(m1: RM<V>, m2: RM<V>, v_eq: (v1: V, v2: V) => boolean): boolean {
    return submap_of(m1, m2, v_eq) && submap_of(m2, m1, v_eq)
}
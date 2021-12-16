export function zip<T1, T2>(l1: T1[], l2: T2[]): [T1, T2][] {
    if (l1.length !== l2.length)
        throw new Error("Lists must be same length in order to zip together")
    return l1.map((e, i) => [e, l2[i]])
}

export const first = <T>(arr: T[]): T => arr[0]

export const last = <T>(arr: T[]) => arr[arr.length - 1]

export const rest = <T>(arr: T[]): T[] => arr.slice(1)

export const all_but_last = <T>(arr: T[]): T[] => arr.slice(0, -1)

export const string_in_array = (stra: string[], str: string): boolean => stra.some((in_a) => str === in_a)

export const replace_at_index = <T>(arr: T[], index: number, replacement: T): T[] => { const ret = arr.slice(); ret.splice(index, 1, replacement); return ret }

export const remove_index = <T>(arr: T[], index: number): T[] => [...arr.slice(0, index), ...arr.slice(index + 1)]

export const invert_string_array = (array: string[]): Record<string, number> =>
    array.length === 0 ? ({})
    : Object.assign({ [array[array.length - 1]]: array.length - 1 }, invert_string_array(array.slice(0, -1)))

/*
- Takes two arrays with elements of the same type T | undefined and of the same length.
- A new array is produced with the same length.
- An entry at index i in the return array ret[i] is equal to arr1[i], or arr2[i] if arr1[i] is undefined.
*/
export const fit_arrays = <T>(arr1: (T | undefined)[], arr2: (T | undefined)[]): (T | undefined)[] => zip(arr1, arr2).map(([e1, e2]) => e1 === undefined ? e2 : e1)

export const defined = <T>(v: T | undefined): v is T => v !== undefined

export const declare = <Value, K>(value: Value, k: (value: Value) => K): K => k(value)

export const is_object = (o: any): o is object => typeof o === "object" && o !== null && !Array.isArray(o)

export const is_any = (a: any): a is any => true

export const index_out_of_bounds = (index: number, length: number): boolean => index < 0 || length <= index

export const is_string = (s: any): s is string => typeof s === "string"

export const is_integer = (i: number): boolean => Number.isInteger(i)

export const is_number = (i: any): i is number => typeof i === "number"

export const is_unit = (o: any): o is [] => Array.isArray(o) && o.length === 0

export const is_array = (a: any): a is any[] => Array.isArray(a)

export const is_empty = (a: any): a is [] => is_array(a) && a.length === 0
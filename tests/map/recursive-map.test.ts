import { MapLookupKeyNotFound, mk_map, RecursiveMap } from "../../src/map/RecursiveMap";

function test_mk_map(name: string, inputs: [string, string][], output: RecursiveMap<string>) {
    const result = mk_map(...inputs)
    test(`mk_map ${name}`, () => expect(result).toEqual(output))
}

// mk_map assumes a right-associative list of entries, such as (a: b, (c: d, (e: f, ())))
test_mk_map("0 elements", [], RecursiveMap.empty())
test_mk_map("1 element", [["a", "B"]], RecursiveMap.empty<string>().add("a", "B"))
test_mk_map("2 elements", [["a", "B"], ["c", "D"]], RecursiveMap.empty<string>().add("a", "B").add("c", "D"))
test_mk_map("4 elements", [["a", "B"], ["c", "D"], ["e", "F"], ["g", "H"]], RecursiveMap.empty<string>().add("a", "B").add("c", "D").add("e", "F").add("g", "H"))

function test_lookup(name: string, map: RecursiveMap<string>, key: string, output: string | MapLookupKeyNotFound) {
    const result = map.lookup(key)
    test(`RecursiveMap.lookup ${name}`, () => expect(result).toEqual(output))
}

test_lookup("empty", mk_map(), "cool", new MapLookupKeyNotFound("cool"))
test_lookup("non-empty containing 1", mk_map(["cool", "beans"]), "cool", "beans")
test_lookup("non-empty containing 3", mk_map(["cool", "beans"], ["something", "else"], ["happened", "here"]), "something", "else")
test_lookup("non-empty non-containing 3", mk_map(["cool", "beans"], ["something", "else"], ["happened", "here"]), "awesome", new MapLookupKeyNotFound("awesome"))
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RecursiveMap_1 = require("../../src/map/RecursiveMap");
function test_mk_map(name, inputs, output) {
    const result = (0, RecursiveMap_1.mk_map)(...inputs);
    test(`mk_map ${name}`, () => expect(result).toEqual(output));
}
// mk_map assumes a right-associative list of entries, such as (a: b, (c: d, (e: f, ())))
test_mk_map("0 elements", [], RecursiveMap_1.RecursiveMap.empty());
test_mk_map("1 element", [["a", "B"]], RecursiveMap_1.RecursiveMap.empty().add("a", "B"));
test_mk_map("2 elements", [["a", "B"], ["c", "D"]], RecursiveMap_1.RecursiveMap.empty().add("a", "B").add("c", "D"));
test_mk_map("4 elements", [["a", "B"], ["c", "D"], ["e", "F"], ["g", "H"]], RecursiveMap_1.RecursiveMap.empty().add("a", "B").add("c", "D").add("e", "F").add("g", "H"));
function test_lookup(name, map, key, output) {
    const result = map.lookup(key);
    test(`RecursiveMap.lookup ${name}`, () => expect(result).toEqual(output));
}
test_lookup("empty", (0, RecursiveMap_1.mk_map)(), "cool", new RecursiveMap_1.MapLookupKeyNotFound("cool"));
test_lookup("non-empty containing 1", (0, RecursiveMap_1.mk_map)(["cool", "beans"]), "cool", "beans");
test_lookup("non-empty containing 3", (0, RecursiveMap_1.mk_map)(["cool", "beans"], ["something", "else"], ["happened", "here"]), "something", "else");
test_lookup("non-empty non-containing 3", (0, RecursiveMap_1.mk_map)(["cool", "beans"], ["something", "else"], ["happened", "here"]), "awesome", new RecursiveMap_1.MapLookupKeyNotFound("awesome"));

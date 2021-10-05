import { RecursiveMap } from "./RecursiveMap";

export const is_map = (m: any): m is RecursiveMap<any> => m instanceof RecursiveMap
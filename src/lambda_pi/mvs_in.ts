import { unionWith } from "lodash";
import { Ast, MetaVariable } from "./ast";
import { children_of } from "./children_of";
import { syntactic_equality } from "./syntactic_equality";
import { is_application, is_binder } from "./utilities";

export const mvs_in = (ast: Ast): MetaVariable[] => children_of(ast).reduce<MetaVariable[]>((acc, child) => unionWith(acc, mvs_in(child)), [])
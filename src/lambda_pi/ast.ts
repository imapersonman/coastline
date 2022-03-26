// An Ast is one of the following:
// - a Constant
// - a Variable
// - an Abstraction
// - an Application
// - a Pi

import { is_integer } from "../utilities";
import { AbstractIdentifier, AbstractApplication, AbstractAbstraction } from "./abstract";

// - a TypeKind
export interface AbstractSyntaxTree {}
export type Ast = AbstractSyntaxTree

export class TypeKind implements AbstractSyntaxTree {}

export class Constant extends AbstractIdentifier<string> implements AbstractSyntaxTree {}

export class NaturalNumber extends Constant {
    constructor(readonly value: number) {
        super(`${value}`)
        if (!is_integer(value) || value < 0)
            throw new Error(`Cannot construct the natural number ${value}`)
    }
}

export class Variable extends AbstractIdentifier<string> implements AbstractSyntaxTree {
    get_index(): number { return 0 }
    get_base_id(): string { return this.id }
    get_name(): string { return this.id }
    parse(): Variable {
        const split_id = this.id.split("_")
        if (split_id.length !== 2 || split_id[0][0] !== "$")
            return new Variable(this.id)
        const base_id = split_id[0].substring(1)
        const index = Number.parseInt(split_id[1])
        if (Number.isNaN(index))
            return new Variable(this.id)
        return new GeneratedVariable(base_id, index)
    }
}

export class GeneratedVariable extends Variable {
    constructor(
        readonly base_id: string,
        readonly index: number) {
        super(`$${base_id}_${index}`)
    }

    get_index(): number { return this.index }
    get_base_id(): string { return this.base_id }
    parse(): Variable { return this }
}

export class MetaVariable extends AbstractIdentifier<string> implements AbstractSyntaxTree {
    parse(): MetaVariable {
        const split_id = this.id.split("_")
        if (split_id.length !== 2 || split_id[0] !== "m")
            return new MetaVariable(this.id)
        const index = Number.parseInt(split_id[1])
        if (Number.isNaN(index))
            return new MetaVariable(this.id)
        return new IndexedMetaVariable(index)
    }

    get_index(): number { return 0 }
}

export class Application extends AbstractApplication<AbstractSyntaxTree> implements AbstractSyntaxTree {}

export class Lambda extends AbstractAbstraction<Variable, AbstractSyntaxTree> implements AbstractSyntaxTree {}

export class Pi extends AbstractAbstraction<Variable, AbstractSyntaxTree> implements AbstractSyntaxTree {}

export class IndexedMetaVariable extends MetaVariable {
    constructor(readonly index: number) { super(`m_${index}`) }
    parse(): MetaVariable { return this }
    get_index(): number { return this.index }
}
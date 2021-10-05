export abstract class AbstractIdentifier<Id> {
    constructor(readonly id: Id) {}
}

export abstract class AbstractApplication<Sub> {
    constructor(readonly head: Sub, readonly arg: Sub) {}
}

export abstract class AbstractAbstraction<V extends AbstractIdentifier<string>, Sub> {
    constructor(readonly bound: V, readonly type: Sub, readonly scope: Sub) {}
}
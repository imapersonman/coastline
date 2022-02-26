import { CoastlineControl, display_coastline_control } from "./control"
import { AnyCoastlineObject } from "./object"

export class OperatorDefinition { constructor(readonly name: string, readonly f: (inputs: AnyCoastlineObject[]) => CoastlineControl) {} }
export const operator_definition = (name: string, f: (inputs: AnyCoastlineObject[]) => CoastlineControl): OperatorDefinition => new OperatorDefinition(name, f)

export class OperatorApplication {

    constructor(
        readonly definition: OperatorDefinition,
        readonly controls: CoastlineControl[]
    ) {}
}
export const operator_app = (definition: OperatorDefinition, controls: CoastlineControl[]) =>
    new OperatorApplication(definition, controls)
export const is_operator_app = (f: unknown): f is OperatorApplication => f instanceof OperatorApplication

export const display_operator_application = (a: OperatorApplication) => ({
    definition : a.definition.name,
    controls   : a.controls.map(display_coastline_control)
})

export class PendingOperation { constructor( readonly operator: OperatorDefinition, readonly arity: number) {} }
export const pending_operation = (operator: OperatorDefinition, arity: number): PendingOperation => new PendingOperation(operator, arity)

export const display_pending_operation = (pop: PendingOperation) => ({
    operator: pop.operator.name,
    arity: pop.arity
})


import { display_stack, Stack } from "../stack"
import { CoastlineControl, display_coastline_control } from "./control"
import { AnyCoastlineObject, display_coastline_object } from "./object"

export class OperatorDefinition { constructor(readonly name: string, readonly parameter_names: string[], readonly f: (inputs: AnyCoastlineObject[]) => CoastlineControl) {} }
export const operator_definition = (name: string, parameter_names: string[], f: (inputs: AnyCoastlineObject[]) => CoastlineControl): OperatorDefinition => new OperatorDefinition(name, parameter_names, f)

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

export class PendingOperation { constructor(readonly op: OperatorDefinition, readonly args: Stack<CoastlineControl>, readonly results: Stack<AnyCoastlineObject>) {} }
export const pending_operation = (op: OperatorDefinition, args: Stack<CoastlineControl>, results: Stack<AnyCoastlineObject>): PendingOperation =>
    new PendingOperation(op, args, results)
export const display_pending_operation = (po: PendingOperation) => ({
    op: po.op.name,
    args: display_stack(po.args, display_coastline_control),
    results: display_stack(po.results, display_coastline_object)
})

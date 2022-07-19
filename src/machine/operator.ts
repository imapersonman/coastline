import { display_stack, Stack } from "../stack"
import { CoastlineControl, display_coastline_control } from "./control"
import { ErrorValueMap } from "./error"
import { AnyCoastlineObject, display_coastline_object, ObjectValueMap } from "./object"

export class OperatorDefinition<OVM extends ObjectValueMap, EVM extends ErrorValueMap> { constructor(readonly name: string, readonly parameter_names: string[], readonly f: (inputs: AnyCoastlineObject<OVM>[]) => CoastlineControl<OVM, EVM>) {} }
export const operator_definition = <OVM extends ObjectValueMap, EVM extends ErrorValueMap>(name: string, parameter_names: string[], f: (inputs: AnyCoastlineObject<OVM>[]) => CoastlineControl<OVM, EVM>): OperatorDefinition<OVM, EVM> => new OperatorDefinition(name, parameter_names, f)

export class OperatorApplication<OVM extends ObjectValueMap, EVM extends ErrorValueMap> {
    constructor(
        readonly definition: OperatorDefinition<OVM, EVM>,
        readonly controls: CoastlineControl<OVM, EVM>[]
    ) {}
}
export const operator_app = <OVM extends ObjectValueMap, EVM extends ErrorValueMap>(definition: OperatorDefinition<OVM, EVM>, controls: CoastlineControl<OVM, EVM>[]) =>
    new OperatorApplication(definition, controls)
export const is_operator_app = <OVM extends ObjectValueMap, EVM extends ErrorValueMap>(f: unknown): f is OperatorApplication<OVM, EVM> => f instanceof OperatorApplication

export const display_operator_application = <OVM extends ObjectValueMap, EVM extends ErrorValueMap>(a: OperatorApplication<OVM, EVM>, display_object: (o: AnyCoastlineObject<OVM>) => any = JSON.stringify) => ({
    definition : a.definition.name,
    controls   : a.controls.map((c) => display_coastline_control(c, display_object))
})

export class PendingOperation<OVM extends ObjectValueMap, EVM extends ErrorValueMap> { constructor(readonly op: OperatorDefinition<OVM, EVM>, readonly args: Stack<CoastlineControl<OVM, EVM>>, readonly results: Stack<AnyCoastlineObject<OVM>>) {} }
export const pending_operation = <OVM extends ObjectValueMap, EVM extends ErrorValueMap>(op: OperatorDefinition<OVM, EVM>, args: Stack<CoastlineControl<OVM, EVM>>, results: Stack<AnyCoastlineObject<OVM>>): PendingOperation<OVM, EVM> =>
    new PendingOperation(op, args, results)
export const display_pending_operation = <OVM extends ObjectValueMap, EVM extends ErrorValueMap>(po: PendingOperation<OVM, EVM>) => ({
    op: po.op.name,
    args: display_stack(po.args, display_coastline_control),
    results: display_stack(po.results, display_coastline_object)
})

import { defined } from "../utilities"
import { CoastlineControl } from "./control"
import { AnyCoastlineObject, CoastlineObject } from "./object"

export type CoastlineRequestValueMap = {
    'AtomName'   : { payload: undefined, response: 'String' }
    'VariableId' : { payload: undefined, response: 'String' }
}

export type CoastlineResponse<K extends keyof CoastlineRequestValueMap> = CoastlineObject<CoastlineRequestValueMap[K]['response']>
export type CoastlineRequestData<K extends keyof CoastlineRequestValueMap> = /*CoastlineRequestValueMap[K]['payload'] extends undefined ? K : */{ [Key in keyof CoastlineRequestValueMap]: { type: Key, payload: CoastlineRequestValueMap[Key]['payload'] } }[K]
export type AnyCoastlineRequest= CoastlineRequest<keyof CoastlineRequestValueMap>
export class CoastlineRequest<CT extends keyof CoastlineRequestValueMap> { constructor(readonly data: CoastlineRequestData<CT>, readonly f: (response: AnyCoastlineObject) => CoastlineControl) {} }
export const req = <CT extends keyof CoastlineRequestValueMap>(data: CoastlineRequestData<CT>, f: (response: AnyCoastlineObject) => CoastlineControl): CoastlineRequest<CT> =>
    new CoastlineRequest(data, f)
export const is_coastline_request = <CT extends keyof CoastlineRequestValueMap>(r: unknown): r is CoastlineRequest<CT> => r instanceof CoastlineRequest

export const display_coastline_request = (r: AnyCoastlineRequest) =>
    ({ type: r.data.type })

export const ctr = <CT extends keyof CoastlineRequestValueMap>(ct: CT, r: AnyCoastlineRequest): r is CoastlineRequest<CT> => defined(r) && r.data.type === ct
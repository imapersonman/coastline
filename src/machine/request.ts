// export type CoastlineRequestValueMap = {
//     'AtomName'   : { payload: undefined, response: 'String' }
//     'VariableId' : { payload: undefined, response: 'String' }
// }

import { ObjectValueMap } from "./object"

// export type CoastlineResponse<K extends keyof CoastlineRequestValueMap> = CoastlineObject<CoastlineRequestValueMap[K]['response']>
// export type CoastlineRequestData<K extends keyof CoastlineRequestValueMap> = /*CoastlineRequestValueMap[K]['payload'] extends undefined ? K : */{ [Key in keyof CoastlineRequestValueMap]: { type: Key, payload: CoastlineRequestValueMap[Key]['payload'], response_type: CoastlineRequestValueMap[Key]['response'] } }[K]
// export type AnyCoastlineRequest = CoastlineRequest<keyof CoastlineRequestValueMap>
// export class CoastlineRequest<CT extends keyof CoastlineRequestValueMap> { constructor(readonly data: CoastlineRequestData<CT>, readonly f: (response: AnyCoastlineObject) => CoastlineControl) {} }
// export const req = <CT extends keyof CoastlineRequestValueMap>(data: CoastlineRequestData<CT>, f: (response: AnyCoastlineObject) => CoastlineControl): CoastlineRequest<CT> =>
//     new CoastlineRequest(data, f)
// export const is_coastline_request = <CT extends keyof CoastlineRequestValueMap>(r: unknown): r is CoastlineRequest<CT> => r instanceof CoastlineRequest

// export const display_coastline_request = (r: AnyCoastlineRequest) =>
//     ({ type: r.data.type })

// export const ctr = <CT extends keyof CoastlineRequestValueMap>(ct: CT, r: AnyCoastlineRequest): r is CoastlineRequest<CT> => defined(r) && r.data.type === ct

export class CoastlineRequest2<OVM extends ObjectValueMap, CT extends keyof OVM> { constructor(readonly object_types: CT[]) {} }
export type AnyCoastlineRequest2<OVM extends ObjectValueMap> = CoastlineRequest2<OVM, keyof OVM>
export const req2 = <OVM extends ObjectValueMap, CT extends keyof OVM>(...object_types: CT[]): CoastlineRequest2<OVM, CT> => new CoastlineRequest2(object_types)
export const is_coastline_request2 = <OVM extends ObjectValueMap>(r: unknown): r is AnyCoastlineRequest2<OVM> => r instanceof CoastlineRequest2
export class Double {
    number: number;
    constructor(number: number);
}

export type RpcData =
    null |
    boolean |
    number |
    string |
    Date |
    readonly RpcData[] |
    {readonly [property: string]: RpcData}

export type SerializableData =
    null |
    boolean |
    number |
    string |
    ArrayBuffer |
    Date |
    Double |
    readonly SerializableData[] |
    {readonly [TKey: string]: SerializableData}

type RpcScalarDataTypeHint =
    'binary' |
    'boolean' |
    'float' |
    'int' |
    'string' |
    'datetime'

export type RpcDataTypeHint =
    null |
    RpcScalarDataTypeHint |
    {readonly [propertyPath: string]: RpcScalarDataTypeHint}

/**
 * @deprecated Do not treat FastRPC type `binary`, type `double` respectively, as native JS class `Array`,
 * type `number` respectively, with hint. Treat FastRPC type `binary`, type `double` respectively, as native JS
 * class `ArrayBuffer`, non-native JS class `Double` respectively, instead.
 */
export function serializeCall(procedure: string, args: readonly RpcData[], dataTypeHint: RpcDataTypeHint): number[]
export function serializeCall(procedure: string, args: readonly SerializableData[]): number[]

/**
 * @deprecated Do not treat FastRPC type `binary`, type `double` respectively, as native JS class `Array`,
 * type `number` respectively, with hint. Treat FastRPC type `binary`, type `double` respectively, as native JS
 * class `ArrayBuffer`, non-native JS class `Double` respectively, instead.
 */
export function serialize(data: RpcData, typeHint: RpcDataTypeHint): number[]
export function serialize(data: SerializableData): number[]

export type ParseOptions = {readonly arrayBuffers?: boolean}

export type ParsedData =
    null |
    boolean |
    number |
    string |
    ArrayBuffer |
    Date |
    readonly ParsedData[] |
    {readonly [TKey: string]: ParsedData}

export type ParsedCall = {
    method: string,
    params: ParsedData[]
}

/**
 * @deprecated Do not treat FastRPC type `binary` as native JS class `Array`. Treat FastRPC type `binary` as native JS
 * class `ArrayBuffer` instead.
 */
export function parse(data: readonly number[]): RpcData | {method: string, params: RpcData[]}
export function parse(data: readonly number[], options?: ParseOptions): ParsedData | ParsedCall

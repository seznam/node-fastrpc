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
 * @deprecated Do not treat FastRPC type `double` as native JS type `number` with hint. Treat FastRPC type `double` as
 * non-native JS class `Double` instead.
 */
export function serializeCall(procedure: string, args: readonly RpcData[], dataTypeHint: RpcDataTypeHint): number[]
export function serializeCall(procedure: string, args: readonly SerializableData[], dataTypeHint: RpcDataTypeHint): number[]

/**
 * @deprecated Do not treat FastRPC type `double` as native JS type `number` with hint. Treat FastRPC type `double` as
 * non-native JS class `Double` instead.
 */
export function serialize(data: RpcData, typeHint: RpcDataTypeHint): number[]
export function serialize(data: SerializableData, typeHint: RpcDataTypeHint): number[]

export function parse(data: readonly number[]): RpcData | {method: string, params: RpcData[]}

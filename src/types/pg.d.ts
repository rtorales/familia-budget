declare module 'pg' {
  export interface PoolConfig {
    connectionString?: string
    ssl?: boolean | { rejectUnauthorized?: boolean }
    max?: number
    idleTimeoutMillis?: number
    connectionTimeoutMillis?: number
  }

  export interface QueryResult<R = Record<string, unknown>> {
    rows: R[]
    rowCount: number | null
    command: string
    oid: number
    fields: FieldDef[]
  }

  export interface FieldDef {
    name: string
    tableID: number
    columnID: number
    dataTypeID: number
    dataTypeSize: number
    dataTypeModifier: number
    format: string
  }

  export class Pool {
    constructor(config?: PoolConfig)
    connect(): Promise<PoolClient>
    end(): Promise<void>
    query<R = Record<string, unknown>>(queryTextOrConfig: string | QueryConfig, values?: unknown[]): Promise<QueryResult<R>>
    on(event: string, listener: (...args: unknown[]) => void): this
  }

  export interface PoolClient {
    query<R = Record<string, unknown>>(queryTextOrConfig: string | QueryConfig, values?: unknown[]): Promise<QueryResult<R>>
    release(err?: Error | boolean): void
    on(event: string, listener: (...args: unknown[]) => void): this
  }

  export interface QueryConfig {
    text: string
    values?: unknown[]
    name?: string
    rowMode?: string
    types?: unknown
  }

  export class Client {
    constructor(config?: PoolConfig)
    connect(): Promise<void>
    end(): Promise<void>
    query<R = Record<string, unknown>>(queryTextOrConfig: string | QueryConfig, values?: unknown[]): Promise<QueryResult<R>>
  }
}

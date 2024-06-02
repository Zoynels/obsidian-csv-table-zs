import { Options } from 'csv-parse'
import { ColumnInfo } from './util'

export interface CsvTableData {
  columns: ColumnInfo[],
  rows: Record<string, any>[]
}

export interface NamedColumn {
  name: string
  header: string
  expression: string
  csv_column: string
  show: number
}

export interface ExtendedSortExpression {
  expression: string
  reversed: boolean
}

export interface CsvTableSpec {
  source: string
  csvOptions?: Options
  columns?: (NamedColumn | string)[]
  columnVariables?: Record<string, string>
  filter?: string[] | string
  maxRows?: number
  sortBy?: (string | ExtendedSortExpression)[] | string | ExtendedSortExpression
}

import { compileExpression } from 'filtrex'
import { ExtendedSortExpression } from './types'

type ExpressionFn = (item: Record<string, any>) => any


export function applyRowFilters(
  filters: string[],
  maxRows: number = Infinity,
  rows: Record<string, any>[],
  columnVariables?: Record<string, string>
): Record<string, any>[] {
  const filteredRows: Record<string, any>[] = []
  const expressions: ExpressionFn[] = []

  for (const expression of filters) {
    expressions.push(compileExpression(expression))
  }

  let rowIndex = 1;
  for (const row of rows) {
    let passesTests = true

    if (rowIndex > maxRows) {
      break
    }

    for (const expression of expressions) {
      if (!evaluateExpression(row, expression, columnVariables)) {
        passesTests = false
        break
      }
    }
    if (passesTests) {
      filteredRows.push(row)
    }
    rowIndex += 1
  }
  return filteredRows
}

export function sortRows(
  sortExpressions: ExtendedSortExpression[],
  rows: Record<string, any>[],
  columnVariables?: Record<string, string>
): Record<string, any>[] {
  const sortedRows: Record<string, any>[] = [...rows]
  const expressions: ExpressionFn[] = []

  for (const expression of sortExpressions) {
    expressions.push(compileExpression(expression.expression))
  }

  for (const expression of sortExpressions.reverse()) {
    const sortExpression = compileExpression(expression.expression)

    sortedRows.sort((a, b) => {
      const aResult = evaluateExpression(a, sortExpression, columnVariables)
      const bResult = evaluateExpression(b, sortExpression, columnVariables)

      if (aResult < bResult) {
        return expression.reversed ? 1 : -1
      } else if (aResult > bResult) {
        return expression.reversed ? -1 : 1
      } else {
        return 0
      }
    })
  }
  return sortedRows
}

export function evaluateExpression(row: Record<string, any>, expression: ExpressionFn, columnVariables?: Record<string, string>): any {
  const extendedRow: Record<string, any> = { ...row }

  for (const columnVariable in columnVariables ?? {}) {
    extendedRow[columnVariable] = row[columnVariables[columnVariable]]
  }

  return expression(extendedRow)
}

export function getCellDisplay(row: Record<string, any>, expression: string): any {
  if (typeof row[expression] === 'string') {
    return row[expression]
  } else {
    return JSON.stringify(row[expression])
  }
}

export interface ColumnInfo {
  name: string
  header: string
  expression: string
  csv_column: string,
  show: number
}

export function getColumnInfo(column: string | ColumnInfo, expression: string): ColumnInfo {
  if (typeof column === 'string') {
    let res: ColumnInfo = {
      name: expression,
      header: column,
      expression: expression,
      csv_column: column,
      show: 1
    }
    return res
  } else {

    let res: ColumnInfo = {
      name: column.name || expression,
      header: column.header || column.name || column.csv_column || expression,
      expression: column.expression || column.name || expression,
      csv_column: column.csv_column,
      show: column.show !== undefined ? column.show : 1

    }
    return res
  }
}

export function getSortExpression(expression: string | ExtendedSortExpression): ExtendedSortExpression {
  if (typeof expression === 'string') {
    return {
      expression: expression,
      reversed: false
    }
  }
  return expression
}

export function getArrayForArrayOrObject<T>(value?: T[] | T | null): T[] {
  if (value === null || value === undefined) {
    return []
  }

  if (Array.isArray(value)) {
    return value
  }

  return [value]
}

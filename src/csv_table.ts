import parseCsv from 'csv-parse/lib/sync'
import { compileExpression } from 'filtrex'
import { CsvTableSpec, CsvTableData, ExtendedSortExpression } from './types'

import { applyRowFilters, getColumnInfo, evaluateExpression, sortRows, getArrayForArrayOrObject, getSortExpression, ColumnInfo } from './util'


export function getFilteredCsvData(
  csvSpec: CsvTableSpec,
  csvData: string
): CsvTableData {
  const {
    cast = true,
    cast_date = true,
    trim = true,
    columns = true,
    skip_empty_lines = true,
    ...extraOptions
  } = (csvSpec.csvOptions ?? {})
  const csvOptions = {
    cast, trim, columns, skip_empty_lines, ...extraOptions
  }
  const parsedCsvData = parseCsv(csvData, csvOptions)
  const columnNames: ColumnInfo[] = []
  const rowColumns: string[] = Object.keys(parsedCsvData[0])


  try {
    let index = 0;
    let columns: ColumnInfo[] = [];
    for (const column of csvSpec.columns ?? rowColumns) {
      index = index + 1;
      const columnInfo = getColumnInfo(column, "col" + index);
      columns.push(columnInfo);
    }

    for (const columnInfo of columns) {
      // Do not attempt to compile/set the expression value
      // if it already exists in our known row columns
      if (rowColumns.indexOf(columnInfo.header) === -1) {
        const expression = compileExpression(columnInfo.expression)
        for (const row of parsedCsvData) {

          let row_new: any = {};
          for (const columnInfo2 of columns) {
            row_new[columnInfo2.name] = row[columnInfo2.csv_column];
            row_new["__name__" + columnInfo2.name] = row[columnInfo2.csv_column]
            row_new["__result__" + columnInfo2.name] = row[columnInfo2.header]
          }
          //console.log("#row_new");
          //console.log(row_new);
          row[columnInfo.header] = evaluateExpression(row_new, expression, csvSpec.columnVariables)
          row[columnInfo.name] = row[columnInfo.csv_column]
          row["__name__" + columnInfo.name] = row[columnInfo.csv_column]
          row["__result__" + columnInfo.name] = row[columnInfo.header]
          row["__header__" + columnInfo.header] = row[columnInfo.header]
        }
      } else {

        console.log(2);
        for (const row of parsedCsvData) {
          if (!(columnInfo.name in row)) {
            row[columnInfo.name] = row[columnInfo.csv_column]
          }
          if (!(columnInfo.header in row)) {
            row[columnInfo.header] = row[columnInfo.csv_column]
          }
          row["__name__" + columnInfo.name] = row[columnInfo.csv_column]
          row["__result__" + columnInfo.name] = row[columnInfo.header]
          row["__header__" + columnInfo.name] = row[columnInfo.header]
          //console.log(row);
        }
      }

      columnNames.push(columnInfo)
    }
  } catch (e) {
    throw new Error(`Error evaluating column expressions: ${e.message}.`)
  }

  let filteredSortedCsvData: Record<string, any>[] = []
  try {
    filteredSortedCsvData = sortRows(
      getArrayForArrayOrObject<string | ExtendedSortExpression>(csvSpec.sortBy).map(getSortExpression),
      applyRowFilters(
        getArrayForArrayOrObject<string>(csvSpec.filter),
        csvSpec.maxRows ?? Infinity,
        parsedCsvData,
        csvSpec.columnVariables
      ),
      csvSpec.columnVariables
    )
  } catch (e) {
    throw new Error(`Error evaluating filter expressions: ${e.message}.`)
  }

  return {
    columns: columnNames,
    rows: filteredSortedCsvData
  }
}

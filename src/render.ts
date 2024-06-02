import { MarkdownRenderer, MarkdownRenderChild } from 'obsidian';

import { ColumnInfo, getCellDisplay, getColumnInfo } from './util'

export class TableRenderer extends MarkdownRenderChild {
  constructor(public columns: ColumnInfo[], public rows: any[], public container: HTMLElement) {
    super(container)
  }

  async onload() {
    await this.render()
  }

  async render() {
    const tableEl = this.container.createEl('table')
    tableEl.addClass('obsidian-csv-table-table');

    const theadEl = tableEl.createEl('thead')
    theadEl.addClass('obsidian-csv-table-thead');
    const headerEl = theadEl.createEl('tr')
    headerEl.addClass('obsidian-csv-table-tr');
    const tbodyEl = tableEl.createEl('tbody')
    tbodyEl.addClass('obsidian-csv-table-tbody');

    const columnNames: ColumnInfo[] = []

    for (const column of this.columns) {
      const columnInfo = column;
      if (columnInfo.show > 0) {
        headerEl.createEl('th', { text: columnInfo.header })
        headerEl.addClass('obsidian-csv-table-headerEl-th');
        columnNames.push(columnInfo)
      }
    }

    for (const row of this.rows) {
      const trEl = tbodyEl.createEl('tr')
      trEl.addClass('obsidian-csv-table-tbody-tr');

      for (const columnName of columnNames) {
        const tdEl = trEl.createEl('td');
        tdEl.addClass('obsidian-csv-table-tbody-tr-td');
        const cellTextMD = getCellDisplay(row, columnName.header);

        MarkdownRenderer.render(app, cellTextMD, tdEl, "", this);

        const fragment = document.createDocumentFragment();
        tdEl.childNodes.forEach((child, index) => {
          if (child instanceof Element && child.tagName === 'P') {
            while (child.firstChild) {
              fragment.appendChild(child.firstChild);
            }
            if (index < tdEl.childNodes.length - 1) {
              fragment.append(document.createElement('br'));
            }
          } else {
            fragment.append(child.cloneNode(true));
          }
        });

        tdEl.innerHTML = '';
        tdEl.append(fragment);
      }
    }
  }
}

export function renderErrorPre(container: HTMLElement, error: string): HTMLElement {
  let pre = container.createEl('pre', { cls: ["csv-table", "csv-error"] });
  pre.appendText(error);
  return pre;
}

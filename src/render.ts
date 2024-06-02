import { MarkdownRenderer, MarkdownRenderChild } from 'obsidian';

import { getCellDisplay, getColumnInfo } from './util'

export class TableRenderer extends MarkdownRenderChild {
  constructor(public columns: string[], public rows: any[], public container: HTMLElement) {
    super(container)
  }

  async onload() {
    await this.render()
  }

  async render() {
    const tableEl = this.container.createEl('table')

    const theadEl = tableEl.createEl('thead')
    const headerEl = theadEl.createEl('tr')
    const tbodyEl = tableEl.createEl('tbody')

    const columnNames: string[] = []

    for (const column of this.columns) {
      const columnInfo = getColumnInfo(column)

      headerEl.createEl('th', { text: columnInfo.name })
      columnNames.push(columnInfo.name)
    }

    for (const row of this.rows) {
      const trEl = tbodyEl.createEl('tr')

      for (const columnName of columnNames) {
        const tdEl = trEl.createEl('td');

        const cellTextMD = getCellDisplay(row, columnName);

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

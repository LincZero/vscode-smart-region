/**
 * 给文档中中的 smart region 上色。
 */

import * as vscode from 'vscode';
import { computeRegions } from './region';

/**
 * Region 区域背景着色器（类似 highlight-region 插件）。
 *
 * 行为：
 *  - 读取 `smartRegion.enableHighlight`，为 false 时不染色并清空已有装饰；
 *  - 读取 `smartRegion.highlightColor`，为区域内每一行应用整行背景色；
 *  - 高亮起点从分割线的下一行开始，避免给"标题行"染色；
 *  - 颜色变化时自动重建 decorationType。
 */
export class RegionHighlighter implements vscode.Disposable {
  private decorationType: vscode.TextEditorDecorationType | undefined;
  private currentColor: string | undefined;

  private ensureDecorationType(color: string): vscode.TextEditorDecorationType {
    if (this.decorationType && this.currentColor === color) {
      return this.decorationType;
    }
    this.decorationType?.dispose();
    this.decorationType = vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      backgroundColor: color,
    });
    this.currentColor = color;
    return this.decorationType;
  }

  clear(editor: vscode.TextEditor): void {
    if (this.decorationType) {
      editor.setDecorations(this.decorationType, []);
    }
  }

  update(editor: vscode.TextEditor | undefined): void {
    if (!editor) { return; }

    const cfg = vscode.workspace.getConfiguration('smartRegion');
    const enabled = cfg.get<boolean>('enableHighlight', false);
    if (!enabled) {
      this.clear(editor);
      return;
    }

    const color = cfg.get<string>('highlightColor', 'rgba(100, 150, 255, 0.05)');
    const decorationType = this.ensureDecorationType(color);

    const regions = computeRegions(editor.document);
    const ranges: vscode.Range[] = [];
    for (const r of regions) {
      const startLine = r.startLine; // 或+1，来表示从分割线的下一行开始着色（分割线本身作为标题不染色）
      if (startLine > r.endLine) { continue; }
      ranges.push(
        new vscode.Range(
          startLine, 0,
          r.endLine, editor.document.lineAt(r.endLine).text.length
        )
      );
    }
    editor.setDecorations(decorationType, ranges);
  }

  dispose(): void {
    this.decorationType?.dispose();
    this.decorationType = undefined;
    this.currentColor = undefined;
  }
}

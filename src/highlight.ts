/**
 * 给文档中的 smart region 上色。
 */

import * as vscode from 'vscode';
import { computeRegions } from './region';
import { HighlightTheme, RegionColorEntry, resolvePalette } from './theme';

/**
 * Region 区域背景着色器（类似 highlight-region 插件）。
 *
 * 行为：
 *  - 读取 `smartRegion.enableHighlight`，为 false 时不染色并清空已有装饰；
 *  - 读取 `smartRegion.highlightTheme` 选择颜色风格（内置主题 / 自定义 / 默认颜色）；
 *  - 自定义主题时读取 `smartRegion.customTheme`（颜色数组）进行轮换着色：
 *      数组长度为 1 → 始终只用这一种颜色；
 *      数组长度为 n → 第 i 个 region 使用 palette[i % n]，每 n 个 region 轮换一次；
 *  - 高亮起点从分割线的下一行开始，避免给"标题行"染色；
 *  - 每种颜色对应一个 decorationType，按需创建并缓存。
 */
export class RegionHighlighter implements vscode.Disposable {
  /** 颜色 → 装饰类型 的缓存 */
  private decorationTypes = new Map<string, vscode.TextEditorDecorationType>();

  private ensureDecorationType(color: string): vscode.TextEditorDecorationType {
    const existing = this.decorationTypes.get(color);
    if (existing) {
      return existing;
    }
    const type = vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      backgroundColor: color,
    });
    this.decorationTypes.set(color, type);
    return type;
  }

  clear(editor: vscode.TextEditor): void {
    for (const type of this.decorationTypes.values()) {
      editor.setDecorations(type, []);
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

    const theme = cfg.get<string>('highlightTheme', HighlightTheme.LincZero);
    const customTheme = cfg.get<RegionColorEntry[]>('customTheme', []);
    const defaultColor = cfg.get<string>('highlightColor', 'rgba(100, 150, 255, 0.08)');
    const palette = resolvePalette(theme, customTheme, defaultColor);

    // 计算 region 并按颜色分组：第 i 个 region 使用 palette[i % palette.length]（颜色轮换）
    const rangesByColor = new Map<string, vscode.Range[]>();
    computeRegions(editor.document).forEach((r, index) => {
      const startLine = r.startLine; // 从分割线的下一行开始着色（分割线本身作为标题不染色）
      if (startLine > r.endLine) { return; }

      const color = palette[index % palette.length];
      const range = new vscode.Range(
        startLine, 0,
        r.endLine, editor.document.lineAt(r.endLine).text.length
      );

      let ranges = rangesByColor.get(color);
      if (!ranges) {
        ranges = [];
        rangesByColor.set(color, ranges);
      }
      ranges.push(range);
    });

    // 先清空所有已创建装饰，避免"某个颜色已不再出现"时残留旧区域
    for (const type of this.decorationTypes.values()) {
      editor.setDecorations(type, []);
    }

    // 再按颜色分别应用装饰
    for (const [color, ranges] of rangesByColor) {
      editor.setDecorations(this.ensureDecorationType(color), ranges);
    }
  }

  dispose(): void {
    for (const type of this.decorationTypes.values()) {
      type.dispose();
    }
    this.decorationTypes.clear();
  }
}

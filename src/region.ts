/**
 * 计算文档中所有可折叠的 region 范围。
 * 提供 computeRegions 函数。
 */

import * as vscode from 'vscode';

/**
 * 匹配三种分割线注释：
 *   # ---,  或 (#+) ---
 *   // ---, 或 /(/+) ---
 *   /* ---, 或 /(*+) ---
 * 
 * 捕获组:
 * 1. 缩进
 * 2. 分隔线注释方式
 * 3. 分隔线注释正文 (可能包括前后空格和 `---` 后缀，匹配成功后再去除)
 */
const SEPARATOR_REGEX = /^(\s*)(#+|\/\/+|\/\*+)\s*-{3,}(.*)$/;

interface SeparatorLine {
  line: number;
  indent: number;
  label?: string;
}

interface RegionRange {
  startLine: number;
  endLine: number;
}

/**
 * 计算文档中所有可折叠的 region 范围。
 * 折叠提供程序与背景高亮共用此函数，保证两者范围完全一致。
 */
export function computeRegions(
  document: vscode.TextDocument,
  token?: vscode.CancellationToken
): RegionRange[] {
  // 配置项：缩进敏感，默认 true。
  // 若为 false，则视为所有分割线注释都在顶列，规则 2 失效。
  const enableIndentEnd = vscode.workspace
    .getConfiguration('smartRegion')
    .get<boolean>('enableIndentEnd', true);

  // 第一遍：遍历文档，收集所有分割线注释行
  const separators: SeparatorLine[] = [];
  for (let i = 0; i < document.lineCount; i++) {
    if (token?.isCancellationRequested) { return []; }
    const match = document.lineAt(i).text.match(SEPARATOR_REGEX);
    if (!match) { continue; }
    separators.push({
      line: i,
      indent: enableIndentEnd ? match[1].length: 0,
      label: match[3]?.replace(/\s*-{3,}\s*$/, '').trim() || undefined,
    });
  }
  // console.log('DEBUG 遍历结果', separators);

  // 第二遍：遍历数组，为每个分割线计算折叠范围
  const ranges: RegionRange[] = [];
  for (let i = 0; i < separators.length; i++) {
    const { startLine, endLine } = findRangeEnd(document, separators, i, token);
    // console.log('DEBUG 范围结果', { i, startLine, endLine });

    if (endLine <= startLine) { continue; }
    ranges.push({
      startLine,
      endLine,
    });
  };
  return ranges;
}

/**
 * 找到第 i 个分割线，对应的 region 折叠范围。
 *
 * 终止规则：
 *   - 规则 1：遇到缩进比当前分割线更小的行 → 结束于其上一行
 *   - 规则 2：遇到同缩进的分割线行 → 结束于其上一行
 *   - 规则 3：扫描到文档末尾 → 结束于文档最后一行
 *   - 补充 1: 空行不参与边界判定
 *   - 补充 2: (TODO) 跨行字符串也不应该参与边界判定
 *
 * @param document   当前文档
 * @param separators 已收集的全部分割线列表
 * @param i          当前分割线在 separators 中的下标
 * @param token      取消令牌
 * @returns 折叠范围的 { startLine, endLine }（endLine 若小于 startLine 表示不可折叠）
 */
function findRangeEnd(
  document: vscode.TextDocument,
  separators: SeparatorLine[],
  i: number,
  token?: vscode.CancellationToken
): { startLine: number; endLine: number } {
  const { line: startLine, indent: currentIndent } = separators[i];

  // (规则3) 默认结束于文档最后一行
  let endLine = document.lineCount - 1;

  for (let line = startLine + 1; line < document.lineCount; line++) {
    if (token?.isCancellationRequested) {
      // 取消时返回一个退化的空范围，交由调用方过滤
      return { startLine, endLine: startLine };
    }

    const text = document.lineAt(line).text;

    // (补充1) 空行不参与边界判定
    if (text.trim() === '') { continue; }

    // 计算该行的缩进（前导空白字符数）
    const indentMatch = text.match(/^\s*/);
    const indent = indentMatch ? indentMatch[0].length : 0;

    // (规则1) 遇到更小缩进的行 → 结束于其上一行
    if (indent < currentIndent) {
      endLine = line - 1;
      break;
    }

    // (规则2) 遇到同缩进的分割线行 → 结束于其上一行
    if (indent === currentIndent && SEPARATOR_REGEX.test(text)) {
      endLine = line - 1;
      break;
    }
  }

  // (其他, 可选) 去掉末尾的空行，让折叠范围更紧凑，也避免"看似无内容"的折叠
  while (endLine > startLine && document.lineAt(endLine).text.trim() === '') {
    endLine--;
  }

  return { startLine, endLine };
}

export class SmartRegionFoldingProvider implements vscode.FoldingRangeProvider {
  provideFoldingRanges(
    document: vscode.TextDocument, // 文档文档内容
    _context: vscode.FoldingContext,
    token: vscode.CancellationToken
  ): vscode.FoldingRange[] {
    return computeRegions(document, token).map(
      r => new vscode.FoldingRange(r.startLine, r.endLine, vscode.FoldingRangeKind.Region)
    );
  }
}

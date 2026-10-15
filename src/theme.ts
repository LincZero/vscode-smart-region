/**
 * 颜色风格主题：内置配色与自定义主题解析。
 *
 * 参考 vscode-region-highlighter 的配色方案：
 *  - 内置若干可"直接切换"的风格主题（LincZero / Rainbow / Day3024 / Morandi）；
 *  - 支持"自定义主题"（数组颜色）；
 *  - 支持"单一颜色"（始终只用这一种）。
 */

/**
 * 颜色条目：既支持纯字符串颜色，也支持 `{ label, color }` 形式（label 暂留作扩展）。
 */
export type RegionColorEntry = string | { label?: string; color: string };

/**
 * 高亮主题枚举（对应 settings 中的 `smartRegion.highlightTheme`）。
 */
export enum HighlightTheme {
  /** 个人风格主题：LincZero */
  LincZero = 'LincZero',
  /** 内置主题：彩虹 */
  Rainbow = 'Rainbow',
  /** 内置主题：Day3024 */
  Day3024 = 'Day3024',
  /** 内置主题：莫兰迪 */
  Morandi = 'Morandi',
  /** 使用 `smartRegion.customTheme` 中的颜色数组 */
  Custom = 'Custom Theme',
  /** 使用 `smartRegion.highlightColor` 单一颜色 */
  Single = 'Single Color',
}

/** 仅包含内置主题名的联合类型 */
type BuiltinTheme =
  | HighlightTheme.LincZero
  | HighlightTheme.Rainbow
  | HighlightTheme.Day3024
  | HighlightTheme.Morandi;

/**
 * 内置主题配色。
 *
 * 透明度换算（rgba 的 alpha → 十六进制）：
 *  0.05 = 0D, 0.10 = 1A, 0.15 = 26, 0.20 = 33
 */
export const DEFAULT_THEMES: Record<BuiltinTheme, string[]> = {
  [HighlightTheme.LincZero]: [
    '#C8E6F50d',
    '#AA82A00d',
    '#51AFE20d',
    '#FAEB5A0d',
    '#4DA96D0d',
    '#D050450d',
  ],
  [HighlightTheme.Rainbow]: [
    '#FF00001A',
    '#FF45001A',
    '#FFFF0026',
    '#90EE9026',
    '#0000FF0D',
    '#8000801A',
  ],
  [HighlightTheme.Day3024]: [
    '#C8E6F533',
    '#AA82A033',
    '#51AFE233',
    '#FAEB5A33',
    '#4DA96D33',
    '#D0504533',
  ],
  [HighlightTheme.Morandi]: [
    '#B7B1A526',
    '#D8CAAF26',
    '#C9C0D326',
    '#F0A48D26',
    '#96545426',
  ],
};

/** 无有效颜色时的兜底色 */
const FALLBACK_COLOR = '#C9C4E930';

/**
 * 将任意形式的颜色条目归一化为字符串数组。
 * 兼容 `Array<color>` 与 `Array<{ label, color }>` 两种写法。
 */
export function normalizeColors(entries: RegionColorEntry[] | undefined): string[] {
  return (entries ?? [])
    .map(entry => (typeof entry === 'string' ? entry : entry?.color))
    .filter((color): color is string => typeof color === 'string' && color.length > 0);
}

/**
 * 根据配置解析出当前生效的颜色调色板。
 *
 * 保证返回值非空：
 *  - `Single Color`        → 仅 `highlightColor` 一种颜色（始终只用这一种）；
 *  - `Custom Theme`        → `customTheme` 数组；
 *  - 内置主题              → 对应内置配色数组；
 *  - 其它未知值 / 空数组   → 兜底为 `highlightColor`。
 */
export function resolvePalette(
  theme: string | undefined,
  customTheme: RegionColorEntry[] | undefined,
  defaultColor: string | undefined
): string[] {
  const fallback = defaultColor && defaultColor.length > 0 ? defaultColor : FALLBACK_COLOR;

  let palette: string[];
  switch (theme) {
    case HighlightTheme.Custom:
      palette = normalizeColors(customTheme);
      break;
    case HighlightTheme.Single:
      palette = [fallback];
      break;
    default: {
      const builtin = DEFAULT_THEMES[theme as BuiltinTheme];
      palette = builtin ? [...builtin] : [fallback];
      break;
    }
  }

  return palette.length > 0 ? palette : [fallback];
}

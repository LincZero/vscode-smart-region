# Smart region

智能地、便携地、无感地、快速声明 region 选区，并优化 region 选区的显示

## 使用

无需配置和启动，开箱即用。

允许用注释分割线 `# ---` / `// ---` / `/* ---` 便捷快速地定义可折叠区域

## 安装

扩展商店搜索 `Smart Region` 并安装。

或者在 github release 页面手动下载 `.visx` 文件，然后在 vscode 扩展处点击三个点的图标 > "从 VISX 安装"

## 特性

### 智能 region 折叠

只要在代码中用一行"分割线注释"作为标题，就会自动形成一个 **Region** 折叠区域：

```python
# --- 工具函数 ---
def foo(): ...
def bar(): ...

# --- 业务逻辑 ---
class Service:
    ...
```

```typescript
// --- 数据层 ---
function load() { ... }
function save() { ... }

// --- 视图层 ---
function render() { ... }
```

只要注释符合以下形式，就会被识别为分割线：

| 语言风格 | 示例 |
| --- | --- |
| Shell / Python / YAML | `# --- 标题 ---` |
| C / JS / TS / Go / Rust | `// --- 标题 ---` |
| C 风格块注释 | `/* --- 标题 ---` |

`-` 的数量要求 **3 个及以上**。

### 支持缩进敏感的结束规则

每条分割线对应一个折叠范围，范围在遇到下面任意一种情况时结束：

1. **缩进更小** 的代码行（结束于其上一行）；
2. **同缩进** 的另一条分割线（结束于其上一行）；
3. 扫描到 **文档末尾**（结束于最后一行）。

空行不参与边界判定，且末尾空行会被自动裁掉，避免"折叠了却没有内容"的空折叠。

可选设置: 关闭 `smartRegion.enableIndentEnd` 后，所有分割线都被视为顶格，规则1将失效

## 设计哲学

`#region #endregion` 很好用，但还不够好用，写起来还是较麻烦。
而 Smart Region 通过智能判断结束区域，大大简化了声明区域的语法。

并且，在注释中添加 `---` 分割线也是很多人的注释使用习惯之一，哪怕没有该插件。
所以并不会带来额外的语法，代码依旧清晰可读。

## Deploy

```bash
# 修改 package.json 的 "version": "0.0.2",
vsce package
vsce publish # 或手动发布于 https://marketplace.visualstudio.com/manage/publishers/linczero
```

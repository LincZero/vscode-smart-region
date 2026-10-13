# Smart Region

Declare region selections intelligently, portably, seamlessly, and quickly, and optimize how region selections are displayed.

## Usage

No configuration or startup is required. It works out of the box.

You can use comment separators `# ---` / `// ---` / `/* ---` to conveniently and quickly define collapsible regions.

## Installation

Search for `Smart Region` in the extension marketplace and install it.

Alternatively, manually download the `.vsix` file from the GitHub release page, then in the VSCode Extensions view, click the three-dot icon > "Install from VSIX".

## Features

### Smart Region Folding

As long as you use a line of "separator comment" as a title in your code, it will automatically form a **Region** folding area:

```python
# --- Utility functions ---
def foo(): ...
def bar(): ...

# --- Business logic ---
class Service:
    ...
```

```typescript
// --- Data layer ---
function load() { ... }
function save() { ... }

// --- View layer ---
function render() { ... }
```

A comment will be recognized as a separator if it matches one of the following forms:

| Language style | Example |
| --- | --- |
| Shell / Python / YAML | `# --- Title ---` |
| C / JS / TS / Go / Rust | `// --- Title ---` |
| C-style block comment | `/* --- Title ---` |

The number of `-` characters must be **3 or more**.

### Indentation-sensitive End Rules

Each separator corresponds to a folding range. The range ends when any of the following conditions is met:

1. A code line with **smaller indentation** (ends on the line above it);
2. Another separator with the **same indentation** (ends on the line above it);
3. The **end of the document** is reached (ends on the last line).

Blank lines do not participate in boundary detection, and trailing blank lines are automatically trimmed to avoid empty folds that "fold but contain no content".

Optional setting: when `smartRegion.enableIndentEnd` is disabled, all separators are treated as top-level.  
That is, rule 1 no longer applies, and a separator ends automatically only when the next separator is encountered.

### Highlight Indicator

Optional setting: when `smartRegion.enableHighlight` is disabled, this feature is turned off.

Optional setting: the color can be configured.

## Design Philosophy

`#region #endregion` is useful, but not useful enough; it is still somewhat cumbersome to write.  
Smart Region greatly simplifies the syntax for declaring regions by intelligently determining where a region ends.

In addition, adding `---` separators in comments is one of the common commenting habits of many people, even without this extension.  
So it does not introduce extra syntax, and the code remains clear and readable.

Drawbacks:

VSCode lacks some corresponding hooks, making it impossible to implement some region features:  
For example, `#region` or `// MARK:` uses the built-in `Minimap Section Headers` feature to display annotation names in the scroll minimap.  
Unless you use it like this: `// --- MARK: region area ---`, but even that is not good enough.

## Deploy

```bash
# Change "version": "0.0.2" in package.json
vsce package
vsce publish # Or manually publish at https://marketplace.visualstudio.com/manage/publishers/linczero
```

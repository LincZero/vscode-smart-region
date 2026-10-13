/**
 * 智能 region 选区扩展
 * 
 * @author LincZero
 * co-author: deepseek-v4.1
 */

import * as vscode from 'vscode';
import { SmartRegionFoldingProvider } from './region';
import { RegionHighlighter } from './highlight';

// 语言列表
const SupportedLanguages = [
  'javascript', 'typescript', 'java', 'python', 'ruby',
  'csharp', 'cpp', 'go', 'rust', 'php', 'shellscript',
];

/// 当你的扩展被激活时会调用此方法
export function activate(context: vscode.ExtensionContext) {
  // --- commands ---
  {
    let disposable = vscode.commands.registerCommand('smart-region.toggle', () => {
      vscode.window.showInformationMessage('待开发');
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('smart-region.toggleHighlight', () => {
      vscode.window.showInformationMessage('待开发');
    });
    context.subscriptions.push(disposable);
  }

  // --- region 区域 ---
  {
    const provider = new SmartRegionFoldingProvider();

    // 注册给对应的文件类型
    const selector: vscode.DocumentSelector = SupportedLanguages.map(
      lang => ({
        scheme: '*', // 或 `{ scheme: 'file' }`, 对未保存文件（untitled）、虚拟文档等不会生效
        language: lang
      })
    );
    context.subscriptions.push(
      vscode.languages.registerFoldingRangeProvider( // 注册折叠范围提供程序
        selector, 
        provider
      )
    );
  }

  // --- region 高亮 ---
  {
    const highlighter = new RegionHighlighter();
    context.subscriptions.push(highlighter);

    // 统一入口：只有受支持的语言才更新
    const updateIfSupported = (editor: vscode.TextEditor | undefined) => {
      if (!editor) { return; }
      if (!SupportedLanguages.includes(editor.document.languageId)) { return; }
      highlighter.update(editor);
    };

    // 刷新视图
    const refreshAll = () => {
      for (const editor of vscode.window.visibleTextEditors) {
        updateIfSupported(editor);
      }
    };
    refreshAll(); // 初始刷新

    // 切换活动编辑器 / 可见编辑器集合变化
    context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor(editor => updateIfSupported(editor)),
      vscode.window.onDidChangeVisibleTextEditors(editors => {
        for (const editor of editors) { updateIfSupported(editor); }
      })
    );

    // 监听文档内容变化
    context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument(e => {
        const editor = vscode.window.visibleTextEditors.find(ed => ed.document === e.document);
        if (editor) { updateIfSupported(editor); }
      })
    );

    // 监听配置变化：颜色/开关可能变化 → 重建装饰并全量刷新
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('smartRegion')) {
          highlighter.dispose();
          refreshAll();
        }
      })
    );
  }
}

/// 当你的扩展被停用时会调用此方法
export function deactivate() {}

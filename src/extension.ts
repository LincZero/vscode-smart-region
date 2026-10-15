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
    // 手动刷新当前视图
    let disposable = vscode.commands.registerCommand('smart-region.refresh', async () => {
      vscode.window.showInformationMessage(`Smart Region：刷新成功`);
    });
    context.subscriptions.push(disposable);

    // 切换插件总开关
    disposable = vscode.commands.registerCommand('smart-region.toggle', async () => {
      const cfg = vscode.workspace.getConfiguration('smartRegion');
      const next = !cfg.get<boolean>('enable', true);
      await cfg.update('enable', next, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`Smart Region：插件功能已${next ? '开启' : '关闭'}`);
    });
    context.subscriptions.push(disposable);

    // 切换高亮开关
    disposable = vscode.commands.registerCommand('smart-region.toggleHighlight', async () => {
      const cfg = vscode.workspace.getConfiguration('smartRegion');
      const next = !cfg.get<boolean>('enableHighlight', true);
      await cfg.update('enableHighlight', next, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`Smart Region：高亮已${next ? '开启' : '关闭'}`);
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

    // 刷新所有编辑器窗口的视图
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

    // 监听: 文档内容变化 -> 更新视图
    context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument(e => {
        const editor = vscode.window.visibleTextEditors.find(ed => ed.document === e.document);
        if (editor) { updateIfSupported(editor); }
      })
    );

    // 监听: 配置变化：颜色/开关可能变化 → 重建装饰并全量刷新
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

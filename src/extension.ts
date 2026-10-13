/**
 * 智能 region 选区扩展
 * 
 * @author LincZero
 * co-author: deepseek-v4.1
 */

import * as vscode from 'vscode';
import { computeRegions } from './region';

class SmartRegionFoldingProvider implements vscode.FoldingRangeProvider {
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

/// 当你的扩展被激活时会调用此方法
export function activate(context: vscode.ExtensionContext) {
  // --- debug
  {
    // 使用控制台输出诊断信息（console.log）和错误信息（console.error）
    // 这行代码只会在你的扩展被激活时执行一次
    console.log('Congratulations, your extension "smart-region" is now active!');

    // 该命令已在 package.json 文件中定义
    // 现在通过 registerCommand 提供该命令的实现
    // commandId 参数必须与 package.json 中的 command 字段匹配
    const disposable = vscode.commands.registerCommand('smart-region.helloWorld', () => { // 注册命令
      // 你放在这里的代码会在每次执行该命令运行时向用户显示消息框
      vscode.window.showInformationMessage('Hello World from SmartRegion!');
    });

    context.subscriptions.push(disposable);
  }

  // --- region 区域
  {
    const provider = new SmartRegionFoldingProvider();

    // 注册给所有文件类型。也可以改成按语言列表：
    // [{ language: 'python' }, { language: 'typescript' }, ...]
    // { scheme: 'file' }, 对未保存文件（untitled）、虚拟文档等不会生效
    context.subscriptions.push(
      vscode.languages.registerFoldingRangeProvider( // 注册折叠范围提供程序
        { scheme: '*' },
        provider
      )
    );
  }

  // --- region 高亮
  // (未开发)
}

/// 当你的扩展被停用时会调用此方法
export function deactivate() {}

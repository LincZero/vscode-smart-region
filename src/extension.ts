// 'vscode' 模块包含 VS Code 扩展性 API
// 在下方导入该模块，并在代码中使用别名 vscode 引用它
import * as vscode from 'vscode';

// 当你的扩展被激活时会调用此方法
// 你的扩展会在命令第一次执行时被激活
export function activate(context: vscode.ExtensionContext) {

	// 使用控制台输出诊断信息（console.log）和错误信息（console.error）
	// 这行代码只会在你的扩展被激活时执行一次
	console.log('Congratulations, your extension "smart-region" is now active!');

	// 该命令已在 package.json 文件中定义
	// 现在通过 registerCommand 提供该命令的实现
	// commandId 参数必须与 package.json 中的 command 字段匹配
	const disposable = vscode.commands.registerCommand('smart-region.helloWorld', () => {
		// 你放在这里的代码会在每次执行该命令时运行
		// 向用户显示消息框
		vscode.window.showInformationMessage('Hello World from SmartRegion!');
	});

	context.subscriptions.push(disposable);
}

// 当你的扩展被停用时会调用此方法
export function deactivate() {}

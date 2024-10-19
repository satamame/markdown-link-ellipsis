import * as vscode from 'vscode';

// package.json で "onLanguage:markdown" を activationEvents にしているので、
// activate 関数は最初に Markdown ファイルが開いた時に呼ばれる。
export function activate(context: vscode.ExtensionContext) {
  // テキストの装飾方法を定義するオブジェクト
  const decorationType = vscode.window.createTextEditorDecorationType({
    textDecoration: 'none; display: none;',
  });

  // エディタごとのデコレーション情報を保持するMap
  const decorationsMap
    = new Map<vscode.TextEditor, vscode.DecorationOptions[]>();

  // Markdown ファイル内の全リンクに対して、装飾を作成または更新する関数
  function updateDecorations(editor: vscode.TextEditor | undefined) {
    if (!editor || editor.document.languageId !== 'markdown') {
        return;
    }

    const text = editor.document.getText();
    const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
    const decorations: vscode.DecorationOptions[] = [];

    // 各ハイパーリンクに対してデコレーション対象の情報を作成する。
    let match;
    while ((match = linkRegex.exec(text))) {
        const startPos = editor.document.positionAt(match.index);
        const endPos = editor.document.positionAt(match.index + match[0].length);
        const decoration = {
            range: new vscode.Range(startPos, endPos),
            hoverMessage: `Full URL: ${match[2]}`
        };
        decorations.push(decoration);
    }

    // Map にデコレーション対象の情報を保存する。
    decorationsMap.set(editor, decorations);

    // デコレーションを適用する。
    applyDecorations(editor);
  }

  // デコレーション対象の情報を使ってデコレーションを適用する関数
  function applyDecorations(editor: vscode.TextEditor | undefined) {
    if (!editor) {
      return;
    }
    const decorations = decorationsMap.get(editor);
    if (!decorations) {
      return;
    }

    const selections = editor.selections;

    // デコレーション対象の情報から、その対象にデコレーションするか判定する関数
    function shouldApplyDecoration(
      decoration: vscode.DecorationOptions
    ): boolean {
      return !selections.some(sel => {
        const dStartLine = decoration.range.start.line;
        const dEndLine = decoration.range.end.line;

        if (sel.isSingleLine && sel.active.line === dStartLine) {
          return true;
        }
        if (sel.start.line <= dStartLine && dEndLine <= sel.end.line) {
          return true;
        }
        return false;
      });
    }

    // デコレーション対象の情報を使って、実際に適用するデコレーションを作る。
    const decorationsToApply = decorations.filter(shouldApplyDecoration)
      .map(d => {
        const text = editor.document.getText(d.range);
        const match = text.match(/\[([^\]]+)\]\(([^\)]+)\)/);
        if (match) {
          const linkText = match[1];
          const startOffset = editor.document.offsetAt(d.range.start);
          const urlStartOffset = startOffset + linkText.length + 2;
          const urlStartPos = editor.document.positionAt(urlStartOffset);
          return {
            range: new vscode.Range(urlStartPos, d.range.end),
            renderOptions: {
              before: {
                contentText: `(...)`
              },
              rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
            },
            hoverMessage: d.hoverMessage
          };
        }
        return d;
      });

    editor.setDecorations(decorationType, decorationsToApply);
  }

  // 拡張機能の起動時に全ての Markdown エディタを更新
  vscode.window.visibleTextEditors.forEach(editor => {
    updateDecorations(editor);
  });

  // エディタの内容が変更されたとき
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      const editor = vscode.window.activeTextEditor;
      if (editor && event.document === editor.document) {
        updateDecorations(editor);
      }
    })
  );

  // 新しいエディタが開かれたとき、または別のエディタにフォーカスが移ったとき
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(
      editor => updateDecorations(editor)
    )
  );

  // テキストエディタの選択範囲が変更されたときのイベントリスナー
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection(event => {
      applyDecorations(event.textEditor);
    })
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}

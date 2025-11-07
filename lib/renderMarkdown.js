// Simple markdown renderer
function renderMarkdown(text) {
  if (!text) return '';

  // Escape HTML characters
  text = text.replace(/&/g, '&')
             .replace(/</g, '<')
             .replace(/>/g, '>');

  // Code blocks (```language\ncode```)
  text = text.replace(/```(\w*)\n([\s\S]*?)\n```/g, '<pre><code class="language-$1">$2</code></pre>');

  // Inline code (`code`)
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  text = text.replace(/_(.*?)_/g, '<em>$1</em>');

  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Lists
  text = text.replace(/^(\s*)\* (.*$)/gm, '$1<li>$2</li>');
  text = text.replace(/^(\s*)- (.*$)/gm, '$1<li>$2</li>');
  text = text.replace(/(<li>.*<\/li>(\s*<li>.*<\/li>)*)/g, '<ul>$1</ul>');

  text = text.replace(/^(\s*)\d+\. (.*$)/gm, '$1<li>$2</li>');
  text = text.replace(/(<li>.*<\/li>(\s*<li>.*<\/li>)*)/g, '<ol>$1</ol>');

  // 🔹 Thinking blocks -> collapsible dropdown
  text = text.replace(/<(thinking|think)>([\s\S]*?)<\/\1>/gi, (match, tag, inner) => {
    return `
      <details style="margin:4px 0;padding:4px;background:rgba(255,255,255,0.05);border-radius:6px;">
        <summary style="cursor:pointer;color:#ccc;">Hidden reasoning</summary>
        <div style="white-space:pre-wrap;margin-top:4px;">${inner.trim()}</div>
      </details>
    `;
  });

  // Also support unescaped <thinking> and <think> blocks
  text = text.replace(/<(thinking|think)>([\s\S]*?)<\/\1>/gi, (match, tag, inner) => {
    return `
      <details style="margin:4px 0;padding:4px;background:rgba(255,255,255,0.05);border-radius:6px;">
        <summary style="cursor:pointer;color:#ccc;">Hidden reasoning</summary>
        <div style="white-space:pre-wrap;margin-top:4px;">${inner.trim()}</div>
      </details>
    `;
  });

  // Line breaks
  text = text.replace(/\n/g, '<br>');

  return text;
}

window.renderMarkdown = renderMarkdown;
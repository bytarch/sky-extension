// Function to highlight related text on the page based on AI response
window.highlightRelatedText = function(aiResponse) {
  if (!window.currentSelectedHtml || !aiResponse) return;

  // Remove previous highlights
  document.querySelectorAll('.sky-highlight').forEach(el => {
    el.classList.remove('sky-highlight');
    el.style.backgroundColor = '';
  });

  // Extract key phrases from AI response (simple approach - can be improved)
  const keyPhrases = aiResponse.split(/[,.;!?]+/).map(phrase => phrase.trim()).filter(phrase => phrase.length > 3);

  // Find text nodes that match the selected HTML structure and contain key phrases
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  let node;

  while (node = walker.nextNode()) {
    const text = node.textContent.trim();
    if (text.length > 0) {
      keyPhrases.forEach(phrase => {
        if (text.toLowerCase().includes(phrase.toLowerCase())) {
          // Check if this text is structurally similar to our selected HTML
          const parent = node.parentNode;
          if (parent && checkStructuralSimilarity(parent, window.currentSelectedHtml)) {
            // Log the HTML that will be highlighted
            console.log('Highlighting HTML:', parent.outerHTML);
            // Highlight the matching text
            const span = document.createElement('span');
            span.className = 'sky-highlight';
            span.style.backgroundColor = 'yellow';
            span.style.color = 'black';
            span.textContent = text;
            parent.replaceChild(span, node);
            return; // Only highlight first match per phrase
          }
        }
      });
    }
  }
};

// Helper function to check structural similarity between elements
function checkStructuralSimilarity(element, htmlString) {
  if (!element || !htmlString) return false;

  // Simple check: see if the element contains similar text structure
  const elementText = element.textContent || '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const htmlText = doc.body.textContent || '';

  // Check if they have significant text overlap
  const elementWords = elementText.toLowerCase().split(/\s+/);
  const htmlWords = htmlText.toLowerCase().split(/\s+/);

  const overlap = elementWords.filter(word => htmlWords.includes(word)).length;
  const maxLength = Math.max(elementWords.length, htmlWords.length);

  return overlap / maxLength > 0.3; // 30% overlap threshold
}
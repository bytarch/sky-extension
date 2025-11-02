// Handle speaking selected text using the TTS API
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'speakText' && message.selection) {
    speakText(message.selection);
  }
});

async function speakText(text) {
  const url = 'https://api.bytarch.dpdns.org/v1/audio/speech';
  const data = {
    input: text,
    model: 'Alloy'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('TTS API request failed');
    }

    const result = await response.json();
    if (result.data && result.data[0] && result.data[0].url) {
      const audio = new Audio(result.data[0].url);
      audio.play();
    } else {
      console.error('Invalid TTS response');
    }
  } catch (error) {
    console.error('Error speaking text:', error);
  }
}
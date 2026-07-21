const navItems = document.querySelectorAll('.nav-item');
const viewTitle = document.querySelector('#view-title');
const captureForm = document.querySelector('#capture-form');
const captureInput = document.querySelector('#capture-input');
const captureType = document.querySelector('#capture-type');
const memoryStream = document.querySelector('#memory-stream');
const voiceButton = document.querySelector('#voice-button');

navItems.forEach((item) => {
  item.addEventListener('click', () => {
    navItems.forEach((navItem) => navItem.classList.remove('active'));
    item.classList.add('active');
    viewTitle.textContent = item.textContent;
  });
});

captureForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = captureInput.value.trim();
  if (!text) return;

  const type = captureType.value === 'auto' ? detectType(text) : captureType.value;
  const item = document.createElement('div');
  item.className = 'memory-item';
  item.innerHTML = `
    <small>${escapeHtml(type.toUpperCase())}</small>
    <p>${escapeHtml(text)}</p>
    <time>Now</time>
  `;

  memoryStream.prepend(item);
  captureInput.value = '';
  captureInput.focus();
});

voiceButton.addEventListener('click', () => {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!Recognition) {
    voiceButton.textContent = 'Voice unavailable';
    return;
  }

  const recognition = new Recognition();
  recognition.lang = 'en-AU';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  voiceButton.textContent = 'Listening…';
  recognition.start();

  recognition.addEventListener('result', (event) => {
    captureInput.value = event.results[0][0].transcript;
    voiceButton.textContent = 'Voice';
    captureInput.focus();
  });

  recognition.addEventListener('end', () => {
    voiceButton.textContent = 'Voice';
  });

  recognition.addEventListener('error', () => {
    voiceButton.textContent = 'Try voice again';
  });
});

function detectType(text) {
  const value = text.toLowerCase();
  if (value.includes('decided') || value.includes('choose') || value.includes('because')) return 'decision';
  if (value.includes('need to') || value.includes('task') || value.includes('todo')) return 'task';
  if (value.includes('remember') || value.includes('happened')) return 'memory';
  return 'idea';
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character]);
}

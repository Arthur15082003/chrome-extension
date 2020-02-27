const input = document.getElementsByTagName('textarea')[0];
input.value="";
let text;
chrome.storage.local.get('congratTexts', (e) => {
  let { congratTexts } = e;
  if (!!congratTexts.length) {
    let randomNumber = Math.floor(Math.random() * congratTexts.length);
    text = congratTexts[randomNumber];
  } else {
    text = 'happy birthday!!';
  }
  input.value = text;
  input.innerText = text;
  input.setAttribute('value', input.value);
  const button = document.querySelectorAll('[type=submit]')[0];

  if (input.value && button) {
    button.click();
    chrome.runtime.sendMessage('clicked');
  }
})
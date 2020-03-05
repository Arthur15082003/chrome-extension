let neededIds = [];
let neededNames = [];
const today = getTodayData();
const { dateToday, hourNow } = today;
let congratAfterMinutes;

async function fetchBirthdays() {
  let response = await fetch('https://www.facebook.com/events/birthdays/');
  if (response) {
    let t = await response.text();
    if (!t.includes('birthdays-content')) {
      response = await fetch('https://www.facebook.com/birthdays/');
      t = await response.text();
    }
    if (t.includes('<input type="password"')) {
      createNotification('facebookLogin');
      return;
    }
    if (t) {
      if (t.includes('birthdays_today_card')) {
        let today = t.split('birthdays_today_card')[1];
        if (today) {
          if (today.includes('birthdays_recent_card')) {
            today = today.split('birthdays_recent_card')[0];
          } else {
            today = today.split('birthdays_upcoming_card')[0];
          }
          let bd = today.split('_tzn');
          for (let i = 1; i < bd.length; i++) {
            let birthdayHtml = bd[i].split('</div>');
            if (birthdayHtml) {
              let id = birthdayHtml[0].split('/ajax/hovercard/user.php?id=')[1];
              let name = birthdayHtml[0].split('data-hovercard-prefer-more-content-show="1">')[1];
              if (name) {
                name = name.split('<')[0];
                if (name) {
                  neededNames.push(name);
                }
              }
              if (id) {
                id = id.split('&')[0];
                if (id) {
                  neededIds.push(id);
                }
              }
            }
          }
        }
      }
      createNotification('congrat');
    }
  }
}

function asyncCreateTab(tabProps) {
  return new Promise((resolve) => {
    chrome.tabs.create(tabProps, (tab) => {
      if (!chrome.runtime.lastError) {
        resolve(tab);
      }
    })
  })
}

function asyncTimeOut(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function congrat(index) {
  if (!!neededIds.length) {
    chrome.storage.local.get('dontSendUsers', async (e) => {
      if (!Object.keys(e).length || !e.dontSendUsers[neededIds[index]]) {
        let tab = await asyncCreateTab({ url: `https://m.facebook.com/messages/compose?ids=${neededIds[index]}`, active: false });
        if (tab) {
          chrome.tabs.executeScript(tab.id, {file: './magic.js'}, () => {
            chrome.runtime.onMessage.addListener(async function listener(res) {
              if (res === 'clicked') {
                await asyncTimeOut(3 * 1000);
                chrome.runtime.onMessage.removeListener(listener);
                chrome.tabs.remove(tab.id);
                if (index + 1 < neededIds.length) {
                  congrat(++index);
                }
              }
            })
          });
        }
      }
    })
  }
}

function getTodayData() {
  const today = moment();
  const dateToday = today.format('l');
  const hourNow = today.format('h');
  return {
    dateToday,
    hourNow,
  }
}

function congratTimeOut() {
  if (!!neededIds.length) {
    setTimeout(() => {
      chrome.storage.local.set({sendedDate: dateToday});
      congrat(0);
    }, congratAfterMinutes * 60 * 1000);
  }
}

async function createNotification(noteName) {
  if (hourNow >= 1 && hourNow <= 8) {
    chrome.storage.local.get('sendedDate', (e) => {
      if (!Object.keys(e).length || dateToday !== e.sendedDate) {
        chrome.storage.local.get('congratTexts', (t) => {
          if (!!Object.keys(t).length && !!t.congratTexts.length) {
            let message = '';
            let buttons = [];
            switch (noteName) {
              case 'congrat':
                if (!!neededNames.length) {
                  if (neededNames.length > 1) {
                    message = `Today ${neededNames[0]}'s and ${neededNames.length - 1} more birthdays`;
                    buttons = [
                      { title: 'congratulate now!'},
                      { title: 'congratulate after 15 minutes'}
                    ]; 
                  } else {
                    message = `Today ${neededNames[0]}'s birthday`;
                    buttons = [
                      { title: 'congratulate now!'},
                      { title: 'congratulate after 15 minutes'}
                    ];
                  }
                } else {
                  message = `Today you have no birthdays`;
                }
                break;
              case 'facebookLogin':
                message = 'Please login to facebook then reload the extension';
            }

            chrome.notifications.create(
              noteName, {   
                type: 'basic', 
                title: "Lazy Friend", 
                iconUrl: "./assets/icon.png",
                message,
                buttons,
                requireInteraction: true,
              }
            );
          }
        })
      }
    })
  }
}
window.addEventListener('load', async () => {
  chrome.storage.local.get('congratTexts', async (e) => {
    if (!!Object.keys(e).length && !!e.congratTexts.length) {
      await fetchBirthdays();
    }
  })
  chrome.notifications.onClosed.addListener((noteId) => {
    switch (noteId) {
      case 'congrat':
        if (!!neededIds.length) {
          chrome.notifications.clear(noteId);
        } else {
          chrome.storage.local.get('sendedDate', (e) => {
            if (!Object.keys(e).length || dateToday !== e.sendedDate) {
              chrome.storage.local.set({'sendedDate': dateToday});
              chrome.notifications.clear(noteId);
            }
          })
        }
      case 'facebookLogin':
        chrome.notifications.clear(noteId); 
    }

  })
  chrome.notifications.onButtonClicked.addListener((noteId, buttonIndex) => {
    if (noteId = 'congrat') {
      switch (buttonIndex) {
        case 0:
          congratAfterMinutes = 0;
          break;
        case 1:
          congratAfterMinutes = 15;
      }
      congratTimeOut();
    }
    chrome.notifications.clear(noteId);
    
  }) 
})
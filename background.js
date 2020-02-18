const neededIds = [];
let neededNames = [];
const today = getTodayData();
const { dateToday, hourNow } = today;
let congratAfterMinutes = 5;

async function fetchBirthdays() {
  let response = await fetch('https://www.facebook.com/events/calendar/birthdays/');
  if (response) {
    let t = await response.text();
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
    }
  }
}

function congrat() {
  chrome.storage.local.get('dontSendUsers', (e) => {
    for (let neededId of neededUsers) {
      if (!Object.keys(e).length || !e.dontSendUsers[neededId]) {
        chrome.tabs.create({ url: `https://m.facebook.com/messages/compose?ids=${neededId}`, active: false }, (tab) => {
          chrome.tabs.executeScript(tab.id, {file: './magic.js'});
        });
      }
    }
  })
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
  if (neededNames) {
    setTimeout(() => {
      chrome.storage.local.set({sendedDate: dateToday});
      congrat();
    }, congratAfterMinutes * 60 * 1000);
  }
}

window.addEventListener('load', async () => {
  await fetchBirthdays();
  if (hourNow >= 1 && hourNow <= 8) {
    chrome.storage.local.get('sendedDate', (e) => {
      if (e) {
        if (dateToday !== e.sendedDate) {
          chrome.storage.local.get('congratTexts', (t) => {
            if (!!Object.keys(t).length && !!t.congratTexts.length) {
              let message;
              if (!!neededNames.length) {
                if (neededNames.length > 1) {
                  message = `Today ${neededNames[0]}'s and ${neededNames.length - 1} more birthdays`;  
                } else {
                  message = `Today ${neededNames[0]}'s birthday`;
                }
              } else {
                message = `Today you have no birthdays`;
              }

              chrome.notifications.create(
                'notification', {   
                  type: 'basic', 
                  title: "Facebook extension!!!", 
                  iconUrl: "./assets/cancel-icon.svg",
                  message,
                  buttons: [
                    { title: 'congrat now'},
                    { title: 'congrat after 15 minutes' },
                  ],
                  requireInteraction: true,
                }
              );
            }
          })
        }
      }
    })
  }
  chrome.notifications.onClosed.addListener(() => {
    chrome.notifications.clear('notification');
    congratTimeOut();
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
    }
    chrome.notifications.clear(noteId);
    congratTimeOut();
  })  
  
})
// chrome.storage.local.remove('sendedDate');

// chrome.storage.local.remove('dontSendUsers');
let inputValues = [];
let buttons = [];

const getAllButtons = () => {
  buttons = document.getElementsByClassName('remove-button');
}

const addInput = (value) => {
  let newElement = document.createElement("div");
  newElement.setAttribute('class', "input-content");
  let firstElement = document.createElement("div");
  firstElement.setAttribute('class', "mdc-text-field mdc-text-field--fullwidth");
  let inputElement = document.createElement("input");
  inputElement.setAttribute('class', "mdc-text-field__input congrat-text");
  inputElement.setAttribute("type", "text");
  inputElement.setAttribute("placeholder", "Congratulations text")
  if (value) {
    inputElement.setAttribute("value", value);
  }
  firstElement.appendChild(inputElement);

  let secondElement = document.createElement("img");
  secondElement.setAttribute('src', './assets/cancel-icon.svg');
  secondElement.setAttribute('class', 'remove-button');
  secondElement.setAttribute('alt', 'cancel-icon');

  newElement.appendChild(firstElement);
  newElement.appendChild(secondElement);

  document.getElementsByClassName('inputs')[0].appendChild(newElement);

  getAllButtons();
  setButtonsListeners();
}

document.getElementById('addInput').addEventListener('click', () => {
  addInput(undefined);
})

document.getElementsByClassName('reload')[0].addEventListener('click', () => {
  chrome.runtime.reload();
});

const setDontSendUsers = () => {
  chrome.storage.local.get('dontSendUsers', (e) => {
    const { dontSendUsers } = e;

    let users = document.getElementsByClassName('users-content')[0];
    users.innerHTML = "";

    for (user in dontSendUsers) {
      let userContent = document.createElement("div");
      userContent.setAttribute('class', 'user-content')
      let userImage = document.createElement("img");

      userImage.setAttribute('src', dontSendUsers[user].avatar);
      userImage.setAttribute('class', 'dont-send-user-image');
      userImage.setAttribute('alt', 'user-image');

      let cancelImage = document.createElement("img");
      cancelImage.setAttribute('src', '../assets/cancel-icon.svg');
      cancelImage.setAttribute('alt', 'cancel icon');
      cancelImage.setAttribute('class', 'user-remove-icon');

      let imageContent = document.createElement("div");
      imageContent.setAttribute('class', 'image-content');
      imageContent.appendChild(userImage);
      imageContent.appendChild(cancelImage);

      let userName = document.createElement("div");
      userName.setAttribute('class', 'user-name');
      userName.innerHTML = dontSendUsers[user].name;

      userContent.appendChild(imageContent);
      userContent.appendChild(userName);

      users.appendChild(userContent);
    }
    setUsersListeners();
  })
}

const setButtonsListeners = () => {
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', (e) => {
      if (buttons.length > 1) {
        let removedItem = e.toElement.parentElement;
        let input = document.getElementsByClassName('inputs')[0];
        if (removedItem) {
          input.removeChild(removedItem);
        }
        getAllButtons();
      }
    })
  }
}

const setUsersListeners = () => {
  let users = document.getElementsByClassName('user-remove-icon');
  if (!!users.length) {
    for (let i = 0; i < users.length; i++) {
      users[i].addEventListener('click', () => {
        chrome.storage.local.get('dontSendUsers', (e) => {
          const { dontSendUsers } = e;
          let deletedItem = Object.keys(dontSendUsers)[i];
          delete dontSendUsers[deletedItem];
          chrome.storage.local.set({dontSendUsers});
        })
        let usersContent = document.getElementsByClassName('users-content')[0];
        usersContent.removeChild(users[i].parentElement.parentElement);
      });
    }
  }
}

document.getElementById('set').addEventListener('click', () => {
  const inputs = document.getElementsByClassName('congrat-text');
  for (let i = 0; i < inputs.length; i++) {
    if (inputs[i].value) {
      let arrayHasValue = inputValues.find(el => el === inputs[i].value);
      if (!arrayHasValue) {
        inputValues.push(inputs[i].value);
      }
    }
  }
  chrome.storage.local.set({congratTexts: inputValues});
  const today = chrome.extension.getBackgroundPage().getTodayData();
  const { dateToday } = today;
  chrome.storage.local.get('sendedDate', async (e) => {
    if (!Object.keys(e).length || e.sendedDate !== dateToday) {
      await chrome.extension.getBackgroundPage().fetchBirthdays();
    }
  });
})

window.addEventListener('load', () => {
  chrome.storage.local.get('congratTexts', (e) => {
    const { congratTexts } = e;

    if (!!Object.keys(e).length && !!congratTexts.length) {
      const firstInputElement = document.getElementsByClassName('congrat-text')[0];
      firstInputElement.value = congratTexts[0];
      for (let i = 1; i < congratTexts.length; i++) {
        addInput(congratTexts[i]);
      }
    } 
  })
  getAllButtons();
  setButtonsListeners();
  setDontSendUsers();
});

const congratTextsCategory = document.getElementsByClassName('congratTextsCategory')[0];
const dontSendCategory = document.getElementsByClassName('dontSendCategory')[0];
const congratTextsContent = document.getElementsByClassName('congratTextsContent')[0];
const dontSendContent = document.getElementsByClassName('dont-send-content')[0];

congratTextsCategory.addEventListener('click', () => {
  congratTextsCategory.setAttribute('style', 'font-weight: bold; opacity: 1');
  dontSendCategory.setAttribute('style', 'font-weight: normal; opacity: 0.56');
  congratTextsContent.style.display = 'block';
  dontSendContent.style.display = 'none';
})

dontSendCategory.addEventListener('click', () => {
  dontSendCategory.setAttribute('style', 'font-weight: bold; opacity: 1');
  congratTextsCategory.setAttribute('style', 'font-weight: normal; opacity: 0.56;');
  dontSendContent.style.display = 'block';
  congratTextsContent.style.display = 'none';
})

document.getElementsByClassName('add-user-icon')[0].addEventListener('click', async () => {
  let url = '' + document.getElementsByClassName('dont-send-input')[0].value;
  if (url) {
    url = url.replace("www.facebook.com", "m.facebook.com");
    let response = await fetch(url);
    if (response) {
      t = await response.text();
      if (t) {
        let name = t.split('<title>')[1];
        if (name) {
          name = name.split('<')[0];
        }
        let avatar = t.split('img profpic')[1]; 
        if (avatar) {
          avatar = avatar.split('url(&#039;')[1];
          if (avatar) {
            avatar.split(';');
          }
        }

        avatar = avatar.replace(/\\\\3a/g, ':');
        avatar = avatar.replace(/\\\\3d/g, '=');
        avatar = avatar.replace(/\\\\26/g, '&');
        avatar = avatar.replace(/ /g, '');

        let id = t.split('method="post"')[1]
        if (id) {
          id = id.split('php?id=')[1];
          if (id) {
            id = id.split('&')[0];
          }
        }

        const user = {
          [id]: {
            name,
            avatar,
          }
        }
        let dontSendUsers;
        chrome.storage.local.get('dontSendUsers', (list) => {
          let dontSendUsers;
          if (!!Object.keys(list).length && !!Object.keys(list.dontSendUsers).length) {
            for (key in list.dontSendUsers) {
              if (Object.keys(user)[0] === key) {
                return;
              } 
              dontSendUsers = {
                ...list.dontSendUsers,
                ...user
              };
            }
          } else {
            dontSendUsers = {
              ...user
            }
          }
          document.getElementsByClassName('dont-send-input')[0].value = '';
          chrome.storage.local.set({dontSendUsers}, () => {
            setDontSendUsers();
          })
        })
      }
    }
  }
})
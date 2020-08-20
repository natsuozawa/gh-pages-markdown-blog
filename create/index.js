// Local Storage keys
import { LOCALSTORAGE_TITLE_KEY, LOCALSTORAGE_BODY_KEY, LOCALSTORAGE_USERNAME_KEY, LOCALSTORAGE_REPOSITORY_KEY, LOCALSTORAGE_TEMPLATE_KEY, LOCALSTORAGE_LOCALE_KEY } from "../common.js";

// UI
import { home, save, send, titleEditor, mainEditor } from "../common.js";

// Utility functions and objects
import { Base64, titleToPath } from "../common.js";

// UI functions
import { updateSaveUI } from "../common.js";

// Backend functions
import { prepareHtml, retrieveDataFile, pushDataFile } from "../common.js";

// Check required settings
const githubUsername = localStorage.getItem(LOCALSTORAGE_USERNAME_KEY);
const githubRepository = localStorage.getItem(LOCALSTORAGE_REPOSITORY_KEY);
const templateUrl = localStorage.getItem(LOCALSTORAGE_TEMPLATE_KEY);
let siteLocale = localStorage.getItem(LOCALSTORAGE_LOCALE_KEY);
siteLocale = siteLocale ? siteLocale : undefined;

if (!githubUsername || !githubRepository || !templateUrl) location.assign("../settings");

// Showdown initialization
const converter = new showdown.Converter();
converter.setFlavor("github");

// State
let currentBodyHtml = "";
let githubPersonalAccessToken = null;
let data = {};
let entries = [];
let entriesTemp;

// Local Storage retrieval
const savedTitle = localStorage.getItem(LOCALSTORAGE_TITLE_KEY);
const savedBody = localStorage.getItem(LOCALSTORAGE_BODY_KEY);
if (savedTitle) {
  titleEditor.value = savedTitle;
}
if (savedBody) {
  mainEditor.value = savedBody;
  currentBodyHtml = savedBody;
}

// Real time preview and saved state update
const updatePreview = () => {
  const text = mainEditor.value;
  const html = converter.makeHtml(text);
  document.querySelector(".preview").innerHTML = html;
  currentBodyHtml = html;
  updateSaveUI(false);
};

updatePreview();

mainEditor.addEventListener("input", updatePreview);
titleEditor.addEventListener("input", () => updateSaveUI(false));

// Save entry for later use
const saveEntry = () => {
  localStorage.setItem(LOCALSTORAGE_TITLE_KEY, titleEditor.value);
  localStorage.setItem(LOCALSTORAGE_BODY_KEY, mainEditor.value);
  updateSaveUI(true);
};
save.addEventListener("click", saveEntry);

// Home navigation 
home.addEventListener("click", () => {
  location.assign("../");
});

// Retrieve .gpmb.json data
retrieveDataFile(githubUsername, githubRepository).then(d => {
  data = d;
  entries = d.hasOwnProperty("content") ? JSON.parse(Base64.decode(d.content)) : [];
});

// New entry creation
/**
 * Adds a new entry into the .gpmb.json object
 * @param {string} title 
 * @param {date} publicationDate
 * @returns {boolean} true if title is valid false if otherwise
 */
const updateDataFile = (title, publicationDate) => {
  let validTitle = true;
  entries.forEach(obj => {
    if (obj.title == title) validTitle = false;
  });

  if (!validTitle) {
    alert("There is already a page with the same title.");
    return false;
  }

  entriesTemp = [...entries];

  entriesTemp.push({
    "title": title,
    "path": titleToPath(title),
    "publicationDate": publicationDate,
    "lastEditedDate": publicationDate,
  });
  return true;
};

/**
 * Pushes changes to Github
 * @param {string} content base64 encoded html file
 * @returns {boolean} true if successful, false if otherwise
 */
const pushEntry = (content) => {
  if (!githubPersonalAccessToken) {
    githubPersonalAccessToken = prompt("Please enter your Github Personal Access Token. (PAT should have the 'public_repo' permission. Store your PAT in a password manager. More info: https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token)");
  }
  if (!githubPersonalAccessToken) return;

  fetch(`https://api.github.com/repos/${githubUsername}/${githubRepository}/contents/${titleToPath(titleEditor.value)}/index.html`, {
    "method": "PUT",
    "headers": {
      "Accept": "application/vnd.github.v3+json",
      "Authorization": "Basic " + Base64.encode(`${githubUsername}:${githubPersonalAccessToken}`)
    },
    "body": JSON.stringify({
      "message": "Create new page via GPMB",
      "content": content
    }),
    "mode": "cors"
  }).then(response => {
    if (response.status == 201) {
      pushDataFile(githubUsername, githubRepository, githubPersonalAccessToken, JSON.stringify(entriesTemp), data.sha)
      .then(r => {
        if (!r.ok) {
          console.log(r);
          throw new Error();
        }
        localStorage.removeItem(LOCALSTORAGE_TITLE_KEY);
        localStorage.removeItem(LOCALSTORAGE_BODY_KEY);
        location.assign("../");
      }).catch(() => alert("Successfully saved the post but failed to update data file."));
    } else if (response.status >= 400 && response.status < 500) {
      alert("Invalid credentials. Note that the provided personal access token must have the public_repo permission.");
      githubPersonalAccessToken = null;
    } else {
      alert("Error when saving to Github. Check console for response.");
      console.log(response);
    }
  }).catch(error => {
    alert("Failed to save to Github");
    console.error(error);
  });
};

const createEntry = () => {
  // An empty title creates a page under root, potentially destroying the main hub page
  // Files/directories starting with . are ignored so the creation won't be reflected in the system 
  // This is a weak protection but forcefully escaping these restrictions will only do harm to the user
  if (!titleEditor.value || titleEditor.value.charAt(0) == '.') return alert("Invalid title");

  // Load template html file  
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status !== 200) {
        alert("An error occurred when trying to retrieve the template HTML file.");
        return;
      }

      const template = xhr.responseText;
      const title = titleEditor.value;
      const publicationDate = new Date();
      const content = Base64.encode(prepareHtml(template, title, publicationDate.toLocaleDateString(siteLocale, {"year": "numeric", "month": "long", "day": "numeric"}), currentBodyHtml));
      if (!updateDataFile(title, publicationDate)) return;
      pushEntry(content);
    } 
  }

  xhr.open("GET", templateUrl, true);
  xhr.send();
};

send.addEventListener("click", createEntry);
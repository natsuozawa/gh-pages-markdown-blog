// Local Storage keys
import { LOCALSTORAGE_USERNAME_KEY, LOCALSTORAGE_REPOSITORY_KEY, LOCALSTORAGE_TEMPLATE_KEY, LOCALSTORAGE_LOCALE_KEY } from "../common.js";

// UI
import { home, send, titleEditor, mainEditor } from "../common.js";

// Utility functions and objects
import { Base64 } from "../common.js";

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
const path = decodeURI(new URLSearchParams(location.search).get("path"));
let file = {};

// Real time preview and saved state update
const updatePreview = () => {
  const text = mainEditor.value;
  const html = converter.makeHtml(text);
  document.querySelector(".preview").innerHTML = html;
  currentBodyHtml = html;
};

updatePreview();

mainEditor.addEventListener("input", updatePreview);

// Home navigation 
home.addEventListener("click", () => {
  location.assign("../");
});

// Retrieve .gpmb.json data
retrieveDataFile(githubUsername, githubRepository).then(d => {
  data = d;
  entries = d.hasOwnProperty("content") ? JSON.parse(Base64.decode(d.content)) : [];
});

// Retrieve file to be edited 
const retrieveEntry = () => {
  fetch(`https://api.github.com/repos/${githubUsername}/${githubRepository}/contents/${path}/index.html`, {
    "method": "GET",
    "headers": {
      "Accept": "application/vnd.github.v3+json"
    },
    "mode": "cors"
  }).then(response => {
    if (!response.ok) {
      console.log(response);
      throw new Error();
    }
    return response.json();
  }).then(d => {
    file = d;
    
    const html = Base64.decode(d.content);
    const a = html.search("<body>");
    const b = html.search("</body>");
    if (a == -1 || b == -1) {
      alert("Could not load. The HTML file must have a body tag.");
      return;
    }
    const htmlBody = html.substr(a + 6, b - a - 6);
    document.getElementById("workspace").innerHTML = htmlBody;
    const titleRoot = document.querySelector("#workspace #gpmb_title_root");
    if (titleRoot) titleEditor.value = titleRoot.innerText;
    const bodyRoot = document.querySelector("#workspace #gpmb_body_root") ;
    if (bodyRoot) {
      currentBodyHtml = bodyRoot.innerHTML;
      document.querySelector(".preview").innerHTML = currentBodyHtml;
      mainEditor.value = converter.makeMarkdown(currentBodyHtml);
    }
  })
}

retrieveEntry();

// Entry update
/**
 * Adds a new entry into the .gpmb.json object
 * @param {date} lastEditedDate
 */
const updateDataFile = (lastEditedDate) => {
  entriesTemp = entries.map(obj => {
    if (obj.path == path) {
      obj.lastEditedDate = lastEditedDate;
    }
    return obj;
  });
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

  fetch(`https://api.github.com/repos/${githubUsername}/${githubRepository}/contents/${path}/index.html`, {
    "method": "PUT",
    "headers": {
      "Accept": "application/vnd.github.v3+json",
      "Authorization": "Basic " + Base64.encode(`${githubUsername}:${githubPersonalAccessToken}`)
    },
    "body": JSON.stringify({
      "message": "Create new page via GPMB",
      "content": content,
      "sha": file.sha
    }),
    "mode": "cors"
  }).then(response => {
    if (response.ok) {
      pushDataFile(githubUsername, githubRepository, githubPersonalAccessToken, JSON.stringify(entriesTemp), data.sha)
      .then(r => {
        if (!r.ok) {
          console.log(r);
          throw new Error();
        }
        location.assign("../");
      })
      .catch(() => alert("Successfully saved the post but failed to update data file."));
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

const updateEntry = () => {
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
      const lastEditedDate = new Date();
      const content = Base64.encode(prepareHtml(template, title, lastEditedDate.toLocaleDateString(siteLocale, {"year": "numeric", "month": "long", "day": "numeric"}), currentBodyHtml));
      updateDataFile(lastEditedDate)
      pushEntry(content);
    } 
  }

  xhr.open("GET", templateUrl, true);
  xhr.send();
};

send.addEventListener("click", updateEntry);
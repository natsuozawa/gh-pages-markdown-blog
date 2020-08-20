// LocalStorage
import { LOCALSTORAGE_USERNAME_KEY, LOCALSTORAGE_REPOSITORY_KEY, LOCALSTORAGE_LOCALE_KEY } from "../common.js";

// Utility functions and objects
import { Base64 } from "./common.js";

// Backend functions
import { retrieveDataFile, pushDataFile } from "./common.js";

// Retrieve localStorage 
const githubUsername = localStorage.getItem(LOCALSTORAGE_USERNAME_KEY);
const githubRepository = localStorage.getItem(LOCALSTORAGE_REPOSITORY_KEY);
let siteLocale = localStorage.getItem(LOCALSTORAGE_LOCALE_KEY);
siteLocale = siteLocale ? siteLocale : undefined;

if (!githubRepository || !githubUsername) location.assign("settings");

let githubPersonalAccessToken = null;

// State
let data = {};
let entries = [];
let entriesTemp = [];

// Data file
/**
 * Update data file to reflect deletion
 * @param {string} path path to deleted file
 */
const updateDataFile = path => {
  entriesTemp = entries.filter(v => (v.path !== path));
}

// Entry deletion
/**
 * Deletes entry 
 * @param {string} path
 * @param {element} entryContainer
 */
const deleteEntry = (path, entryContainer) => {
  if (!githubPersonalAccessToken) {
    githubPersonalAccessToken = prompt("Please enter your Github Personal Access Token. (PAT should have the 'public_repo' permission. Store your PAT in a password manager. More info: https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token)");
  }
  if (!githubPersonalAccessToken) return;

  // First GET the file to delete because we need the SHA of the file
  fetch(`https://api.github.com/repos/${githubUsername}/${githubRepository}/contents/${path}/index.html`, {
    "method": "GET",
    "headers": {
      "Accept": "application/vnd.github.v3+json",
      "Authorization": "Basic " + Base64.encode(`${githubUsername}:${githubPersonalAccessToken}`)
    },
    "mode": "cors"
  }).then(response => {
    if (!response.ok) {
      console.log(response);
      throw new Error();
    }
    return response.json();
  }).then(d => {
    // Then send the DELETE request
    fetch(`https://api.github.com/repos/${githubUsername}/${githubRepository}/contents/${path}/index.html`, {
      "method": "DELETE",
      "headers": {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": "Basic " + Base64.encode(`${githubUsername}:${githubPersonalAccessToken}`)
      },
      "body": JSON.stringify({
        "message": "Delete page via GPMB",
        "sha": d.sha
      }),
      "mode": "cors"
    }).then(res => {
      if (!res.ok) {
        console.log(res);
        throw new Error();
      }

      // Then update the data file
      pushDataFile(githubUsername, githubRepository, githubPersonalAccessToken, JSON.stringify(entriesTemp), data.sha)
      .then(r => {
        if (!r.ok) {
          console.log(r);
          throw new Error();
        }
        
        // update UI
        entryContainer.remove();
        entries = [...entriesTemp];
      }).catch(() => {
        alert("Successfully deleted file but failed to update data file.");
      });
    }).catch(() => {
      alert("Failed to delete file.");
    });
  }).catch(() => {
    alert("Failed to delete file.");
  });
}

// Retrieve data from .gpmb.json
retrieveDataFile(githubUsername, githubRepository).then(d => {
  data = d;
  entries = d.hasOwnProperty("content") ? JSON.parse(Base64.decode(d.content)) : [];
}).then(() => {
  entries.forEach(entry => {
    const titleTextNode = document.createTextNode(entry.title);
    const publicationDateTextNode = document.createTextNode("Created: " + new Date(entry.publicationDate).toLocaleDateString(siteLocale, {"year": "numeric", "month": "long", "day": "numeric"}));
    const pathTextNode = document.createTextNode("/" + entry.path);
    const entryContainer = document.createElement("div");
    const entryTitle = document.createElement("h2");
    const entryPublicationDate = document.createElement("p");
    const entryLinks = document.createElement("div");
    const entryLink = document.createElement("a");
    const editButton = document.createElement("button");
    const deleteButton = document.createElement("button");
    editButton.classList.add("icon", "mini-icon", "active-icon", "edit");
    deleteButton.classList.add("icon", "mini-icon", "active-icon", "delete");
    editButton.addEventListener("click", () => {
      location.assign(`edit?path=${encodeURI(entry.path)}`);
    });
    deleteButton.addEventListener("click", event => {
      if (confirm("Delete this file? This change can only be reversed through Github.")) {
        updateDataFile(entry.path);
        deleteEntry(entry.path, event.target.parentElement.parentElement);
      }
    });
    entryLink.href = `https://${githubUsername}.github.io/${githubRepository}/${entry.path}`;
    entryTitle.appendChild(titleTextNode);
    entryPublicationDate.appendChild(publicationDateTextNode);
    entryLink.appendChild(pathTextNode);
    entryLink.classList.add("pathlink");
    entryLinks.append(entryLink, editButton, deleteButton);
    entryContainer.append(entryTitle, entryPublicationDate, entryLinks);
    entryContainer.classList.add("entry");
    document.querySelector(".main").appendChild(entryContainer);
  });
});

// Activate menu button event listeners
document.getElementById("create").addEventListener("click", () => {
  location.assign("create");
});

document.getElementById("settings").addEventListener("click", () => {
  location.assign("settings");
});
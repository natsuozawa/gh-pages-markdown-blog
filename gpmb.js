// Main object
var gpmb = {
  error: false,
  username: null,
  repository: null,
  entries: []
}

/**
 * Load .gpmb.json data from Github
 * Always call this function with the appropriate arguments before embedding anything
 * @param {string} username Github username that owns the repository
 * @param {string} repository name of the Github repository with the .gpmb.json file
 * @param {function} callback called if loading succeeds
 */
gpmb.load = function(username, repository, callback) {
  gpmb.username = username;
  gpmb.repository = repository;
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status == 200) {
        gpmb.entries = JSON.parse(xhr.responseText).sort(function(a, b) {
          return new Date(a.lastEditedDate) > new Date(b.lastEditedDate);
        });
        if (typeof callback === "function") callback();
      } else {
        gpmb.error = true;
      }
    }
  }
  xhr.open("GET", "https://raw.githubusercontent.com/" + username + "/" + repository + "/master/.gpmb.json", true);
  xhr.send();
}

/**
 * Embed posts, ordered by date
 * @param {HTML element} element parent element under which embeds will be created
 * @param {number} begin index of the latest element to embed (0-indexed, 0 by default)
 * @param {number} end index of the earliest element to embed (0-indexed, -1 for the last element, -1 by default)
 * @param {string} locale valid locale (eg: en-US, ja-JP)
 */
gpmb.embed = function(element, begin, end, locale) {
  if (typeof begin === "undefined") begin = 0;
  if (typeof end === "undefined") end = -1;
  if (typeof locale === "undefined") locale = "en-US"
  if (end === -1 || end >= gpmb.entries.length) end = gpmb.entries.length - 1;
  if (end < begin) {
    var temp = end;
    end = begin;
    begin = temp;
  }

  for (var i = begin; i <= end; i++) {
    var entry = gpmb.entries[i];
    const titleTextNode = document.createTextNode(entry.title);
    const dateTextNode = document.createTextNode(new Date(entry.lastEditedDate).toLocaleDateString(locale, {"year": "numeric", "month": "long", "day": "numeric"}));
    const entryContainer = document.createElement("div");
    const entryTitle = document.createElement("h2");
    const entryDate = document.createElement("p");
    const entryLink = document.createElement("a");
    entryLink.href = "https://" + gpmb.username + ".github.io/" + gpmb.repository + "/" + entry.path;
    entryLink.appendChild(titleTextNode);
    entryDate.appendChild(dateTextNode);
    entryTitle.appendChild(entryLink);
    entryContainer.appendChild(entryTitle);
    entryContainer.appendChild(entryDate);
    entryContainer.classList.add("gpmb_entry");
    element.appendChild(entryContainer);
  }
}

// Utility
// Base64 stolen code from stackoverflow
export const Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r,c1,c2,c3;r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}};

// Replaces whitespace with -
// Not entirely sure how the proccessing here would affect i18n
export const titleToPath = title => title.trim().toLowerCase().replace(/\s/g, "-");

// Local Storage constants
export const LOCALSTORAGE_TITLE_KEY = "GPMB_DRAFT_TITLE";
export const LOCALSTORAGE_BODY_KEY = "GPMB_DRAFT_BODY";
export const LOCALSTORAGE_USERNAME_KEY = "GPMB_OPTIONS_USERNAME";
export const LOCALSTORAGE_REPOSITORY_KEY = "GPMB_OPTIONS_REPOSITORY";
export const LOCALSTORAGE_TEMPLATE_KEY = "GPMB_OPTIONS_TEMPLATE";
export const LOCALSTORAGE_LOCALE_KEY = "GPMB_OPTIONS_LOCALE";

// Buttons
export const home = document.getElementById("home");
export const save = document.getElementById("save");
export const saved = document.getElementById("saved");
export const send = document.getElementById("send");

// Editors
export const titleEditor = document.getElementById("title-editor");
export const mainEditor = document.getElementById("main-editor");

// Views
export const workspace = document.getElementById("workspace");

// Real time preview and saved status update
/**
 * Switch between the save button and the check icon
 * @param {boolean} s state, true if saved, false if there are unsaved changes
 */
export const updateSaveUI = (s) => {
  if (s) {
    save.style.display = "none";
    saved.style.display = "block";
  } else {
    save.style.display = "block";
    saved.style.display = "none";
  }
};

// Data file
/**
 * Retrieve .gpmb.json file from Github
 * @param {*} githubUsername 
 * @param {*} githubRepository 
 * @returns {promise} response
 */
export const retrieveDataFile = (githubUsername, githubRepository) => { 
  return fetch(`https://api.github.com/repos/${githubUsername}/${githubRepository}/contents/.gpmb.json`, {
    "method": "GET",
    "headers": {
      "Accept": "application/vnd.github.v3+json"
    },
    "mode": "cors"
  }).then(r => {
    if (r.status == 404) {
      return {};
    } else if (r.ok) {
      return r.json();
    } else {
      throw new Error(r.statusText);
    }
  }).catch(e => alert(`Failed to retrieve data file. ${e}`));
};

/**
 * Pushes updated .gpmb.json file to Github
 * @param {string} githubUsername 
 * @param {string} githubRepository 
 * @param {string} githubPersonalAccessToken 
 * @param {string} entries json string of entries
 * @param {string} sha blob SHA of the file being replaced 
 */
export const pushDataFile = (githubUsername, githubRepository, githubPersonalAccessToken, entries, sha = null) => {
  let body = {
    "message": "Update .gpmb.json to reflect new file",
    "content": Base64.encode(entries)
  };
  if (sha) body.sha = sha;
  body = JSON.stringify(body);
  return fetch(`https://api.github.com/repos/${githubUsername}/${githubRepository}/contents/.gpmb.json`, {
    "method": "PUT",
    "headers": {
      "Accept": "application/vnd.github.v3+json",
      "Authorization": "Basic " + Base64.encode(`${githubUsername}:${githubPersonalAccessToken}`)
    },
    "body": body,
    "mode": "cors"
  });
}

// Output preparation
/**
 * Creates html file
 * @param {string} template 
 * @param {string} title
 * @param {string} publicationDateString
 * @param {string} body html
 * @returns {string} html file
 */
export const prepareHtml = (template, title, publicationDateString, body) => {
  // Split template html into before body, inside body, and after body
  const a = template.search("<body>");
  const b = template.search("</body>");
  const c = template.search("<title>");
  if (a == -1 || b == -1) {
    alert("The template HTML file must have a body tag");
    return;
  }
  let templateBeforeBody = template.substr(0, a + 6);
  const templateBody = template.substr(a + 6, b - a - 6);
  const templateAfterBody = template.substr(b);

  if (c !== -1 && d !== -1) {
    templateBeforeBody = templateBeforeBody.substr(0, c + 7) + title + templateBeforeBody.substr(c + 7);
  }

  // Copy body under an invisible element and manipulate DOM to generate the output file
  workspace.innerHTML = templateBody;

  const titleh1 = document.createElement("h1");
  titleh1.appendChild(document.createTextNode(title));
  const titleRoot = document.querySelector("#workspace #gpmb_title_root");
  if (titleRoot) titleRoot.appendChild(titleh1);

  const bodyRoot = document.querySelector("#workspace #gpmb_body_root");
  if (bodyRoot) bodyRoot.innerHTML = body;

  const publicationDatep = document.createElement("p");
  publicationDatep.appendChild(document.createTextNode(publicationDateString));
  const dateRoot = document.querySelector("#workspace #gpmb_date_root");
  if (dateRoot) dateRoot.appendChild(publicationDatep);

  // Concatenate with before body and after body to complete the output html file
  return templateBeforeBody + workspace.innerHTML + templateAfterBody;
};
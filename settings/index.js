import { LOCALSTORAGE_USERNAME_KEY, LOCALSTORAGE_REPOSITORY_KEY, LOCALSTORAGE_TEMPLATE_KEY, LOCALSTORAGE_LOCALE_KEY } from "../common.js";
import { home, save } from "../common.js";

// Fields
const username = document.getElementById("github-username");
const repository = document.getElementById("github-repository");
const template = document.getElementById("template-url");
const locale = document.getElementById("site-locale");

// Retrieve settings
let githubUsername = localStorage.getItem(LOCALSTORAGE_USERNAME_KEY);
let githubRepository = localStorage.getItem(LOCALSTORAGE_REPOSITORY_KEY);
let templateUrl = localStorage.getItem(LOCALSTORAGE_TEMPLATE_KEY);
let siteLocale = localStorage.getItem(LOCALSTORAGE_LOCALE_KEY);
if (githubUsername) username.value = githubUsername;
if (githubRepository) repository.value = githubRepository;
if (templateUrl) template.value = templateUrl;
if (siteLocale) locale.value = siteLocale;

if (!githubUsername || !githubRepository || !templateUrl) {
  document.querySelector(".required").style.display = "block";
}

// Button event listeners
home.addEventListener("click", () => {
  location.assign("../");
});

// Save settings
const saveSettings = () => {
  githubUsername = username.value;
  githubRepository = repository.value;
  templateUrl = template.value;
  siteLocale = locale.value;
  localStorage.setItem(LOCALSTORAGE_USERNAME_KEY, githubUsername);
  localStorage.setItem(LOCALSTORAGE_REPOSITORY_KEY, githubRepository);
  localStorage.setItem(LOCALSTORAGE_TEMPLATE_KEY, templateUrl);
  localStorage.setItem(LOCALSTORAGE_LOCALE_KEY, siteLocale);
  location.assign("../");
};

save.addEventListener("click", saveSettings);
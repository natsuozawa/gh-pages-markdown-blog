# Github Pages Mardown Blog

An easy-to-use, minimalist blogging platform based on markdown for Github Pages.
This platform is designed to be integrated with a separate website that the user creates.

# How it works

Traditionally, blogs have been hosted on centralized blog platforms (e.g. Blogger, hatenablog) or on independent platforms with a CMS. While the former approach allows easy setup, customization capabilities (custom domains, custom layouts, etc.) are usually limited. The latter approach provides much more freedom, but it is often costly to set up and maintain.

Github Pages, however, offers free and easy-to-use infrastructure, on which users are free to deploy static web pages customized to their likings. Github Pages Markdown Blog (GPMB) is built on top of Github Pages, allowing users to quickly create new entries and maintain them.

On GPMB's Blog Manager, users can 
* Write new entries using Github Markdown.
* Create a new page on their Github Pages site.
* Edit or delete existing pages created using GPMB.
* Supply a custom template HTML within which the contents are embedded.

With GPMB's client script, users can
* Display the title and date of all or a specified number of recent entries.

GPMB is intended to be a minimal blog platform, in experiment. Currently, users cannot
* Store thumbnail along with entries.
* Tag entries with relevant categories.

# How to use 

Note that GPMB is intended for people with sufficient web development skills. 

1. Create a new repository on Github. Enable Github Pages. If you are not planning to use a custom domain, the blog posts will be created under https://`username`.github.io/`project name`
2. Create your own template HTML page and stylesheets/scripts.
3. Get a copy of GPMB's client-side script `gpmb.js` on this repository and add it to your repository. This script provides a `gpmb` object, which has methods to get a list of entries and embed them. (API reference below)
4. Create your own index page and embed `gpmb.js`. Use the methods to index your entries.
5. Go to the Blog Manager. You will be required to configure your Github information and specify the template html location in settings. 
6. Write an entry. In order to push it to Github, create a new Github personal access token (PAT) with the permission `public_repo`. Save it in your Password Manager and use it when prompted. (Your credentials are never saved for security - you will have to provide it every time)
7. You are good to go!

# gpmb.js API reference

`gpmb.js` is the client-side script for GPMB. It contains a single object named `gpmb`.

## Data members 

### gpmb.entries
An array of entry objects. Is empty before `gpmb.load()` is called.

Each object has the following properties.

* **title**: the title of the entry
* **path**: the path to the entry - the title in kebab case.
* **publicationDate**: the date when the entry was first created.
* **lastEditedDate**: the date when the entry was last edited.

Entries are ordered by last edited date, from newest to oldest.

### gpmb.error

A boolean. 

* True if an error is raised in `gpmb.load()`
* False if `gpmb.load()` is completed successfully, or it is not called.

### gpmb.username

A string containing the Github username of the repository owner from which entries are loaded. Is set to `null` before `gpmb.load()` is called.

### gpmb.repository

A string containing the name of the Github repository from which entries are loaded. Is set to `null` before `gpmb.load()` is called.

## Methods

### gpmb.load(username, repository, [callback])

Loads data from Github.

The following parameters are accepted.

* **username**: a string containing the Github username of the repository owner from which entries are to be loaded.
* **repository**: astring containing the name of the Github repository from which entries are to be loaded.
* **callback** *(optional, defaults to empty function)*: a function which is called after entries are successfully loaded - the function is not called when there is an error.

Data is saved in `gpmb.entries`. The function returns nothing.

### gpmb.embed(element, [begin], [end], [locale])

Creates a list of entries (an `<h1>` containing the title and a `<p>` containing the last edited date) from `gpmb.entries`.

The following parameters are accepted.

* **element**: an HTML element under which the list is created.
* **begin** *(optional, defaults to 0)*: a number containing the index of the newest entry to embed, 0-indexed.
* **end** *(optional, defaults to -1)*: a number containing the index of the oldest entry to embed, -1 indexed. Use -1 for the earliest entry.
* **locale** *(optional, defaults to `en-US`)*: a string containing a valid locale with which date strings are created.

# Development 

## Running locally 

Start Python's http server in the project directory.

```
$ python3 -m http.server
```

Navigate to `localhost:8000` on the browser.

## Supported browsers

* Blog Manager: Most modern browsers. Tested on Firefox.
* Client-side script: Most browsers. Tested on Firefox.
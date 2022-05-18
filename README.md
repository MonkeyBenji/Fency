# Fency

Fency is a browser extension that will allow the user to install a series of content scripts to optimize the experience of various websites.
The user can toggle the content scripts that will be injected via the popup menu.
Also, external sources can be managed from this menu so users can add/remove scripts from certain sources.

For now, the sources are fixed to a few trusted URL's.
This will allow users to enable content scripts I create to enhance the experience of software I wrote those scripts for.
When the targeted software changes, the scripts can quickly be updated and a refresh from within Fency should fetch the latest versions of the content scripts.

Fency provides a library to allow commonly required content script actions to be programmed with less lines of code.
On top of that, the library adds extra functionality not normally available to content scripts, by communicating with the background script (e.g. typing like a user or closing a tab).

To run the software you can use the command

web-ext run -t chromium

If your terminal is complaining about digitally signing, execution policies, PSSecurityException and stuff, try not using PowerShell, but something like Git Bash

## Content Scripts

The background.js defines a constant SUBSCRIPTIONS_DEFAULT with references to JSON files that define the content scripts that Fency loads.
The current version of Fency does not yet allow the end user to add extra subscriptions.
A developer can just edit the refered json files there to their own liking, references to local files (browser.runtime.getURL) will not get cached for an easier debugging experience.

## Install to Firefox Developer Edition

Zip it
Go to about:addons
Drag&Drop zip file to extension list
(or click cog (settings) icon and choose Install from file)

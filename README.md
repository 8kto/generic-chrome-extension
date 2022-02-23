# Igel: SA Optimizely Tool
![](./images/igel350.jpg)

`Igel` is **Chrome** extension for the Optimizely experiments management.

## Features
<details>
<summary>How does it look?</summary>

![](./images/ui-tab-list.png)

</details>

* The `List` tab lets you control experiments by turning them on or off, selecting a variation, and setting boolean variables for the release toggles.

* The `JSON` tab is for editing raw feature flags JSON: it's preformatted, so it's still more convenient than the native Developer tools section. 
This tab is used when you need to manually modify some experiment's properties, or add/remove it completely. 
However, a new experiment can be added via the button, read further.

* The `Docs` tab contains some important notes about the current implementation and limitations.

* Tab ➕ allows you to add a new experiment.


## Install and update
Preferred way: 
1. Checkout repo to the local machine.
2. Using [this manual](https://developer.chrome.com/docs/extensions/mv3/getstarted/), install the project folder through the "Load unpacked" action.
3. Find the newly installed extension in the browser tray with extensions, pin it.

**Alternatively**, you can install `.crx` extension file through the browser UI. For that, check the [releases page](https://github.com/RedTecLab/igel-chrome-sa-optimizely-tool/releases) (last available version can be staled).

Since the repository is private, it's not possible to automatically get the latest version, 
so for now, the only way to check for updates is to open the repository page and check for the latest release.


## Development
1. Install dependencies: `yarn`
2. [Add code completion for the `chrome` libs](https://newbedev.com/how-do-i-use-webstorm-for-chrome-extension-development).
3. Check [official documentation](https://developer.chrome.com/docs/extensions/mv3/devguide/)


**PR and issue reports are welcome!**

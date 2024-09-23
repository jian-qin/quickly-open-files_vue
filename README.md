# quickly-open-files_vue

English | [简体中文](./README.zh-CN.md)

> Quickly open files in VSCode by right-clicking on elements on the page

## Compatibility

- Vue2、Vue3

## Start (2 choose 1)

1. (Recommended) Download and install the Chrome extension [Quickly open files](https://github.com/jian-qin/quickly-open-files_vue/releases)

```javascript
// Configure in the project
window.__DEV__ROOTPATH // Root path (optional)
window.__DEV__SOURCEPATH // Source code directory (optional)
```

2. Install the npm package in the project

```bash
npm install quickly-open-files_vue
```

## Install VSCode extension

- If you haven't installed the vscode extension [Quickly open files](https://marketplace.visualstudio.com/items?itemName=jian-qin.quickly-open-files), please enable the openUrl option

- The method of opening files through URL cannot distinguish windows. If there are multiple windows, it may open in the wrong window. It is recommended to install the vscode extension

## Usage

```javascript
import QuicklyOpenFilesVue from 'quickly-open-files_vue'

new QuicklyOpenFilesVue()
```

## Configuration

```javascript
new QuicklyOpenFilesVue({
  port: 4444, // Port
  openUrl: false, // Whether to enable the backup function of opening VSCode with URL
  sourcePath: 'src/', // Source code directory
  rootPath: '', // Root path
})
```

## Root path problem

> By default, the value of the component __file property is an absolute path. If it is not the root path, you need to pass in the root path

```javascript
// vue.config.js
process.env.VUE_APP_ROOTPATH = __dirname

// main.js
new QuicklyOpenFilesVue({
  rootPath: process.env.VUE_APP_ROOTPATH
})

// or

// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    'import.meta.env.VITE_ROOTPATH': JSON.stringify(__dirname)
  }
})

// main.js
new QuicklyOpenFilesVue({
  rootPath: import.meta.env.VITE_ROOTPATH
})
```

## Operation

- Hold alt and right click on the element to open the vscode file (the nearest component to which the element belongs)

- Hold ctrl and right click on the page to open the vscode file (the page component of the current route)

- Hold shift and right click on the page to broadcast opening this page (notify other clients to open the current page)

- Hold the keyboard and click the right mouse button multiple times. When you release it, open the vscode file of the nth component to which the element belongs/the nth page component of the nested route

## API

```javascript
const vs = new QuicklyOpenFilesVue(router)

function openFileByElement (element) {
  // Open the vscode file of the nearest component to which the element belongs
  vs.openFileByElement(element)
}

function openFileByPage () {
  // Open the vscode file of the page component of the current route
  vs.openFileByPage()
}

function broadcastOpenPage () {
  // Broadcast opening this page (notify other clients to open the current page)
  vs.broadcastOpenPage()
}
```

## Use in the console

```javascript
window.__VSCode.openFileByElement(document.querySelector('.demo'))
window.__VSCode.openFileByElement($0)

window.__VSCode.openFileByPage()

window.__VSCode.broadcastOpenPage()
```
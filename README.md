# quickly-open-files_vue

English | [简体中文](./README.zh-CN.md)

> Dependency of vscode plugin 'Quickly open files'

## Install vscode plugin

[Quickly open files](https://marketplace.visualstudio.com/items?itemName=jian-qin.quickly-open-files)

## Install

```bash
npm install quickly-open-files_vue
```

## Usage

```javascript
import QuicklyOpenFilesVue from 'quickly-open-files_vue'

const router = createRouter({
  // ...
})

new QuicklyOpenFilesVue(router)
```

## Operation

- Hold alt and click on the element to open the vscode file (the nearest component to which the element belongs)

- Hold ctrl and click on the page to open the vscode file (the page component of the current route)

- Hold shift and click on the page to broadcast opening this page (notify other clients to open the current page)

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
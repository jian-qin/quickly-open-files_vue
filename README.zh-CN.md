# quickly-open-files_vue

[English](./README.md) | 简体中文

**注意：暂未兼容MacOS**

> vscode插件 “Quickly open files” 的依赖

## 安装vscode插件

[Quickly open files](https://marketplace.visualstudio.com/items?itemName=jian-qin.quickly-open-files)

## 安装

```bash
npm install quickly-open-files_vue
```

## 用法

```javascript
import QuicklyOpenFilesVue from 'quickly-open-files_vue'

new QuicklyOpenFilesVue()
```

## 根路径问题

> 默认情况下，组件的__file属性的值是绝对路径，如果不是根路径，需要传入根路径

```javascript
import QuicklyOpenFilesVue from 'quickly-open-files_vue'

new QuicklyOpenFilesVue({
  rootPath: QuicklyOpenFilesVue.formatRootPath_importMetaUrl(import.meta.url)
})
```

## 操作

- 按住alt点击元素打开vscode文件（元素所属最近的组件）

- 按住alt+[1-9]点击元素打开vscode文件（元素所属最近第n个组件）

- 按住ctrl点击页面打开vscode文件（当前路由的页面组件）

- 按住shift点击页面广播打开本页（通知其他客户端打开当前页面）

## API

```javascript
const vs = new QuicklyOpenFilesVue(router)

function openFileByElement (element) {
  // 打开元素所属最近的组件的vscode文件
  vs.openFileByElement(element)
}

function openFileByPage () {
  // 打开当前路由的页面组件的vscode文件
  vs.openFileByPage()
}

function broadcastOpenPage () {
  // 广播打开本页（通知其他客户端打开当前页面）
  vs.broadcastOpenPage()
}
```

## 在控制台中使用

```javascript
window.__VSCode.openFileByElement(document.querySelector('.demo'))
window.__VSCode.openFileByElement($0)

window.__VSCode.openFileByPage()

window.__VSCode.broadcastOpenPage()
```
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

## 配置

```javascript
new QuicklyOpenFilesVue({
  port: 4444, // 端口
  openUrl: false, // 如果连接关闭了就使用使用URL打开VSCode
  rootPath: '', // 根路径
})
```

## 根路径问题

> 默认情况下，组件的__file属性的值是绝对路径，如果不是根路径，则需要传入根路径

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

## 操作

- 按住alt右键元素打开vscode文件（元素所属最近的组件）

- 按住ctrl右键页面打开vscode文件（当前路由的页面组件）

- 按住shift右键页面广播打开本页（通知其他客户端打开当前页面）

- 按住键盘多次点击鼠标右键，松开时打开元素所属的第n个组件/嵌套路由的第n个页面组件的vscode文件

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
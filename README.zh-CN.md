# quickly-open-files_vue

[English](./README.md) | 简体中文

> 通过右键点击页面上的元素，快速在VSCode中打开对应的文件

## 兼容

- Vue2、Vue3

## 开始（2选1）

1. （推荐）下载安装Chrome插件 [Quickly open files](https://github.com/jian-qin/quickly-open-files_vue/releases)

```javascript
// 在项目中配置
window.__DEV__ROOTPATH // 根路径（可选）
```

2. 在项目中安装npm包

```bash
npm install quickly-open-files_vue
```

## 安装VSCode扩展

- 如果没有安装vscode扩展 [Quickly open files](https://marketplace.visualstudio.com/items?itemName=jian-qin.quickly-open-files)，请启用 openUrl 选项

- 通过URL打开文件的方式无法区分窗口，如果有多个窗口，可能会打开在错误的窗口，建议安装vscode扩展

## 用法

```javascript
import QuicklyOpenFilesVue from 'quickly-open-files_vue'

new QuicklyOpenFilesVue()
```

## 配置

```javascript
new QuicklyOpenFilesVue({
  port: 4444, // 端口
  openUrl: false, // 是否启用URL打开VSCode的备用功能
  sourcePath: 'src/', // 源码目录
  eventKey: 'left', // 鼠标按键
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

- 按住alt+鼠标左/右键，点击元素打开vscode文件（元素所属最近的组件）

- 按住ctrl+鼠标左/右键，当前页面打开vscode文件（当前路由的页面组件）

- 按住shift+鼠标左/右键，当前页面广播打开本页（通知其他客户端打开当前页面）

- 按住键盘多次点击鼠标，松开时打开元素所属的第n个组件/嵌套路由的第n个页面组件的vscode文件

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
import ReconnectingWebSocket from 'reconnecting-websocket'
import type { Router } from 'vue-router'

/**
 * Prevent multiple instantiations 防止多次实例化
 */
let isInstantiated = false

export default class QuicklyOpenFiles {
  ws
  #router
  #rootPath
  #holdKeys = new Set<string>()
  /**
   * Format rootPath-import.meta.url 格式化根路径-import.meta.url
   * @param url import.meta.url
   */
  static formatRootPath_importMetaUrl(url: string) {
    const _url = url.match(/[/|\\](\w+:[/|\\]\w+.+?[/|\\])src[/|\\]/)?.[1]
    if (!_url) {
      throw new Error('The root path could not be found.')
    }
    return decodeURI(_url)
  }
  /**
   * @param router vue-router instance vue-router 实例
   * @param port WebSocket port WebSocket 端口
   * @param rootPath root path 根路径
   */
  constructor(router: Router, {
    port = 4444,
    rootPath = ''
  } = {}) {
    if (isInstantiated) {
      throw new Error('QuicklyOpenFiles has already been instantiated.')
    }
    isInstantiated = true
    this.#router = router
    this.#rootPath = rootPath
    this.ws = new ReconnectingWebSocket(`ws://${location.hostname}:${port}/`)
    this.#stopReconnect()
    this.#addListener()
    this.#mountWindowMethod()
  }
  /**
   * Determine to stop reconnecting 判断停止重连
   * @description If the first connection fails, it will not try to connect again later 如果首次连接失败的话，之后就不再尝试连接
   */
  #stopReconnect() {
    const close = () => this.ws.close()
    this.ws.addEventListener('error', close)
    this.ws.addEventListener('open', () => this.ws.removeEventListener('error', close))
  }
  /**
   * Mount the method to the window object for easy access in the console 把方法挂载到 window 对象上，方便在控制台调用
   */
  #mountWindowMethod() {
    // @ts-ignore
    self.__VSCode = {
      openFileByElement: this.openFileByElement,
      openFileByPage: this.openFileByPage,
      broadcastOpenPage: this.broadcastOpenPage,
    }
  }
  #addListener() {
    // Record the currently held keys 记录当前按住的按键
    document.addEventListener('keydown', e => this.#holdKeys.add(e.key))
    document.addEventListener('keyup', e => this.#holdKeys.delete(e.key))
    // Hold alt and click on the element to open the vscode file (the nearest component to which the element belongs) 按住alt点击元素打开vscode文件（元素所属最近的组件）
    document.addEventListener('click', e => {
      if (!e.altKey) return
      const index = this.#getKeyIndex('Alt')
      if (index === -1) return
      e.stopImmediatePropagation()
      this.openFileByElement(e.target as Element, index)
    }, true)
    // Hold ctrl and click on the page to open the vscode file (the page component of the current route) 按住ctrl点击页面打开vscode文件（当前路由的页面组件）
    document.addEventListener('click', e => {
      if (!e.ctrlKey) return
      if (this.#holdKeys.size !== 1) return
      e.stopImmediatePropagation()
      this.openFileByPage()
    }, true)
    // Hold shift and click on the page to broadcast opening this page (notify other clients to open the current page) 按住shift点击页面广播打开本页（通知其他客户端打开当前页面）
    document.addEventListener('click', e => {
      if (!e.shiftKey) return
      const index = this.#getKeyIndex('Shift')
      if (index === -1) return
      e.stopImmediatePropagation()
      this.broadcastOpenPage()
    }, true)
    // Receive broadcast messages from the server (open the specified page) 从服务器接收广播消息（打开指定页面）
    this.ws.addEventListener('message', (res: MessageEvent) => {
      const { to, type, data } = JSON.parse(res.data)
      if (to !== 'client') return
      if (type !== 'relay-broadcast:openPage') return
      if (document.hidden) return
      this.#router.push(data).then(() => {
        console.log(`%cOpened page: %c${data}`, this.#cssBox('#67c23a'), 'font-weight: bold;')
      }).catch(() => {
        console.log(`%cFailed to open page: %c${data}`, this.#cssBox('#f56c6c'), 'font-weight: bold;')
      })
    })
  }
  /**
   * Get the value of other number keys except the specified key 获取除了指定按键外的其他数字按键值
   * @param key specified key 指定的按键
   * @returns number key value 数字按键值
   */
  #getKeyIndex(key: string) {
    if (this.#holdKeys.size > 2) return -1
    const index = Number([...this.#holdKeys].find(_key => _key !== key)) || 0
    if (isNaN(index)) return -1
    return index
  }
  /**
   * Open the vscode file of the nearest component to which the element belongs 打开元素所属最近的组件的vscode文件
   * @param target element to find 要查找的元素
   * @param index number key value 按的数字键值
   * @returns [path, pathList] [路径, 路径列表]
   */
  openFileByElement = (target: Element, index: number = 0) => {
    const domToVueCtx = (dom: any) => {
      while (dom) {
        const ctx = dom.__vnode?.ctx
        if (ctx) {
          return ctx
        } else {
          dom = dom.parentElement
        }
      }
    }
    const getPathList = (ctx: any) => {
      const result: string[] = []
      while (ctx) {
        const path = ctx.type?.__file
        if (path) {
          const _path = this.#joinRootPath(path)
          _path && result.push(_path)
        }
        ctx = ctx.parent
      }
      return result
    }
    const vueCtx = domToVueCtx(target)
    const pathList = getPathList(vueCtx)
    this.#printLog(pathList, index)
    this.#sendOpenFile(pathList[index])
    return [pathList[index], pathList] as const
  }
  /**
   * Open the vscode file of the page component of the current route 打开当前路由的页面组件的vscode文件
   * @returns Opened file path 打开的文件路径
   */
  openFileByPage = () => {
    const matched = this.#router.currentRoute.value.matched
    // @ts-ignore
    let path: string | undefined = matched[matched.length - 1]?.components?.default?.__file
    if (!path) {
      console.log('%cNo file path found.', this.#cssBox('#f56c6c'))
      return
    }
    path = this.#joinRootPath(path)!
    this.#printLog([path], 0)
    this.#sendOpenFile(path)
    return path
  }
  /**
   * Broadcast opening this page (notify other clients to open the current page) 广播打开本页（通知其他客户端打开当前页面）
   * @returns Opened page path 打开的页面路径
   */
  broadcastOpenPage = () => {
    const path = this.#router.currentRoute.value.fullPath
    this.#printLog([path], 0)
    this.ws.send(JSON.stringify({
      to: 'client',
      type: 'relay-broadcast:openPage',
      data: path,
    }))
    return path
  }
  /**
   * Join the root path with the url 拼接根路径和url
   * @param url url to join 要拼接的url
   */
  #joinRootPath(url: string) {
    if (/^[/|\\]?\w+:/.test(url)) {
      return url
    }
    if (!/^[/|\\]?src[/|\\]/.test(url)) {
      return null
    }
    if (['/', '\\'].includes(url[0])) {
      url = url.slice(1)
    }
    return this.#rootPath + url
  }
  /**
   * Send open file message to server 发送打开文件消息到服务器
   * @param path file path 文件路径
   */
  #sendOpenFile(path?: string) {
    if (!path) {
      console.log('%cNo file path found.', this.#cssBox('#f56c6c'))
      return
    }
    this.ws.send(JSON.stringify({
      to: 'server',
      type: 'openFile',
      data: path,
    }))
  }
  /**
   * Print log information 打印日志信息
   * @param list list to print 要打印的列表
   * @param index highlight index 高亮的索引
   */
  #printLog(list: string[], index: number) {
    if (list.length === 0) return
    list = [...list].reverse()
    const result = `%c${list.join('%c\n%c')}`
    const css = list.flatMap((_, i) => {
      const color = list.length - 1 - i === index ? '#409eff' : '#909399'
      return [`${this.#cssBox(color)}margin-left: ${i}em;`, '']
    })
    console.log(result, ...css)
  }
  #cssBox(color: string) {
    return `
      color: #fff;
      background-color: ${color};
      padding: 2px 4px;
      border-radius: 4px;
      margin: 2px 5px 2px 0;
    `
  }
}
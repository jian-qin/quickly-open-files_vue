import ReconnectingWebSocket from 'reconnecting-websocket'
import type { Router, RouteLocationMatched } from 'vue-router'

/**
 * Prevent multiple instantiations 防止多次实例化
 */
let isInstantiated = false

export default class QuicklyOpenFiles {
  ws
  #openUrl = false
  #rootEl
  #sourcePath
  #eventKey
  #rootPath = ''
  #holdKeys = new Set<'alt' | 'ctrl' | 'shift'>()
  #holdCount = 0
  #holdTarget: Element | null = null
  /**
   * @param port WebSocket port WebSocket 端口
   * @param rootEl Root element selector 根元素选择器
   * @param openUrl Whether to enable the backup function of opening VSCode with URL 是否启用URL打开VSCode的备用功能
   * @param sourcePath Source code directory 源码目录
   * @param eventKey Mouse button 鼠标按键
   * @param rootPath root path 根路径
   */
  constructor({
    port = 4444,
    openUrl = false,
    rootEl = '#app',
    sourcePath = 'src/' as string | RegExp,
    eventKey = 'left' as 'left' | 'right',
    rootPath = '',
  } = {}) {
    if (isInstantiated) {
      throw new Error('QuicklyOpenFiles has already been instantiated.')
    }
    isInstantiated = true
    this.#openUrl = openUrl
    this.#rootEl = rootEl
    this.#sourcePath = sourcePath
    this.#eventKey = eventKey
    if (rootPath) {
      this.#rootPath = this.#formatFilePath(rootPath)
      if (!this.#rootPath.endsWith('/')) {
        this.#rootPath += '/'
      }
    }
    this.ws = new ReconnectingWebSocket(`ws://${location.hostname}:${port}/`)
    this.#stopReconnect()
    this.#addListener()
    this.#mountWindowMethod()
  }
  /**
   * Format file path (unify slashes, uppercase drive letter, remove slashes before drive letter) 格式化文件路径（统一斜杠、大小写盘符、去除盘符前的斜杠）
   * @param path file path 文件路径
   * @returns formatted file path 格式化后的文件路径
   */
  #formatFilePath(path: string) {
    return path.replace(/\\/g, '/').replace(/^\/([a-zA-Z]:)/, '$1').replace(/^[a-z]:/, $0 => $0.toUpperCase())
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
    self.__QuicklyOpenFiles_api = {
      openFileByElement: this.openFileByElement,
      openFileByPage: this.openFileByPage,
      broadcastOpenPage: this.broadcastOpenPage,
    }
  }
  /**
   * Add event listener 添加事件监听
   */
  #addListener() {
    // Record the currently held keys 记录当前按住的按键
    const event = { left: 'click', right: 'contextmenu' }[this.#eventKey] as 'click' | 'contextmenu'
    document.addEventListener(event, e => {
      e.altKey && this.#holdKeys.add('alt')
      e.ctrlKey && this.#holdKeys.add('ctrl')
      e.shiftKey && this.#holdKeys.add('shift')
      if (e.altKey || e.ctrlKey || e.shiftKey) {
        this.#holdCount++
        this.#holdTarget = e.target as Element | null
        e.preventDefault()
        e.stopImmediatePropagation()
      }
    }, true)
    // Clear the record when the key is released and trigger the operation 松开按键时清除记录并触发操作
    document.addEventListener('keyup', () => {
      if (this.#holdCount && this.#holdTarget) {
        this.#holdKeys.has('alt') && this.openFileByElement(this.#holdTarget, this.#holdCount)
        this.#holdKeys.has('ctrl') && this.openFileByPage(this.#holdTarget, this.#holdCount)
        this.#holdKeys.has('shift') && this.broadcastOpenPage(this.#holdTarget, this.#holdCount)
      }
      this.#holdCount = 0
      this.#holdKeys.clear()
      this.#holdTarget = null
    })
    // Receive broadcast messages from the server (open the specified page) 从服务器接收广播消息（打开指定页面）
    this.ws.addEventListener('message', (res: MessageEvent) => {
      const { to, type, data } = JSON.parse(res.data)
      if (to !== 'client') return
      if (type !== 'relay-broadcast:openPage') return
      if (document.hidden) return
      const router = this.#getRouter()
      if (!router) return
      router.push(data).then(() => {
        console.log(`%cOpened page: %c${data}`, this.#cssBox('#67c23a'), 'font-weight: bold;')
      }).catch(() => {
        console.log(`%cFailed to open page: %c${data}`, this.#cssBox('#f56c6c'), 'font-weight: bold;')
      })
    })
  }
  /**
   * Get the router instance 获取路由实例
   * @param target element to find 要查找的元素
   * @returns router instance 路由实例
   */
  #getRouter(target?: Element): Router | undefined {
    const vueVersion = this.#getVueVersion(target)
    if (vueVersion === '3') {
      if (target) {
        return this.#domToVueCtx(target)?.appContext.config.globalProperties.$router
      }
      // @ts-ignore
      return document.querySelector(this.#rootEl)?.__vue_app__.config.globalProperties.$router
    } else if (vueVersion === '2') {
      if (target) {
        return this.#domToVueCtx(target)?.$router
      }
      // @ts-ignore
      return document.querySelector(this.#rootEl)?.__vue__.$router
    }
  }
  /**
   * Get the path of the current route 获取当前路由的路径嵌套列表
   * @param target element to find 要查找的元素
   * @returns path list 路径列表
   */
  #getRouterPaths(target?: Element): string[] {
    const router = this.#getRouter(target)
    if (!router) return []
    const vueVersion = this.#getVueVersion(target)
    let matched: RouteLocationMatched[] = []
    if (vueVersion === '3') {
      matched = router.currentRoute.value.matched
    } else if (vueVersion === '2') {
      // @ts-ignore
      matched = router.currentRoute.matched
    }
    return matched.flatMap(item => {
      // @ts-ignore
      let path = item.components?.default?.__file
      if (!path) return []
      path = this.#joinRootPath(path)
      return path ? [path] : []
    }).reverse()
  }
  /**
   * Get the Vue instance of the nearest component to which the element belongs 获取元素所属最近的组件的Vue实例
   * @param dom element to find 要查找的元素
   * @returns Vue instance Vue实例
   */
  #domToVueCtx(dom: any) {
    const getCtx = {
      2: (dom: any) => dom.__vue__,
      3: (dom: any) => dom.__vnode?.ctx,
    }[this.#getVueVersion(dom) as '2' | '3']
    while (dom) {
      const ctx = getCtx(dom)
      if (ctx) {
        return ctx
      } else {
        dom = dom.parentNode
      }
    }
  }
  /**
   * Open the vscode file of the nearest component to which the element belongs 打开元素所属最近的组件的vscode文件
   * @param target element to find 要查找的元素
   * @param index number key value 按的数字键值
   * @returns [path, pathList] [路径, 路径列表]
   */
  openFileByElement = (target: Element, index: number = 1) => {
    index--
    const vueVersion = this.#getVueVersion(target)
    if (!vueVersion) return
    const getPathList = (ctx: any) => {
      const result: string[] = []
      const pushPath = (path?: string) => {
        if (!path) return
        const _path = this.#joinRootPath(path)
        _path && result.push(_path)
      }
      if (vueVersion === '3') {
        while (ctx) {
          pushPath(ctx.type?.__file)
          ctx = ctx.parent
        }
      } else if (vueVersion === '2') {
        while (ctx) {
          pushPath(ctx.$options?.__file)
          ctx = ctx.$parent
        }
      }
      return result
    }
    const vueCtx = this.#domToVueCtx(target)
    const pathList = getPathList(vueCtx)
    this.#printLog(pathList, index)
    this.#sendOpenFile(pathList[index])
    return [pathList[index], pathList] as const
  }
  /**
   * Open the vscode file of the page component of the current route 打开当前路由的页面组件的vscode文件
   * @param target The selected element 选中的元素
   * @param index number key value 按的数字键值
   * @returns Opened file path 打开的文件路径
   */
  openFileByPage = (target?: Element, index: number = 1) => {
    index--
    if (!this.#getVueVersion(target)) return
    const pathList = this.#getRouterPaths(target)
    if (!pathList.length) {
      console.log('%cNo file path found.', this.#cssBox('#f56c6c'))
      return
    }
    this.#printLog(pathList, index)
    this.#sendOpenFile(pathList[index])
    return [pathList[index], pathList] as const
  }
  /**
   * Broadcast opening this page (notify other clients to open the current page) 广播打开本页（通知其他客户端打开当前页面）
   * @returns Opened page path 打开的页面路径
   */
  broadcastOpenPage = (target?: Element, index: number = 1) => {
    index--
    if (!this.#getVueVersion(target)) return
    const pathList = this.#getRouterPaths(target)
    if (!pathList.length) {
      console.log('%cNo file path found.', this.#cssBox('#f56c6c'))
      return
    }
    this.#printLog(pathList, index)
    this.ws.send(JSON.stringify({
      to: 'client',
      type: 'relay-broadcast:openPage',
      data: pathList[index],
    }))
    return [pathList[index], pathList] as const
  }
  /**
   * 获取vue版本
   * @param dom element to find 要查找的元素
   * @returns vue版本
   */
  #getVueVersion(dom?: any): '2' | '3' | undefined {
    while (dom) {
      if (dom.__vnode) {
        return '3'
      } else if (dom.__vue__) {
        return '2'
      } else {
        dom = dom.parentNode
      }
    }
    const root: any = document.querySelector(this.#rootEl)
    if (!root) return
    if (root.__vue_app__) {
      return '3'
    } else if (root.__vue__) {
      return '2'
    }
  }
  /**
   * Join the root path with the url 拼接根路径和url
   * @param url url to join 要拼接的url
   */
  #joinRootPath(url: string) {
    url = this.#formatFilePath(url)
    // If the url starts with a slash, it is an absolute path 如果url以斜杠开头，就是绝对路径
    if (url.startsWith('/')) {
      return url
    }
    // If it is a Windows path, return directly 如果是Windows路径，直接返回
    if (/^[a-zA-Z]:/.test(url)) {
      return url
    }
    // Filter out file paths that are not in the source code directory 过滤掉不在源码目录的文件路径
    if (typeof this.#sourcePath === 'string') {
      if (!url.startsWith(this.#sourcePath)) {
        return null
      }
    } else {
      if (!this.#sourcePath.test(url)) {
        return null
      }
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
    // If the connection is closed, use the URL to open VSCode 如果连接关闭了就使用使用URL打开VSCode
    if (this.ws.readyState === WebSocket.CLOSED && this.#openUrl) {
      if (!path.startsWith('/')) {
        path = '/' + path
      }
      window.open(`vscode://file${path}`)
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
    const result = `%c${list.map((path, index) => `(${list.length - index}) ${path} (${list.length - index})`).join('%c\n%c')}`
    const css = list.flatMap((_, i) => {
      const color = list.length - 1 - i === index ? '#409eff' : '#909399'
      return [`${this.#cssBox(color)}margin-left: ${i}em;`, '']
    })
    console.log(result, ...css)
  }
  #cssBox(color: string) {
    return `
      color: #fff;
      line-break: anywhere;
      background-color: ${color};
      padding: 2px 4px;
      border-radius: 4px;
      margin: 2px 5px 2px 0;
    `
  }
}
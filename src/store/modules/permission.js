import auth from '@/plugins/auth'
import router, {constantRoutes, dynamicRoutes} from '@/router'
import {getRouters} from '@/api/menu'
import Layout from '@/layout/index'
import ParentView from '@/components/ParentView'
import InnerLink from '@/layout/components/InnerLink'

// 匹配views里面所有的.vue文件
const modules = import.meta.glob('./../../views/**/*.vue')
const usePermissionStore = defineStore(
    'permission',
    {
        state: () => ({
            /**
             * 这个变量中保存了本地的公共路由以及服务端请求获取的动态路由
             * 1. 在首页的搜索中使用
             * 2. 在tagView中使用
             * 从routes的使用场景中可以看到，它并不用于页面的渲染，只用于逻辑上的处理
             * 这个变量有区别于下面三个变量的一个特点就是将children铺平了（3-n级的菜单全部变为2级菜单）
             * 因为这个变量做的是幕后的工作不涉及页面的渲染，所以为了方便将这个变量进行单独提取
             */
            routes: [],
            // 暂无使用场景
            addRoutes: [],
            /**
             * 全部的菜单数据，相当于是sidebarRouters的一个备份。不论在什么情况下这里面的数据都是1-n级的菜单数据
             */
            defaultRoutes: [],
            /**
             * 顶部的菜单路由，如果开启了顶部菜单，那么就会参与顶部菜单的渲染
             */
            topbarRouters: [],
            /**
             * 左侧菜单的路由，左侧菜单的数据渲染都是从这个变量中获取的。默认情况下是1-n级的菜单数据。但是当开启了顶部菜单后 这里面的数据就会变成不完整的，2-n级的菜单数据
             */
            sidebarRouters: []
        }),
        actions: {
            setRoutes(routes) {
                this.addRoutes = routes
                this.routes = constantRoutes.concat(routes)
            },
            setDefaultRoutes(routes) {
                this.defaultRoutes = constantRoutes.concat(routes)
            },
            setTopbarRoutes(routes) {
                this.topbarRouters = routes
            },
            setSidebarRouters(routes) {
                this.sidebarRouters = routes
            },
            generateRoutes(roles) {
                return new Promise(resolve => {
                    // 向后端请求路由数据
                    getRouters().then(res => {
                        /**
                         * 这里为什么要先转为json字符串再转为对象，是因为如果直接使用服务端返回的数据那么三个变量都会指向同一块内存指针
                         * @type {any}
                         */
                        const sdata = JSON.parse(JSON.stringify(res.data));
                        const rdata = JSON.parse(JSON.stringify(res.data));
                        const defaultData = JSON.parse(JSON.stringify(res.data));
                        const sidebarRoutes = filterAsyncRouter(sdata);
                        // 这是一个重写后的 routes ,这个重写后的 routes 会将 children 铺平
                        const rewriteRoutes = filterAsyncRouter(rdata, false, true);
                        const defaultRoutes = filterAsyncRouter(defaultData);
                        // 动态路由，根据用户权限查询出本地定义的可用的动态路由，因为这些动态路由都不涉及到菜单渲染。所以查询到之后直接遍历放到router对象中即可
                        const asyncRoutes = filterDynamicRoutes(dynamicRoutes);
                        asyncRoutes.forEach(route => {
                            router.addRoute(route)
                        });
                        // 公共路由+服务端返回的动态路由 赋值给routes
                        this.setRoutes(rewriteRoutes);
                        // 左侧菜单 公共路由+sidebarRoutes
                        this.setSidebarRouters(constantRoutes.concat(sidebarRoutes));
                        // 备份菜单 公共路由+sidebarRoutes
                        this.setDefaultRoutes(sidebarRoutes);
                        // 顶部路由 defaultRoutes
                        this.setTopbarRoutes(defaultRoutes);
                        // 返回重写后的 routes 是 children 铺平后的
                        resolve(rewriteRoutes)
                    })
                })
            }
        }
    })

/**
 * 将服务端传来的component字符串转为，前端的component组件（对象）
 * @param asyncRouterMap 服务端的动态路由json数据
 * @param lastRouter 是否是最后一个路由（其实没用）
 * @param type 是否展开children
 * @returns {*}
 */
function filterAsyncRouter(asyncRouterMap, lastRouter = false, type = false) {
    return asyncRouterMap.filter(route => {
        if (type && route.children) {
            route.children = filterChildren(route.children)
        }
        if (route.component) {
            // Layout ParentView 组件特殊处理
            if (route.component === 'Layout') {
                route.component = Layout
            } else if (route.component === 'ParentView') {
                route.component = ParentView
            } else if (route.component === 'InnerLink') {
                route.component = InnerLink
            } else {
                // 功能性的组件加载
                route.component = loadView(route.component)
            }
        }
        if (route.children != null && route.children && route.children.length) {
            // 递归调用将children中的component字符串也变为component组件(对象)
            route.children = filterAsyncRouter(route.children, route, type)
        } else {
            delete route['children']
            delete route['redirect']
        }
        return true
    })
}

/**
 * 这个方法主要是做菜单铺平工作
 * 1. 将3-n级菜单变成2级菜单
 * 2. 将path变为父节点path+'/'+子节点的path
 * @param childrenMap
 * @param lastRouter
 * @returns {[]}
 */
function filterChildren(childrenMap, lastRouter = false) {
    var children = []
    childrenMap.forEach((el, index) => {
        if (el.children && el.children.length) {
            if (el.component === 'ParentView' && !lastRouter) {
                el.children.forEach(c => {
                    c.path = el.path + '/' + c.path
                    if (c.children && c.children.length) {
                        // 如果操作日志还有children，那么就通过递归再将其children都过滤出来
                        children = children.concat(filterChildren(c.children, c))
                        return
                    }
                    children.push(c)
                })
                return
            }
        }
        if (lastRouter) {
            el.path = lastRouter.path + '/' + el.path
            if (el.children && el.children.length) {
                children = children.concat(filterChildren(el.children, el))
                return
            }
        }
        /**
         * 以系统管理 为例，从用户管理到通知公告，上面两个if都不会进去，直接放到children中即可（因为本来就是二级菜单，并且没有children）
         * @type {*[]}
         */
        children = children.concat(el)
    })
    return children
}

// 动态路由遍历，验证是否具备权限
export function filterDynamicRoutes(routes) {
    const res = []
    routes.forEach(route => {
        if (route.permissions) {
            if (auth.hasPermiOr(route.permissions)) {
                res.push(route)
            }
        } else if (route.roles) {
            if (auth.hasRoleOr(route.roles)) {
                res.push(route)
            }
        }
    })
    return res
}

/**
 * 加载功能性的一些组件
 * modules保存的是所有views文件里面的.vue文件。是一个key-value形式的对象，内容类似如下：
 * ../../views/monitor/cache/index.vue:() => import("/src/views/monitor/cache/index.vue")
 * 其中的key 就是../../views/monitor/cache/index.vue
 * value就是懒加载的函数
 * @param view 服务端传的component字符串
 * @returns {function(): Promise<As extends keyof KnownAsTypeMap ? KnownAsTypeMap[As] : unknown>}
 */
export const loadView = (view) => {
    let res;
    for (const path in modules) {
        // path就是类似这样子的字符串 ../../views/monitor/cache/index.vue
        const dir = path.split('views/')[1].split('.vue')[0];
        // 最终分割后的dir就是 monitor/cache/index
        if (dir === view) {
            res = () => modules[path]();
        }
    }
    return res;
}

export default usePermissionStore

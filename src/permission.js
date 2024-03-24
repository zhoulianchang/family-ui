import router from './router'
import {ElMessage} from 'element-plus'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import {getToken} from '@/utils/auth'
import {isHttp} from '@/utils/validate'
import {isRelogin} from '@/utils/request'
import useUserStore from '@/store/modules/user'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'

NProgress.configure({showSpinner: false});

const whiteList = ['/login', '/register'];
/**
 * 全局前置路由导航守卫 类似于Java中的Filter
 * to：要去的页面 类似于 HttpServletResponse
 * from： 从哪个页面来 类似于 HttpServletRequest
 * next： 一个继续向下执行的函数 类似于 FilterChain
 */
router.beforeEach((to, from, next) => {
    NProgress.start()
    if (getToken()) {
        // 如果已经登陆了
        to.meta.title && useSettingsStore().setTitle(to.meta.title)
        /* has token*/
        if (to.path === '/login') {
            next({path: '/'})
            NProgress.done()
        } else if (whiteList.indexOf(to.path) !== -1) {
            // 如果已经登陆并且要去的是注册页面的话 直接放行
            next()
        } else {
            // 判断当前用户的角色长度是否等于0 如果等于0的话则有两种情况
            if (useUserStore().roles.length === 0) {
                // 1. 第一次登陆 还没向服务端发起用户请求，路由信息也还没没有加载
                // 2.用户按了F5或者浏览器刷新，导致Pinia中的数据丢失。则需要重新获取一次用户信息
                isRelogin.show = true
                // 判断当前用户是否已拉取完user_info信息
                useUserStore().getInfo().then(() => {
                    isRelogin.show = false
                    usePermissionStore().generateRoutes().then(accessRoutes => {
                        // 根据roles权限生成可访问的路由表
                        accessRoutes.forEach(route => {
                            if (!isHttp(route.path)) {
                                router.addRoute(route) // 动态添加可访问路由表
                            }
                        })
                        next({...to, replace: true}) // hack方法 确保addRoutes已完成
                    })
                }).catch(err => {
                    // 如果出现异常则直接退出登陆
                    useUserStore().logOut().then(() => {
                        ElMessage.error(err)
                        next({path: '/'})
                    })
                })
            } else {
                next()
            }
        }
    } else {
        // 没有token
        if (whiteList.indexOf(to.path) !== -1) {
            // 在免登录白名单，直接进入
            next()
        } else {
            next(`/login?redirect=${to.fullPath}`) // 否则全部重定向到登录页
            NProgress.done()
        }
    }
})

router.afterEach(() => {
    NProgress.done()
})

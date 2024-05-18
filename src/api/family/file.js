import request from '@/utils/request'

// 查询文件列表
export function listFile(query) {
    return request({
        url: '/family/file/list',
        method: 'get',
        params: query
    })
}

// 查询文件列表(树状)
export function treeFile(query) {
    return request({
        url: '/family/file/tree',
        method: 'get',
        params: query
    })
}

// 新增文件
export function addFile(data) {
    return request({
        url: '/family/file',
        method: 'post',
        data: data,
        headers: {
            'Content-Type': 'multipart/form-data' // 设置请求头为 multipart/form-data
        }
    })
}

// 修改文件夹
export function updateFile(data) {
    return request({
        url: '/family/file',
        method: 'put',
        data: data
    })
}

// 删除文件
export function delFile(favorId) {
    return request({
        url: '/family/file/' + favorId,
        method: 'delete'
    })
}

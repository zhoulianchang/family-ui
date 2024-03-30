import request from '@/utils/request'

// 查询列表
export function listAccount(query) {
  return request({
    url: '/family/account/list',
    method: 'get',
    params: query
  })
}

// 查询列表
export function selectAccount(query) {
  return request({
    url: '/family/account/select',
    method: 'get',
    params: query
  })
}

// 查询详情
export function getAccount(id) {
  return request({
    url: '/family/account/' + id,
    method: 'get'
  })
}

// 新增
export function addAccount(data) {
  return request({
    url: '/family/account',
    method: 'post',
    data: data
  })
}

// 修改
export function updateAccount(data) {
  return request({
    url: '/family/account',
    method: 'put',
    data: data
  })
}

// 删除
export function delAccount(id) {
  return request({
    url: '/family/account/' + id,
    method: 'delete'
  })
}

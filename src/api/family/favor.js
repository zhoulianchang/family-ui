import request from '@/utils/request'

// 查询人情账薄列表
export function listFavor(query) {
  return request({
    url: '/family/favor/list',
    method: 'get',
    params: query
  })
}
// 查询人情账薄列表
export function statsFavorAmount(query) {
  return request({
    url: '/family/favor/stats/amount',
    method: 'get',
    params: query
  })
}

// 查询人情账薄详细
export function getFavor(favorId) {
  return request({
    url: '/family/favor/' + favorId,
    method: 'get'
  })
}

// 新增人情账薄
export function addFavor(data) {
  return request({
    url: '/family/favor',
    method: 'post',
    data: data
  })
}

// 修改人情账薄
export function updateFavor(data) {
  return request({
    url: '/family/favor',
    method: 'put',
    data: data
  })
}

// 删除人情账薄
export function delFavor(favorId) {
  return request({
    url: '/family/favor/' + favorId,
    method: 'delete'
  })
}

import request from '@/utils/request'

// 查询账单管理列表
export function listBill(query) {
  return request({
    url: '/family/bill/list',
    method: 'get',
    params: query
  })
}
// 统计账单情况
export function statsBill(query) {
  return request({
    url: '/family/bill/stats/flow',
    method: 'get',
    params: query
  })
}

// 查询账单管理详细
export function getBill(billId) {
  return request({
    url: '/family/bill/' + billId,
    method: 'get'
  })
}

// 新增账单管理
export function addBill(data) {
  return request({
    url: '/family/bill',
    method: 'post',
    data: data
  })
}

// 修改账单管理
export function updateBill(data) {
  return request({
    url: '/family/bill',
    method: 'put',
    data: data
  })
}

// 删除账单管理
export function delBill(billId) {
  return request({
    url: '/family/bill/' + billId,
    method: 'delete'
  })
}

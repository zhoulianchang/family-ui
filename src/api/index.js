import request from '@/utils/request'

// 统计账单分类情况
export function statsBillByType(query) {
  return request({
    url: '/index/stats/bill/by/type',
    method: 'get',
    params: query
  })
}

// 根据消费用户统计支出账单
export function statsBillByUser(query) {
  return request({
    url: '/index/stats/bill/by/user',
    method: 'get',
    params: query
  })
}
// 查询账户余额
export function getAccountBalance() {
  return request({
    url: '/index/stats/account/balance',
    method: 'get'
  })
}


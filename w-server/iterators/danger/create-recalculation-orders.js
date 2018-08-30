const Request = require('../../models/Request')
const Portfolio = require('../../models/Portfolio')
const Order = require('../../models/Order')
const Stock = require('../../models/Stock')

const checkBalance = require('../../trading/wealthman_check_balance')
const trade = require('../../trading/wealthman_trade')

module.exports = () => new Promise(async (resolve, reject) => {
  const requests = await Request.find({status: 'recalculation'})
  const smartContracts = []
  let i = 0
  for (request of requests) {
    const portfolio = await Portfolio.findOne({request: request._id, state: 'active'})
    if (portfolio !== null && portfolio.smart_contract)
      smartContracts.push({
        address: portfolio.smart_contract,
        portfolio: portfolio._id,
        request: request._id,
        currencies: portfolio.currencies
      })
  }
  for (let smartContract of smartContracts) {
    const request = await Request.findById(smartContract.request)
    for (let token of smartContract.currencies) {
      const order = new Order({
        token_name: token.currency,
        whole_eth_amount: request.value,
        percent: token.percent,
        contract_address: smartContract.address,
        rebuild: false
      })
      await order.save()
    }
  }
  resolve()
})
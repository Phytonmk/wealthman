const Token = require('../../models/accessToken')
const Investor = require('../../models/Investor')
const Manager = require('../../models/Manager')
const Request = require('../../models/Request')
const Portfolio = require('../../models/Portfolio')
const configs = require('../../configs')
const portfolioAbi = require('../../trading/portfolio_abi.js')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider(configs.web3httpProvider))
const TGlogger = require('../../helpers/tg-testing-loger')
const notify = require('../../helpers/notifications')
// const addPortfolio = require('../../trading/wealthman_portfolio_add')
const deployContract = require('../../trading/wealthman_deploy')

module.exports = (app) => {
  app.post('/api/contracts/deploy', async (req, res) => {
    const token = await Token.findOne({token: req.body.accessToken})
    if (token === null) {
      res.status(403)
      res.end('')
      return
    }
    const investor = await Investor.findOne({user: token.user})
    if (investor === null) {
      res.status(403)
      res.end('')
      return
    }
    const request = await Request.findOne({investor: investor._id, _id: req.body.request})
    if (request === null) {
      res.status(403)
      res.end('')
      return
    }
    const manager = await Manager.findById(request.manager)
    if (manager === null) {
      res.status(404)
      res.end('')
      return
    }
    const deploySettings = {
      _owner: investor.wallet_address,
      _manager: manager.wallet_address,
      _tradesMaxCount: request.revisions_amount,
      _managmentFee: request.managment_fee,
      _performanceFee: request.perfomance_fee,
      _frontFee: request.front_fee,
      _exitFee: request.exit_fee,
      _endTime: (new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * request.period).getTime()),
      _mngPayoutPeriod: undefined,
      _prfPayoutPeriod: undefined
    }
    const deploying = await deployContract(deploySettings).catch((err) => {
      res.status(500)
      console.log(err)
    })
    if (!deploying || !deploying.success) {
      res.status(500)
      console.log('unsuccessfull deployment')
    } else {
      request.set({
        deployment_hash: deploying.hash,
        status: 'deploying'
      })
      const portfolio = await Portfolio.findOne({request: request._id, state: 'draft'})
      portfolio.set({state: 'active'})
      await portfolio.save()
      await request.save()
      await notify({request: request._id, title: `Contract deploying started`})
      await TGlogger(`Deploying contract for request #${request._id}\nHash: ${deploying.hash}\n` + JSON.stringify(deploySettings))
      res.status(200)
      res.end()
    }
  })
  app.post('/api/withdraw-address', async (req, res) => {
    const token = await Token.findOne({token: req.body.accessToken})
    if (token === null) {
      res.status(403)
      res.end('')
      return
    }
    const investor = await Investor.findOne({user: token.user})
    if (investor === null) {
      res.status(403)
      res.end('')
      return
    }
    const request = await Request.findOne({
      investor: investor._id,
      _id: req.body.request
    })
    if (request === null) {
      res.status(404)
      res.end('')
      return
    }
    // if (request.status === 'archived') {
    //   res.send({alreadyWithdrawed: true})
    //   res.end()
    // } else if (request.status === 'withdrawing') {
    //   res.send({withdrawingProcess: true})
    //   res.end()
    // // } else if (['active'/*, 'waiting for deposit', 'revision', 'recalculated'*/].includes(request.status)) {
    // } else 
    if (request.status === 'waiting for withdraw'){
      const portfolio = await Portfolio.findOne({
        request: request._id,
        state: 'active'
      })
      if (portfolio === null) {
        res.status(404)
        res.end('')
        return
      }
      res.send({mayBeWithdrawed: true, address: portfolio.smart_contract, requestStatus: request.status})
      res.end()
    } else if (request.status === 'active'){
      res.send({mayBeWithdrawed: true})
      res.end()
    }
  })
  app.post('/api/sell-tokens', async (req, res) => {
    const token = await Token.findOne({token: req.body.accessToken})
    if (token === null) {
      res.status(403)
      res.end('')
      return
    }
    const investor = await Investor.findOne({user: token.user})
    if (investor === null) {
      res.status(403)
      res.end('')
      return
    }
    const request = await Request.findOne({
      investor: investor._id,
      _id: req.body.request
    })
    if (request === null) {
      res.status(404)
      res.end('')
      return
    }
    request.set({status: 'getting ethereum'})
    await request.save()
  })
  // app.get('/api/contract-price/:request/:type', (req, res) => {
  //   cosnt
  //   const portfolio = await Portfolio.find({request: req.params.request, state: 'active'})
  //   if (portfolio === null) {
  //     res.status(404)
  //     res.end()
  //     return
  //   }
  //   const contract = new web3.eth.Contract(portfolioAbi, portfolio.smart_contract)
  //   let functionAbi = null
  //   switch (req.params.type) {
  //     case 'deploy':
  //       functionAbi = contract.deploy({
  //         data: bytecode,
  //         arguments:[
  //           '0x6e3F0CC77BF9A846e5FD4B07706bf8ca95493d4D',
  //           '0xA5Db0030205F621eF2571275858A92aa0D65C0D2',
  //           '0x6e3F0CC77BF9A846e5FD4B07706bf8ca95493d4D',
  //           '0x6e3F0CC77BF9A846e5FD4B07706bf8ca95493d4D',
  //            1535760000, 5, 10, 5, 5, 5, 5, 5]
  //       }).encodeABI()
  //     break
  //     case 'deploy':
  //       functionAbi = contract.methods.transferEth().encodeABI()
  //     break
  //     case 'rebuild':
  //       functionAbi = contract.methods.transferAllToEth(tokens).encodeABI()
  //     break
  //     case 'withdraw':
  //       functionAbi = contract.methods.withdraw().encodeABI()
  //     break
  //   }
  //   if (functionAbi === null) {
  //     res.status(400)
  //     res.end()
  //     return
  //   }
  //   res.status(200)
  //   res.end('')
  // })
}

// const getNonce = (address) =>
//   new Promise((resolve, reject) =>
//     web3.eth.getTransactionCount(address, (e, result) => e ? reject(e) : resolve(result)))

// const getGasPrice = () =>
//   new Promise((resolve, reject) =>
//     web3.eth.getGasPrice((e, result) => e ? reject(e) : resolve(result)))

// const getGasLimit = (functionAbi) =>
//   new Promise((resolve, reject) =>
//     web3.eth.estimateGas({data: functionAbi}, (e, result) => e ? reject(e) : resolve(result)))
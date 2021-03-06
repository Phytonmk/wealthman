const AccessToken = require('../../models/accessToken')
const Stock = require('../../models/Stock')
const Investor = require('../../models/Investor')
const Manager = require('../../models/Manager')
const Request = require('../../models/Request')
const fs = require('fs-extra')
const Portfolio = require('../../models/Portfolio')
const configs = require('../../configs')
const portfolioAbi = require('../../trading/contract-abi.js')
const bytecode = require('../../trading/bytecode.js')
const ccxt = require('ccxt')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider(configs.web3httpProvider))
const TGlogger = require('../../helpers/tg-testing-loger')
const notify = require('../../helpers/notifications')
// const addPortfolio = require('../../trading/wealthman_portfolio_add')
const deployContract = require('../../trading/deploy')
const { getGasPrice, getGasLimit } = require('../../helpers/blockchain-gas-and-nonce-helper')

const exchanges = []
for (let exchange of configs.exchanges) {
  exchange.api = new ccxt[exchange.name]({
    apiKey: exchange.key,
    secret: exchange.secret,
    test: !configs.productionMode
  })
  exchanges.push(exchange)
}

module.exports = (app) => {
  // Запросить деплой контракта
  app.post('/api/contracts/deploy', async (req, res) => {
    const token = await AccessToken.findOne({token: req.body.accessToken})
    if (token === null) {
      res.status(403)
      res.end()
      return
    }
    const investor = await Investor.findOne({user: token.user})
    if (investor === null) {
      res.status(403)
      res.end()
      return
    }
    const request = await Request.findOne({investor: investor._id, _id: req.body.request})
    if (request === null) {
      res.status(403)
      res.end()
      return
    }
    const manager = await Manager.findById(request.manager)
    if (manager === null) {
      res.status(404)
      res.end()
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
      portfolio.set({state: 'active', lastActiveEnabling: new Date()})
      await portfolio.save()
      await request.save()
      await notify({request: request._id, title: `Contract deploying started`})
      await TGlogger(`Deploying contract for request #${request._id}\nHash: ${deploying.hash}\n` + JSON.stringify(deploySettings))
      res.status(200)
      res.end()
    }
  })
  // Получить адрес кошелька, который был указан инвестором при деплое
  app.post('/api/withdraw-address', async (req, res) => {
    const token = await AccessToken.findOne({token: req.body.accessToken})
    if (token === null) {
      res.status(403)
      res.end()
      return
    }
    const investor = await Investor.findOne({user: token.user})
    if (investor === null) {
      res.status(403)
      res.end()
      return
    }
    const request = await Request.findOne({
      investor: investor._id,
      _id: req.body.request
    })
    if (request === null) {
      res.status(404)
      res.end()
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
        res.end()
        return
      }
      res.send({mayBeWithdrawed: true, address: portfolio.smart_contract, requestStatus: request.status})
      res.end()
    } else if (request.status === 'active'){
      res.send({mayBeWithdrawed: true})
      res.end()
    }
  })
  // Продать все токены со смарт контракта
  app.post('/api/sell-tokens', async (req, res) => {
    const token = await AccessToken.findOne({token: req.body.accessToken})
    if (token === null) {
      res.status(403)
      res.end()
      return
    }
    const investor = await Investor.findOne({user: token.user})
    if (investor === null) {
      res.status(403)
      res.end()
      return
    }
    const request = await Request.findOne({
      investor: investor._id,
      _id: req.body.request
    })
    if (request === null) {
      res.status(404)
      res.end()
      return
    }
    request.set({status: 'getting ethereum'})
    await request.save()
  })
  // Получить информацию о стоимости различных операций по контракту type: deploy, rebuild, withdraw
  app.get('/api/contract-cost/:request/:type', async (req, res) => {
    const portfolio = await Portfolio.findOne({request: req.params.request, state: 'active'})
    const contract = portfolio === null ? new web3.eth.Contract(portfolioAbi) : new web3.eth.Contract(portfolioAbi, portfolio.smart_contract)
    let functionAbi = null
    switch (req.params.type) {
      case 'deploy':
        functionAbi = contract.deploy({
          data: bytecode,
          arguments:[
            '0x6e3F0CC77BF9A846e5FD4B07706bf8ca95493d4D',
            '0xA5Db0030205F621eF2571275858A92aa0D65C0D2',
            '0x6e3F0CC77BF9A846e5FD4B07706bf8ca95493d4D',
            '0x6e3F0CC77BF9A846e5FD4B07706bf8ca95493d4D',
             1535760000, 5, 10, 5, 5, 5, 5, 5]
        }).encodeABI()
        break
      // case 'deploy':
      //   functionAbi = contract.methods.transferEth().encodeABI()
      //   break
      case 'rebuild':
        if (portfolio === null) {
          res.status(400)
          res.end()
          return
        }
        const tokens = []
        for (let token of portfolio.currencies) {
          const stock = await Stock.findOne({title: token.currency})
          tokens.push(stock.address)
        }
        functionAbi = contract.methods.transferAllToEth(tokens).encodeABI()
        break
      case 'withdraw':
        functionAbi = contract.methods.withdraw().encodeABI()
        break
    }
    if (functionAbi === null) {
      res.status(400)
      res.end()
      return
    } else {
      const gasPrice = await getGasPrice(functionAbi)
      const gasLimit = await getGasLimit(functionAbi)
      const ethPriceData = await exchanges[0].api.fetchTicker('ETH/USDT')
          .catch(console.log)
      const operationPrice = Math.round((gasPrice / (10 ** 9)) * (gasLimit / (10 ** 9)) * ethPriceData.last * 100) / 100 
      res.send(operationPrice.toString())
      res.end()
    }
  })
  app.get('/api/create-wallet', (req, res) => {
    const account = web3.eth.accounts.create();
    res.send(account);
    res.status(200);
    res.end('');
  });
  app.post('/api/photo/agreement', async (req, res, next) => {
    const token = await AccessToken.findOne({ token: req.headers.accesstoken })
    if (token === null) {
      res.status(403)
      res.end()
      return
    }
    const investor = await Investor.findOne({ user: token.user })
    if (!req.files)
      return res.status(400).send('No files were uploaded')
    if (!req.headers.request)
      return res.status(400).send('No "request" header set')
    const request = await Request.findById(req.headers.request)
    if (token === null) {
      res.status(400)
      res.end()
      return
    }
    const file = req.files.file
    await fs.ensureDir(`${__dirname}/../../img/agreements/${request._id}/investor/`)
    const extension = file.name.includes('.') ? file.name.substr(file.name.lastIndexOf('.') + 1) : ''
    if (!['pdf', 'doc', 'docx', 'jpg', 'png'].includes(extension))
      return res.status(400).send('File must be pdf, doc, docx, jpg or png')
    file.mv(`${__dirname}/../../img/agreements/${request._id}/investor/${file.name}`, async (err) => {
      if (err)
        return res.status(500).send(err)
      request.set({ investor_agreement: file.name })
      await request.save()
      res.send(file.name)
      res.end()
    })
  })
}
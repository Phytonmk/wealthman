const Request = require('../../models/Request');
const Portfolio = require('../../models/Portfolio');
const Order = require('../../models/Order');

const checkBalance = require('../../trading/wealthman_check_balance');
const trade = require('../../trading/wealthman_trade');

let workingProcess = false;

const work = async () => {
  if (workingProcess)
    return false;
  workingProcess = true;

  const requests = await Request.find({status: 'waiting for deposit'});
  const smartContracts = [];
  let i = 0;
  for (request of requests) {
    const portfolio = await Portfolio.findOne({request: request.id});
    if (portfolio !== null && portfolio.smart_contract)
      smartContracts.push({
        address: portfolio.smart_contract,
        portfolio: portfolio.id,
        request: request.id,
        currencies: portfolio.currencies
      });
  }
  for (let smartContract of smartContracts) {
    // console.log(`Checking ${smartContract.address} for deposit...`);
    const deposit = await checkBalance(smartContract.address).catch((e) => {
      console.log('Deposit checking error:', e.toString());
    });
    // if (deposit)
    //   console.log(`deposited on ${smartContract.address}`);
    // else
    //   console.log(`no deposit on ${smartContract.address}`);
    if (deposit) {
      const request = await Request.findOne({id: smartContract.request});
      trade(smartContract.address, smartContract.request);
      request.set({status: 'active'});
      await request.save();
      for (let token of smartContract.currencies) {
        const order = new Order({
          token_name: token.title.toUpperCase(),
          whole_eth_amount: request.value,
          percent: token.percent,
          contract_address: smartContract.address
        });
        await order.save();
      }
    }
  }
  workingProcess = false;
}



work();
let interval = setInterval(work, 1000 * 60 * 3);
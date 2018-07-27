const apiURL = 'https://api-rinkeby.etherscan.io';
// const token = 'BNJX7XSCHMS4KBD3ZS96PSCPV7BBCF3KC4';

const Request = require('../../models/Request');
const Portfolio = require('../../models/Portfolio');

const checkBalance = require('../../trading/wealthman_check_balance');
const trade = require('../../trading/wealthman_trade');

let workingProcess = false;

const work = async () => {
  if (workingProcess)
    return false;
  // workingProcess = true;

  const requests = await Request.find({status: 'waiting for deposit'});
  const smartContracts = [];
  let i = 0;
  for (request of requests) {
    const portfolio = await Portfolio.findOne({request: request.id});
    if (portfolio !== null && portfolio.smart_contract)
      smartContracts.push({
        address: portfolio.smart_contract,
        portfolio: portfolio.id,
        request: request.id
      });
  }
  for (let smartContract of smartContracts) {
    console.log(`Checking ${smartContract.address} for deposit...`);
    const deposit = await checkBalance(smartContract.address);
    if (deposit)
      console.log('deposited');
    else
      console.log('no deposit');
    if (deposit) {
      const request = await Request.findOne({id: smartContract.request});
      trade(smartContract.address, smartContract.request);
      request.set({status: 'active'});  
      await request.save();
    }
  }
  workingProcess = false;
}



work();
let interval = setInterval(work, 1000 * 60 * 3);
const apiURL = 'https://api-rinkeby.etherscan.io';
// const token = 'BNJX7XSCHMS4KBD3ZS96PSCPV7BBCF3KC4';

const Request = require('../../models/Request');
const Portfolio = require('../../models/Portfolio');

const checkDeployment = require('../../trading/wealthman_check_deploy');
const trade = require('../../trading/wealthman_trade');

let workingProcess = false;

const work = async () => {
  if (workingProcess)
    return false;
  // workingProcess = true;

  const requests = await Request.find({status: 'deploying'});
  for (request of requests) {
    if (request.deployment_hash) {
      console.log(`Checking ${request.deployment_hash} for deployment...`);
      const deployment = await checkDeployment(request.deployment_hash).catch(console.log);
      // console.log(deployment);
      switch (deployment.status) {
        case 'failed':
          console.log(`${request.deployment_hash} faild`);
          request.set({status: 'failed'});
          await request.save();
          break;
        case 'deployed':
          console.log(`${request.deployment_hash} deployed`);
          request.set({status: 'waiting for deposit'});
          const portfolio = await Portfolio.findOne({state: 'active', request: request.id});
          if (portfolio !== null) {
            portfolio.set({smart_contract: deployment.address}); 
            await request.save();
            await portfolio.save();
          } else {
            request.set({status: 'failed'});
            request.save();
          }
          break;
        case 'pending':
          console.log(`${request.deployment_hash} no data yet`);
        break;
      }
    }
  }
  workingProcess = false;
}



work();
let interval = setInterval(work, 1000 * 60 * 3);
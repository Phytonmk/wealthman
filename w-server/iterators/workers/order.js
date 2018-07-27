const Binance = require('node-binance-api');
const Order = require('../../models/Order');
const connection_settings = require('../../trading/connection_settings');

binance = new Binance().options({
  APIKEY: connection_settings.binanceApi.key,
  APISECRET: connection_settings.binanceApi.secret,
  useServerTime: true,
  test:false
});

const marketBuy = (ticker, quantity, falgs) => new Promise((resolve, reject) => {
  binance.marketBuy(ticker, quantity, falgs, (err, response) => {
    if (err)
      reject(err);
    else
      resolve(response);
  })
});

const withdraw = (name, address, quantity) => new Promise((resolve, reject) => {
  binance.withdraw(name, address, quantity, false, (err, response) => {
    if (err)
      reject(err);
    else
      resolve(response)
  })
});

const flags = { type: 'MARKET', newOrderRespType: 'FULL' };

let workingProcess = false;

const work = async () => {
  if (workingProcess)
    return false;
  workingProcess = true;

  const orders = await Order.find({$or: [{status: 'created'}, {status: 'token bouthg'}]});
  for (let order of orders) {
    const quantity = 1; // update it
    if (order.status === 'created') {
      const ticker = order.token_name + 'ETH';
      const buyingResult = await marketBuy(ticker, quantity, flags)
        .catch( async (e) => {
          console.log(e);
          order.set({status: 'failed to buy token'});
          await order.save();
        }); 
      if (buyingResult) {
        console.log(buyingResult);
        order.set({
          cost: 99, // update it
          status: 'token bouthg'
        });
        await order.save();
      }
    } else if (order.status === 'token bouthg') {
      const withdrawingResult = await withdraw(order.token_name, order.contract_address, quantity)
        .catch( async (e) => {
          console.log(e);
          order.set({status: 'failed to withdraw'});
          await order.save();
        }); 
      if (withdrawingResult) {
        console.log(buyingResult);
        order.set({
          status: 'completed'
        });
        await order.save();
      }
    }
  }

  workingProcess = false;
}



work();
let interval = setInterval(work, 1000 * 60 * 3);
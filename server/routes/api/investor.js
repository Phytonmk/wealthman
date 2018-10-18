const Token = require('../../models/accessToken');
const User = require('../../models/User');
const Manager = require('../../models/Manager');
const Investor = require('../../models/Investor');
const Request = require('../../models/Request');
const Company = require('../../models/Company');

module.exports = (app) => {
  // Получить список инвесторов
  app.post('/api/investors-list', async (req, res, next) => {
    const token = await Token.findOne({token: req.body.accessToken});
    if (token === null) {
      res.status(403);
      res.end();
      return;
    }
    const investors = await Investor.find()
    res.send(investors);
    res.end();
  });
  // Получит информацию об инвесторе
  app.get('/api/investor/:id', async (req, res, next) => {
    const investor = await Investor.findById(req.params.id);
    if (investor === null) {
      res.status(404);
      res.end();
      return;
    }
    res.send(investor);
    res.end();
  });
  // Получить список клиентов текущего аккаунта
  app.get('/api/my-clients', async (req, res, next) => {
    const token = await Token.findOne({token: req.headers.accesstoken})
    if (token === null) {
      res.sendStatus(403)
      res.end()
      return
    }
    const user = await User.findById(token.user)
    if (user === null) {
      res.sendStatus(403)
      res.end()
      return
    }
    let userType = null
    if (user.type === 1)
      userType = 'manager'
    else if (user.type === 1)
      userType = 'company'
    if (userType === null) {
      res.sendStatus(403)
      res.end()
      return
    }
    const userRoleAccount = await (userType === 'manager' ? Manager : Company).findOne({user: user._id}) 
    const roleId = userRoleAccount._id
    const requests = await Request.find({[userType]: roleId, type: 'portfolio'})
    const result = []
    for (let request of requests) {
      result.push(request.investor)
    }
    res.send(result)
    res.end()
  })
} 
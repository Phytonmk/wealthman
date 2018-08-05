const fs = require('fs');
const path = require('path');


const timeTable = { //seconds
  default: 10,
  stocks: 60 * 60 * 12
}
const timeout = 60 * 25

module.exports = (app) => {
  const workers = []
  fs.readdirSync(__dirname + '/workers/').forEach((file) => {
    const name = file.replace(/\.js$/i, '')
    workers.push({
      name,
      module: require(`${__dirname}/workers/${file}`),
      workingProcess: false,
      workStart: 0,
      workEnd: 0
    })
  });
  const interval = () => { 
    for (let worker of workers) {
      // console.log(`Wordker ${worker.name} workingProcess: ${worker.workingProcess}`)
      if (!worker.workingProcess &&
       worker.workEnd + (timeTable[worker.name] || timeTable.default) * 1000 < Date.now()) {
        worker.workingProcess = true
        worker.workStart = Date.now()
        worker.module()
          .then(() => console.log(`  -Iterator ${worker.name} completed work`))
          .catch((err) => console.log(`  -Iterator ${worker.name} failed`, err))
          .finally(() => {
            worker.workEnd = Date.now()
            worker.workingProcess = false
          })
      } else if (worker.workStart + timeout * 1000 < Date.now()) {
        worker.workingProcess = false
      }
    }
  }
  setInterval(interval, 1000 * 5)
};

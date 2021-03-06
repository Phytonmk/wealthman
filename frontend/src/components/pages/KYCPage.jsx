import React, { Component } from 'react';
import { setReduxState } from '../../redux';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import { api, setPage, setCurrency, previousPage, getCookie, setCookie } from '../helpers';
import Input from '../inputs/Input'
import Cards from '../dashboards/Cards'

const services = ['Robo-advisor', 'Discretionary', 'Advisory'];

// import ProgressBar2 from '../ProgressBar2';
// import QuestionsForm from '../QuestionsForm';

class KYCPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      analysis: false,
      manager_comment: false,
      value: '',
      comment: '',
      manager: '-',
      managerId: '',
      managerName: '-',
      service: '-',
      revisionsAmount: 0,
      question: 0,
      period: 1,
      // formComplited: false
    };
  }
  componentWillMount() {
    const managerType = this.props.history.location.search.split('=')[1].split('/')[0]
    const managerId = this.props.history.location.search.split('/')[1]
    if (managerType === '' || managerId === '')
      setPage('')
    this.setState({manager: managerType, service: (getCookie('service') || '')});
    api.get(managerType + '/' + managerId)
      .then((res) => {
        console.log(res.data.name, res.data.surname)
        this.setState({
          managerName: (res.data.name || res.data.company_name || '') + ' ' + (res.data.surname || ''),
          managerId: res.data._id,
          managerData: res.data
        })
      })
    console.log(window.filledKYCanswers)
  }
  componentDidMount() {
    window.onbeforeunload = () => 'Data will not be stored, continue?'
  }
  componentWillUnmount() {
    window.onbeforeunload = null
  }
  // sendForm() {
  //   window.onbeforeunload = null
  //   this.setState({formComplited: true});
  //   api.post('investor/kyc', {answers: this.state.answers})
  //     .then((res) => {
  //       setReduxState({risk: res.data});
  //     })
  //     .catch(console.log);
  // }
  send() {
    console.log(window.filledKYCanswers)
    api.post('request', {
      type: 'portfolio',
      [this.state.manager]: this.state.managerId,
      value: this.state.value,
      comment: this.state.comment,
      service: this.state.service,
      revisions_amount: this.state.revisionsAmount,
      period: this.state.period,
      options: {
        analysis: this.state.analysis,
        comment: this.state.manager_comment
      },
      kycAnswers: window.filledKYCanswers,
    })
    .then(() => {
      setCookie('selectedManager', '')
      setPage('requests');
    })
    .catch(console.log);
  }
  render() {
    let managerConditions = '';
    let pageContent = ''
    if (services.includes(this.state.service) && this.state.managerData) {
      const currentService = this.state.managerData.services.find(service => service.type === services.indexOf(this.state.service));
      if (currentService) {
        managerConditions = <div className="row">
          <div className="row"><b>Exit fee</b>: {currentService.exit_fee} %</div>
          <div className="row"><b>Management fee</b>: {currentService.managment_fee} %</div>
          <div className="row"><b>Perfomance fee</b>: {currentService.perfomance_fee} %</div>
          <div className="row"><b>Front fee</b>: {currentService.front_fee} %</div>
          <div className="row"><b>Max recalculations</b>: {currentService.recalculation} days</div>
        </div>
      }
      let splitedQuestions = []
      if (window.filledKYCanswers) {
        for (let i = 0; i < window.filledKYCanswers.length; i += 2)
          splitedQuestions.push(window.filledKYCanswers.slice(i, i + 2))
      }
      pageContent = 
        <div>
          <div className="row">
            <p>By clicking “Send to {this.state.manager}” button you send</p>
            <ol>
              <li> Request for portfolio balance to {this.state.manager} <b>{this.state.managerName}</b> and selected service: <b>{this.state.service}</b></li>
              <li> Your personal risk profile and information </li>
            </ol>
          </div>
          {managerConditions}
          <div className="row">
            <p>Before you continue, please fill information below. Notice, that investment size field is the actual amount of money, that you are going to invest. You will not have an opportunity to change this number.

Minimal investment is 1000$</p>
          </div>
          <h3><b>Sending request to manager</b></h3>
          <div className="row">
            <p>Investment size</p>
          </div>
          <div className="row">
            <input type="number" value={this.state.value} min="0" step="0.1" onChange={(event) => this.setState({value: event.target.value})} /> ETH
          </div>
          <div className="row">
            <small>Minimal investment is {currentService.min}$</small>
          </div>
          <div className="row">
            <p>Investment period</p>
          </div>
          <div className="row">
            <input type="number" value={this.state.period} min="1" step="7" onChange={(event) => this.setState({period: event.target.value})} /> Days
          </div>

          {this.state.service === 'Robo-advisor' || this.state.service === '-' ? '' : <div>
            <div className="row">
              <p>Allowed revisions amount</p>
            </div>
            <div className="row">
              <input type="number" value={this.state.revisionsAmount} min="0" step="1" onChange={(event) => this.setState({revisionsAmount: event.target.value})} />
            </div>
          </div>}
          <div className="row">
            <p>Comment for manager</p>
            <p>In case you want get special conditions (e.g. lower fees by greate investments amount), leave a comment here</p>
          </div>
          <div className="row">
            <input type="text" value={this.state.comment} onChange={(event) => this.setState({comment: event.target.value})} />
          </div>
          <div className="row">
            <p><label><input type="checkbox" checked={this.state.analysis} onChange={(event) => this.setState({analysis: event.target.checked})} /> Analysis Neccesity</label></p>
          </div>
          <div className="row-padding">
            <p><label><input type="checkbox" checked={this.state.manager_comment} onChange={(event) => this.setState({manager_comment: event.target.checked})} /> Comment Neccesity</label></p>
          </div>
          <br />
          <div className="row-padding">
            <Link to={"/managers"}>
              <button className="back" onClick={() => previousPage()}>Back</button>
            </Link>
            <button className="continue" onClick={() => this.send()}>Send to {this.state.manager}</button>
          </div>
        </div>
      pageContent =
        <React.Fragment>
          <div className="row-padding">
            <h3>Before you continue, please fill information below:</h3>
          </div>
          <div className="row-padding">
            <small className="blue">Investment size</small>
            <Input type="number" value={this.state.value} min="0" step="0.1" onChange={(event) => this.setState({value: event.target.value})} /> ETH
            <small>Notice, that investment size field is the actual amount of money, that you are going to invest. You will not have an opportunity to change this number. Minimum investment is {currentService.min}$</small>
          </div>
          <div className="row-padding">
            <small className="blue">Investment period</small>
            <Input type="number" value={this.state.period} min="1" step="7" onChange={(event) => this.setState({period: event.target.value})} /> Days
          </div>

          {this.state.service === 'Robo-advisor' || this.state.service === '-' ? '' : <div>
            <div className="row-padding">
              <small className="blue">Allowed revisions amount</small>
              <Input type="number" value={this.state.revisionsAmount} min="0" step="1" onChange={(event) => this.setState({revisionsAmount: event.target.value})} />
            </div>
          </div>}
          <div className="row-padding">
            <small className="blue">Comment for manager</small>
            <Input type="textarea" value={this.state.comment} onChange={(event) => this.setState({comment: event.target.value})} />
            <small>If you want recieve special conditions (e.g. lower fees), please, contact adviser in the field above.</small>
          </div>
          {/*<div className="row-padding">
            <label><Input type="switcher" checked={this.state.analysis} onChange={(event) => this.setState({analysis: event.target.checked})} /> Analysis Neccesity</label>
          </div>
          <div className="row-padding">
            <label><Input type="switcher" checked={this.state.manager_comment} onChange={(event) => this.setState({manager_comment: event.target.checked})} /> Comment Neccesity</label>
          </div>*/}
          <div className="row-padding">
            <h3>Normal manager conditions:</h3>
          </div>
          <Cards
            cards={[{
              title: currentService.exit_fee + ' %',
              subtitle: 'Exit fee'
            }, {
              title: currentService.managment_fee + ' %',
              subtitle: 'Management fee'
            }, {
              title: currentService.perfomance_fee + ' %',
              subtitle: 'Performance fee'
            }, {
              title: currentService.front_fee + ' %',
              subtitle: 'Front fee'
            }, {
              title: currentService.recalculation + ' days',
              subtitle: 'Max recalculations'
            }]}
          />
          <hr />
          <div className="row-padding">
            <h3>By clicking “Send to {this.state.manager}” button you send</h3>
          </div>
          <div className="row-padding">
            Request for portfolio balance to {this.state.manager} <b>{this.state.managerName}</b> and selected service: <b>{this.state.service}</b>
          </div>
          <div className="row-padding">
            Answers from form the questionnaire:
          </div>
          <div className="row-padding">
            {splitedQuestions.map(questionsSet =>
              <Cards
                cards={questionsSet.map(question => ({
                  subtitle: question.question,
                  title: (answer => {
                    if (answer[0] === '{' && answer[answer.length - 1] === '}') {
                      try {
                        const answerObject = JSON.parse(answer)
                        let resultSubAnswers = []
                        for (let subQuestion in answerObject) {
                          resultSubAnswers.push(subQuestion + ': ' + answerObject[subQuestion])
                        }
                        return resultSubAnswers.join('; ')
                      } catch(e) {
                        console.log(e)
                        return answer
                      }
                    } else {
                      return answer
                    }
                  })(question.answer)
              }))}/>)
            }
          </div>
          <div className="row-padding">
            Data, specified above:
          </div>
          <div className="row-padding">
            <small>Investment size</small>
            <p>{this.state.value} ETH</p>
          </div>
          <div className="row-padding">
            <small>Investment period</small>
            <p>{this.state.period} {this.state.period == 1 ? 'day' : 'days'}</p>
          </div>
          {this.state.service === 'Robo-advisor' || this.state.service === '-' ? '' : <div className="row-padding">
            <small>Allowed revisions amount</small>
            <p>{this.state.revisionsAmount}</p>
          </div>}
          <div className="row-padding">
            <small>Comment for manager</small>
            <p>{this.state.comment || 'no comment'}</p>
          </div>
          {/*<div className="row-padding">
            <small>Analysis Neccesity</small>
            <p>{this.state.analysis ? 'yes' : 'no'}</p>
          </div>
          <div className="row-padding">
            <small>Comment Neccesity</small>
            <p>{this.state.manager_comment ? 'yes' : 'no'}</p>
          </div>*/}
          <div className="row-padding">
            <Link to={"/managers"}>
              <button className="back" onClick={() => previousPage()}>Back</button>
            </Link>
            <button className="continue" onClick={() => this.send()}>Send to {this.state.manager}</button>
          </div>
        </React.Fragment>
    }
    return(
      <div>
        {/*this.state.formComplited ?
          <ProgressBar2 step="1" total="1" /> :
          <ProgressBar2 step={questions[this.state.question].step} total={questions[this.state.question].total} />*/}
        <div className="container">
          <div className="box kyc-page">
            <div className="row">
              <h1>Final step</h1>
            </div>
            {pageContent}
          </div>
        </div>
      </div>
    );
  }
}


export default withRouter(connect(a => a)(KYCPage));



const questions = [
  {
    question: 'What is your primary reason for investing?',
    subtitle: 'Choose one goal and then add other goals from your personal account. ',
    answers: ['Long-term investment growth', 'Emergency fund', 'Retirement', 'Large purchase (education,  house,  business, etc)', 'Other'],
    step: 1,
    total: 5,
    condition: () => true
  },
  {
    question: 'How long do you plan to hold your investments in the markets?',
    inputs: ['Years'],
    condition: (answers) => answers[0] !== undefined && ['Long-term investment growth', 'Emergency fund', 'Other'].includes(answers[0].answer),
    step: 2,
    total: 5
  },
  {
    question: 'What is the total amount you want to invest?',
    inputs: ['$'],
    condition: (answers) => answers[0] !== undefined && ['Long-term investment growth', 'Emergency fund', 'Other'].includes(answers[0].answer),
    step: 3,
    total: 5
  },
  {
    question: 'What age and length of retirement you want to save?',
    inputs: ['Age', 'Length'],
    condition: (answers) => answers[0] !== undefined && answers[0].answer === 'Retirement',
    step: 2,
    total: 5
  },
  {
    question: 'What is the total amount you want to save?',
    inputs: ['$'],
    condition: (answers) => answers[0] !== undefined && answers[0].answer === 'Retirement',
    step: 3,
    total: 5
  },
  {
    question: 'What are the current value and expected time of your purchase?',
    inputs: ['Value', 'Expected time'],
    condition: (answers) => answers[0] !== undefined && answers[0].answer === 'Large purchase (like education,  house,  business, etc)',
    step: 2,
    total: 4
  },
  {
    question: 'What currency of your purchase?',
    answers: ['BTC','ETH','EUR','USD','GBP','CHF','RUB'],
    condition: (answers) => answers[0] !== undefined && answers[0].answer === 'Large purchase (like education,  house,  business, etc)',
    step: 3,
    total: 4
  },
  {
    question: 'What currency you measure your wealth?',
    answers: ['BTC','ETH','EUR','USD','GBP','CHF','RUB'],
    condition: (answers) => answers[0] !== undefined && answers[0].answer !== 'Large purchase (like education,  house,  business, etc)',
    step: 4,
    total: 5
  },
]
const filters = [
  {
    link: "Robo-advisor",
    description: "Invest on Autopilot",
  },
  {
    link: "Discretionary",
    description: "Get The Right Investment Manager For Your Wealth",
  },
  {
    link: "Advisory",
    description: "Find The Right Advisory Support For Your Own Decisions On Investment Management",
  },
];
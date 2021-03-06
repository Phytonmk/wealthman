import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Link } from 'react-router-dom'

import { setReduxState } from '../../redux'

import { api, getCookie, setCookie, setPage } from '../helpers';

import questions from './registration/questions';
import Form from './registration/Form';

import Subheader from './../Subheader';
// import AccountInfo from './account/AccountInfo';
// import RiskProfile from './account/RiskProfile';
// import Goals from './account/Goals';
import DetailedInfo from './account/DetailedInfo';
import AccountAccess from './account/AccountAccess';
import OldAccount from './account/OldAccount';

class AccountPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: '',
      dataSavedToast: false
    }
  }
  componentWillMount() {
    if (this.state.userData === undefined || this.state.userData.wallet_address === undefined) {
      api.post('getme')
        .then((res) => {
          setReduxState({userData: res.data.userData});
          // console.log(this.props.userData)
          // setTimeout(() => this.forceUpdate(), 0);
        })
        .catch(console.log)
    }
  }
  changePassword() {
    if (this.state.old_password !== '' && this.state.new_password1 !== '' &&
      this.state.new_password1 === this.state.new_password2) {
      api.post('changepassword', {
        old_password: this.state.old_password,
        new_password1: this.state.new_password1,
        new_password2: this.state.new_password2,
      })
      .then(() => alert('Password changed'))
      .catch(console.log);
    }
  }
  // saveData(data) {
  //   api.post(this.state.user + '/data', Object.assign({accessToken: getCookie('accessToken')}, data))
  //     .then(() => {
  //     })
  //     .catch(console.log);
  // }
  savedToast() {
    this.setState({ dataSavedToast: true })
    clearTimeout(this.hideToastTimeout)
    this.hideToastTimeout = setTimeout(() => {
      this.setState({ dataSavedToast: false })
    }, 5000)
      document.querySelector('.data-update-toast').scrollIntoView({ behavior: 'smooth' })
  }
  render () {
    return (
      <div id="account-page">
        <h4 className="data-update-toast" style={{opacity: this.state.dataSavedToast ? 1 : 0}}>Data was updated</h4>
        <Subheader data={[
          {
            header: 'Profile',
            content: <OldAccount savedToast={() => this.savedToast()} usertype={this.props.user} userData={this.props.userData} />
          },
          {
            header: 'Account access',
            content: <AccountAccess savedToast={() => this.savedToast()} />
          },
          {
            header: 'KYC blank',
            content: <DetailedInfo savedToast={() => this.savedToast()} />
          },
      //    {
      //      header: "Account settings",
      //      content: <OldAccount />,
      //    },
      //    {
      //      header: "Risk Profile",
      //      content: <RiskProfile />,
      //    },
      //    {
      //      header: "Goals And Aims",
      //      content: <Goals />,
      //    },
      //    {
      //      header: "Personal Information",
      //      content: <DetailedInfo />,
      //    },
      //    {
      //      header: "Contacts & Password change",
      //      content: <AccountInfo />,
      //    },
        ]}
      />
      </div>
    );
  }

}

export default connect(a => a)(AccountPage);

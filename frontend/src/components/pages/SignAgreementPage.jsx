import React, { Component } from 'react';
import { setReduxState } from '../../redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import ProgressBar from '../ProgressBar'

import { api, getCookie, setCookie, newLines, setPage, previousPage } from '../helpers';

class SignAgreementPage extends Component {
  constructor(props) {
    super(props);
  
    this.state = {};
  }
  render() {
    return (
      <div>
        <div className="container">
          <div className="box">
            <div className="container">
              <h2>Sign Agreement</h2>
              <p>Please download and fill this form. Then scan and upload it back to the site.</p>
              <div className="document-box">
                <h3 className="text-center">Agreement form</h3>
                <div className="row">
                  <button className="continue">DOWNLOAD FILE</button>
                </div>
              </div>
              <div className="document-box">
                <h3 className="text-center">Filled Agreement form</h3>
                <div className="row">
                  <button className="continue">UPLOAD FILE</button>
                </div>
              </div>
              <div className="row-padding">
                <button className="back" onClick={() => previousPage()}>Back</button>
                <Link to={"/money/" + this.props.match.params.id}>
                  <button className="continue">Continue</button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(a => a)(SignAgreementPage)
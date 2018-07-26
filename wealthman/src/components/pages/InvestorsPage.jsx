import React, { Component } from 'react';
import { store, setReduxState } from '../../redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Sortable2 from '../Sortable2.jsx';
import Select from '../Select.jsx';
import Search from '../Search.jsx';
import myDate from '../myDate.jsx';
import { api, setPage, setCurrency, setCookie } from '../helpers';

class InvestorsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchName: "",
      gotData: false,
      investors: []
    }
  }
  componentDidMount() {
    api.post('investors-list')
      .then((res) => {
        // console.log(res.data);
        this.setState({gotData: true, investors: res.data});
      })
      .catch(console.log);
    // if (!this.state.gotData)
    //   this.load();
  }
  render() {
    let sortableHeader = [
      {
        property: "img",
        title: "",
        width: "41px",
        type: "unsortable",
      },
      {
        property: "name",
        title: "Investor name",
        width: "156px",
      },
      {
        property: "registered",
        title: "Registered on platform",
        // width: "55px",
        width: "85px",
        type: "date",
      },
      {
        property: "aum",
        title: "AUM, mln $",
        width: "82px",
        type: "number",
        tooltip: "Assets Under Management in millions of $"
      },
      {
        property: "managers",
        title: "Number of managers",
        // width: "52px",
        width: "82px",
      },
      {
        property: 'chat',
        width: "105px",
        type: "unsortable",
      }
    ];
    let sortableInvestors = this.state.investors.map((investor, i) => {
      const name = (investor.name || '') + " " + (investor.surname || '');
      return {
        id: investor.id,
        img: <div className="in-sortable-img-container"><img src={investor.img ? api.imgUrl(investor.img) : 'manager/user.svg'} className="user-icon" /></div>,
        name: (investor.name || '') + ' ' + (investor.surname || ''),
        registered: new myDate(investor.registred || (Date.now() - 1000 * 60 * 600)).niceTime(),
        aum: {
          render: Math.ceil(Math.random() * 100) + "$",
          value: Math.ceil(Math.random() * 100)
        },
        managers: Math.ceil(Math.random() * 5),
        chat: <Link to={"/chat/" + investor.user} className="no-margin">
            <button className="big-blue-button">
              Chat
            </button>
          </Link>
      };
    });

    return (
      <div>
        <article className="long-text-input">
          <div className="container">
            <Search value={this.state.searchName} setValue={(value) => this.setState({searchName: value})} />
          </div>
        </article>
        <div className="container">
          {this.state.gotData ?
            <Sortable2
              filter={row =>
                row.name.toLowerCase().includes(this.state.searchName.toLowerCase())
              }
              columns={sortableHeader}
              data={sortableInvestors}
              navigation={true}
              maxShown={5}
            />
            :
            <div className="loading"><p>Loading</p></div>
          }
        </div>
      </div>
    );
  }
}



export default connect(a => a)(InvestorsPage);
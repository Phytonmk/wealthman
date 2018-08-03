import React, { Component } from 'react';

import '../css/TextInput.sass';

class TextInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    return (
      <input
        value={this.props.value}
        onChange={(event) => this.props.setValue(event.target.value)}
        placeholder={this.props.placeholder}
      />
    );
  }
}

export default TextInput;

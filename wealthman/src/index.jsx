import React from 'react';
import ReactDOM from 'react-dom';
import './css/index.css';
import './css/main.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

import { Provider } from 'react-redux';
import { store } from './redux/index';

ReactDOM.render(<Provider store={store}><App /></Provider>, document.getElementById('root'));
registerServiceWorker();
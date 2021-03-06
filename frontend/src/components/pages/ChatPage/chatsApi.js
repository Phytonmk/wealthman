import axios from 'axios'
import { getCookie } from '../../helpers'
import io from 'socket.io-client';

const apiUrl = 'http://141.8.198.87:8080/chats-api/'
const socketsHost = 'ws://141.8.198.87';

// const apiUrl = 'http://185.185.70.5:2905/chats-api/'
// const socketsHost = 'ws://185.185.70.5';

// const apiUrl = 'http://localhost:2905/chats-api/'
// const socketsHost = 'ws://localhost';

const api = {};


api.post = (url, data={}, options={}) => axios.post(apiUrl + url, data, Object.assign(options, {headers: {accessToken: getCookie('accessToken')}}));
api.get = (url, data={}, options={}) => axios.get(apiUrl + url, Object.assign(options, {params: data, headers: {accessToken: getCookie('accessToken')}}));

api.chatsList = () => api.get('chats-list');
api.getMessages = (chat, offsetDate=Date.now() + 1000 * 60 * 60 * 24 * 365) => api.get('messages', {chat, offsetDate});

let currentWsToken = null;
let currentWs = null;
api.connect = () => new Promise((resolve, reject) => {
  api.get('ws')
    .then(res => {
      let aleradyConnected = false;
      const ws = io(socketsHost + ':' + res.data.ws_port);
      ws.on('connect', () => {
        ws.emit('message', {type: 'auth', accessToken: getCookie('accessToken')});
      });
      ws.on('message', (message) => {
        if (!aleradyConnected) {
          if (message.success && message.token) {
            aleradyConnected = true;
            currentWsToken = message.token;
            currentWs = ws;
            console.log('connected to sockets on port ' + res.data.ws_port);
            resolve(ws);
          } else {
            reject(message);
          }
        }
      });
    })
    .catch(reject);
});
api.sendMessage = (to, text) => {
  if (currentWsToken === null) {
    console.log('not auth yet to send messages');
  } else {
    const ws = currentWs;
    ws.emit('message', {
      type: 'text_message',
      token: currentWsToken,
      to, text
    });
  }
}

export default api;
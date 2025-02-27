import React from 'react';
import ReactDOM from 'react-dom/client';
import '../src/index.css'
import reportWebVitals from './reportWebVitals'
import { Provider } from 'react-redux';
import store from './store'
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
  <Provider store={store}>
    <App></App>
  </Provider>,
  </React.StrictMode>
);

reportWebVitals();
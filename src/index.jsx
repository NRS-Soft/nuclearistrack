import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { DrizzleContext } from '@drizzle/react-plugin';
import { Drizzle } from '@drizzle/store';
import NuclearPoE from './build/contracts/NuclearPoE.json';

const drizzleOptions = {
  contracts: [NuclearPoE],
  polls: {
    blocks: 3000,
    accounts: 2000,
  },
};

const drizzle = new Drizzle(drizzleOptions);

ReactDOM.render(
  <DrizzleContext.Provider drizzle={drizzle}>
    <App />
  </DrizzleContext.Provider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
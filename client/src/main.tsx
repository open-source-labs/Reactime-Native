import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './store/store';
import '../src/styles/global.scss';


// TODO: get the websockets/Redux connection working with StrictMode for our dev environment
// when we publish our npm package, I think that we don't need StrictMode
ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  // </React.StrictMode> 
);

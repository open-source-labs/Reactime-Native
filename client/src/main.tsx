import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './store/store';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);




// src/App.tsx
// import React from 'react';
// import { Provider } from 'react-redux';
// import { store } from './store/store';
// import MainContainer from './containers/MainContainer';
// import { ThemeProvider } from './ThemeProvider'; // Optional

// function App(): React.JSX.Element {
//   return (
//     <Provider store={store}>
//       <MainContainer />
//     </Provider>
//   );
// }

// export default App;

/**
 * <Provider store={store}>
      <ThemeProvider>
        <MainContainer />
      </ThemeProvider>
    </Provider>
 */

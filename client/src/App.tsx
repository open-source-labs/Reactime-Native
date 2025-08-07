import React from 'react';
import MainContainer from './containers/MainContainer';

function App(): React.JSX.Element {
  return (
    <div>
      <MainContainer />
    </div>
  );
}

export default App;


// // src/App.tsx
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


// src/App.tsx
import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import MainContainer from '../containers/MainContainer';
// import { Toaster } from 'react-hot-toast'; // Optional
// import { ThemeProvider } from './ThemeProvider'; // Optional

function App(): JSX.Element {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <Toaster />
        <MainContainer />
      </ThemeProvider>
    </Provider>
  );
}

export default App;


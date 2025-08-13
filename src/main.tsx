import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

import App from './App'
import { store } from './store'
import { theme } from './theme'
import { NotificationProvider } from './contexts/NotificationContext'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)

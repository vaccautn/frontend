import './App.css'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function App() {
  const currentPath = window.location.pathname

  if (currentPath === '/login') {
    return <LoginPage />
  }

  if (currentPath === '/register') {
    return <RegisterPage />
  }

  return <HomePage />
}

export default App

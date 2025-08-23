import './App.css'
import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'

function App() {

  return (
    <div className='overflow-x-hidden'>
      <Outlet />
    </div>
  )
}

export default App

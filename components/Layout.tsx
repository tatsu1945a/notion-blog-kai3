import React from 'react'
import Navber from './Navber/Navber'

const Layout = ({ children }) => {
  return (
    <div>
      <Navber />
    
      {children}
    </div>
  )
}

export default Layout
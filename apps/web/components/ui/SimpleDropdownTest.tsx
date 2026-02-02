'use client'

import { useState } from 'react'

export function SimpleDropdownTest({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative z-50">
      <div 
        onClick={() => {
          console.log('DIV clicked, current state:', isOpen)
          setIsOpen(!isOpen)
          console.log('New state should be:', !isOpen)
        }}
        className={`${className} cursor-pointer select-none`}
        style={{ 
          backgroundColor: isOpen ? 'lightgreen' : 'lightblue',
          padding: '8px',
          border: '2px solid black',
          borderRadius: '4px'
        }}
      >
        <span>⚽ Fußball Test - Click Me! {isOpen ? 'OPEN' : 'CLOSED'}</span>
      </div>

      {isOpen && (
        <div 
          style={{ 
            position: 'absolute',
            top: '100%',
            left: '0',
            marginTop: '4px',
            backgroundColor: 'yellow',
            border: '3px solid red',
            padding: '16px',
            width: '200px',
            zIndex: 99999
          }}
        >
          <div>DROPDOWN IS WORKING!</div>
          <button onClick={() => setIsOpen(false)}>Close</button>
        </div>
      )}
    </div>
  )
}

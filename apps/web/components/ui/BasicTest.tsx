'use client'

import { useState } from 'react'

export function BasicTest() {
  const [count, setCount] = useState(0)

  console.log('BasicTest component rendered, count is:', count)

  return (
    <div 
      style={{ 
        backgroundColor: 'red', 
        color: 'white', 
        padding: '10px', 
        margin: '10px',
        border: '2px solid black' 
      }}
    >
      <h1>BASIC TEST - Count: {count}</h1>
      <button 
        onClick={() => {
          console.log('Button clicked! Current count:', count)
          setCount(count + 1)
          console.log('Count should now be:', count + 1)
        }}
        style={{ 
          backgroundColor: 'blue', 
          color: 'white', 
          padding: '10px', 
          fontSize: '16px' 
        }}
      >
        Click Me - Current: {count}
      </button>
    </div>
  )
}
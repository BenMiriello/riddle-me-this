import ChatContainer from './components/ChatContainer/ChatContainer'
import Footer from './components/Footer/Footer'
import { BadgeContainer } from './components/BadgeContainer'
import { BadgeProvider } from './contexts/BadgeContext'
import { useState } from 'react'

function App() {
  const [isTextFilling, setIsTextFilling] = useState(false)

  return (
    <BadgeProvider>
      <div className="bg-gray-900 min-h-screen">
        <BadgeContainer isTextFilling={isTextFilling} />
        <ChatContainer onTextFillingChange={setIsTextFilling} />
        <Footer />
      </div>
    </BadgeProvider>
  )
}

export default App

import { useState } from 'react'

interface ChatInputProps {
  onSubmit: () => void
  isLoading: boolean
}

const ChatInput = ({ onSubmit, isLoading }: ChatInputProps) => {
  const [inputValue, setInputValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isLoading) {
      onSubmit()
      setInputValue('')
    }
  }

  return (
    <div className="bg-gray-700 rounded-lg border border-gray-600 p-3 w-full">
      <form onSubmit={handleSubmit} className="flex space-x-2 w-full">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Riddle me this..."
          className="flex-1 bg-gray-600 text-white text-sm border border-gray-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default ChatInput

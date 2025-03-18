import * as React from "react"
import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Send, User, MessagesSquare, PlusCircle, Trash2 } from "lucide-react"

interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
}

interface Conversation {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
  messages: Message[]
}

export function ChatBox() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "General Questions",
      lastMessage: "Hello! How can I help you today?",
      timestamp: new Date(),
      messages: [
        {
          id: "1",
          content: "Hello! How can I help you today?",
          sender: "bot",
          timestamp: new Date(),
        },
      ],
    },
    {
      id: "2",
      title: "Wallet Support",
      lastMessage: "Have you tried reconnecting your wallet?",
      timestamp: new Date(Date.now() - 86400000),
      messages: [
        {
          id: "2",
          content: "Have you tried reconnecting your wallet?",
          sender: "bot",
          timestamp: new Date(Date.now() - 86400000),
        },
      ],
    },
  ])
  const [activeConversation, setActiveConversation] = useState("1")
  const [conversationCounter, setConversationCounter] = useState(3)

  // Create a new conversation
  const createNewConversation = () => {
    // Save current conversation messages
    setConversations(prev => 
      prev.map(conv => 
        conv.id === activeConversation 
          ? {...conv, messages: [...messages]} 
          : conv
      )
    )
    
    // Create new conversation
    const newId = conversationCounter.toString()
    const newConversation: Conversation = {
      id: newId,
      title: `New Chat ${newId}`,
      lastMessage: "How can I help you today?",
      timestamp: new Date(),
      messages: [
        {
          id: Date.now().toString(),
          content: "How can I help you today?",
          sender: "bot",
          timestamp: new Date(),
        }
      ]
    }
    
    // Add to conversations list and set as active
    setConversations(prev => [newConversation, ...prev])
    setActiveConversation(newId)
    setConversationCounter(prev => prev + 1)
    
    // Reset messages to only include initial greeting
    setMessages(newConversation.messages)
  }

  // Delete a conversation
  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the conversation selection
    
    setConversations(prev => prev.filter(conv => conv.id !== id))
    
    // If the active conversation is deleted, set the first conversation as active
    // or create a new one if no conversations remain
    if (id === activeConversation) {
      const remainingConversations = conversations.filter(conv => conv.id !== id)
      if (remainingConversations.length > 0) {
        const newActiveId = remainingConversations[0].id
        setActiveConversation(newActiveId)
        setMessages(remainingConversations[0].messages)
      } else {
        createNewConversation()
      }
    }
  }

  // Switch to a different conversation
  const switchConversation = (id: string) => {
    // Save current conversation messages before switching
    setConversations(prev => 
      prev.map(conv => 
        conv.id === activeConversation 
          ? {...conv, messages: [...messages]} 
          : conv
      )
    )
    
    // Switch to selected conversation
    setActiveConversation(id)
    
    // Load messages from the selected conversation
    const selectedConv = conversations.find(conv => conv.id === id)
    if (selectedConv) {
      setMessages(selectedConv.messages)
    }
  }

  const handleSendMessage = () => {
    if (input.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: input,
        sender: "user",
        timestamp: new Date(),
      }
      
      setMessages([...messages, newMessage])
      
      // Simulate a response after a short delay
      setTimeout(() => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: "I received your message. How can I help further?",
          sender: "bot",
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, botResponse])
        
        // Update the conversation
        setConversations(prev => 
          prev.map(conv => 
            conv.id === activeConversation 
              ? {
                  ...conv, 
                  lastMessage: botResponse.content, 
                  timestamp: new Date(),
                  messages: [...messages, newMessage, botResponse]
                } 
              : conv
          )
        )
      }, 1000)
      
      setInput("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <Card className="w-full max-w-2xl shadow-lg flex h-[500px] overflow-hidden">
      {/* Conversation List */}
      <div className="w-1/4 border-r bg-muted/20 flex flex-col">
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>Conversations</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={createNewConversation}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <div className="overflow-y-auto flex-1">
          {conversations.map((conversation) => (
            <div 
              key={conversation.id}
              className={`p-3 cursor-pointer hover:bg-muted/50 flex flex-col ${
                activeConversation === conversation.id ? "bg-muted/50" : ""
              }`}
              onClick={() => switchConversation(conversation.id)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs truncate">{conversation.title}</span>
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(conversation.timestamp)}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 opacity-60 hover:opacity-100"
                    onClick={(e) => deleteConversation(conversation.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {conversation.lastMessage}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="w-3/4 flex flex-col">
        <CardHeader className="p-3 border-b">
          <CardTitle className="text-sm font-medium">
            {conversations.find(c => c.id === activeConversation)?.title || "Chat"}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((message) => (
            <div 
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-2 ${
                  message.sender === "user" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Avatar className="h-5 w-5">
                    {message.sender === "user" ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <MessagesSquare className="h-3 w-3" />
                    )}
                  </Avatar>
                  <span className="text-xs font-medium">
                    {message.sender === "user" ? "You" : "Assistant"}
                  </span>
                  <span className="text-[10px] opacity-70">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className="text-xs">{message.content}</p>
              </div>
            </div>
          ))}
        </CardContent>
        
        <CardFooter className="p-3 border-t mt-auto">
          <div className="flex w-full space-x-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 resize-none rounded-md border border-input bg-transparent p-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[40px] max-h-[80px]"
              rows={1}
            />
            <Button 
              size="icon" 
              className="h-10 w-10"
              onClick={handleSendMessage}
              disabled={!input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </div>
    </Card>
  )
} 
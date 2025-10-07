import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { cn } from "../../lib/utils"
import { Search as SearchIcon, X, Clock, User, DollarSign, CheckSquare } from "lucide-react"
import { useApp } from "../../state/store"

interface SearchResult {
  id: string
  label: string
  description: string
  href: string
  icon: React.ReactNode
  category: string
}

interface SearchProps {
  className?: string
}

export function Search({ className }: SearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const app = useApp()
  
  // Generate search results based on current app state
  const generateResults = (searchQuery: string): SearchResult[] => {
    if (!searchQuery.trim()) return []
    
    const query = searchQuery.toLowerCase()
    const results: SearchResult[] = []
    
    // Add household children
    if (app.household) {
      app.household.children.forEach(child => {
        if (child.name.toLowerCase().includes(query)) {
          results.push({
            id: `child-${child.id}`,
            label: child.name,
            description: `View ${child.name}'s dashboard`,
            href: `/child/${child.id}`,
            icon: <User className="h-4 w-4" />,
            category: "Children"
          })
        }
      })
    }
    
    // Add navigation items
    const navItems = [
      { label: "Dashboard", href: "/parent", icon: <Clock className="h-4 w-4" />, category: "Navigation" },
      { label: "Settings", href: "/settings", icon: <Clock className="h-4 w-4" />, category: "Navigation" },
      { label: "Bank", href: "/bank", icon: <DollarSign className="h-4 w-4" />, category: "Navigation" },
      { label: "Tasks", href: "/parent", icon: <CheckSquare className="h-4 w-4" />, category: "Navigation" }
    ]
    
    navItems.forEach(item => {
      if (item.label.toLowerCase().includes(query)) {
        results.push({
          id: `nav-${item.label.toLowerCase()}`,
          label: item.label,
          description: `Go to ${item.label}`,
          href: item.href,
          icon: item.icon,
          category: item.category
        })
      }
    })
    
    return results.slice(0, 8) // Limit results
  }
  
  useEffect(() => {
    if (query.trim()) {
      setResults(generateResults(query))
    } else {
      setResults([])
    }
  }, [query, app.household])
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setQuery("")
    }
  }
  
  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <SearchIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-25"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-0 z-50 w-80 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <SearchIcon className="h-4 w-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search children, pages..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 outline-none text-sm"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {results.length > 0 ? (
                <div className="p-2">
                  {results.map((result) => (
                    <a
                      key={result.id}
                      href={result.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="text-gray-400">{result.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {result.label}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {result.description}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {result.category}
                      </div>
                    </a>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Start typing to search...
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

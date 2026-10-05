import { useEffect, useState } from 'react'
import { Sparkles, BookOpen, Brain, Target, Zap } from 'lucide-react'

const FloatingQuotes = () => {
  const [activeQuotes, setActiveQuotes] = useState([])

  const quotes = [
    {
      text: "Excellence in research comes from questioning everything",
      icon: Brain,
      color: "from-purple-500 to-pink-500"
    },
    {
      text: "AI augments human insight, not replaces it",
      icon: Sparkles,
      color: "from-blue-500 to-cyan-500"
    },
    {
      text: "Every paper tells a story waiting to be understood",
      icon: BookOpen,
      color: "from-green-500 to-emerald-500"
    },
    {
      text: "Novelty emerges from deep analysis and critical thinking",
      icon: Target,
      color: "from-orange-500 to-red-500"
    },
    {
      text: "Transform research review with intelligent assistance",
      icon: Zap,
      color: "from-indigo-500 to-purple-500"
    },
    {
      text: "Discover weaknesses before they become problems",
      icon: Target,
      color: "from-red-500 to-pink-500"
    },
    {
      text: "Clarity in writing reflects clarity in thought",
      icon: BookOpen,
      color: "from-teal-500 to-blue-500"
    },
    {
      text: "Every analysis brings you closer to perfection",
      icon: Brain,
      color: "from-violet-500 to-fuchsia-500"
    }
  ]

  useEffect(() => {
    // Initialize with 3 random quotes
    const initialQuotes = []
    const usedIndices = new Set()
    
    while (initialQuotes.length < 3) {
      const randomIndex = Math.floor(Math.random() * quotes.length)
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex)
        initialQuotes.push({
          ...quotes[randomIndex],
          id: Date.now() + randomIndex,
          position: {
            x: Math.random() * 80 + 10, // 10-90%
            y: Math.random() * 60 + 20  // 20-80%
          },
          duration: 15 + Math.random() * 10, // 15-25 seconds
          delay: Math.random() * 5
        })
      }
    }
    
    setActiveQuotes(initialQuotes)

    // Add new quotes periodically
    const interval = setInterval(() => {
      setActiveQuotes(prev => {
        // Remove quotes older than their duration
        const filtered = prev.filter(q => {
          const age = (Date.now() - q.id) / 1000
          return age < q.duration
        })

        // Add a new quote if we have less than 4
        if (filtered.length < 4) {
          const unusedQuotes = quotes.filter(q => 
            !filtered.some(fq => fq.text === q.text)
          )
          
          if (unusedQuotes.length > 0) {
            const randomQuote = unusedQuotes[Math.floor(Math.random() * unusedQuotes.length)]
            filtered.push({
              ...randomQuote,
              id: Date.now(),
              position: {
                x: Math.random() * 80 + 10,
                y: Math.random() * 60 + 20
              },
              duration: 15 + Math.random() * 10,
              delay: 0
            })
          }
        }

        return filtered
      })
    }, 8000) // Check every 8 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      {activeQuotes.map((quote) => {
        const Icon = quote.icon
        
        return (
          <div
            key={quote.id}
            className="absolute animate-float-quote"
            style={{
              left: `${quote.position.x}%`,
              top: `${quote.position.y}%`,
              animationDuration: `${quote.duration}s`,
              animationDelay: `${quote.delay}s`
            }}
          >
            <div className={`
              flex items-center space-x-3 px-6 py-4 rounded-2xl
              bg-gradient-to-r ${quote.color} bg-opacity-10
              backdrop-blur-xl border border-white/10
              shadow-2xl hover:scale-105 transition-transform duration-500
              max-w-md
            `}>
              <div className={`
                p-2.5 rounded-xl bg-gradient-to-br ${quote.color}
                shadow-lg flex-shrink-0
              `}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-white text-sm font-medium leading-relaxed">
                {quote.text}
              </p>
            </div>
          </div>
        )
      })}

      <style jsx>{`
        @keyframes float-quote {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          10% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          90% {
            opacity: 1;
            transform: translateY(-20px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-40px) scale(0.95);
          }
        }

        .animate-float-quote {
          animation: float-quote ease-in-out forwards;
        }
      `}</style>
    </div>
  )
}

export default FloatingQuotes

import { useEffect, useState } from 'react'

const FloatingKeywords = () => {
  const [keywords, setKeywords] = useState([])

  const keywordList = [
    { text: "AI Analysis", color: "text-purple-400" },
    { text: "Research", color: "text-blue-400" },
    { text: "Innovation", color: "text-green-400" },
    { text: "Clarity", color: "text-cyan-400" },
    { text: "Novelty", color: "text-pink-400" },
    { text: "Weaknesses", color: "text-red-400" },
    { text: "Related Work", color: "text-indigo-400" },
    { text: "Critical Review", color: "text-orange-400" },
    { text: "Deep Learning", color: "text-violet-400" },
    { text: "Insights", color: "text-teal-400" },
    { text: "Academic", color: "text-fuchsia-400" },
    { text: "Evidence", color: "text-emerald-400" },
    { text: "Citations", color: "text-sky-400" },
    { text: "Methodology", color: "text-amber-400" },
    { text: "Findings", color: "text-rose-400" }
  ]

  useEffect(() => {
    // Initialize keywords with random positions and delays
    const initialKeywords = keywordList.map((kw, index) => ({
      ...kw,
      id: index,
      left: Math.random() * 90 + 5, // 5-95%
      top: Math.random() * 80 + 10, // 10-90%
      duration: 20 + Math.random() * 15, // 20-35 seconds
      delay: Math.random() * 10,
      size: Math.random() * 0.5 + 0.8 // 0.8-1.3
    }))

    setKeywords(initialKeywords)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-[4] overflow-hidden opacity-30">
      {keywords.map((keyword) => (
        <div
          key={keyword.id}
          className={`absolute animate-float-gentle ${keyword.color} font-bold select-none`}
          style={{
            left: `${keyword.left}%`,
            top: `${keyword.top}%`,
            fontSize: `${keyword.size}rem`,
            animationDuration: `${keyword.duration}s`,
            animationDelay: `${keyword.delay}s`,
            textShadow: '0 0 30px currentColor'
          }}
        >
          {keyword.text}
        </div>
      ))}
    </div>
  )
}

export default FloatingKeywords

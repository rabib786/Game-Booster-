import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. State for current tab
content = content.replace("const [isBoosting, setIsBoosting] = useState(false);", "const [isBoosting, setIsBoosting] = useState(false);\n  const [currentTab, setCurrentTab] = useState<'Game Booster' | 'System Booster'>('Game Booster');\n  const [isCleaning, setIsCleaning] = useState(false);\n  const [isOptimizing, setIsOptimizing] = useState(false);")

# 2. Update navigation headers
nav_html = """
            <nav className="flex space-x-8">
              <button
                onClick={() => setCurrentTab('Game Booster')}
                className={`transition-colors ${currentTab === 'Game Booster' ? 'text-razer-green glass-border pb-1' : 'hover:text-razer-green'}`}>
                Game Booster
              </button>
              <button
                onClick={() => setCurrentTab('System Booster')}
                className={`transition-colors ${currentTab === 'System Booster' ? 'text-razer-green glass-border pb-1' : 'hover:text-razer-green'}`}>
                System Booster
              </button>
            </nav>
"""

content = re.sub(r'<nav className="flex space-x-8">.*?</nav>', nav_html.strip(), content, flags=re.DOTALL)

# 3. Handle window controls
controls_html = """
          <div className="flex items-center space-x-4 text-gray-500">
            <button className="hover:text-white transition-colors">⚙️</button>
            <button onClick={() => window.eel && window.eel.minimize_window()} className="hover:text-white transition-colors">—</button>
            <button onClick={() => window.eel && window.eel.maximize_window()} className="hover:text-white transition-colors">▢</button>
            <button onClick={() => window.eel && window.eel.close_window()} className="hover:text-red-500 transition-colors">✕</button>
          </div>
"""

content = re.sub(r'<div className="flex items-center space-x-4 text-gray-500">.*?</div>', controls_html.strip(), content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)

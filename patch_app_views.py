import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Remove the Specials section and its dummy state

# 1. Remove state
content = re.sub(r'const \[selectedItems, setSelectedItems\] = useState<string\[\]>\(\[.*?\]\);\n', '', content, flags=re.DOTALL)
content = re.sub(r'const toggleItem = .*?};\n', '', content, flags=re.DOTALL)
content = re.sub(r'const specialItems = \[.*?\];\n', '', content, flags=re.DOTALL)

# 2. Add System Booster Logic
sys_booster_logic = """
  const handleCleanSystem = async () => {
    setIsCleaning(true);
    addLog('Initiating System Clean sequence...');
    if (window.eel) {
      try {
        const result = await window.eel.clean_system()();
        if (result.status === 'success') {
          addLog(result.message);
        } else {
          addLog(`Error: ${result.message}`, true);
        }
      } catch (error) {
        addLog(`Failed to communicate with backend: ${error}`, true);
      }
    } else {
      setTimeout(() => {
        addLog('[Web Preview] Cleaned 150.45 MB of Junk.');
        setIsCleaning(false);
      }, 1000);
      return;
    }
    setIsCleaning(false);
  };

  const handleOptimizeStartup = async () => {
    setIsOptimizing(true);
    addLog('Initiating Startup Optimization sequence...');
    if (window.eel) {
      try {
        const result = await window.eel.optimize_startup()();
        if (result.status === 'success') {
          addLog(result.message);
          if (result.details) {
            addLog(result.details);
          }
        } else {
          addLog(`Error: ${result.message}`, true);
        }
      } catch (error) {
        addLog(`Failed to communicate with backend: ${error}`, true);
      }
    } else {
      setTimeout(() => {
        addLog('[Web Preview] Disabled 3 startup programs.');
        setIsOptimizing(false);
      }, 1000);
      return;
    }
    setIsOptimizing(false);
  };
"""

content = content.replace("const handleBoost = async () => {", sys_booster_logic + "\n  const handleBoost = async () => {")

# 3. Replace the main content section with conditional rendering

main_content_start = content.find("      <main className=\"flex-1 overflow-y-auto p-8 custom-scrollbar\" data-purpose=\"dashboard-content\">")
main_content_end = content.find("      </main>", main_content_start)

main_content = content[main_content_start:main_content_end]

# Modify main_content

# We only want to conditionally render the "Summary Card", "Specials", "Processes".
# The "Logs" section can stay at the bottom for both tabs.

summary_card = re.search(r'{/\* BEGIN: OptimizationSummary \*/}.*?{/\* END: OptimizationSummary \*/}', main_content, re.DOTALL).group(0)
specials_section = re.search(r'{/\* BEGIN: SpecialsSection \*/}.*?{/\* END: SpecialsSection \*/}', main_content, re.DOTALL).group(0)
processes_section = re.search(r'{/\* BEGIN: ProcessesSection \*/}.*?{/\* END: ProcessesSection \*/}', main_content, re.DOTALL).group(0)

# Create the Game Booster View
game_booster_view = f"""
        {{currentTab === 'Game Booster' && (
          <>
            {summary_card}
            {processes_section}
          </>
        )}}
"""

# Replace Specials section in game_booster_view (actually, we just don't include it in game_booster_view)
# But we need to update the summary card text to not talk about "28 items" anymore or just leave it since it's dummy UI for now. Let's just remove the Specials from the view.

# Create the System Booster View
system_booster_view = """
        {currentTab === 'System Booster' && (
          <div className="flex flex-col space-y-8">
            <section className="bg-panel-bg p-6 rounded-sm border-l-4 border-blue-500 shadow-lg" data-purpose="clean-system-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-blue-500 text-3xl">🧹</div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">System Cleaner</h1>
                    <p className="text-sm text-gray-500 font-medium">Reclaims disk space by thoroughly wiping temporary files.</p>
                  </div>
                </div>
                <button
                  onClick={handleCleanSystem}
                  disabled={isCleaning}
                  className={`bg-blue-500 hover:bg-blue-400 text-black font-black py-2.5 px-12 rounded-sm text-sm uppercase tracking-tighter transition-all transform active:scale-95 shadow-[0_0_15px_rgba(59,130,246,0.3)] ${isCleaning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isCleaning ? 'Cleaning...' : 'Clean Now'}
                </button>
              </div>
            </section>

            <section className="bg-panel-bg p-6 rounded-sm border-l-4 border-purple-500 shadow-lg" data-purpose="startup-optimize-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-purple-500 text-3xl">🚀</div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Startup Optimizer</h1>
                    <p className="text-sm text-gray-500 font-medium">Improves boot times by disabling non-essential applications.</p>
                  </div>
                </div>
                <button
                  onClick={handleOptimizeStartup}
                  disabled={isOptimizing}
                  className={`bg-purple-500 hover:bg-purple-400 text-black font-black py-2.5 px-12 rounded-sm text-sm uppercase tracking-tighter transition-all transform active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.3)] ${isOptimizing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isOptimizing ? 'Optimizing...' : 'Optimize Now'}
                </button>
              </div>
            </section>
          </div>
        )}
"""

# Extract the Logs section
logs_section = re.search(r'{/\* Output Console Box \(moved from old design\) \*/}.*?</section>', main_content, re.DOTALL).group(0)


new_main_content = f"""
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar" data-purpose="dashboard-content">
{game_booster_view}
{system_booster_view}
{logs_section}
      </main>
"""

content = content[:main_content_start] + new_main_content.strip() + content[main_content_end+len("      </main>"):]

# Also remove selectedItems from toggleAutoBoost area to prevent errors
# (Actually, web preview handles selectedItems.length, let's fix that too)
content = content.replace("`[Web Preview] Optimized: ${selectedItems.length} items`", "`[Web Preview] Optimized: Process list items`")

with open('src/App.tsx', 'w') as f:
    f.write(content)

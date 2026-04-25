import React from 'react';

export type TabType = 'Library' | 'Boost Tab' | 'System Booster' | 'Booster Prime' | 'Settings';

export interface NavigationProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  showNavigationArrows?: boolean;
}

/**
 * Tab navigation component
 */
export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  showNavigationArrows = true,
}) => {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'Library', label: 'Library' },
    { id: 'Boost Tab', label: 'Boost' },
    { id: 'System Booster', label: 'System Booster' },
    { id: 'Booster Prime', label: 'Booster Prime' },
    { id: 'Settings', label: 'Settings' },
  ];

  const tabOrder: TabType[] = ['Library', 'Boost Tab', 'System Booster', 'Booster Prime', 'Settings'];
  
  const handleTabStep = (direction: -1 | 1) => {
    const currentIndex = tabOrder.indexOf(currentTab);
    if (currentIndex === -1) return;
    
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < tabOrder.length) {
      onTabChange(tabOrder[nextIndex]);
    }
  };

  return (
    <nav className="flex items-center justify-between border-b border-gray-800 px-8 py-4 bg-nav-bg">
      {showNavigationArrows && (
        <div className="flex items-center space-x-2">
          <button
            aria-label="Previous tab"
            onClick={() => handleTabStep(-1)}
            className="hover:text-white focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:outline-none rounded px-1"
          >
            <span aria-hidden="true">{"<"}</span>
          </button>
          <button
            aria-label="Next tab"
            onClick={() => handleTabStep(1)}
            className="hover:text-white focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:outline-none rounded px-1"
          >
            <span aria-hidden="true">{">"}</span>
          </button>
        </div>
      )}
      
      <div className="flex-1 flex justify-center space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={currentTab === tab.id}
            className={`transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:outline-none rounded px-1 ${
              currentTab === tab.id
                ? 'text-razer-green border-b-2 border-razer-green pb-1'
                : 'text-gray-500 hover:text-white'
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {showNavigationArrows && <div className="w-10" />} {/* Spacer for alignment */}
    </nav>
  );
};
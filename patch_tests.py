with open('src/App.test.tsx', 'r') as f:
    content = f.read()

# Replace handles item selection with handles tab switching
new_test = """
  it('handles tab switching', () => {
    render(<App />);
    const systemBoosterTab = screen.getByText('System Booster');
    fireEvent.click(systemBoosterTab);

    expect(screen.getByText('System Cleaner')).toBeInTheDocument();
  });
"""

import re
content = re.sub(r"it\('handles item selection'.*?\}\);", new_test.strip(), content, flags=re.DOTALL)

with open('src/App.test.tsx', 'w') as f:
    f.write(content)

import '@testing-library/jest-dom'

// Mock scrollIntoView since jsdom doesn't support it natively
window.HTMLElement.prototype.scrollIntoView = function() {};

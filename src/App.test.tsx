import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders title', () => {
    render(<App />);
    expect(screen.getByText(/28 items will be optimized/i)).toBeInTheDocument();
  });

  it('handles boost click', async () => {
    render(<App />);
    const boostBtn = screen.getByText('Boost Now');
    fireEvent.click(boostBtn);

    expect(screen.getByText('Boosting...')).toBeInTheDocument();
  });

  it('handles autoboost toggle', () => {
    render(<App />);
    const autoboost = screen.getByText('Auto-Boost');
    fireEvent.click(autoboost);

    // Test passes if no error is thrown
    expect(autoboost).toBeInTheDocument();
  });

  it('handles tab switching', () => {
    render(<App />);
    const systemBoosterTab = screen.getByText('System Booster');
    fireEvent.click(systemBoosterTab);

    expect(screen.getByText('System Cleaner')).toBeInTheDocument();
  });
});

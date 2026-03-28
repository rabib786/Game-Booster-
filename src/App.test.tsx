import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders Library tab by default', () => {
    render(<App />);
    expect(screen.getByText(/My Library/i)).toBeInTheDocument();
  });


  it('handles boost click', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('Boost'));
    const boostBtn = screen.getByText('Boost Now');
    fireEvent.click(boostBtn);

    expect(screen.getByText('Boosting...')).toBeInTheDocument();
  });

  it('handles autoboost toggle', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Boost'));
    const autoboost = screen.getByText('Auto-Boost');
    fireEvent.click(autoboost);

    expect(autoboost).toBeInTheDocument();
  });

  it('handles power plan toggle', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('Boost'));
    const powerBtn = screen.getByText('Enable High Perf.');
    fireEvent.click(powerBtn);

    expect(powerBtn).toBeInTheDocument();
  });

  it('handles network flush click', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('Boost'));
    const flushBtn = screen.getByText('Flush Network');
    fireEvent.click(flushBtn);

    expect(screen.getByText('Flushing...')).toBeInTheDocument();
  });
});

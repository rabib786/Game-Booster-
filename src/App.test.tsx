import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock the eel bindings
beforeEach(() => {
  window.eel = {
    expose: vi.fn(),
    boost_game: vi.fn(() => async () => ({ status: 'success', message: 'Freed 500 MB', details: 'Closed spotify' })),
    clean_system: vi.fn(() => async () => ({ status: 'success', message: 'Cleaned 1 GB' })),
    optimize_startup: vi.fn(() => async () => ({ status: 'success', message: 'Disabled 2 apps' })),
  };
});

describe('App', () => {
  it('renders correctly', () => {
    render(<App />);
    expect(screen.getByText(/NEXUS/i)).toBeInTheDocument();
    expect(screen.getByText(/Game Booster/i)).toBeInTheDocument();
  });

  it('handles boost game click', async () => {
    render(<App />);
    const boostBtn = screen.getByText('Boost Game');
    fireEvent.click(boostBtn);

    expect(screen.getByText('Boosting...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('> Freed 500 MB')).toBeInTheDocument();
    });
  });

  it('handles clean system click', async () => {
    render(<App />);
    const cleanBtn = screen.getByText('Clean System');
    fireEvent.click(cleanBtn);

    expect(screen.getByText('Cleaning...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('> Cleaned 1 GB')).toBeInTheDocument();
    });
  });

  it('handles optimize startup click', async () => {
    render(<App />);
    const optBtn = screen.getByText('Optimize Startup');
    fireEvent.click(optBtn);

    expect(screen.getByText('Optimizing...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('> Disabled 2 apps')).toBeInTheDocument();
    });
  });
});

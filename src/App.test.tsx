import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('eel', undefined);
  });

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

  describe('handleCleanSystem', () => {
    it('handles successful cleaning (window.eel)', async () => {
      const cleanSystemMock = vi.fn().mockResolvedValue({ status: 'success', message: 'Successfully cleaned 500MB' });
      vi.stubGlobal('eel', {
        full_system_clean: () => cleanSystemMock,
        get_prime_games: () => vi.fn().mockResolvedValue([])
      });

      render(<App />);

      // Navigate to Booster Prime tab
      fireEvent.click(screen.getByText('Booster Prime'));

      // Find and click Clean Now button
      const cleanBtn = screen.getByRole('button', { name: 'Clean Now' });
      fireEvent.click(cleanBtn);

      // Verify it enters cleaning state
      expect(screen.getByText('Cleaning...')).toBeInTheDocument();
      expect(cleanBtn).toBeDisabled();

      // Wait for it to finish
      await waitFor(() => {
        expect(screen.queryByText('Cleaning...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Clean Now')).not.toBeDisabled();
      expect(screen.getByText(/Successfully cleaned 500MB/i)).toBeInTheDocument();
    });

    it('handles failed cleaning (window.eel)', async () => {
      const cleanSystemMock = vi.fn().mockResolvedValue({ status: 'error', message: 'Disk access denied' });
      vi.stubGlobal('eel', {
        full_system_clean: () => cleanSystemMock,
        get_prime_games: () => vi.fn().mockResolvedValue([])
      });

      render(<App />);

      fireEvent.click(screen.getByText('Booster Prime'));
      const cleanBtn = screen.getByRole('button', { name: 'Clean Now' });
      fireEvent.click(cleanBtn);

      await waitFor(() => {
        expect(screen.queryByText('Cleaning...')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/Error: Disk access denied/i)).toBeInTheDocument();
    });

    it('handles network/backend error (window.eel)', async () => {
      const cleanSystemMock = vi.fn().mockRejectedValue(new Error('Network Error'));
      vi.stubGlobal('eel', {
        full_system_clean: () => cleanSystemMock,
        get_prime_games: () => vi.fn().mockResolvedValue([])
      });

      render(<App />);

      fireEvent.click(screen.getByText('Booster Prime'));
      const cleanBtn = screen.getByRole('button', { name: 'Clean Now' });
      fireEvent.click(cleanBtn);

      await waitFor(() => {
        expect(screen.queryByText('Cleaning...')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/Failed to communicate with backend/i)).toBeInTheDocument();
    });

    it('handles cleaning in web preview mode (no window.eel)', async () => {
      vi.stubGlobal('eel', undefined);
      vi.useFakeTimers({ shouldAdvanceTime: true });

      render(<App />);

      fireEvent.click(screen.getByText('Booster Prime'));
      const cleanBtn = screen.getByText('Clean Now');
      fireEvent.click(cleanBtn);

      expect(screen.getByText('Cleaning...')).toBeInTheDocument();

      // Fast-forward timers to resolve setTimeout
      act(() => {
        vi.runAllTimers();
      });

      await waitFor(() => {
        expect(screen.queryByText('Cleaning...')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      expect(screen.getByText(/\[Web Preview\] Cleaned 150.45 MB of Junk./i)).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('handleOptimizeStartup', () => {
    it('handles successful optimization (window.eel)', async () => {
      const optimizeStartupMock = vi.fn().mockResolvedValue({ status: 'success', message: 'Startup optimized' });
      vi.stubGlobal('eel', {
        optimize_startup: () => optimizeStartupMock,
        get_prime_games: () => vi.fn().mockResolvedValue([])
      });

      render(<App />);

      // Navigate to Booster Prime tab
      fireEvent.click(screen.getByText('Booster Prime'));

      // Find and click Optimize Now button
      const optimizeBtn = screen.getByRole('button', { name: 'Optimize Now' });
      fireEvent.click(optimizeBtn);

      // Verify it enters optimizing state
      expect(screen.getByText('Optimizing...')).toBeInTheDocument();
      expect(optimizeBtn).toBeDisabled();

      // Wait for it to finish
      await waitFor(() => {
        expect(screen.queryByText('Optimizing...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Optimize Now')).not.toBeDisabled();
      expect(screen.getByText(/Startup optimized/i)).toBeInTheDocument();
    });

    it('handles failed optimization (window.eel)', async () => {
      const optimizeStartupMock = vi.fn().mockResolvedValue({ status: 'error', message: 'Access denied' });
      vi.stubGlobal('eel', {
        optimize_startup: () => optimizeStartupMock,
        get_prime_games: () => vi.fn().mockResolvedValue([])
      });

      render(<App />);

      fireEvent.click(screen.getByText('Booster Prime'));
      const optimizeBtn = screen.getByRole('button', { name: 'Optimize Now' });
      fireEvent.click(optimizeBtn);

      await waitFor(() => {
        expect(screen.queryByText('Optimizing...')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/Error: Access denied/i)).toBeInTheDocument();
    });

    it('handles network/backend error (window.eel)', async () => {
      const optimizeStartupMock = vi.fn().mockRejectedValue(new Error('Network Error'));
      vi.stubGlobal('eel', {
        optimize_startup: () => optimizeStartupMock,
        get_prime_games: () => vi.fn().mockResolvedValue([])
      });

      render(<App />);

      fireEvent.click(screen.getByText('Booster Prime'));
      const optimizeBtn = screen.getByRole('button', { name: 'Optimize Now' });
      fireEvent.click(optimizeBtn);

      await waitFor(() => {
        expect(screen.queryByText('Optimizing...')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/Failed to communicate with backend/i)).toBeInTheDocument();
    });

    it('handles optimization in web preview mode (no window.eel)', async () => {
      vi.stubGlobal('eel', undefined);
      vi.useFakeTimers({ shouldAdvanceTime: true });

      render(<App />);

      fireEvent.click(screen.getByText('Booster Prime'));
      const optimizeBtn = screen.getByText('Optimize Now');
      fireEvent.click(optimizeBtn);

      expect(screen.getByText('Optimizing...')).toBeInTheDocument();

      // Fast-forward timers to resolve setTimeout
      act(() => {
        vi.runAllTimers();
      });

      await waitFor(() => {
        expect(screen.queryByText('Optimizing...')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      expect(screen.getByText(/\[Web Preview\] Disabled 3 startup programs./i)).toBeInTheDocument();

      vi.useRealTimers();
    });
  });
});
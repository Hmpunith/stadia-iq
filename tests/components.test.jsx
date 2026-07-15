import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import App from '../src/App.jsx';
import Header from '../src/components/Header.jsx';
import WayfinderMap from '../src/components/WayfinderMap.jsx';

const renderApp = async () => {
  let result;
  await act(async () => {
    result = render(<App />);
  });
  return result;
};

describe('App Component Swapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', async () => {
    const { container } = await renderApp();
    expect(container).toBeTruthy();
  });

  it('renders Header with h1 StadiaIQ', async () => {
    await renderApp();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/StadiaIQ/i);
  });

  it('renders the select view role selectors', async () => {
    await renderApp();
    const buttons = screen.getAllByRole('radio');
    expect(buttons).toHaveLength(3); // Fan Companion, Volunteer Portal, Organizer Cockpit
  });

  it('defaults to Fan view and renders the wayfinder map', async () => {
    await renderApp();
    expect(screen.getByText(/NJ Transit Rail Terminal/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /congestion-aware wayfinder/i })).toBeInTheDocument();
  });

  it('switches to Volunteer Portal view when selected', async () => {
    await renderApp();
    const volunteerBtn = screen.getByRole('radio', { name: /volunteer portal/i });
    
    await act(async () => {
      fireEvent.click(volunteerBtn);
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /AI Incident Intake Console/i })).toBeInTheDocument();
    });
  });

  it('switches to Organizer Cockpit view when selected', async () => {
    await renderApp();
    const organizerBtn = screen.getByRole('radio', { name: /organizer cockpit/i });

    await act(async () => {
      fireEvent.click(organizerBtn);
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /GenAI Strategic Response Planner/i })).toBeInTheDocument();
    });
  });
});

describe('Header Component Details', () => {
  it('renders links and role selector dynamically', () => {
    const setActiveRole = vi.fn();
    render(<Header activeRole="fan" setActiveRole={setActiveRole} />);
    const buttons = screen.getAllByRole('radio');
    expect(buttons[0]).toHaveAttribute('aria-checked', 'true');
    
    fireEvent.click(buttons[1]);
    expect(setActiveRole).toHaveBeenCalledWith('staff');
  });
});

describe('WayfinderMap SVG Rendering', () => {
  it('renders node coordinate representations', () => {
    render(<WayfinderMap recommendedRoute={['Lot P1', 'Gate A']} crowdHeatmap={{}} />);
    expect(screen.getByText('Lot P1')).toBeInTheDocument();
    expect(screen.getByText('Gate A')).toBeInTheDocument();
  });
});

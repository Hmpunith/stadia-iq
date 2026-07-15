import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import App from '../src/App.jsx';
import Header from '../src/components/Header.jsx';
import WayfinderMap from '../src/components/WayfinderMap.jsx';
import FanPortal from '../src/components/FanPortal.jsx';
import StaffPortal from '../src/components/StaffPortal.jsx';

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
    expect(buttons).toHaveLength(3); // Fan, Volunteer, Organizer
  });

  it('defaults to Fan view and renders the wayfinder map', async () => {
    await renderApp();
    expect(screen.getByText(/NJ Transit Rail Terminal/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /congestion-aware wayfinder/i })).toBeInTheDocument();
  });

  it('switches to Volunteer Portal view when selected', async () => {
    await renderApp();
    const volunteerBtn = screen.getByRole('radio', { name: /volunteer/i });
    
    await act(async () => {
      fireEvent.click(volunteerBtn);
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /AI Incident Intake Console/i })).toBeInTheDocument();
    });
  });

  it('switches to Organizer Cockpit view when selected', async () => {
    await renderApp();
    const organizerBtn = screen.getByRole('radio', { name: /organizer/i });

    await act(async () => {
      fireEvent.click(organizerBtn);
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /GenAI Strategic Response Planner/i })).toBeInTheDocument();
    });
  });

  it('toggles body classes when theme switcher button is clicked', async () => {
    await renderApp();
    const toggleBtn = screen.getByRole('button', { name: /switch to light mode/i });
    expect(document.body.className).not.toContain('light-theme');

    await act(async () => {
      fireEvent.click(toggleBtn);
    });

    expect(document.body.className).toContain('light-theme');
  });
});

describe('Header Component Details', () => {
  it('renders links and role selector dynamically', () => {
    const setActiveRole = vi.fn();
    render(<Header activeRole="fan" setActiveRole={setActiveRole} theme="dark" toggleTheme={() => {}} />);
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

describe('FanPortal Core Interactions', () => {
  it('allows changing origin and target nodes', () => {
    render(<FanPortal setRoute={() => {}} telemetry={{}} triggerTelemetryRefresh={() => {}} />);
    const startSelect = screen.getByLabelText(/matchday origin/i);
    const endSelect = screen.getByLabelText(/target destination/i);

    fireEvent.change(startSelect, { target: { value: 'Lot P3' } });
    fireEvent.change(endSelect, { target: { value: 'Gate B' } });

    expect(startSelect.value).toBe('Lot P3');
    expect(endSelect.value).toBe('Gate B');
  });

  it('fires route calculation fetch on form submit', async () => {
    const setRoute = vi.fn();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        recommendedRoute: ['Lot P1', 'Gate A'],
        navigationSteps: [],
        crowdStatus: 'LOW',
        totalDurationMins: 5.0,
      }),
    });
    globalThis.fetch = mockFetch;

    render(<FanPortal setRoute={setRoute} telemetry={{}} triggerTelemetryRefresh={() => {}} />);
    const submitBtn = screen.getByRole('button', { name: /find smart route/i });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(mockFetch).toHaveBeenCalled();
  });
});

describe('StaffPortal Core Interactions', () => {
  it('allows filling in raw incident text reports', () => {
    render(<StaffPortal triggerTelemetryRefresh={() => {}} />);
    const textarea = screen.getByLabelText(/raw log\/transcript/i);

    fireEvent.change(textarea, { target: { value: 'Water leak section 104' } });
    expect(textarea.value).toBe('Water leak section 104');
  });
});

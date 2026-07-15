/**
 * @fileoverview Stateful in-memory database module for StadiaIQ (replaces Firebase).
 * Holds matchday active incidents, volunteer tasks, sustainability eco-logs, and telemetry.
 * Pre-populates sample data for demonstration.
 *
 * @module db
 * @version 1.0.0
 */

import { ECO_ACTIONS, SEVERITY } from './constants.js';

// Stateful in-memory database
const db = {
  incidents: [
    {
      id: 'inc-1',
      title: 'Water spill near Gate B entry ramp',
      description: 'Large puddle of water creating slipping hazard for incoming crowds.',
      category: 'Safety',
      severity: SEVERITY.MEDIUM,
      status: 'OPEN',
      location: 'Gate B',
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(), // 30 mins ago
      reportedBy: 'Volunteer John',
      resolutionChecklist: [
        'Place yellow wet floor warning sign',
        'Use dry mop to clear puddle completely',
        'Inspect area for ceiling leaks',
      ],
    },
    {
      id: 'inc-2',
      title: 'Ticket scanner error at Turnstile 4',
      description: 'Turnstile 4 scanner is failing to read barcode scans from mobile devices.',
      category: 'Technology',
      severity: SEVERITY.HIGH,
      status: 'IN_PROGRESS',
      location: 'Gate A',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(), // 15 mins ago
      reportedBy: 'Staff Sarah',
      resolutionChecklist: [
        'Restart reader hardware',
        'Verify local network connection',
        'Deploy handheld backup scanner if reset fails',
      ],
    },
    {
      id: 'inc-3',
      title: 'Overflowing recycle bin at Section 112',
      description: 'The green plastic recycle bin next to Section 112 concessions is completely full.',
      category: 'Sustainability',
      severity: SEVERITY.LOW,
      status: 'CLOSED',
      location: 'Section 100s',
      timestamp: new Date(Date.now() - 60 * 60000).toISOString(), // 1 hour ago
      reportedBy: 'Volunteer Alex',
      resolutionChecklist: [
        'Empty full green bin',
        'Insert new compostable liner bag',
        'Transport sorted recycling to primary storage bin B',
      ],
    },
  ],

  tasks: [
    {
      id: 'task-1',
      title: 'Wet floor cleanup - Gate B',
      description: 'Apply dry mop and post caution signs.',
      status: 'PENDING',
      incidentId: 'inc-1',
      assignedTo: 'John Doe',
    },
    {
      id: 'task-2',
      title: 'Hardware diagnostic - Turnstile 4',
      description: 'Restart and verify scanner network.',
      status: 'IN_PROGRESS',
      incidentId: 'inc-2',
      assignedTo: 'Sarah Jenkins',
    },
    {
      id: 'task-3',
      title: 'Concession queue safety check - Section 202',
      description: 'Verify crowd barricades are securely placed.',
      status: 'COMPLETED',
      assignedTo: 'John Doe',
    },
    {
      id: 'task-4',
      title: 'Restock water cups - Refill Station 305',
      description: 'Bring 2 cases of compostable cups from supply storage.',
      status: 'PENDING',
      assignedTo: 'Unassigned',
    },
  ],

  sustainability: {
    totalPoints: 2450,
    totalCo2SavedKg: 154.6,
    users: {
      'Fan-123': {
        username: 'Fan-123',
        points: 80,
        co2SavedKg: 3.5,
        history: [
          { actionId: 'public_transit', timestamp: new Date(Date.now() - 120 * 60000).toISOString() }, // 2 hours ago
          { actionId: 'recycle_cup', timestamp: new Date(Date.now() - 40 * 60000).toISOString() }, // 40 mins ago
          { actionId: 'water_refill', timestamp: new Date(Date.now() - 10 * 60000).toISOString() }, // 10 mins ago
        ],
      },
    },
  },

  telemetry: {
    attendance: 54320,
    averageQueueTimeMins: 8.5,
    activeIncidentsCount: 2,
    transitDelayStatus: 'ON_TIME',
    crowdHeatmap: {
      'Gate A': 35, // queue occupancy percentage or index
      'Gate B': 75, // high congestion
      'Gate C': 25,
      'Gate D': 55,
    },
  },
};

// Database operations

/**
 * Retrieve all incidents currently stored in the database.
 * @returns {Array<Object>} Array of incident objects.
 */
export function getIncidents() {
  return db.incidents;
}

/**
 * Create a new incident record with an auto-generated id, timestamp, and OPEN status.
 * @param {Object} incident - The incident data to store.
 * @returns {Object} The newly created incident object with generated id, timestamp, and status.
 */
export function addIncident(incident) {
  const newIncident = {
    id: `inc-${Date.now()}`,
    timestamp: new Date().toISOString(),
    status: 'OPEN',
    ...incident,
  };
  db.incidents.unshift(newIncident);
  db.telemetry.activeIncidentsCount = db.incidents.filter((inc) => inc.status !== 'CLOSED').length;
  return newIncident;
}

/**
 * Update an existing incident by id and refresh the active-incidents telemetry counter.
 * @param {string} id - The unique identifier of the incident to update.
 * @param {Object} updates - An object containing the fields to merge into the incident.
 * @returns {Object|null} The updated incident object, or null if not found.
 */
export function updateIncident(id, updates) {
  const index = db.incidents.findIndex((inc) => inc.id === id);
  if (index !== -1) {
    db.incidents[index] = { ...db.incidents[index], ...updates };
    db.telemetry.activeIncidentsCount = db.incidents.filter((inc) => inc.status !== 'CLOSED').length;
    return db.incidents[index];
  }
  return null;
}

/**
 * Retrieve all volunteer/staff tasks currently stored in the database.
 * @returns {Array<Object>} Array of task objects.
 */
export function getTasks() {
  return db.tasks;
}

/**
 * Create a new task record with an auto-generated id and PENDING status.
 * @param {Object} task - The task data to store.
 * @returns {Object} The newly created task object with generated id and default status.
 */
export function addTask(task) {
  const newTask = {
    id: `task-${Date.now()}`,
    status: 'PENDING',
    assignedTo: 'Unassigned',
    ...task,
  };
  db.tasks.push(newTask);
  return newTask;
}

/**
 * Update an existing task by id. If the task is marked COMPLETED and all
 * sibling tasks sharing the same incidentId are also COMPLETED, the parent
 * incident is automatically closed.
 * @param {string} id - The unique identifier of the task to update.
 * @param {Object} updates - An object containing the fields to merge into the task.
 * @returns {Object|null} The updated task object, or null if not found.
 */
export function updateTask(id, updates) {
  const index = db.tasks.findIndex((t) => t.id === id);
  if (index !== -1) {
    db.tasks[index] = { ...db.tasks[index], ...updates };
    // Auto-update parent incident if completed
    if (updates.status === 'COMPLETED' && db.tasks[index].incidentId) {
      const incidentId = db.tasks[index].incidentId;
      const relatedTasks = db.tasks.filter((t) => t.incidentId === incidentId);
      const allCompleted = relatedTasks.every((t) => t.status === 'COMPLETED');
      if (allCompleted) {
        updateIncident(incidentId, { status: 'CLOSED' });
      }
    }
    return db.tasks[index];
  }
  return null;
}

/**
 * Retrieve the current sustainability state including global totals and per-user data.
 * @returns {Object} The sustainability state object.
 */
export function getSustainability() {
  return db.sustainability;
}

/**
 * Log an eco-friendly action for a fan, awarding points and CO₂ savings.
 * Creates the user record if it does not already exist.
 * @param {string} username - The unique username of the fan performing the action.
 * @param {string} actionId - The identifier of the eco action (matched against ECO_ACTIONS).
 * @returns {Object|null} An object with action details, user totals, and global totals, or null if actionId is invalid.
 */
export function logEcoAction(username, actionId) {
  const action = ECO_ACTIONS[actionId.toUpperCase()];
  if (!action) {
    return null;
  }

  // Update global aggregates
  db.sustainability.totalPoints += action.points;
  db.sustainability.totalCo2SavedKg = parseFloat((db.sustainability.totalCo2SavedKg + action.co2SavingKg).toFixed(2));

  // Update user specific records
  if (!db.sustainability.users[username]) {
    db.sustainability.users[username] = {
      username,
      points: 0,
      co2SavedKg: 0,
      history: [],
    };
  }

  const user = db.sustainability.users[username];
  user.points += action.points;
  user.co2SavedKg = parseFloat((user.co2SavedKg + action.co2SavingKg).toFixed(2));
  user.history.unshift({ actionId, timestamp: new Date().toISOString() });

  return {
    action,
    userPoints: user.points,
    userCo2SavedKg: user.co2SavedKg,
    global: {
      totalPoints: db.sustainability.totalPoints,
      totalCo2SavedKg: db.sustainability.totalCo2SavedKg,
    },
  };
}

/**
 * Retrieve the current live telemetry snapshot.
 * @returns {Object} The telemetry state object.
 */
export function getTelemetry() {
  return db.telemetry;
}

/**
 * Merge partial updates into the telemetry state.
 * @param {Object} updates - An object containing the telemetry fields to update.
 * @returns {Object} The merged telemetry state object.
 */
export function updateTelemetry(updates) {
  db.telemetry = { ...db.telemetry, ...updates };
  return db.telemetry;
}

/**
 * Reset database state to default. Useful for automated tests.
 */
export function resetDB() {
  db.incidents = [
    {
      id: 'inc-1',
      title: 'Water spill near Gate B entry ramp',
      description: 'Large puddle of water creating slipping hazard for incoming crowds.',
      category: 'Safety',
      severity: SEVERITY.MEDIUM,
      status: 'OPEN',
      location: 'Gate B',
      timestamp: new Date().toISOString(),
      reportedBy: 'Volunteer John',
      resolutionChecklist: ['Place wet sign', 'Dry mop puddle'],
    },
  ];
  db.tasks = [
    {
      id: 'task-1',
      title: 'Wet floor cleanup - Gate B',
      description: 'Apply dry mop.',
      status: 'PENDING',
      incidentId: 'inc-1',
      assignedTo: 'John Doe',
    },
  ];
  db.sustainability = {
    totalPoints: 100,
    totalCo2SavedKg: 5.0,
    users: {},
  };
  db.telemetry = {
    attendance: 50000,
    averageQueueTimeMins: 5.0,
    activeIncidentsCount: 1,
    transitDelayStatus: 'ON_TIME',
    crowdHeatmap: {
      'Gate A': 20,
      'Gate B': 40,
    },
  };
}

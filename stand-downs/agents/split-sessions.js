/**
 * Split agent-sessions.json by mission
 * Run: node stand-downs/agents/split-sessions.js
 */

const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, 'agent-sessions.json');
const data = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));

// Group sessions by mission
const missions = {};
data.sessions.forEach(session => {
  const mission = session.mission || 'unknown';
  if (!missions[mission]) {
    missions[mission] = [];
  }
  missions[mission].push(session);
});

// Group each mission's sessions by agent
Object.keys(missions).forEach(mission => {
  const agents = {};
  missions[mission].forEach(session => {
    const agentId = session.agentId || 'unknown';
    if (!agents[agentId]) {
      agents[agentId] = [];
    }
    agents[agentId].push(session);
  });

  // Write agent-specific files
  Object.keys(agents).forEach(agentId => {
    const missionDir = path.join(__dirname, mission);
    if (!fs.existsSync(missionDir)) {
      fs.mkdirSync(missionDir, { recursive: true });
    }
    
    const agentFile = path.join(missionDir, `${agentId}.json`);
    fs.writeFileSync(
      agentFile,
      JSON.stringify({ sessions: agents[agentId] }, null, 2)
    );
    console.log(`Created: ${agentFile}`);
  });
});

console.log('\nSplit complete!');
console.log(`Processed ${data.sessions.length} sessions across ${Object.keys(missions).length} missions`);

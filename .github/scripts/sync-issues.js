#!/usr/bin/env node
/**
 * Sync local issue files from .github/ISSUES/ to GitHub Issues
 * 
 * Issue file format:
 * ---
 * title: Issue Title
 * labels: label1,label2,label3
 * assignees: username (optional, leave empty if none)
 * milestone: milestone-name (optional)
 * ---
 * 
 * Issue body content here...
 */

const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');

const ISSUES_DIR = path.join(process.cwd(), '.github', 'ISSUES');
const REPO_OWNER = process.env.GITHUB_REPOSITORY_OWNER || 'stackdock';
const REPO_NAME = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'stackdock';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('❌ Error: GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

/**
 * Parse frontmatter from markdown file
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { metadata: {}, body: content };
  }
  
  const metadataStr = match[1];
  const body = match[2].trim();
  const metadata = {};
  
  // Parse YAML-like frontmatter
  metadataStr.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return; // Skip empty lines and comments
    
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) return;
    
    const key = trimmed.substring(0, colonIndex).trim();
    const value = trimmed.substring(colonIndex + 1).trim();
    
    // Handle arrays (labels, assignees)
    if (value.includes(',')) {
      metadata[key] = value.split(',').map(v => v.trim()).filter(v => v);
    } else if (value === '' || value === 'null' || value === 'undefined') {
      // Skip empty values
    } else {
      metadata[key] = value;
    }
  });
  
  return { metadata, body };
}

/**
 * Check if issue already exists
 */
async function issueExists(title) {
  try {
    const { data: issues } = await octokit.rest.issues.listForRepo({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      state: 'all', // Check both open and closed
      per_page: 100,
    });
    
    return issues.some(issue => issue.title === title);
  } catch (error) {
    console.error(`⚠️  Error checking existing issues: ${error.message}`);
    return false;
  }
}

/**
 * Get milestone number by name
 */
async function getMilestoneNumber(milestoneName) {
  if (!milestoneName) return undefined;
  
  try {
    const { data: milestones } = await octokit.rest.issues.listMilestonesForRepo({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      state: 'open',
    });
    
    const milestone = milestones.find(m => m.title === milestoneName);
    return milestone?.number;
  } catch (error) {
    console.warn(`⚠️  Warning: Could not find milestone "${milestoneName}"`);
    return undefined;
  }
}

/**
 * Create GitHub issue from file
 */
async function createIssue(filePath, metadata, body) {
  const title = metadata.title || path.basename(filePath, '.md');
  
  if (!title) {
    console.error(`❌ Error: No title found in ${filePath}`);
    return;
  }
  
  // Check if issue already exists
  if (await issueExists(title)) {
    console.log(`⏭️  Issue already exists: "${title}" - skipping`);
    return;
  }
  
  // Prepare labels (filter out empty values)
  const labels = Array.isArray(metadata.labels) 
    ? metadata.labels 
    : (metadata.labels ? [metadata.labels] : []);
  
  // Prepare assignees (filter out empty values)
  const assignees = Array.isArray(metadata.assignees)
    ? metadata.assignees.filter(a => a)
    : (metadata.assignees ? [metadata.assignees].filter(a => a) : []);
  
  // Get milestone number if provided
  const milestone = metadata.milestone 
    ? await getMilestoneNumber(metadata.milestone)
    : undefined;
  
  try {
    const issueData = {
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title,
      body,
    };
    
    if (labels.length > 0) {
      issueData.labels = labels;
    }
    
    if (assignees.length > 0) {
      issueData.assignees = assignees;
    }
    
    if (milestone) {
      issueData.milestone = milestone;
    }
    
    const { data: issue } = await octokit.rest.issues.create(issueData);
    
    console.log(`✅ Created issue #${issue.number}: "${title}"`);
    if (labels.length > 0) {
      console.log(`   Labels: ${labels.join(', ')}`);
    }
    if (milestone) {
      console.log(`   Milestone: ${metadata.milestone}`);
    }
    
    return issue;
  } catch (error) {
    console.error(`❌ Error creating issue "${title}": ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

/**
 * Main sync function
 */
async function syncIssues() {
  console.log('🚀 Starting issue sync...');
  console.log(`📁 Issues directory: ${ISSUES_DIR}`);
  console.log(`📦 Repository: ${REPO_OWNER}/${REPO_NAME}`);
  console.log('');
  
  if (!fs.existsSync(ISSUES_DIR)) {
    console.log(`📁 Issues directory not found: ${ISSUES_DIR}`);
    console.log('   Creating directory...');
    fs.mkdirSync(ISSUES_DIR, { recursive: true });
    console.log('   Directory created. Add issue files and run again.');
    return;
  }
  
  const files = fs.readdirSync(ISSUES_DIR)
    .filter(file => {
      // Only process .md files, but exclude documentation files
      if (!file.endsWith('.md')) return false;
      const lowerName = file.toLowerCase();
      // Exclude README, TESTING, and other common doc files
      if (lowerName === 'readme.md' || 
          lowerName === 'testing.md' || 
          lowerName.startsWith('readme') ||
          lowerName.startsWith('testing')) {
        return false;
      }
      return true;
    })
    .map(file => path.join(ISSUES_DIR, file));
  
  if (files.length === 0) {
    console.log('📝 No issue files found in .github/ISSUES/');
    return;
  }
  
  console.log(`📝 Found ${files.length} issue file(s)`);
  console.log('');
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const filePath of files) {
    const fileName = path.basename(filePath);
    console.log(`📄 Processing: ${fileName}`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const { metadata, body } = parseFrontmatter(content);
      
      if (!metadata.title && !body) {
        console.log(`   ⚠️  Skipping empty file`);
        skipped++;
        continue;
      }
      
      const issue = await createIssue(filePath, metadata, body);
      
      if (issue) {
        created++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`   ❌ Failed to process ${fileName}: ${error.message}`);
      errors++;
    }
    
    console.log(''); // Empty line between files
  }
  
  console.log('✨ Issue sync complete!');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  if (errors > 0) {
    console.log(`   ❌ Errors: ${errors}`);
  }
}

// Run sync
syncIssues().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

'use strict';

const fs = require('fs-extra');
const path = require('path');

/**
 * Import Question Topics from JSON file
 * 
 * Usage: npm run import:question-topics
 * 
 * JSON file format (data/question-topics.json):
 * [
 *   {
 *     "name": "Mathematics",
 *     "description": [
 *       {
 *         "type": "paragraph",
 *         "children": [{ "type": "text", "text": "Questions about math concepts" }]
 *       }
 *     ]
 *   },
 *   {
 *     "name": "Science",
 *     "description": [
 *       {
 *         "type": "paragraph",
 *         "children": [{ "type": "text", "text": "Questions about science topics" }]
 *       }
 *     ]
 *   }
 * ]
 * 
 * Or simplified format (description will be auto-converted):
 * [
 *   { "name": "Mathematics", "description": "Questions about math concepts" },
 *   { "name": "Science", "description": "Questions about science topics" }
 * ]
 */

const DEFAULT_DATA_FILE = path.join(__dirname, '..', 'data', 'question-topics.json');

async function createQuestionTopic(entry) {
  try {
    const result = await strapi.documents('api::question-topic.question-topic').create({
      data: {
        ...entry,
        publishedAt: Date.now(),
      },
    });
    console.log(`✓ Created question topic: "${entry.name}"`);
    return result;
  } catch (error) {
    console.error(`✗ Failed to create question topic: "${entry.name}"`);
    console.error(error.message);
    return null;
  }
}

async function checkExistingTopic(name) {
  const existing = await strapi.documents('api::question-topic.question-topic').findMany({
    filters: { name: { $eq: name } },
  });
  return existing.length > 0;
}

/**
 * Convert simple string description to blocks format
 */
function convertDescriptionToBlocks(description) {
  if (!description) return null;
  
  // If already in blocks format, return as-is
  if (Array.isArray(description)) {
    return description;
  }
  
  // Convert string to blocks format
  if (typeof description === 'string') {
    return [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: description }],
      },
    ];
  }
  
  return null;
}

async function importQuestionTopics(dataFile, options = {}) {
  const { skipExisting = true, dryRun = false } = options;
  
  // Check if data file exists
  if (!fs.existsSync(dataFile)) {
    console.error(`Data file not found: ${dataFile}`);
    console.log('\nPlease create a JSON file with the following format:');
    console.log(`
[
  { "name": "Topic Name", "description": "Topic description" },
  { "name": "Another Topic", "description": "Another description" }
]
    `);
    return { created: 0, skipped: 0, failed: 0 };
  }
  
  // Read and parse JSON file
  let topics;
  try {
    const fileContent = fs.readFileSync(dataFile, 'utf-8');
    topics = JSON.parse(fileContent);
  } catch (error) {
    console.error(`Failed to parse JSON file: ${error.message}`);
    return { created: 0, skipped: 0, failed: 0 };
  }
  
  if (!Array.isArray(topics)) {
    console.error('JSON file must contain an array of question topics');
    return { created: 0, skipped: 0, failed: 0 };
  }
  
  console.log(`\nFound ${topics.length} question topic(s) to import`);
  if (dryRun) {
    console.log('(Dry run mode - no changes will be made)\n');
  } else {
    console.log('');
  }
  
  let created = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const topic of topics) {
    // Validate required fields
    if (!topic.name) {
      console.error('✗ Skipping entry without name');
      failed++;
      continue;
    }
    
    // Check if topic already exists
    if (skipExisting) {
      const exists = await checkExistingTopic(topic.name);
      if (exists) {
        console.log(`⊘ Skipping existing topic: "${topic.name}"`);
        skipped++;
        continue;
      }
    }
    
    // Prepare entry with converted description
    const entry = {
      name: topic.name,
      description: convertDescriptionToBlocks(topic.description),
    };
    
    if (dryRun) {
      console.log(`○ Would create topic: "${entry.name}"`);
      created++;
    } else {
      const result = await createQuestionTopic(entry);
      if (result) {
        created++;
      } else {
        failed++;
      }
    }
  }
  
  return { created, skipped, failed };
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const dataFile = args.find((arg) => !arg.startsWith('--')) || DEFAULT_DATA_FILE;
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  
  console.log('='.repeat(50));
  console.log('Question Topics Import Script');
  console.log('='.repeat(50));
  console.log(`Data file: ${dataFile}`);
  
  // Initialize Strapi
  console.log('\nInitializing Strapi...');
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  app.log.level = 'error';
  
  try {
    const result = await importQuestionTopics(dataFile, {
      skipExisting: !force,
      dryRun,
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('Import Summary:');
    console.log(`  Created: ${result.created}`);
    console.log(`  Skipped: ${result.skipped}`);
    console.log(`  Failed:  ${result.failed}`);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('\nImport failed:', error.message);
    process.exit(1);
  } finally {
    await app.destroy();
  }
  
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});


'use strict';

const fs = require('fs-extra');
const path = require('path');

/**
 * Import Questions from JSON file
 * 
 * Usage: npm run import:questions
 * 
 * JSON file format (data/questions.json):
 * [
 *   {
 *     "code": "Q001",
 *     "question": "What is the capital of France?",
 *     "type": "single",
 *     "answers": [
 *       { "id": "A", "content": "London" },
 *       { "id": "B", "content": "Paris" },
 *       { "id": "C", "content": "Berlin" },
 *       { "id": "D", "content": "Madrid" }
 *     ],
 *     "correctAnswer": ["B"],
 *     "explanation": "Paris is the capital and largest city of France.",
 *     "difficulty": "easy",
 *     "source": "Geography Quiz",
 *     "version": 1,
 *     "topic": "Geography",
 *     "tags": ["Europe", "Capitals"]
 *   }
 * ]
 * 
 * Notes:
 * - "question" and "explanation" can be strings (auto-converted to blocks) or blocks format
 * - "topic" is the name of an existing question-topic
 * - "tags" is an array of existing question-tag names
 * - "type" can be: single, multiple, essay
 * - "difficulty" can be: easy, medium, hard
 */

const DEFAULT_DATA_FILE = path.join(__dirname, '..', 'data', 'questions.json');

// Cache for topics and tags lookups
let topicsCache = {};
let tagsCache = {};

/**
 * Convert simple string to blocks format
 */
function convertToBlocks(content) {
  if (!content) return null;
  
  // If already in blocks format, return as-is
  if (Array.isArray(content)) {
    return content;
  }
  
  // Convert string to blocks format
  if (typeof content === 'string') {
    return [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: content }],
      },
    ];
  }
  
  return null;
}

/**
 * Load all topics into cache
 */
async function loadTopicsCache() {
  const topics = await strapi.documents('api::question-topic.question-topic').findMany({
    status: 'published',
  });
  
  topicsCache = {};
  for (const topic of topics) {
    topicsCache[topic.name.toLowerCase()] = topic;
  }
  
  console.log(`Loaded ${Object.keys(topicsCache).length} topic(s) into cache`);
}

/**
 * Load all tags into cache
 */
async function loadTagsCache() {
  const tags = await strapi.documents('api::question-tag.question-tag').findMany({
    status: 'published',
  });
  
  tagsCache = {};
  for (const tag of tags) {
    tagsCache[tag.name.toLowerCase()] = tag;
  }
  
  console.log(`Loaded ${Object.keys(tagsCache).length} tag(s) into cache`);
}

/**
 * Find topic by name
 */
function findTopicByName(name) {
  if (!name) return null;
  return topicsCache[name.toLowerCase()] || null;
}

/**
 * Find tags by names
 */
function findTagsByNames(names) {
  if (!names || !Array.isArray(names)) return [];
  
  const foundTags = [];
  for (const name of names) {
    const tag = tagsCache[name.toLowerCase()];
    if (tag) {
      foundTags.push(tag);
    }
  }
  return foundTags;
}

/**
 * Check if question with code already exists
 */
async function checkExistingQuestion(code) {
  if (!code) return false;
  
  const existing = await strapi.documents('api::question.question').findMany({
    filters: { code: { $eq: code } },
  });
  return existing.length > 0;
}

/**
 * Generate a unique code if not provided
 */
function generateCode(index) {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `Q-${timestamp}-${random}-${index}`;
}

async function createQuestion(entry) {
  try {
    const result = await strapi.documents('api::question.question').create({
      data: {
        ...entry,
        publishedAt: Date.now(),
      },
    });
    console.log(`✓ Created question: "${entry.code}"`);
    return result;
  } catch (error) {
    console.error(`✗ Failed to create question: "${entry.code}"`);
    console.error(error.message);
    return null;
  }
}

async function importQuestions(dataFile, options = {}) {
  const { skipExisting = true, dryRun = false } = options;
  
  // Check if data file exists
  if (!fs.existsSync(dataFile)) {
    console.error(`Data file not found: ${dataFile}`);
    console.log('\nPlease create a JSON file with the question format.');
    return { created: 0, skipped: 0, failed: 0 };
  }
  
  // Read and parse JSON file
  let questions;
  try {
    const fileContent = fs.readFileSync(dataFile, 'utf-8');
    questions = JSON.parse(fileContent);
  } catch (error) {
    console.error(`Failed to parse JSON file: ${error.message}`);
    return { created: 0, skipped: 0, failed: 0 };
  }
  
  if (!Array.isArray(questions)) {
    console.error('JSON file must contain an array of questions');
    return { created: 0, skipped: 0, failed: 0 };
  }
  
  // Load caches
  await loadTopicsCache();
  await loadTagsCache();
  
  console.log(`\nFound ${questions.length} question(s) to import`);
  if (dryRun) {
    console.log('(Dry run mode - no changes will be made)\n');
  } else {
    console.log('');
  }
  
  let created = 0;
  let skipped = 0;
  let failed = 0;
  const missingTopics = new Set();
  const missingTags = new Set();
  
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    
    // Generate code if not provided
    const code = q.code || generateCode(i);
    
    // Validate required fields
    if (!q.question) {
      console.error(`✗ Skipping question at index ${i}: missing question text`);
      failed++;
      continue;
    }
    
    if (!q.answers || !Array.isArray(q.answers) || q.answers.length === 0) {
      console.error(`✗ Skipping question "${code}": missing or invalid answers`);
      failed++;
      continue;
    }
    
    if (!q.correctAnswer || !Array.isArray(q.correctAnswer) || q.correctAnswer.length === 0) {
      console.error(`✗ Skipping question "${code}": missing or invalid correctAnswer`);
      failed++;
      continue;
    }
    
    // Check if question already exists
    if (skipExisting && q.code) {
      const exists = await checkExistingQuestion(q.code);
      if (exists) {
        console.log(`⊘ Skipping existing question: "${code}"`);
        skipped++;
        continue;
      }
    }
    
    // Find topic
    let topicId = null;
    if (q.topic) {
      const topic = findTopicByName(q.topic);
      if (topic) {
        topicId = topic.documentId;
      } else {
        missingTopics.add(q.topic);
      }
    }
    
    // Find tags
    let tagIds = [];
    if (q.tags && Array.isArray(q.tags)) {
      const tags = findTagsByNames(q.tags);
      tagIds = tags.map((t) => t.documentId);
      
      // Track missing tags
      for (const tagName of q.tags) {
        if (!tagsCache[tagName.toLowerCase()]) {
          missingTags.add(tagName);
        }
      }
    }
    
    // Prepare entry
    const entry = {
      code: code,
      question: convertToBlocks(q.question),
      type: q.type || 'single',
      answers: q.answers,
      correctAnswer: q.correctAnswer,
      explanation: convertToBlocks(q.explanation),
      difficulty: q.difficulty || 'easy',
      source: q.source || null,
      version: q.version || 1,
      question_topic: topicId,
      question_tags: tagIds,
    };
    
    if (dryRun) {
      console.log(`○ Would create question: "${code}" (topic: ${q.topic || 'none'}, tags: ${q.tags?.join(', ') || 'none'})`);
      created++;
    } else {
      const result = await createQuestion(entry);
      if (result) {
        created++;
      } else {
        failed++;
      }
    }
  }
  
  // Report missing topics and tags
  if (missingTopics.size > 0) {
    console.log(`\n⚠ Missing topics (not linked): ${Array.from(missingTopics).join(', ')}`);
  }
  if (missingTags.size > 0) {
    console.log(`⚠ Missing tags (not linked): ${Array.from(missingTags).join(', ')}`);
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
  console.log('Questions Import Script');
  console.log('='.repeat(50));
  console.log(`Data file: ${dataFile}`);
  
  // Initialize Strapi
  console.log('\nInitializing Strapi...');
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  app.log.level = 'error';
  
  try {
    const result = await importQuestions(dataFile, {
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



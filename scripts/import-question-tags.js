'use strict';

const fs = require('fs-extra');
const path = require('path');

/**
 * Import Question Tags from JSON file
 * 
 * Usage: npm run import:question-tags
 * 
 * JSON file format (data/question-tags.json):
 * [
 *   { "name": "Easy" },
 *   { "name": "Medium" },
 *   { "name": "Hard" },
 *   { "name": "Beginner Friendly", "slug": "beginner-friendly" }
 * ]
 * 
 * Note: If slug is not provided, it will be auto-generated from the name
 */

const DEFAULT_DATA_FILE = path.join(__dirname, '..', 'data', 'question-tags.json');

/**
 * Generate a slug from a string
 */
function generateSlug(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function createQuestionTag(entry) {
  try {
    const result = await strapi.documents('api::question-tag.question-tag').create({
      data: {
        ...entry,
        publishedAt: Date.now(),
      },
    });
    console.log(`✓ Created question tag: "${entry.name}" (slug: ${entry.slug})`);
    return result;
  } catch (error) {
    console.error(`✗ Failed to create question tag: "${entry.name}"`);
    console.error(error.message);
    return null;
  }
}

async function checkExistingTag(name, slug) {
  const existingByName = await strapi.documents('api::question-tag.question-tag').findMany({
    filters: { name: { $eq: name } },
  });
  
  const existingBySlug = await strapi.documents('api::question-tag.question-tag').findMany({
    filters: { slug: { $eq: slug } },
  });
  
  return existingByName.length > 0 || existingBySlug.length > 0;
}

async function importQuestionTags(dataFile, options = {}) {
  const { skipExisting = true, dryRun = false } = options;
  
  // Check if data file exists
  if (!fs.existsSync(dataFile)) {
    console.error(`Data file not found: ${dataFile}`);
    console.log('\nPlease create a JSON file with the following format:');
    console.log(`
[
  { "name": "Tag Name" },
  { "name": "Another Tag", "slug": "custom-slug" }
]
    `);
    return { created: 0, skipped: 0, failed: 0 };
  }
  
  // Read and parse JSON file
  let tags;
  try {
    const fileContent = fs.readFileSync(dataFile, 'utf-8');
    tags = JSON.parse(fileContent);
  } catch (error) {
    console.error(`Failed to parse JSON file: ${error.message}`);
    return { created: 0, skipped: 0, failed: 0 };
  }
  
  if (!Array.isArray(tags)) {
    console.error('JSON file must contain an array of question tags');
    return { created: 0, skipped: 0, failed: 0 };
  }
  
  console.log(`\nFound ${tags.length} question tag(s) to import`);
  if (dryRun) {
    console.log('(Dry run mode - no changes will be made)\n');
  } else {
    console.log('');
  }
  
  let created = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const tag of tags) {
    // Validate required fields
    if (!tag.name) {
      console.error('✗ Skipping entry without name');
      failed++;
      continue;
    }
    
    // Generate slug if not provided
    const slug = tag.slug || generateSlug(tag.name);
    
    // Check if tag already exists
    if (skipExisting) {
      const exists = await checkExistingTag(tag.name, slug);
      if (exists) {
        console.log(`⊘ Skipping existing tag: "${tag.name}"`);
        skipped++;
        continue;
      }
    }
    
    // Prepare entry
    const entry = {
      name: tag.name,
      slug: slug,
    };
    
    if (dryRun) {
      console.log(`○ Would create tag: "${entry.name}" (slug: ${entry.slug})`);
      created++;
    } else {
      const result = await createQuestionTag(entry);
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
  console.log('Question Tags Import Script');
  console.log('='.repeat(50));
  console.log(`Data file: ${dataFile}`);
  
  // Initialize Strapi
  console.log('\nInitializing Strapi...');
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  app.log.level = 'error';
  
  try {
    const result = await importQuestionTags(dataFile, {
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



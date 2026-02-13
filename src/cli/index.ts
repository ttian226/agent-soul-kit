#!/usr/bin/env node
import { Command } from 'commander';
import { createNewSoul } from './commands/new.js';
import { addReflection } from './commands/reflect.js';
import { distillDiary } from './commands/distill.js';
import { showStatus } from './commands/status.js';
import { searchMemory } from './commands/search.js';
import { showVibes, captureVibe, showResonance } from './commands/vibe.js';

const program = new Command();

program
  .name('soul')
  .description('CLI to manage an Agent Soul Kit')
  .version('0.2.0');

program
  .command('new <directory>')
  .description('Initialize a new soul in the specified directory')
  .action(createNewSoul);

program
  .command('reflect <message>')
  .description('Add a new reflection to the mind diary')
  .action(addReflection);

program
  .command('distill')
  .description('Review recent diary entries to distill into long-term memory')
  .action(distillDiary);

program
  .command('status')
  .description('Show a dashboard of the soul\'s current state')
  .action(showStatus);

program
  .command('search <query>')
  .description('Search across memory layers')
  .option('-l, --layer <layers>', 'Comma-separated layers to search (L1,L2,L3)')
  .option('-n, --limit <number>', 'Maximum results (default: 10)')
  .action(searchMemory);

// Vibe subcommands
const vibeCmd = program
  .command('vibe')
  .description('Manage emotional snapshots');

vibeCmd
  .command('list', { isDefault: true })
  .description('Show recent vibes')
  .action(showVibes);

vibeCmd
  .command('capture <emoji> <summary>')
  .description('Capture a new vibe snapshot')
  .option('-t, --trigger <trigger>', 'What triggered this feeling')
  .action(captureVibe);

vibeCmd
  .command('resonance')
  .description('Show emotional resonance summary')
  .action(showResonance);

program.parse(process.argv);

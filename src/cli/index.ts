#!/usr/bin/env node
import { Command } from 'commander';
import { createNewSoul } from './commands/new.js';
import { addReflection } from './commands/reflect.js';
import { distillDiary } from './commands/distill.js';

const program = new Command();

program
  .name('soul')
  .description('CLI to manage an Agent Soul Kit')
  .version('0.1.0');

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

program.parse(process.argv);

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';

async function findLatestDiary(diaryPath: string): Promise<string | null> {
  try {
    const files = await fs.readdir(diaryPath);
    const diaryFiles = files
      .filter(file => file.endsWith('.md'))
      .sort()
      .reverse();
    
    return diaryFiles.length > 0 ? path.join(diaryPath, diaryFiles[0]) : null;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null; // Directory doesn't exist, which is fine.
    }
    throw error;
  }
}

export async function distillDiary(): Promise<void> {
  const soulPath = path.resolve('.');
  const diaryPath = path.join(soulPath, 'memory', 'mind_diary');
  const memoryFile = path.join(soulPath, 'MEMORY.md');

  console.log(chalk.magenta('🔎 Looking for recent thoughts to distill...'));

  try {
    const latestDiaryFile = await findLatestDiary(diaryPath);

    if (!latestDiaryFile) {
      console.log(chalk.yellow('No mind diary entries found. Nothing to distill yet.'));
      return;
    }

    console.log(chalk.cyan(`\n---  Distilling from ${chalk.bold(path.basename(latestDiaryFile))} ---\n`));
    const content = await fs.readFile(latestDiaryFile, 'utf-8');
    const entries = content.split('---').filter(entry => entry.trim().length > 0).map(e => e.trim());

    if (entries.length === 0) {
        console.log(chalk.yellow('Diary is empty. Nothing to distill.'));
        return;
    }

    const { selectedEntries } = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'selectedEntries',
            message: 'Select the insights worth remembering. They will be appended to MEMORY.md.\n',
            choices: entries.map(entry => ({ name: entry.substring(0, 100) + '...', value: entry })),
        }
    ]);

    if (selectedEntries && selectedEntries.length > 0) {
        console.log(chalk.blue(`\n✍️  Appending ${selectedEntries.length} insights to MEMORY.md...`));
        const contentToAppend = selectedEntries.map(entry => `\n---\n${entry}\n`).join('');
        await fs.appendFile(memoryFile, contentToAppend);
        console.log(chalk.green('✅ Insights successfully added to your long-term memory!'));
    } else {
        console.log(chalk.yellow('No insights selected. Your memory remains unchanged.'));
    }

  } catch (error) {
    console.error(chalk.red('❌ Failed to distill diary:'), error);
    process.exit(1);
  }
}

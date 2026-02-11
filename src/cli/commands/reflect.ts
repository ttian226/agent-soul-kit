import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

function getTodaysDate(): string {
  // Simple YYYY-MM-DD format in UTC
  const today = new Date();
  const year = today.getUTCFullYear();
  const month = (today.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = today.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function addReflection(message: string): Promise<void> {
  const soulPath = path.resolve('.'); // Assumes CLI is run from the soul's root directory
  const diaryPath = path.join(soulPath, 'memory', 'mind_diary');
  const today = getTodaysDate();
  const diaryFile = path.join(diaryPath, `${today}.md`);

  console.log(chalk.blue(`✍️  Adding reflection to ${chalk.bold(diaryFile)}...`));

  try {
    // Ensure the directory exists
    await fs.mkdir(diaryPath, { recursive: true });

    // Prepare the content to append
    const timestamp = new Date().toISOString();
    const content = `\n---\n*${timestamp}*\n\n${message}\n`;

    // Append to the file, creating it if it doesn't exist
    await fs.appendFile(diaryFile, content);

    console.log(chalk.green('✅ Reflection added successfully!'));
  } catch (error) {
    console.error(chalk.red('❌ Failed to add reflection:'), error);
    process.exit(1);
  }
}

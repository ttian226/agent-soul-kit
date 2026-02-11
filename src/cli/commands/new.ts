import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

export async function createNewSoul(directory: string): Promise<void> {
  const rootPath = path.resolve(directory);
  console.log(chalk.yellow(`✨ Initializing a new soul at ${chalk.bold(rootPath)}...`));

  try {
    // Create base directories
    await fs.mkdir(rootPath, { recursive: true });
    await fs.mkdir(path.join(rootPath, 'memory', 'mind_diary'), { recursive: true });
    await fs.mkdir(path.join(rootPath, 'coordination'), { recursive: true });

    // Create core files
    const memoryMd = `# MEMORY.md - Your Agent's Long-Term Memory\n\nThis is where the distilled wisdom of your agent will live.`;
    await fs.writeFile(path.join(rootPath, 'MEMORY.md'), memoryMd);

    const soulMd = `# SOUL.md - Your Agent's Core Identity\n\nDefine your agent's personality and core principles here.`;
    await fs.writeFile(path.join(rootPath, 'SOUL.md'), soulMd);
    
    console.log(chalk.green('✅ Soul initialized successfully!'));
    console.log(chalk.cyan('Next steps: Edit SOUL.md and MEMORY.md to define your agent.'));

  } catch (error) {
    console.error(chalk.red('❌ Failed to initialize soul:'), error);
    process.exit(1);
  }
}

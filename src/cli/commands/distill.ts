import fs from 'fs/promises';
import path from 'path';

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

  console.log(`🔎 Looking for recent thoughts to distill...`);

  try {
    const latestDiaryFile = await findLatestDiary(diaryPath);

    if (!latestDiaryFile) {
      console.log('No mind diary entries found. Nothing to distill yet.');
      return;
    }

    console.log(`\n---  distilling from ${path.basename(latestDiaryFile)} ---\n`);
    const content = await fs.readFile(latestDiaryFile, 'utf-8');
    const entries = content.split('---').filter(entry => entry.trim().length > 0);

    if (entries.length === 0) {
        console.log('Diary is empty. Nothing to distill.');
        return;
    }

    console.log('Here are the recent entries. Which ones are worth remembering?\n');
    entries.forEach((entry, index) => {
      console.log(`[ Entry ${index + 1} ]`);
      console.log(entry.trim());
      console.log('\n-------------------\n');
    });

    console.log(`To add an insight to your long-term MEMORY.md, edit the file manually.`);

  } catch (error) {
    console.error('❌ Failed to distill diary:', error);
    process.exit(1);
  }
}

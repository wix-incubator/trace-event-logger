import { existsSync } from 'node:fs';
import tempy from 'tempy';
import { writeFile, unlink } from 'node:fs/promises';

import { describe, beforeEach, afterEach, it, expect } from '@jest/globals';

import { traceMerge } from './index';

describe('traceMerge', () => {
  let temporaryFilePaths: string[];

  beforeEach(() => {
    temporaryFilePaths = [];
  });

  afterEach(async () => {
    await Promise.all(
      temporaryFilePaths.map(async (filePath) => {
        if (filePath && existsSync(filePath)) {
          await unlink(filePath);
        }
      }),
    );
  });

  it('should emit events in order', async () => {
    const file1 = tempy.file();
    const file2 = tempy.file();
    temporaryFilePaths.push(file1, file2);
    await writeFile(file1, JSON.stringify([{ ts: 2 }, { ts: 3 }]));
    await writeFile(file2, JSON.stringify([{ ts: 1 }, { ts: 4 }]));

    const chunks: unknown[] = [];
    for await (const chunk of traceMerge([file1, file2])) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual([{ ts: 1 }, { ts: 2 }, { ts: 3 }, { ts: 4 }]);
  });
});

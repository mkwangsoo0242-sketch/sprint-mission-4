#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function walkDir(dir, cb) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const res = path.resolve(dir, f.name);
    if (f.isDirectory()) {
      walkDir(res, cb);
    } else {
      cb(res);
    }
  }
}

function removeZoneFiles(startDir = process.cwd()) {
  let removed = 0;
  walkDir(startDir, (filePath) => {
    if (filePath.includes('Zone.Identifier')) {
      try {
        fs.unlinkSync(filePath);
        console.log('Removed:', filePath);
        removed++;
      } catch (e) {
        console.error('Could not remove', filePath, e.message);
      }
    }
  });
  if (removed === 0) {
    console.log('No Zone.Identifier files found.');
  } else {
    console.log(`Removed ${removed} Zone.Identifier file(s).`);
  }
}

if (require.main === module) {
  removeZoneFiles();
}

module.exports = { removeZoneFiles };

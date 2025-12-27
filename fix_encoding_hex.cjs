/**
 * Fix encoding issues in main.js using hex patterns
 */
const fs = require('fs');

let content = fs.readFileSync('main.js', 'utf8');
const originalLength = content.length;

// Fix common mojibake patterns for Portuguese (more comprehensive)
const fixes = [
    // Multi-char patterns first
    [/\u00C3\u0087\u00C3\u0083O/g, 'CAO'],  // ÇÃO
    [/\u00C3\u0087\u00C3\u0192O/g, 'CAO'],  // ÇÃO variant
    [/\u00C3\u00A7\u00C3\u00B5es/g, 'coes'],
    [/\u00C3\u00A7\u00C3\u00A3o/g, 'cao'],
    [/\u00C3\u00A7\u00C3\u00A3/g, 'ca'],
    [/\u00C3\u0089/g, 'E'],  // É
    [/\u00C3\u0093/g, 'O'],  // Ó
    [/\u00C3\u0094/g, 'O'],  // Ô
    [/\u00C3\u009A/g, 'U'],  // Ú
    [/\u00C3\u0192/g, 'A'],  // Ã
    [/\u00C3\u0087/g, 'C'],  // Ç
    [/\u00C3\u00A7/g, 'c'],
    [/\u00C3\u00B5es/g, 'oes'],
    [/\u00C3\u00B5/g, 'o'],
    [/\u00C3\u00A3o/g, 'ao'],
    [/\u00C3\u00A3/g, 'a'],
    [/\u00C3\u00A9/g, 'e'],
    [/\u00C3\u00AD/g, 'i'],
    [/\u00C3\u00B3/g, 'o'],
    [/\u00C3\u00BA/g, 'u'],
    [/\u00C3\u00A1/g, 'a'],
    [/\u00C3\u00A2/g, 'a'],
    [/\u00C3\u00AA/g, 'e'],
    [/\u00C3\u00B4/g, 'o'],
    [/\u00C3\u0083/g, 'A'],
    [/\u00C3\u0080/g, 'A'],
    // Broken checkmarks/warns
    [/\u00E2\u009C\u0085/g, '[OK]'],
    [/\u00E2\u009A[\u0080-\u00FF]?/g, '[WARN]'],
    [/\u00E2\u009D\u008C/g, '[ERROR]'],
    [/\u00E2\u0084\u00B9/g, '[INFO]'],
    [/\u00E2\u00B1\u008F/g, '[TIMER]'],
    [/\u00EF\u00B8[\u0080-\u00FF]/g, ''],  // variation selector
    // Broken emojis: just remove the entire pattern
    [/\u00F0\u0178[\u0080-\u00FF][\u0080-\u00FF]?/g, ''],
    [/\u00F0\u0178/g, ''],
    [/\u00C3\u00B0\u00C5\u00B8/g, ''],
    // Specific broken sequences
    [/Ã"/g, 'O'],
    [/Ã‰/g, 'E'],
    [/ÃƒO/g, 'AO'],
    [/Ãš/g, 'U'],
];

for (const [pattern, replacement] of fixes) {
    content = content.replace(pattern, replacement);
}

// Remove remaining broken emoji sequences (aggressive cleanup)
// Pattern: ðŸ followed by characters
content = content.replace(/ðŸ[\u0080-\u00FF][\u0080-\u00FF]?/g, '');
content = content.replace(/ðŸ/g, '');

fs.writeFileSync('main.js', content, 'utf8');

console.log('Encoding fixes applied (round 2).');
console.log('Original:', originalLength, 'bytes');
console.log('New:', content.length, 'bytes');
console.log('Saved:', originalLength - content.length, 'bytes');

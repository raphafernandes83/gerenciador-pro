/**
 * Fix encoding issues in main.js
 * Converts mojibake patterns to ASCII equivalents
 */
const fs = require('fs');

// Read file
let content = fs.readFileSync('main.js', 'utf8');
const originalLength = content.length;

// Mapping of broken emoji patterns to ASCII
const emojiFixes = {
    'ðŸ"§': '[CONFIG]',
    'ðŸ›¡ï¸': '[SHIELD]',
    'ðŸ›¡': '[SHIELD]',
    'ðŸ"': '[SEARCH]',
    'ðŸš€': '[START]',
    'ðŸ­': '[FACTORY]',
    'ðŸ"¦': '[PACKAGE]',
    'ðŸ—„ï¸': '[DB]',
    'ðŸ—„': '[DB]',
    'ðŸ"Š': '[STATS]',
    'ðŸŽ®': '[GAME]',
    'ðŸŽ¯': '[TARGET]',
    'ðŸ'¥': '[CRASH]',
    'ðŸ'¤': '[USER]',
    'ðŸŒ': '[NET]',
    'ðŸ"„': '[SYNC]',
    'ðŸ†•': '[NEW]',
    'ðŸ—': '[KEY]',
    'ðŸ"‹': '[CLIP]',
    'ðŸŽ¨': '[ART]',
    'ðŸŽ‰': '[DONE]',
    'ðŸ"ˆ': '[CHART]',
    'ðŸ§ª': '[TEST]',
    'ðŸ§¹': '[CLEAN]',
    'ðŸ"±': '[MOBILE]',
    'ðŸš¨': '[ALERT]',
    'âœ…': '[OK]',
    'âŒ': '[ERROR]',
    'âš ï¸': '[WARN]',
    'âš ': '[WARN]',
    'â„¹ï¸': '[INFO]',
    'â„¹': '[INFO]',
    'â±ï¸': '[TIMER]',
    'ï¸': '',
};

// Mapping of mojibake to ASCII
const mojibakeFixes = {
    'Ã§Ã£o': 'cao',
    'Ã§Ãµes': 'coes',
    'Ã§Ã£': 'ca',
    'Ã§Ã¡': 'ca',
    'Ã§Ã¢': 'ca',
    'Ã§': 'c',
    'Ã£o': 'ao',
    'Ã£': 'a',
    'Ãµes': 'oes',
    'Ãµ': 'o',
    'Ã©': 'e',
    'Ã­': 'i',
    'Ã³': 'o',
    'Ãº': 'u',
    'Ã¡': 'a',
    'Ã¢': 'a',
    'Ãª': 'e',
    'Ã´': 'o',
    'Ã¼': 'u',
    'Ãƒ': 'A',
    'Ã': 'A',
};

// Apply emoji fixes
for (const [pattern, replacement] of Object.entries(emojiFixes)) {
    content = content.split(pattern).join(replacement);
}

// Apply mojibake fixes
for (const [pattern, replacement] of Object.entries(mojibakeFixes)) {
    content = content.split(pattern).join(replacement);
}

// Write file
fs.writeFileSync('main.js', content, 'utf8');

console.log('Encoding fixes applied.');
console.log('Original size:', originalLength);
console.log('New size:', content.length);
console.log('Difference:', originalLength - content.length, 'bytes');

#!/usr/bin/env python3
"""
Fix encoding issues in main.js
Converts mojibake patterns to ASCII equivalents
"""
import re

# Read file
with open('main.js', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

original_content = content

# Mapping of broken emoji patterns to ASCII
emoji_fixes = {
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
    'ï¸': '',  # variation selector
}

# Mapping of mojibake to ASCII
mojibake_fixes = {
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
}

# Apply emoji fixes
for pattern, replacement in emoji_fixes.items():
    content = content.replace(pattern, replacement)

# Apply mojibake fixes
for pattern, replacement in mojibake_fixes.items():
    content = content.replace(pattern, replacement)

# Write file
with open('main.js', 'w', encoding='utf-8') as f:
    f.write(content)

# Count changes
changes = len(original_content) - len(content)
print(f"Encoding fixes applied. Size change: {changes} bytes")

import re

# Le o arquivo
with open('charts.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Define o padrão antigo (escapado corretamente)
old_pattern = r'''
// 🆕 CHECKPOINT 2\.2c: Helper para DOMManager
const domHelper = \{
    add\(el, \.\.\.c\) \{ if\(window\.domManager\) return window\.domManager\.addClass\(el,\.\.\.c\); if\(typeof el==='string'\)el=document\.querySelector\(el\); el\?\.classList\.add\(\.\.\.c\); return!!el; \},
    remove\(el, \.\.\.c\) \{ if\(window\.domManager\) return window\.domManager\.removeClass\(el,\.\.\.c\); if\(typeof el==='string'\)el=document\.querySelector\(el\); el\?\.classList\.remove\(\.\.\.c\); return!!el; \}
\};'''

# Define o padrão novo
new_text = '''
// 🆕 CHECKPOINT 2.2c: Helper de transição para DOMManager (CONSOLIDADO)
// Importa domHelper centralizado (anteriormente duplicado em 3 arquivos)
import { domHelper } from './src/dom-helper.js';'''

# Faz a substituição
content_new = re.sub(old_pattern, new_text, content)

# Salva o arquivo
with open('charts.js', 'w', encoding='utf-8') as f:
    f.write(content_new)

print("Substituição concluída!")

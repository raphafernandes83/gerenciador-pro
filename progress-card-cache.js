/**
 * 🗄️ Progress Card Cache - Ponte para o módulo de cache
 * 
 * Este arquivo faz a ponte entre as referências antigas e o novo sistema modular.
 * Importa e re-exporta as funcionalidades do módulo de cache.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0 - Bridge Module
 */

// Importa o cache do módulo principal
import progressCardCache from './progress-card/utils/cache.js';

// Re-exporta o cache como default
export default progressCardCache;

// Exposição global para compatibilidade com código legado
if (typeof window !== 'undefined') {
    window.progressCardCache = progressCardCache;
    
    console.log('🗄️ Progress Card Cache Bridge carregado com sucesso');
}









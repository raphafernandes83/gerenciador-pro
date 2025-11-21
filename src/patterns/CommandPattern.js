/**
 * 🎯 COMMAND PATTERN PARA UI
 * Elimina complexidade ciclomática através de comandos compostos
 *
 * @module CommandPattern
 * @author Sistema de Qualidade Avançada
 * @version 3.0.0
 */

/**
 * Interface base para comandos
 */
export class UICommand {
    constructor(name, description) {
        this.name = name;
        this.description = description;
        this.timestamp = null;
        this.executionTime = null;
        this.success = null;
        this.result = null;
        this.error = null;
    }

    /**
     * Executa o comando
     * @abstract
     */
    async execute() {
        throw new Error('execute() deve ser implementado pela subclasse');
    }

    /**
     * Desfaz o comando (se suportado)
     * @abstract
     */
    async undo() {
        throw new Error('undo() deve ser implementado pela subclasse');
    }

    /**
     * Valida se comando pode ser executado
     */
    canExecute() {
        return true;
    }

    /**
     * Obtém metadados do comando
     */
    getMetadata() {
        return {
            name: this.name,
            description: this.description,
            timestamp: this.timestamp,
            executionTime: this.executionTime,
            success: this.success,
        };
    }
}

/**
 * Comando para sincronização de campo específico
 */
export class SyncFieldCommand extends UICommand {
    constructor(fieldConfig, value, domElement) {
        super(`SyncField_${fieldConfig.id}`, `Sincroniza campo ${fieldConfig.description}`);
        this.fieldConfig = fieldConfig;
        this.value = value;
        this.domElement = domElement;
        this.previousValue = null;
    }

    async execute() {
        const start = performance.now();
        this.timestamp = new Date().toISOString();

        try {
            if (!this.canExecute()) {
                throw new Error(`Comando ${this.name} não pode ser executado`);
            }

            // Armazena valor anterior para undo
            this.previousValue = this._getCurrentValue();

            // Executa sincronização específica por tipo
            await this._executeSyncByType();

            this.success = true;
            this.result = { synced: true, value: this.value };
        } catch (error) {
            this.success = false;
            this.error = error;
            throw error;
        } finally {
            this.executionTime = performance.now() - start;
        }

        return this.result;
    }

    async undo() {
        if (this.previousValue !== null) {
            const undoValue = this.previousValue;
            this.value = undoValue;
            await this._executeSyncByType();
            return { undone: true, restoredValue: undoValue };
        }
        return { undone: false, reason: 'Valor anterior não disponível' };
    }

    canExecute() {
        return (
            this.domElement && this.fieldConfig && this.value !== undefined && this.value !== null
        );
    }

    _getCurrentValue() {
        switch (this.fieldConfig.type) {
            case 'input_value':
            case 'select_value':
                return this.domElement.value;
            case 'checkbox_checked':
                return this.domElement.checked;
            case 'text_content':
                return this.domElement.textContent;
            default:
                return null;
        }
    }

    async _executeSyncByType() {
        switch (this.fieldConfig.type) {
            case 'input_value':
            case 'select_value':
                this.domElement.value = this.value;
                break;
            case 'checkbox_checked':
                this.domElement.checked = Boolean(this.value);
                break;
            case 'text_content':
                this.domElement.textContent = String(this.value);
                break;
            default:
                throw new Error(`Tipo de sincronização não suportado: ${this.fieldConfig.type}`);
        }
    }
}

/**
 * Comando composto para múltiplas operações
 */
export class CompositeCommand extends UICommand {
    constructor(name, description, commands = []) {
        super(name, description);
        this.commands = commands;
        this.executedCommands = [];
        this.failedAt = -1;
    }

    addCommand(command) {
        this.commands.push(command);
        return this;
    }

    async execute() {
        const start = performance.now();
        this.timestamp = new Date().toISOString();
        this.executedCommands = [];
        this.failedAt = -1;

        try {
            const results = [];

            for (let i = 0; i < this.commands.length; i++) {
                const command = this.commands[i];

                if (!command.canExecute()) {
                    console.warn(`Comando ${command.name} pulado: não pode ser executado`);
                    continue;
                }

                try {
                    const result = await command.execute();
                    this.executedCommands.push(command);
                    results.push({ command: command.name, success: true, result });
                } catch (error) {
                    this.failedAt = i;
                    results.push({ command: command.name, success: false, error });

                    // Rollback automático dos comandos executados
                    await this._rollbackExecuted();

                    throw new Error(`Falha no comando ${command.name}: ${error.message}`);
                }
            }

            this.success = true;
            this.result = {
                executed: this.executedCommands.length,
                total: this.commands.length,
                results,
            };
        } catch (error) {
            this.success = false;
            this.error = error;
            throw error;
        } finally {
            this.executionTime = performance.now() - start;
        }

        return this.result;
    }

    async undo() {
        const results = [];

        // Desfaz em ordem reversa
        for (let i = this.executedCommands.length - 1; i >= 0; i--) {
            const command = this.executedCommands[i];

            try {
                const result = await command.undo();
                results.push({ command: command.name, undone: true, result });
            } catch (error) {
                results.push({ command: command.name, undone: false, error });
            }
        }

        return { undone: true, results };
    }

    async _rollbackExecuted() {
        console.warn(`Iniciando rollback de ${this.executedCommands.length} comandos...`);

        for (let i = this.executedCommands.length - 1; i >= 0; i--) {
            try {
                await this.executedCommands[i].undo();
            } catch (error) {
                console.error(
                    `Erro no rollback do comando ${this.executedCommands[i].name}:`,
                    error
                );
            }
        }
    }
}

/**
 * Comando para operações DOM com batching automático
 */
export class BatchedDOMCommand extends UICommand {
    constructor(name, description, operations = []) {
        super(name, description);
        this.readOperations = [];
        this.writeOperations = [];
        this.results = [];

        operations.forEach((op) => this.addOperation(op));
    }

    addOperation(operation) {
        if (operation.type === 'read') {
            this.readOperations.push(operation);
        } else if (operation.type === 'write') {
            this.writeOperations.push(operation);
        }
        return this;
    }

    async execute() {
        const start = performance.now();
        this.timestamp = new Date().toISOString();

        try {
            // Executa todas as leituras primeiro
            const readResults = await Promise.all(
                this.readOperations.map((op) => this._executeRead(op))
            );

            // Agenda todas as escritas para próximo frame
            const writeResults = await new Promise((resolve) => {
                requestAnimationFrame(async () => {
                    const results = await Promise.all(
                        this.writeOperations.map((op) => this._executeWrite(op))
                    );
                    resolve(results);
                });
            });

            this.success = true;
            this.result = {
                reads: readResults.length,
                writes: writeResults.length,
                readResults,
                writeResults,
            };
        } catch (error) {
            this.success = false;
            this.error = error;
            throw error;
        } finally {
            this.executionTime = performance.now() - start;
        }

        return this.result;
    }

    async _executeRead(operation) {
        try {
            return {
                id: operation.id,
                success: true,
                result: operation.fn(),
            };
        } catch (error) {
            return {
                id: operation.id,
                success: false,
                error: error.message,
            };
        }
    }

    async _executeWrite(operation) {
        try {
            return {
                id: operation.id,
                success: true,
                result: operation.fn(),
            };
        } catch (error) {
            return {
                id: operation.id,
                success: false,
                error: error.message,
            };
        }
    }

    async undo() {
        // Operações DOM geralmente não são reversíveis
        return { undone: false, reason: 'Operações DOM não são reversíveis' };
    }
}

/**
 * Invoker que gerencia execução de comandos
 */
export class UICommandInvoker {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = 50;
        this.statistics = {
            executed: 0,
            successful: 0,
            failed: 0,
            undone: 0,
        };
    }

    /**
     * Executa comando e adiciona ao histórico
     */
    async execute(command) {
        try {
            const result = await command.execute();

            this._addToHistory(command);
            this.statistics.executed++;
            this.statistics.successful++;

            return result;
        } catch (error) {
            this.statistics.executed++;
            this.statistics.failed++;
            throw error;
        }
    }

    /**
     * Desfaz último comando executado
     */
    async undo() {
        if (this.currentIndex < 0) {
            throw new Error('Nenhum comando para desfazer');
        }

        const command = this.history[this.currentIndex];

        try {
            const result = await command.undo();
            this.currentIndex--;
            this.statistics.undone++;
            return result;
        } catch (error) {
            throw new Error(`Erro ao desfazer comando ${command.name}: ${error.message}`);
        }
    }

    /**
     * Refaz comando desfeito
     */
    async redo() {
        if (this.currentIndex >= this.history.length - 1) {
            throw new Error('Nenhum comando para refazer');
        }

        const command = this.history[this.currentIndex + 1];

        try {
            const result = await command.execute();
            this.currentIndex++;
            return result;
        } catch (error) {
            throw new Error(`Erro ao refazer comando ${command.name}: ${error.message}`);
        }
    }

    /**
     * Limpa histórico de comandos
     */
    clearHistory() {
        this.history = [];
        this.currentIndex = -1;
    }

    /**
     * Obtém estatísticas de execução
     */
    getStatistics() {
        const successRate =
            this.statistics.executed > 0
                ? ((this.statistics.successful / this.statistics.executed) * 100).toFixed(2)
                : 0;

        return {
            ...this.statistics,
            successRate: `${successRate}%`,
            historySize: this.history.length,
            currentIndex: this.currentIndex,
            canUndo: this.currentIndex >= 0,
            canRedo: this.currentIndex < this.history.length - 1,
        };
    }

    _addToHistory(command) {
        // Remove comandos após índice atual (quando executamos após undo)
        this.history = this.history.slice(0, this.currentIndex + 1);

        // Adiciona novo comando
        this.history.push(command);
        this.currentIndex++;

        // Limita tamanho do histórico
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }
    }
}

/**
 * Factory para criação de comandos tipados
 */
export class UICommandFactory {
    static createSyncCommand(fieldConfig, value, domElement) {
        return new SyncFieldCommand(fieldConfig, value, domElement);
    }

    static createCompositeCommand(name, description) {
        return new CompositeCommand(name, description);
    }

    static createBatchedDOMCommand(name, description) {
        return new BatchedDOMCommand(name, description);
    }

    static createSyncAllFieldsCommand(mappingConfig, values, domElements) {
        const composite = new CompositeCommand('SyncAllFields', 'Sincroniza todos os campos da UI');

        mappingConfig.forEach((config) => {
            const element = domElements[config.domKey];
            const value = values[config.configKey];

            if (element && value !== undefined) {
                const command = this.createSyncCommand(config, value, element);
                composite.addCommand(command);
            }
        });

        return composite;
    }
}

/**
 * Instância global do invoker
 */
export const globalCommandInvoker = new UICommandInvoker();

export default {
    UICommand,
    SyncFieldCommand,
    CompositeCommand,
    BatchedDOMCommand,
    UICommandInvoker,
    UICommandFactory,
    globalCommandInvoker,
};

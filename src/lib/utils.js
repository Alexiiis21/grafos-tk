export const convertToRegex = (automata) => {
    if (!automata || !automata.states || automata.states.length === 0) {
        return 'Autómata inválido';
    }
    
    const stateMapping = {};
    automata.states.forEach((state, index) => {
        stateMapping[state] = index + 1;
    });
    
    const n = automata.states.length;
    const equations = Array(n).fill().map(() => Array(n + 1).fill('∅'));
    
    automata.transitions.forEach(t => {
        const i = stateMapping[t.from] - 1;
        const j = stateMapping[t.to] - 1;
        
        if (equations[i][j] === '∅') {
            equations[i][j] = t.symbol;
        } else {
            equations[i][j] = `(${equations[i][j]}+${t.symbol})`;
        }
    });
    
    // Paso 4: Añadir la cadena vacía para los estados finales
    automata.finalStates.forEach(state => {
        const i = stateMapping[state] - 1;
        equations[i][n] = 'ε';
    });
    
    for (let k = 0; k < n; k++) {
        if (equations[k][k] !== '∅') {
            const akk = equations[k][k];
            equations[k][k] = '∅'; 
            
            for (let j = 0; j <= n; j++) {
                if (j !== k && equations[k][j] !== '∅') {
                    equations[k][j] = `(${akk})*(${equations[k][j]})`;
                }
            }
        }
        
        // Substituir la ecuación para Rk en las otras ecuaciones
        for (let i = 0; i < n; i++) {
            if (i !== k && equations[i][k] !== '∅') {
                const aik = equations[i][k];
                equations[i][k] = '∅'; // Eliminar la referencia a Rk
                
                // Substituir en cada término
                for (let j = 0; j <= n; j++) {
                    if (equations[k][j] !== '∅') {
                        const newTerm = `(${aik})(${equations[k][j]})`;
                        if (equations[i][j] === '∅') {
                            equations[i][j] = newTerm;
                        } else {
                            // Usar + en lugar de | (cambio #2)
                            equations[i][j] = `(${equations[i][j]}+${newTerm})`;
                        }
                    }
                }
            }
        }
    }
    
    // Paso 6: La expresión regular es la solución para el estado inicial
    const initialStateIndex = stateMapping[automata.initialState] - 1;
    return equations[initialStateIndex][n] === '∅' ? '∅' : equations[initialStateIndex][n];
};

// Simplificación más precisa de expresiones regulares
export const simplifyRegex = (regex) => {
    if (!regex) return '∅';
    
    let simplified = regex;
    let prevSimplified;
    
    const simplifications = [
        { pattern: /\|/g, replacement: '+' },
        
        { pattern: /\(\s*([^+*()]+)\s*\)/g, replacement: '$1' },
        
        { pattern: /\(ε\)\*/g, replacement: 'ε' },
        { pattern: /ε\*/g, replacement: 'ε' },
        { pattern: /\(ε\)\+/g, replacement: '(' },
        { pattern: /\+\(ε\)/g, replacement: ')' },
        { pattern: /ε\+ε/g, replacement: 'ε' },
        { pattern: /ε\(([^)]+)\)/g, replacement: '($1)' },
        { pattern: /\(([^)]+)\)ε/g, replacement: '($1)' },
        
        { pattern: /\(∅\)/g, replacement: '∅' },
        { pattern: /∅\*/g, replacement: 'ε' },
        { pattern: /∅\+/g, replacement: '' },
        { pattern: /\+∅/g, replacement: '' },
        { pattern: /\(∅\+([^)]+)\)/g, replacement: '($1)' },
        { pattern: /\(([^)]+)\+∅\)/g, replacement: '($1)' },
        { pattern: /∅\(([^)]+)\)/g, replacement: '∅' },
        { pattern: /\(([^)]+)\)∅/g, replacement: '∅' },
        
        { pattern: /\(([^+*()]+)\+(\1)\)/g, replacement: '$1' },
        
        // Simplificaciones de Kleene
        { pattern: /\(\(([^)]+)\)\*\)\*/g, replacement: '($1)*' },
        { pattern: /\(([^*()]+)\*\)\*/g, replacement: '($1)*' }
    ];
    
    do {
        prevSimplified = simplified;
        
        for (const { pattern, replacement } of simplifications) {
            simplified = simplified.replace(pattern, replacement);
        }
        
        if (simplified === '(∅)*') simplified = 'ε';
        
    } while (simplified !== prevSimplified && simplified.length < 1000); 
    
    return simplified;
};
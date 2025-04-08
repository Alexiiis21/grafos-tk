'use client'
import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import AutomataVisualizer from '@/components/AutomataVisualizer';
import QuintupleDisplay from '@/components/QuintupleDisplay';

export default function PositivaPage() {
    const [automata, setAutomata] = useState(null);
    const [positivaResult, setPositivaResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileUpload = (data) => {
        if (validateAutomata(data)) {
            setAutomata(data);
        } else {
            alert('Formato de autómata inválido. Por favor verifica la estructura del archivo JSON.');
        }
    };

    const validateAutomata = (data) => {
        if (!data.states || !Array.isArray(data.states) || 
            !data.alphabet || !Array.isArray(data.alphabet) ||
            !data.transitions || !Array.isArray(data.transitions) ||
            !data.initialState || 
            !data.finalStates || !Array.isArray(data.finalStates)) {
            return false;
        }

        if (!data.states.includes(data.initialState)) return false;

        for (const finalState of data.finalStates) {
            if (!data.states.includes(finalState)) return false;
        }

        for (const transition of data.transitions) {
            if (!transition.from || !transition.to || !transition.symbol) return false;
            if (!data.states.includes(transition.from)) return false;
            if (!data.states.includes(transition.to)) return false;
            if (!data.alphabet.includes(transition.symbol)) return false;
        }

        return true;
    };

    const performPositiveClosure = () => {
        if (!automata) {
            alert('Debes cargar un autómata para calcular su cierre positivo');
            return;
        }
    
        setIsProcessing(true);
    
        try {
            // Verificar que el autómata es válido
            if (!validateAutomata(automata)) {
                alert('El autómata proporcionado no tiene un formato válido');
                setIsProcessing(false);
                return;
            }
            
            // Crear una copia del autómata original
            const originalAutomata = {
                states: [...automata.states],
                alphabet: [...automata.alphabet],
                transitions: [...automata.transitions.map(t => ({...t}))],
                initialState: automata.initialState,
                finalStates: [...automata.finalStates]
            };
            
            // Prefijamos los estados del autómata original para evitar colisiones
            const prefix = "A_";
            
            // Creamos mapeo de estados originales a prefijados
            const stateMapping = {};
            originalAutomata.states.forEach(state => {
                stateMapping[state] = prefix + state;
            });
            
            // Creamos los estados prefijados
            const prefixedStates = originalAutomata.states.map(state => prefix + state);
            
            // Creamos las transiciones prefijadas
            const prefixedTransitions = originalAutomata.transitions.map(t => ({
                from: prefix + t.from,
                symbol: t.symbol,
                to: prefix + t.to
            }));
            
            // Prefijamos el estado inicial y los estados finales
            const prefixedInitial = prefix + originalAutomata.initialState;
            const prefixedFinals = originalAutomata.finalStates.map(state => prefix + state);
            
            // Crear un nuevo estado inicial (NO será final en cierre positivo)
            const newInitialState = "q_start";
            
            // Añadir una transición epsilon desde el nuevo estado inicial al estado inicial original
            const initialEpsilonTransition = {
                from: newInitialState,
                symbol: 'ε',
                to: prefixedInitial
            };
            
            // Añadir transiciones epsilon desde todos los estados finales al estado inicial original
            // Esto crea el "bucle" que permite repetir el autómata una o más veces
            const loopbackTransitions = prefixedFinals.map(finalState => ({
                from: finalState,
                symbol: 'ε',
                to: prefixedInitial
            }));
            
            // Construir el nuevo autómata
            const result = {
                states: [...prefixedStates, newInitialState],
                alphabet: [...originalAutomata.alphabet, 'ε'], // Añadir epsilon al alfabeto
                initialState: newInitialState,
                // En el cierre positivo A+, el nuevo estado inicial NO es de aceptación
                finalStates: [...prefixedFinals], 
                transitions: [
                    ...prefixedTransitions, 
                    initialEpsilonTransition, 
                    ...loopbackTransitions
                ]
            };
            
            // Optimización: eliminar estados inalcanzables
            const optimizedResult = removeUnreachableStates(result);
            
            setPositivaResult(optimizedResult);
        } catch (error) {
            console.error('Error al calcular el cierre positivo:', error);
            alert('Error al calcular el cierre positivo del autómata: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };
    
    // Función para eliminar estados inalcanzables desde el estado inicial
    const removeUnreachableStates = (automata) => {
        const reachable = new Set([automata.initialState]);
        let oldSize = 0;
        
        // Encontrar todos los estados alcanzables en un bucle de punto fijo
        while (reachable.size !== oldSize) {
            oldSize = reachable.size;
            
            automata.transitions.forEach(t => {
                if (reachable.has(t.from)) {
                    reachable.add(t.to);
                }
            });
        }
        
        // Filtrar el autómata para mantener solo los estados alcanzables
        return {
            states: automata.states.filter(s => reachable.has(s)),
            alphabet: automata.alphabet,
            initialState: automata.initialState,
            finalStates: automata.finalStates.filter(s => reachable.has(s)),
            transitions: automata.transitions.filter(t => reachable.has(t.from) && reachable.has(t.to))
        };
    };

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8 py-6">
                    <h1 className="text-4xl font-bold text-blue-800 mb-2">Cierre Positivo</h1>
                    <p className="text-gray-600">Carga un autómata para calcular su cierre positivo (A+)</p>
                </header>
                
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-blue-700 flex items-center">
                        Autómata de Entrada
                    </h2>
                    <div className="mb-6">
                        <FileUpload onFileUpload={handleFileUpload} />
                    </div>
                    
                    {automata && (
                        <>
                            <div className="mb-4">
                                <h3 className="text-lg font-medium mb-2 text-gray-700">Quíntupla:</h3>
                                <QuintupleDisplay automata={automata} />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium mb-2 text-gray-700">Visualización:</h3>
                                <div className="border border-gray-200 rounded-md overflow-hidden">
                                    <AutomataVisualizer automata={automata} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
                
                <div className="flex justify-center mb-8">
                    <button
                        onClick={performPositiveClosure}
                        disabled={!automata || isProcessing}
                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Procesando...' : 'Calcular Cierre Positivo (A+)'}
                    </button>
                </div>
                
                {positivaResult && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-semibold mb-4 text-purple-700 flex items-center">
                            Resultado del Cierre Positivo (A+)
                        </h2>
                        <div className="mb-4">
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Quíntupla Resultante:</h3>
                            <QuintupleDisplay automata={positivaResult} />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Visualización:</h3>
                            <div className="border border-gray-200 rounded-md overflow-hidden">
                                <AutomataVisualizer automata={positivaResult} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
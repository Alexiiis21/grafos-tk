'use client'
import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import AutomataVisualizer from '@/components/AutomataVisualizer';
import QuintupleDisplay from '@/components/QuintupleDisplay';

export default function ConcatPage() {
    const [automata1, setAutomata1] = useState(null);
    const [automata2, setAutomata2] = useState(null);
    const [concatResult, setConcatResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileUpload1 = (data) => {
        if (validateAutomata(data)) {
            setAutomata1(data);
        } else {
            alert('Formato de autómata 1 inválido. Por favor verifica la estructura del archivo JSON.');
        }
    };

    const handleFileUpload2 = (data) => {
        if (validateAutomata(data)) {
            setAutomata2(data);
        } else {
            alert('Formato de autómata 2 inválido. Por favor verifica la estructura del archivo JSON.');
        }
    };

    const validateAutomata = (data) => {
        // Check if data has all required fields
        if (!data.states || !Array.isArray(data.states) || 
            !data.alphabet || !Array.isArray(data.alphabet) ||
            !data.transitions || !Array.isArray(data.transitions) ||
            !data.initialState || 
            !data.finalStates || !Array.isArray(data.finalStates)) {
            return false;
        }

        // Check if initial state is in states array
        if (!data.states.includes(data.initialState)) return false;

        // Check if all final states are in states array
        for (const finalState of data.finalStates) {
            if (!data.states.includes(finalState)) return false;
        }

        // Check if all transitions reference valid states and symbols
        for (const transition of data.transitions) {
            if (!transition.from || !transition.to || !transition.symbol) return false;
            if (!data.states.includes(transition.from)) return false;
            if (!data.states.includes(transition.to)) return false;
            if (!data.alphabet.includes(transition.symbol)) return false;
        }

        return true;
    };

    const performConcatenation = () => {
        if (!automata1 || !automata2) {
            alert('Debes cargar dos autómatas para realizar la concatenación');
            return;
        }
    
        setIsProcessing(true);
    
        try {
            // Crear prefijos para evitar colisiones de nombres de estados
            const prefixA1 = "A1_";
            const prefixA2 = "A2_";
            
            // Prefijamos los estados para evitar colisiones
            const statesA1 = automata1.states.map(state => prefixA1 + state);
            const statesA2 = automata2.states.map(state => prefixA2 + state);
            
            // Prefijamos los estados iniciales y finales
            const initialA1 = prefixA1 + automata1.initialState;
            const initialA2 = prefixA2 + automata2.initialState;
            const finalStatesA1 = automata1.finalStates.map(state => prefixA1 + state);
            const finalStatesA2 = automata2.finalStates.map(state => prefixA2 + state);
            
            // Prefijamos las transiciones
            const transitionsA1 = automata1.transitions.map(t => ({
                from: prefixA1 + t.from,
                symbol: t.symbol,
                to: prefixA1 + t.to
            }));
            
            const transitionsA2 = automata2.transitions.map(t => ({
                from: prefixA2 + t.from,
                symbol: t.symbol,
                to: prefixA2 + t.to
            }));
            
            // Creamos los enlaces entre los estados finales del primer autómata
            // y el estado inicial del segundo autómata con transiciones epsilon
            const epsilonTransitions = [];
            
            finalStatesA1.forEach(finalState => {
                epsilonTransitions.push({
                    from: finalState,
                    symbol: 'ε', // Transición epsilon
                    to: initialA2
                });
            });
            
            // Caso especial: si el estado inicial del primer autómata es también final,
            // y el estado inicial del segundo autómata es final, entonces el estado inicial
            // del resultado debe ser también final
            let resultFinalStates = [...finalStatesA2];
            if (automata1.finalStates.includes(automata1.initialState) && 
                automata2.finalStates.includes(automata2.initialState)) {
                resultFinalStates = [initialA1, ...resultFinalStates];
            }
            
            // Unimos todos los componentes para formar el nuevo autómata
            const result = {
                states: [...statesA1, ...statesA2],
                alphabet: [...new Set([...automata1.alphabet, ...automata2.alphabet, 'ε'])],
                initialState: initialA1,
                finalStates: resultFinalStates, // Solo los estados finales del segundo autómata son finales por defecto
                transitions: [...transitionsA1, ...transitionsA2, ...epsilonTransitions]
            };
            
            // Optimización: eliminar estados inalcanzables
            const optimizedResult = removeUnreachableStates(result);
            
            // Documentar que el resultado es un AFND con épsilon-transiciones
            optimizedResult.type = "AFND-ε";
            
            setConcatResult(optimizedResult);
        } catch (error) {
            console.error('Error al realizar la concatenación:', error);
            alert('Error al realizar la concatenación de autómatas: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };
    
    // Función para eliminar estados inalcanzables desde el estado inicial
    const removeUnreachableStates = (automata) => {
        const reachable = new Set([automata.initialState]);
        let oldSize = 0;
        
        // Encontrar todos los estados alcanzables en un bucle de punto fijo
        // considerando también las transiciones epsilon
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
            transitions: automata.transitions.filter(t => reachable.has(t.from) && reachable.has(t.to)),
            type: automata.type // Mantener la propiedad type si existe
        };
    };
    return (
        <main className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8 py-6">
                    <h1 className="text-4xl font-bold text-blue-800 mb-2">Concatenación de Autómatas</h1>
                    <p className="text-gray-600">Carga dos autómatas para realizar A·B (concatenación)</p>
                </header>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Autómata 1 */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4 text-blue-700 flex items-center">
                            Autómata A
                        </h2>
                        <div className="mb-6">
                            <FileUpload onFileUpload={handleFileUpload1} />
                        </div>
                        
                        {automata1 && (
                            <>
                                <div className="mb-4">
                                    <h3 className="text-lg font-medium mb-2 text-gray-700">Quíntupla:</h3>
                                    <QuintupleDisplay automata={automata1} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium mb-2 text-gray-700">Visualización:</h3>
                                    <div className="border border-gray-200 rounded-md overflow-hidden">
                                        <AutomataVisualizer automata={automata1} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    
                    {/* Autómata 2 */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4 text-green-700 flex items-center">
                            Autómata B
                        </h2>
                        <div className="mb-6">
                            <FileUpload onFileUpload={handleFileUpload2} />
                        </div>
                        
                        {automata2 && (
                            <>
                                <div className="mb-4">
                                    <h3 className="text-lg font-medium mb-2 text-gray-700">Quíntupla:</h3>
                                    <QuintupleDisplay automata={automata2} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium mb-2 text-gray-700">Visualización:</h3>
                                    <div className="border border-gray-200 rounded-md overflow-hidden">
                                        <AutomataVisualizer automata={automata2} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                
                {/* Botón para realizar la concatenación */}
                <div className="flex justify-center mb-8">
                    <button
                        onClick={performConcatenation}
                        disabled={!automata1 || !automata2 || isProcessing}
                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Procesando...' : 'Realizar Concatenación A·B'}
                    </button>
                </div>
                
                {/* Resultado de la concatenación */}
                {concatResult && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-semibold mb-4 text-purple-700 flex items-center">
                            Resultado de la Concatenación A·B
                        </h2>
                        <div className="mb-4">
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Quíntupla Resultante:</h3>
                            <QuintupleDisplay automata={concatResult} />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Visualización:</h3>
                            <div className="border border-gray-200 rounded-md overflow-hidden">
                                <AutomataVisualizer automata={concatResult} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
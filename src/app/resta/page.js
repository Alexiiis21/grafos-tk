'use client'
import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import AutomataVisualizer from '@/components/AutomataVisualizer';
import QuintupleDisplay from '@/components/QuintupleDisplay';

export default function RestaPage() {
    const [automata1, setAutomata1] = useState(null);
    const [automata2, setAutomata2] = useState(null);
    const [restaResult, setRestaResult] = useState(null);
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

    const performResta = () => {
        if (!automata1 || !automata2) {
            alert('Debes cargar dos autómatas para realizar la resta');
            return;
        }

        setIsProcessing(true);

        try {
            // Verificar que ambos autómatas son AFDs
            if (!isAFD(automata1) || !isAFD(automata2)) {
                alert('Esta operación requiere que ambos autómatas sean AFDs');
                setIsProcessing(false);
                return;
            }
            
            // Realizar la resta A - B = A ∩ B'
            // 1. Obtener el complemento de B
            const complementoB = obtenerComplemento(automata2);
            
            // 2. Obtener la intersección de A con el complemento de B
            const resultado = calcularInterseccion(automata1, complementoB);
            
            setRestaResult(resultado);
        } catch (error) {
            console.error('Error al realizar la resta:', error);
            alert('Error al realizar la resta de autómatas: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Función para verificar si un autómata es un AFD
    const isAFD = (automaton) => {
        // Para cada estado y cada símbolo del alfabeto, debe haber exactamente una transición
        for (const state of automaton.states) {
            for (const symbol of automaton.alphabet) {
                const transitions = automaton.transitions.filter(
                    t => t.from === state && t.symbol === symbol
                );
                
                // En un AFD, debe haber exactamente una transición para cada par (estado, símbolo)
                if (transitions.length !== 1) {
                    return false;
                }
            }
        }
        return true;
    };

    // Función para obtener el complemento de un autómata
    const obtenerComplemento = (automata) => {
        return {
            states: [...automata.states],
            alphabet: [...automata.alphabet],
            initialState: automata.initialState,
            finalStates: automata.states.filter(state => !automata.finalStates.includes(state)),
            transitions: [...automata.transitions]
        };
    };

    // Función para calcular la intersección A ∩ B utilizando el producto cartesiano y BFS
    const calcularInterseccion = (automata1, automata2) => {
        // Encontrar el alfabeto común
        const commonAlphabet = automata1.alphabet.filter(symbol => 
            automata2.alphabet.includes(symbol)
        );
        
        if (commonAlphabet.length === 0) {
            throw new Error('Los autómatas no tienen símbolos en común en sus alfabetos.');
        }

        // Inicializar el resultado
        const result = {
            states: [],
            alphabet: commonAlphabet,
            transitions: [],
            initialState: null,
            finalStates: []
        };

        // Crear el producto cartesiano de estados usando BFS
        const stateMap = new Map(); // Para mapear pares de estados a nombres legibles

        // Crear el estado inicial
        const initialStatePair = `${automata1.initialState},${automata2.initialState}`;
        const initialStateName = `(${automata1.initialState},${automata2.initialState})`;
        result.initialState = initialStateName;
        stateMap.set(initialStatePair, initialStateName);
        result.states.push(initialStateName);
        
        // Es un estado final si es final en A y también en B
        if (automata1.finalStates.includes(automata1.initialState) && 
            automata2.finalStates.includes(automata2.initialState)) {
            result.finalStates.push(initialStateName);
        }
        
        const queue = [initialStatePair];
        const visited = new Set([initialStatePair]);
        
        while (queue.length > 0) {
            const currentPair = queue.shift();
            const [state1, state2] = currentPair.split(',');
            const currentStateName = stateMap.get(currentPair);
            
            // Por cada símbolo en el alfabeto común
            for (const symbol of commonAlphabet) {
                // Encontrar el siguiente estado en cada autómata
                const nextState1 = getTransitionTarget(automata1, state1, symbol);
                const nextState2 = getTransitionTarget(automata2, state2, symbol);
                
                // Añadir la transición solo si ambos estados tienen transición para este símbolo
                if (nextState1 && nextState2) {
                    const nextPair = `${nextState1},${nextState2}`;
                    
                    // Si este par de estados no ha sido procesado antes
                    if (!stateMap.has(nextPair)) {
                        const newStateName = `(${nextState1},${nextState2})`;
                        stateMap.set(nextPair, newStateName);
                        result.states.push(newStateName);
                        
                        // Es un estado final si es final en A y también en B
                        if (automata1.finalStates.includes(nextState1) && 
                            automata2.finalStates.includes(nextState2)) {
                            result.finalStates.push(newStateName);
                        }
                        
                        // Añadir a la cola para procesar sus transiciones
                        if (!visited.has(nextPair)) {
                            queue.push(nextPair);
                            visited.add(nextPair);
                        }
                    }
                    
                    // Añadir la transición
                    const nextStateName = stateMap.get(nextPair);
                    result.transitions.push({
                        from: currentStateName,
                        symbol: symbol,
                        to: nextStateName
                    });
                }
            }
        }
        
        return result;
    };

    // Función auxiliar para obtener el estado destino de una transición
    const getTransitionTarget = (automaton, state, symbol) => {
        const transition = automaton.transitions.find(
            t => t.from === state && t.symbol === symbol
        );
        return transition ? transition.to : null;
    };

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8 py-6">
                    <h1 className="text-4xl font-bold text-blue-800 mb-2">Resta de Autómatas</h1>
                    <p className="text-gray-600">Carga dos autómatas para realizar A - B (resta)</p>
                </header>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                
                <div className="flex justify-center mb-8">
                    <button
                        onClick={performResta}
                        disabled={!automata1 || !automata2 || isProcessing}
                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Procesando...' : 'Realizar A - B'}
                    </button>
                </div>
                
                {restaResult && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-semibold mb-4 text-purple-700 flex items-center">
                            Resultado de A - B
                        </h2>
                        <div className="mb-4">
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Quíntupla Resultante:</h3>
                            <QuintupleDisplay automata={restaResult} />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Visualización:</h3>
                            <div className="border border-gray-200 rounded-md overflow-hidden">
                                <AutomataVisualizer automata={restaResult} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
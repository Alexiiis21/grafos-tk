'use client'
import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import AutomataVisualizer from '@/components/AutomataVisualizer';
import QuintupleDisplay from '@/components/QuintupleDisplay';

export default function UnionPage() {
    const [automata1, setAutomata1] = useState(null);
    const [automata2, setAutomata2] = useState(null);
    const [unionResult, setUnionResult] = useState(null);
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

    const performUnion = () => {
        if (!automata1 || !automata2) {
            alert('Debes cargar dos autómatas para realizar la unión');
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
            
            // Verificar que ambos autómatas compartan el mismo alfabeto
            const alphabet = [...new Set([...automata1.alphabet, ...automata2.alphabet])];
            
            // Inicializar el resultado
            const result = {
                states: [],
                alphabet: alphabet,
                transitions: [],
                initialState: null,
                finalStates: []
            };
    
            // Crear el producto cartesiano de estados
            const stateMap = new Map(); 
    
            const initialStatePair = `${automata1.initialState},${automata2.initialState}`;
            const initialStateName = `(${automata1.initialState},${automata2.initialState})`;
            result.initialState = initialStateName;
            stateMap.set(initialStatePair, initialStateName);
            result.states.push(initialStateName);
            
            if (automata1.finalStates.includes(automata1.initialState) || 
                automata2.finalStates.includes(automata2.initialState)) {
                result.finalStates.push(initialStateName);
            }
            
            // Procesar estados usando BFS
            const queue = [initialStatePair];
            const visited = new Set([initialStatePair]);
            
            while (queue.length > 0) {
                const currentPair = queue.shift();
                const [state1, state2] = currentPair.split(',');
                const currentStateId = stateMap.get(currentPair);
                
                // Por cada símbolo en el alfabeto
                for (const symbol of alphabet) {
                    const nextState1 = getTransitionTarget(automata1, state1, symbol) || 'dead';
                    const nextState2 = getTransitionTarget(automata2, state2, symbol) || 'dead';
                    
                    // Crear el siguiente par de estados
                    const nextPair = `${nextState1},${nextState2}`;
                    
                    // Verificar si este par ya ha sido procesado
                    if (!stateMap.has(nextPair)) {
                        const newStateName = `(${nextState1},${nextState2})`;
                        stateMap.set(nextPair, newStateName);
                        result.states.push(newStateName);
                        
                        // Determinar si es un estado de aceptación
                        if (
                          (nextState1 !== 'dead' && automata1.finalStates.includes(nextState1)) || 
                          (nextState2 !== 'dead' && automata2.finalStates.includes(nextState2))
                        ) {
                            result.finalStates.push(newStateName);
                        }
                        
                        // Añadir a la cola para procesar sus transiciones
                        if (!visited.has(nextPair)) {
                            queue.push(nextPair);
                            visited.add(nextPair);
                        }
                    }
                    
                    // Añadir la transición
                    const nextStateId = stateMap.get(nextPair);
                    result.transitions.push({
                        from: currentStateId,
                        symbol: symbol,
                        to: nextStateId
                    });
                }
            }
            
            // Filtrar estados muertos que no son necesarios
            const reachableStates = new Set();
            const transitionsToKeep = [];
            
            const reachableQueue = [result.initialState];
            reachableStates.add(result.initialState);
            
            while (reachableQueue.length > 0) {
                const currentState = reachableQueue.shift();
                
                // Encontrar todas las transiciones desde este estado
                for (const transition of result.transitions) {
                    if (transition.from === currentState) {
                        transitionsToKeep.push(transition);
                        
                        if (!reachableStates.has(transition.to)) {
                            reachableStates.add(transition.to);
                            reachableQueue.push(transition.to);
                        }
                    }
                }
            }
            
            // Actualizar el resultado con solo los estados alcanzables
            result.states = [...reachableStates];
            result.transitions = transitionsToKeep;
            result.finalStates = result.finalStates.filter(state => reachableStates.has(state));
                
            setUnionResult(result);
        } catch (error) {
            console.error('Error al realizar la unión:', error);
            alert('Error al realizar la unión de autómatas');
        } finally {
            setIsProcessing(false);
        }
    };
    
    // Función auxiliar para comprobar si un autómata es AFD
    const isAFD = (automaton) => {
        // Comprobar que para cada estado y cada símbolo del alfabeto existe exactamente una transición
        const transitionMap = new Map();
        
        for (const state of automaton.states) {
            for (const symbol of automaton.alphabet) {
                const key = `${state},${symbol}`;
                transitionMap.set(key, 0);
            }
        }
        
        for (const transition of automaton.transitions) {
            const key = `${transition.from},${transition.symbol}`;
            transitionMap.set(key, transitionMap.get(key) + 1);
            
            // Si hay más de una transición para un par estado-símbolo, no es AFD
            if (transitionMap.get(key) > 1) {
                return false;
            }
        }
        
        for (const [key, count] of transitionMap.entries()) {
            if (count !== 1) {
                return false;
            }
        }
        
        return true;
    };
    
    // Función auxiliar para obtener el estado destino de una transición
    const getTransitionTarget = (automaton, state, symbol) => {
        if (state === 'dead') return 'dead';
        
        const transition = automaton.transitions.find(t => 
            t.from === state && t.symbol === symbol
        );
        
        return transition ? transition.to : null;
    };

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8 py-6">
                    <h1 className="text-4xl font-bold text-blue-800 mb-2">Unión de Autómatas</h1>
                    <p className="text-gray-600">Carga dos autómatas para realizar su unión</p>
                </header>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4 text-blue-700 flex items-center">
                            Autómata 1
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
                            Autómata 2
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
                        onClick={performUnion}
                        disabled={!automata1 || !automata2 || isProcessing}
                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Procesando...' : 'Realizar Unión de Autómatas'}
                    </button>
                </div>
                
                {unionResult && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-semibold mb-4 text-purple-700 flex items-center">
                            Resultado de la Unión
                        </h2>
                        <div className="mb-4">
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Quíntupla Resultante:</h3>
                            <QuintupleDisplay automata={unionResult} />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Visualización:</h3>
                            <div className="border border-gray-200 rounded-md overflow-hidden">
                                <AutomataVisualizer automata={unionResult} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
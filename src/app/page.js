'use client'
import { useState, useEffect } from 'react';
import FileUpload from '@/components/FileUpload';
import GraphVisualizer from '@/components/GraphVisualizer';

export default function Home() {
    const [graph, setGraph] = useState(null);
    const [originalGraph, setOriginalGraph] = useState(null);
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [result, setResult] = useState('');
    
    const handleFileUpload = (data) => {
        if (validateGraph(data)) {
            setOriginalGraph(JSON.parse(JSON.stringify(data))); // Copia profunda
            setGraph(data);
            setSteps([]);
            setCurrentStepIndex(0);
            setResult('');
        } else if (typeof data === 'string') {
            try {
                // Intentar parsear archivo de texto que describe la 5-tupla
                const parsedGraph = parseGraphFromText(data);
                setOriginalGraph(JSON.parse(JSON.stringify(parsedGraph)));
                setGraph(parsedGraph);
                setSteps([]);
                setCurrentStepIndex(0);
                setResult('');
            } catch (e) {
                alert('Formato de archivo de texto inválido. Verifica la estructura.');
            }
        } else {
            alert('Formato de grafo inválido. Por favor verifica la estructura del archivo.');
        }
    };

    const validateGraph = (data) => {
        // Validar la estructura básica de un grafo
        if (!data.nodes || !Array.isArray(data.nodes) || 
            !data.edges || !Array.isArray(data.edges)) {
            return false;
        }

        // Validar que cada nodo tenga un id
        const nodeIds = new Set();
        for (const node of data.nodes) {
            if (!node.id) return false;
            nodeIds.add(node.id);
        }

        // Validar que cada arista tenga source y target válidos
        for (const edge of data.edges) {
            if (!edge.source || !edge.target) return false;
            if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return false;
        }

        return true;
    };

    // Parsea un archivo de texto que contiene la descripción de la 5-tupla
    const parseGraphFromText = (text) => {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        // Formato esperado
        // Línea 1: Estados separados por comas
        // Línea 2: Símbolos del alfabeto separados por comas
        // Línea 3: Estado inicial
        // Línea 4: Estados finales separados por comas
        // Líneas restantes: Transiciones en formato "estadoOrigen,símbolo,estadoDestino"
        
        if (lines.length < 5) {
            throw new Error("Formato de texto inválido");
        }
        
        const states = lines[0].split(',').map(s => s.trim());
        const alphabet = lines[1].split(',').map(s => s.trim());
        const initialState = lines[2].trim();
        const finalStates = lines[3].split(',').map(s => s.trim());
        
        // Validaciones básicas
        if (!states.includes(initialState)) {
            throw new Error("Estado inicial no está en la lista de estados");
        }
        
        for (const finalState of finalStates) {
            if (!states.includes(finalState)) {
                throw new Error(`Estado final '${finalState}' no está en la lista de estados`);
            }
        }
        
        // Construir grafo
        const nodes = states.map(id => ({
            id,
            label: id,
            isInitial: id === initialState,
            isFinal: finalStates.includes(id)
        }));
        
        const edges = [];
        for (let i = 4; i < lines.length; i++) {
            const parts = lines[i].split(',').map(p => p.trim());
            if (parts.length !== 3) continue;
            
            const [source, symbol, target] = parts;
            if (!states.includes(source) || !states.includes(target)) continue;
            
            edges.push({
                source,
                target,
                label: symbol
            });
        }
        
        return { nodes, edges };
    };

    // Aplica el Teorema de Kleene paso a paso
    const applyKleeneTheorem = () => {
        if (!graph) return;

        // Paso 1: Agregar nuevo estado inicial
        const step1 = addNewInitialState(graph);
        
        // Paso 2: Agregar nuevo estado final
        const step2 = addNewFinalState(step1);
        
        // Paso 3: Eliminar estados de paso uno por uno
        const steps = [
            { graph: JSON.parse(JSON.stringify(graph)), description: "Grafo original" },
            { graph: JSON.parse(JSON.stringify(step1)), description: "Paso 1: Nuevo estado inicial añadido" },
            { graph: JSON.parse(JSON.stringify(step2)), description: "Paso 2: Nuevo estado final añadido" }
        ];
        
        // Encontrar estados de paso (ni inicial ni final)
        const passStates = step2.nodes.filter(node => 
            node.id !== 'START' && node.id !== 'FINAL' && 
            !node.isInitial && !node.isFinal
        ).map(node => node.id);
        
        let currentGraph = JSON.parse(JSON.stringify(step2));
        
        // Eliminar estados de paso uno por uno
        for (let i = 0; i < passStates.length; i++) {
            const stateToRemove = passStates[i];
            currentGraph = removeState(currentGraph, stateToRemove);
            steps.push({
                graph: JSON.parse(JSON.stringify(currentGraph)),
                description: `Paso ${i + 3}: Eliminado estado '${stateToRemove}'`
            });
        }
        
        // Calcular la expresión regular final
        const finalRegex = calculateFinalRegex(currentGraph);
        
        setSteps(steps);
        setCurrentStepIndex(0);
        setGraph(steps[0].graph);
        setResult(finalRegex);
    };

    // Añade un nuevo estado inicial
    const addNewInitialState = (originalGraph) => {
        const newGraph = JSON.parse(JSON.stringify(originalGraph));
        
        // Encontrar el estado inicial original
        const originalInitialState = newGraph.nodes.find(node => node.isInitial);
        
        if (originalInitialState) {
            // Quitar la marca de inicial del estado original
            originalInitialState.isInitial = false;
            
            // Añadir nuevo estado inicial
            newGraph.nodes.push({
                id: 'START',
                label: 'NUEVO INICIAL',
                isInitial: true,
                isFinal: false,
                color: '#4CAF50'
            });
            
            // Añadir transición ε al estado inicial original
            newGraph.edges.push({
                source: 'START',
                target: originalInitialState.id,
                label: 'ε'
            });
        }
        
        return newGraph;
    };

    // Añade un nuevo estado final
    const addNewFinalState = (graphWithNewInitial) => {
        const newGraph = JSON.parse(JSON.stringify(graphWithNewInitial));
        
        // Encontrar todos los estados finales originales
        const originalFinalStates = newGraph.nodes.filter(node => node.isFinal);
        
        if (originalFinalStates.length > 0) {
            // Quitar la marca de final de los estados originales
            for (const finalState of originalFinalStates) {
                finalState.isFinal = false;
            }
            
            // Añadir nuevo estado final
            newGraph.nodes.push({
                id: 'FINAL',
                label: 'NUEVO FINAL',
                isInitial: false,
                isFinal: true,
                color: '#F44336'
            });
            
            // Añadir transiciones ε desde los estados finales originales
            for (const finalState of originalFinalStates) {
                newGraph.edges.push({
                    source: finalState.id,
                    target: 'FINAL',
                    label: 'ε'
                });
            }
        }
        
        return newGraph;
    };

    // Elimina un estado y recalcula las transiciones
    const removeState = (currentGraph, stateId) => {
        const newGraph = JSON.parse(JSON.stringify(currentGraph));
        
        // Obtener todas las transiciones que involucran el estado a eliminar
        const incomingEdges = newGraph.edges.filter(edge => edge.target === stateId);
        const outgoingEdges = newGraph.edges.filter(edge => edge.source === stateId);
        const selfLoop = newGraph.edges.find(edge => edge.source === stateId && edge.target === stateId);
        
        // Para cada par de estados (p,q) donde p → stateId → q, crear una nueva transición p → q
        for (const incoming of incomingEdges) {
            if (incoming.source === stateId) continue; // Skip self-loops, tratados separadamente
            
            for (const outgoing of outgoingEdges) {
                if (outgoing.target === stateId) continue; // Skip self-loops
                
                // Calcular la nueva expresión regular para la transición
                let newRegex = incoming.label + (selfLoop ? `(${selfLoop.label})*` : '') + outgoing.label;
                
                // Buscar si ya existe una transición entre estos estados
                const existingEdge = newGraph.edges.find(edge => 
                    edge.source === incoming.source && edge.target === outgoing.target);
                
                if (existingEdge) {
                    // Si ya existe, actualizar la expresión regular (unión)
                    existingEdge.label = simplifyRegex(`${existingEdge.label}|${newRegex}`);
                } else {
                    // Si no existe, crear una nueva transición
                    newGraph.edges.push({
                        source: incoming.source,
                        target: outgoing.target,
                        label: newRegex
                    });
                }
            }
        }
        
        // Eliminar todas las transiciones que involucran al estado
        newGraph.edges = newGraph.edges.filter(edge => 
            edge.source !== stateId && edge.target !== stateId);
        
        // Eliminar el nodo
        newGraph.nodes = newGraph.nodes.filter(node => node.id !== stateId);
        
        return newGraph;
    };

    // Simplifica una expresión regular (implementación básica)
    const simplifyRegex = (regex) => {
        // Aquí se pueden implementar reglas de simplificación más complejas
        // Esta es una implementación muy básica
        return regex.replace(/\(\)|\(\(\)\)|\(\(\)||\(\)|\(\)/g, '')
                   .replace(/\(\(([^()]*)\)\)/g, '($1)')
                   .replace(/\|ε/g, '?')
                   .replace(/ε\|/g, '?');
    };

    // Calcula la expresión regular final
    const calculateFinalRegex = (finalGraph) => {
        // Buscar la transición del nuevo estado inicial al nuevo estado final
        const finalTransition = finalGraph.edges.find(edge => 
            edge.source === 'START' && edge.target === 'FINAL');
        
        if (finalTransition) {
            return simplifyRegex(finalTransition.label);
        }
        
        return "No se pudo obtener una expresión regular";
    };

    // Navegar entre los pasos
    const showPreviousStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1);
            setGraph(steps[currentStepIndex - 1].graph);
        }
    };

    const showNextStep = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
            setGraph(steps[currentStepIndex + 1].graph);
        }
    };

    // Genera un ejemplo para demostración
    const createExampleGraph = () => {
        const exampleGraph = {
            nodes: [
                { id: "q0", label: "q0", isInitial: true, isFinal: false },
                { id: "q1", label: "q1", isInitial: false, isFinal: false },
                { id: "q2", label: "q2", isInitial: false, isFinal: true }
            ],
            edges: [
                { source: "q0", target: "q0", label: "a" },
                { source: "q0", target: "q1", label: "b" },
                { source: "q1", target: "q2", label: "a" },
                { source: "q2", target: "q0", label: "b" }
            ]
        };
        setOriginalGraph(JSON.parse(JSON.stringify(exampleGraph)));
        setGraph(exampleGraph);
        setSteps([]);
        setCurrentStepIndex(0);
        setResult('');
    };

    return (
        <main className="container mx-auto px-4 py-8 bg-white">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-10 py-8">
                    <h1 className="text-5xl font-bold text-blue-800 mb-4">Teorema de Kleene - Grafos a Expresiones Regulares</h1>
                    <p className="text-xl text-gray-600">Conversión de un grafo de transición a una expresión regular usando el teorema de Kleene</p>
                </header>
                
                <div className="bg-white rounded-lg shadow-md p-8 mb-10">
                    <h2 className="text-2xl font-semibold text-blue-700 mb-4">
                        Subir Archivo
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Sube un archivo TXT con la 5-tupla del grafo o un archivo JSON con la estructura del grafo.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <FileUpload onFileUpload={handleFileUpload} />
                        <button
                            onClick={createExampleGraph}
                            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                        >
                            Usar Ejemplo
                        </button>
                    </div>
                </div>

                {graph && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-blue-700">
                                {steps.length > 0 ? steps[currentStepIndex].description : "Grafo de Transición"}
                            </h2>
                            {steps.length === 0 && (
                                <button
                                    onClick={applyKleeneTheorem}
                                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 transition-colors"
                                >
                                    Aplicar Teorema de Kleene
                                </button>
                            )}
                        </div>
                        <div className="border border-gray-200 rounded-md overflow-hidden">
                            <GraphVisualizer graph={graph} />
                        </div>
                        
                        {steps.length > 0 && (
                            <div className="flex justify-between items-center mt-4">
                                <button 
                                    onClick={showPreviousStep}
                                    disabled={currentStepIndex === 0}
                                    className={`px-4 py-2 font-medium rounded-lg shadow-md ${
                                        currentStepIndex === 0 
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    ← Paso Anterior
                                </button>
                                <span className="text-lg font-medium">
                                    Paso {currentStepIndex + 1} de {steps.length}
                                </span>
                                <button 
                                    onClick={showNextStep}
                                    disabled={currentStepIndex === steps.length - 1}
                                    className={`px-4 py-2 font-medium rounded-lg shadow-md ${
                                        currentStepIndex === steps.length - 1 
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    Siguiente Paso →
                                </button>
                            </div>
                        )}
                        
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-2 text-blue-700">Información del Grafo</h3>
                            <div className="bg-gray-50 p-4 rounded-md">
                                <p><strong>Nodos:</strong> {graph.nodes.length}</p>
                                <p><strong>Aristas:</strong> {graph.edges.length}</p>
                                {result && (
                                    <p><strong>Expresión Regular Resultante:</strong> <span className="text-lg font-bold text-green-600">{result}</span></p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                {!graph && (
                    <div className="text-center py-12">
                        <p className="text-xl text-gray-500">
                            Carga un grafo o usa el ejemplo para continuar
                        </p>
                    </div>
                )}
                
                {/* Instrucciones sobre el formato del archivo TXT */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-8 text-black">
                    <h2 className="text-xl font-semibold mb-4 text-blue-700">
                        Formato del Archivo de Texto
                    </h2>
                    <p className="mb-4">El archivo TXT debe seguir el siguiente formato:</p>
                    <pre className="bg-gray-50 p-4 rounded-md mb-4 overflow-auto">
                        <code>{`q0,q1,q2,q3     // Estados separados por comas
a,b             // Alfabeto separado por comas
q0              // Estado inicial
q3              // Estados finales separados por comas
q0,a,q1         // Transiciones: origen,símbolo,destino
q1,b,q2
q2,a,q3
q3,b,q0`}</code>
                    </pre>
                </div>
            </div>
        </main>
    );
}
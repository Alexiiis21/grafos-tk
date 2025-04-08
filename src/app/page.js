'use client'
import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import AutomataVisualizer from '@/components/AutomataVisualizer';
import QuintupleDisplay from '@/components/QuintupleDisplay';
import { convertToRegex, simplifyRegex } from '@/lib/utils';

export default function Home() {
    const [automata, setAutomata] = useState(null);
    const [regex, setRegex] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const calculateRegex = () => {
        if (!automata) {
            alert('Debes cargar un autómata para obtener su expresión regular');
            return;
        }
        
        setIsProcessing(true);
        try {
            const result = convertToRegex(automata);
            const simplified = simplifyRegex(result);
            setRegex(simplified);
        } catch (error) {
            console.error('Error al calcular la expresión regular:', error);
            alert('Error al calcular la expresión regular del autómata: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileUpload = (data) => {
        if (validateAutomata(data)) {
            setAutomata(data);
            // Limpiar cualquier expresión regular previa
            setRegex(null);
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

    return (
        <main className="container mx-auto px-4 py-8 bg-white">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-10 py-8">
                    <h1 className="text-5xl font-bold text-blue-800 mb-4">Visualizador de Autómatas</h1>
                    <p className="text-xl text-gray-600">Carga un archivo JSON con una quíntupla para generar y visualizar tu autómata</p>
                </header>
                
                <div className="bg-white rounded-lg shadow-md p-8 mb-10">
                    <h2 className="text-2xl font-semibold text-blue-700 mb-4">
                        Subir Archivo JSON
                    </h2>
                    <p className="text-gray-600 mb-6">
                        El archivo debe contener la representación de la quíntupla (Q, Σ, δ, q0, F) en formato JSON.
                    </p>
                    <FileUpload onFileUpload={handleFileUpload} />
                </div>

                {automata && (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-xl font-semibold mb-4 text-blue-700">
                                    Quíntupla
                                </h2>
                                <QuintupleDisplay automata={automata} />
                            </div>
                            
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-xl font-semibold mb-4 text-blue-700">
                                    Representación Visual
                                </h2>
                                <div className="border border-gray-200 rounded-md overflow-hidden">
                                    <AutomataVisualizer automata={automata} />
                                </div>
                            </div>
                        </div>

                        {/* Botón para calcular la expresión regular */}
                        <div className="flex justify-center mb-8">
                            <button
                                onClick={calculateRegex}
                                disabled={isProcessing}
                                className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? 'Procesando...' : 'Obtener Expresión Regular'}
                            </button>
                        </div>
                    </>
                )}
                
                {regex && (
                    <div className="bg-white rounded-lg shadow-md p-6 mt-8">
                        <h2 className="text-2xl font-semibold mb-4 text-green-700 flex items-center">
                            Expresión Regular Equivalente
                        </h2>
                        <div className="bg-gray-50 p-4 rounded-md mb-4">
                            <p className="text-lg font-medium text-gray-800 break-words">{regex}</p>
                        </div>
                        <div className="text-sm text-gray-600">
                            <p>Derivada utilizando el Lema de Arden</p>
                            <p className="mt-1">Esta expresión regular describe exactamente el mismo lenguaje que el autómata.</p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
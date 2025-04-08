import React from 'react';

const QuintupleDisplay = ({ automata }) => {
    if (!automata) return null;

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-blue-700 mb-4">Quíntupla (Q, Σ, δ, q0, F)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-600 mb-1">Q (Estados):</p>
                    <div className="text-sm text-black bg-white px-3 py-2 rounded border border-gray-200">
                        {`{${automata.states.join(', ')}}`}
                    </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-600 mb-1">Σ (Alfabeto):</p>
                    <div className="text-sm text-black bg-white px-3 py-2 rounded border border-gray-200">
                        {`{${automata.alphabet.join(', ')}}`}
                    </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md col-span-1 md:col-span-2">
                    <p className="text-sm font-medium text-gray-600 mb-1">δ (Transiciones):</p>
                    <div className="text-sm text-black bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="border border-gray-300 px-4 py-2 bg-gray-100">Estado</th>
                                    {automata.alphabet.map(symbol => (
                                        <th key={symbol} className="border border-gray-300 px-4 py-2 bg-gray-100">
                                            {symbol}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {automata.states.map(state => (
                                    <tr key={state}>
                                        <td className="border border-gray-300 px-4 py-2 font-medium">
                                            {state}{automata.initialState === state ? ' *' : ''}
                                            {automata.finalStates.includes(state) ? ' †' : ''}
                                        </td>
                                        {automata.alphabet.map(symbol => {
                                            const transition = automata.transitions.find(
                                                t => t.from === state && t.symbol === symbol
                                            );
                                            return (
                                                <td key={`${state}-${symbol}`} className="border border-gray-300 px-4 py-2 text-center">
                                                    {transition ? transition.to : '-'}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="mt-2 text-xs text-gray-500">
                            <span className="mr-4">* Estado inicial</span>
                            <span>† Estado final</span>
                        </div>
                    </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-600 mb-1">q0 (Estado inicial):</p>
                    <div className="text-sm text-black bg-white px-3 py-2 rounded border border-gray-200">
                        {automata.initialState}
                    </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-600 mb-1">F (Estados finales):</p>
                    <div className="text-sm text-black bg-white px-3 py-2 rounded border border-gray-200">
                        {`{${automata.finalStates.join(', ')}}`}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuintupleDisplay;
'use client'
import React, { useState, useRef } from 'react';

const FileUpload = ({ onFileUpload }) => {
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        processFile(file);
    };

    const processFile = (file) => {
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target.result);
                    onFileUpload(json);
                    setError('');
                } catch (err) {
                    setError('Archivo JSON inválido. Por favor sube una representación de quíntupla válida.');
                }
            };
            reader.readAsText(file);
        }
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        const file = e.dataTransfer.files[0];
        processFile(file);
    };

    const openFileDialog = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="w-full">
            <div 
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center cursor-pointer transition-all ${
                    isDragging 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={openFileDialog}
            >
                <input 
                    type="file" 
                    accept=".json" 
                    ref={fileInputRef}
                    onChange={handleFileChange} 
                    className="hidden" 
                />
                
                <svg 
                    className="w-12 h-12 text-gray-400 mb-3" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                    />
                </svg>
                
                <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Haz clic para explorar</span> o arrastra y suelta
                </p>
                <p className="text-xs text-gray-500">Solo archivos JSON</p>
                
                {fileName && (
                    <div className="mt-4 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {fileName}
                    </div>
                )}
            </div>
            
            {error && (
                <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                    <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {error}
                </div>
            )}
        </div>
    );
};

export default FileUpload;
'use client'
import React from 'react';

const DownloadOptions = ({ onDownloadQuintuple, onDownloadImage }) => {
  return (
    <div className="flex justify-end mb-3 space-x-2">
      <button 
        onClick={onDownloadQuintuple}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md flex items-center transition-colors shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Descargar Quíntupla
      </button>
      <button 
        onClick={onDownloadImage}
        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md flex items-center transition-colors shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Descargar Imagen
      </button>
    </div>
  );
};

export default DownloadOptions;
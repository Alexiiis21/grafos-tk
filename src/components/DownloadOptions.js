import React from "react";

const DownloadOptions = ({ onDownloadGraph, onDownloadImage }) => {
  return (
    <div className="download-options">
      <button
        onClick={onDownloadGraph}
        className="btn download-btn"
        title="Descargar grafo en formato JSON"
      >
        Descargar Grafo
      </button>
      <button
        onClick={onDownloadImage}
        className="btn download-btn"
        title="Descargar imagen del grafo"
      >
        Descargar Imagen
      </button>
    </div>
  );
};

export default DownloadOptions;
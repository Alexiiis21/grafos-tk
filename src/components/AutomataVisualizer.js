"use client";
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { toPng } from "html-to-image";
import DownloadOptions from "./DownloadOptions";

const AutomataVisualizer = ({ automata }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // Función para normalizar la estructura (soporta ambos formatos)
  const normalizeStructure = (data) => {
    // Si ya tiene el formato de autómata
    if (data.states && data.transitions) {
      return data;
    }
    
    // Si está en formato de grafo, convertirlo a formato autómata
    if (data.nodes && data.edges) {
      return {
        states: data.nodes.map(node => node.id),
        initialState: data.nodes.find(node => node.isInitial)?.id || '',
        finalStates: data.nodes.filter(node => node.isFinal).map(node => node.id),
        transitions: data.edges.map(edge => ({
          from: edge.source,
          to: edge.target,
          symbol: edge.label || ''
        }))
      };
    }
    
    // Si no es ninguno de los dos formatos, devolver un objeto vacío
    return { states: [], initialState: '', finalStates: [], transitions: [] };
  };

  // Función para descargar la quíntupla como JSON
  const downloadQuintuple = () => {
    if (!automata) return;

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(automata, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "automata.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Función para descargar la imagen del autómata
  const downloadImage = () => {
    if (!svgRef.current) return;

    toPng(svgRef.current)
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = "automata.png";
        link.href = dataUrl;
        link.click();
      })
      .catch((error) => {
        console.error("Error generando imagen:", error);
        alert(
          "Hubo un error al generar la imagen. Por favor intenta de nuevo."
        );
      });
  };

  useEffect(() => {
    if (!automata || !svgRef.current) return;

    // Normalizar la estructura para asegurar compatibilidad con ambos formatos
    const normalizedData = normalizeStructure(automata);
    
    // Si no hay estados, no renderizar
    if (normalizedData.states.length === 0) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 500;
    const nodeRadius = 30;

    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const g = svg.append("g");

    const simulation = d3
      .forceSimulation()
      .force(
        "link",
        d3
          .forceLink()
          .id((d) => d.id)
          .distance(180)
      )
      .force("charge", d3.forceManyBody().strength(-800))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(nodeRadius * 2));

    const nodes = normalizedData.states.map((state) => ({
      id: state,
      isInitial: state === normalizedData.initialState,
      isFinal: normalizedData.finalStates.includes(state),
    }));

    const links = [];
    const transitionLabels = {};

    // Organizar transiciones múltiples entre los mismos estados
    normalizedData.transitions.forEach((t) => {
      const linkKey = `${t.from}-${t.to}`;
      
      if (transitionLabels[linkKey]) {
        // Si ya existe una transición entre estos estados, concatenar los símbolos
        transitionLabels[linkKey] += `, ${t.symbol}`;
      } else {
        // Si es la primera transición, inicializar la etiqueta
        transitionLabels[linkKey] = t.symbol;
        links.push({
          id: linkKey,
          source: t.from,
          target: t.to,
          isSelfLoop: t.from === t.to
        });
      }
    });

    const defs = g.append("defs");

    // Gradientes para los nodos
    const nodeGradient = defs
      .append("linearGradient")
      .attr("id", "nodeGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "100%");

    nodeGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#67B7D1");

    nodeGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#4891D9");

    const finalStateGradient = defs
      .append("linearGradient")
      .attr("id", "finalStateGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "100%");

    finalStateGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#FAD02E");

    finalStateGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#F9A826");

    // Marcadores de flecha
    defs
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#555");

    // Crear enlaces
    const linkGroup = g.append("g").attr("class", "links");

    const link = linkGroup
      .selectAll("g")
      .data(links)
      .enter()
      .append("g")
      .attr("class", "link");

    const path = link
      .append("path")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2)
      .attr("fill", "none")
      .attr("marker-end", "url(#arrowhead)")
      .attr("class", "transition-path");

    // Crear etiquetas de transición
    const labelGroup = g.append("g").attr("class", "transition-labels");

    const linkLabels = labelGroup
      .selectAll("text")
      .data(links)
      .enter()
      .append("text")
      .attr("class", "transition-label")
      .attr("dy", -8)
      .attr("font-size", 14)
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .attr("fill", "#333")
      .text(d => transitionLabels[d.id]);
    
    // Añadir fondo a las etiquetas para mejor legibilidad
    try {
      linkLabels.each(function() {
        const bbox = this.getBBox();
        labelGroup.insert("rect", "text")
          .attr("x", bbox.x - 2)
          .attr("y", bbox.y - 2)
          .attr("width", bbox.width + 4)
          .attr("height", bbox.height + 4)
          .attr("fill", "white")
          .attr("opacity", 0.7)
          .attr("rx", 2);
      });
    } catch(e) {
      console.log("Error al obtener bbox:", e);
    }

    // Crear nodos
    const nodeGroup = g.append("g").attr("class", "nodes");

    const node = nodeGroup
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    // Sombra de los nodos
    node
      .append("circle")
      .attr("r", nodeRadius + 2)
      .attr("fill", "#000")
      .attr("opacity", 0.3)
      .attr("transform", "translate(3, 3)");

    // Círculo principal del nodo
    node
      .append("circle")
      .attr("r", nodeRadius)
      .attr("fill", (d) =>
        d.isFinal ? "url(#finalStateGradient)" : "url(#nodeGradient)"
      )
      .attr("stroke", "#2D3748")
      .attr("stroke-width", 2);

    // Círculo adicional para estados finales
    node
      .filter((d) => d.isFinal)
      .append("circle")
      .attr("r", nodeRadius - 6)
      .attr("stroke", "#2D3748")
      .attr("stroke-width", 2)
      .attr("fill", "none");

    // Flecha para estado inicial
    node
      .filter((d) => d.isInitial)
      .each(function (d) {
        g.append("path")
          .attr("class", "initial-arrow")
          .attr("d", `M0,0 L0,0`)
          .attr("stroke", "#2D3748")
          .attr("stroke-width", 2.5)
          .attr("marker-end", "url(#initial-arrow)")
          .datum(d);
      });

    // Texto del nodo
    node
      .append("text")
      .text((d) => d.id)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("font-size", 14)
      .attr("font-weight", "bold")
      .attr("font-family", "Arial, sans-serif")
      .attr("fill", "#fff")
      .attr("pointer-events", "none");

    // Función de actualización en cada tick de la simulación
    simulation.nodes(nodes).on("tick", () => {
      // Actualizar posición de los enlaces
      path.attr("d", (d) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
      
        if (d.isSelfLoop) {
          // Dibujar bucle para auto-transiciones
          const rx = nodeRadius * 1.8,  
                ry = nodeRadius * 1.8;
          
          return `M${d.source.x},${d.source.y - nodeRadius} 
                  A${rx},${ry} 0 1,1 ${d.source.x + nodeRadius * 0.7},${d.source.y - nodeRadius * 0.7}`;
        }
      
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) return "M0,0 L0,0";

        // Calcular punto final para que la flecha no entre en el nodo
        const unitX = dx / length;
        const unitY = dy / length;
        const margin = 5;
        const targetX = d.target.x - unitX * (nodeRadius + margin);
        const targetY = d.target.y - unitY * (nodeRadius + margin);

        return `M${d.source.x},${d.source.y} A${dr * 1.2},${dr * 1.2} 0 0,1 ${targetX},${targetY}`;
      });

      // Actualizar posición de las etiquetas
      linkLabels
        .attr("x", d => {
          if (d.isSelfLoop) {
            return d.source.x;
          } else {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            return d.source.x + dx/2 + (dy !== 0 ? 15 * dy/Math.abs(dy) : 0);
          }
        })
        .attr("y", d => {
          if (d.isSelfLoop) {
            return d.source.y - nodeRadius * 2.5;
          } else {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            return d.source.y + dy/2 - (dx !== 0 ? 15 * dx/Math.abs(dx) : 0);
          }
        });
    
      // Actualizar fondos de las etiquetas
      try {
        labelGroup.selectAll("rect").each(function(_, i) {
          const text = labelGroup.selectAll("text").nodes()[i];
          const bbox = text.getBBox();
          d3.select(this)
            .attr("x", bbox.x - 2)
            .attr("y", bbox.y - 2)
            .attr("width", bbox.width + 4)
            .attr("height", bbox.height + 4);
        });
      } catch(e) {}

      // Actualizar posición de los nodos
      node.attr("transform", (d) => `translate(${d.x}, ${d.y})`);

      // Actualizar posición de las flechas de estado inicial
      g.selectAll(".initial-arrow").attr("d", (d) => {
        const angle = Math.PI;
        const startX = d.x - nodeRadius - 40;
        const startY = d.y;
        const endX = d.x - nodeRadius - 10;
        const endY = d.y;
        return `M${startX},${startY} L${endX},${endY}`;
      });
    });

    simulation.force("link").links(links);

    // Funciones para arrastrar nodos
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
    }

    // Controles de zoom
    const controls = svg
      .append("g")
      .attr("transform", "translate(20, 20)")
      .attr("class", "controls");

    controls
      .append("rect")
      .attr("width", 100)
      .attr("height", 70)
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("fill", "white")
      .attr("stroke", "#ddd");

    controls
      .append("text")
      .attr("x", 50)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .text("Zoom Controls");

    const zoomIn = controls.append("g").attr("transform", "translate(25, 40)");
    zoomIn
      .append("circle")
      .attr("r", 10)
      .attr("fill", "#eee")
      .attr("stroke", "#ddd");
    zoomIn.append("text").attr("text-anchor", "middle").attr("dy", 4).text("+");
    zoomIn.style("cursor", "pointer");
    zoomIn.on("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 1.3);
    });

    const zoomOut = controls.append("g").attr("transform", "translate(75, 40)");
    zoomOut
      .append("circle")
      .attr("r", 10)
      .attr("fill", "#eee")
      .attr("stroke", "#ddd");
    zoomOut
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .text("-");
    zoomOut.style("cursor", "pointer");
    zoomOut.on("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 0.7);
    });

    // Zoom inicial automático
    setTimeout(() => {
      svg
        .transition()
        .duration(500)
        .call(
          zoom.transform,
          d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(0.9)
            .translate(-width / 2, -height / 2)
        );
    }, 200);
  }, [automata]);

  return (
    <div className="automata-visualizer" ref={containerRef}>
      <DownloadOptions
        onDownloadQuintuple={downloadQuintuple}
        onDownloadImage={downloadImage}
      />
      <svg
        ref={svgRef}
        width="100%"
        height="600"
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          background: "linear-gradient(to bottom right, #f8f9fa, #e9ecef)",
        }}
      ></svg>
    </div>
  );
};

export default AutomataVisualizer;
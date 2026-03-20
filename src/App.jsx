import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell, ResponsiveContainer,
  AreaChart, Area, ReferenceLine
} from 'recharts';
import { BookOpen, BarChart2, ShieldAlert, Zap, Target, Grid } from 'lucide-react';

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [isApiSet, setIsApiSet] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultsData, setResultsData] = useState(null);
  const [activeTab, setActiveTab] = useState('analisis'); 
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isApiSet) {
      setMessages([
        { role: 'model', text: 'INICIANDO PROTOCOLO ESTRATÉGICO (ACOSTA-FLORES & NASH)...' },
        { role: 'model', text: 'Soy tu Analista Estratégico Experto. Mi objetivo es mapear tu situación utilizando la Teoría de Decisiones bajo Riesgo (Equivalentes Bajo Certeza) y la Teoría de Juegos.\n\nPor favor, descríbeme tu escenario con el mayor detalle posible. ¿Quiénes son los jugadores, cuál es el conflicto principal (ej. el escenario del divorcio, el exesposo, etc.) y qué está en juego?' }
      ]);
    }
  }, [isApiSet]);

  const systemPrompt = `Eres un "Analista Estratégico Experto", una IA implacable especializada en la Teoría de Decisiones de Acosta-Flores y el Equilibrio de Nash.

TU OBJETIVO:
1. El usuario presentará un escenario complejo.
2. Haz preguntas asertivas y crudas para averiguar: Asimetría de información, verdaderos incentivos (Utilidad) y riesgos reales (legales, físicos, financieros).
3. Evalúa si el usuario muestra aversión o propensión al riesgo para calcular teóricamente su "Equivalente Bajo Certeza" (EBC).
4. Cuando tengas el panorama claro, emite tu veredicto final devolviendo ÚNICAMENTE un bloque JSON.

REGLAS ESTRICTAS DEL JSON PARA LA MATRIZ DE JUEGO (¡CUMPLIMIENTO OBLIGATORIO!):
- La "matriz_juego" DEBE ser un array de EXACTAMENTE 4 objetos. Esto simula un tablero 2x2.
- Debes usar exactamente 2 estrategias para el usuario ("tu_estrategia") y 2 para el rival ("rival_estrategia").
- Solo UNA combinación debe tener "es_nash": true. Las otras tres deben ser falsas.
- Usa números enteros del 0 al 100 para "tu_utilidad" y "rival_utilidad".

FORMATO EXACTO REQUERIDO PARA EL VEREDICTO FINAL:
{
  "status": "completed",
  "analisis_texto": "Escribe aquí tu análisis profundo. Menciona explícitamente el concepto de Equivalente Bajo Certeza aplicado a su nivel de riesgo y explica cuál es el Equilibrio de Nash en su tablero actual. Sé directo y dile qué decisión debe tomar.",
  "graficas": {
    "nivel_riesgo": 85, 
    "utilidad_esperada": [
      {"estrategia": "Opción Conservadora", "valor": 80},
      {"estrategia": "Opción Agresiva", "valor": 20},
      {"estrategia": "Retirada Estratégica", "valor": 95}
    ],
    "matriz_juego": [
      {"tu_estrategia": "Ceder / Negociar", "rival_estrategia": "Ceder / Negociar", "tu_utilidad": 70, "rival_utilidad": 70, "es_nash": false},
      {"tu_estrategia": "Ceder / Negociar", "rival_estrategia": "Atacar / Exigir", "tu_utilidad": 10, "rival_utilidad": 100, "es_nash": false},
      {"tu_estrategia": "Atacar / Exigir", "rival_estrategia": "Ceder / Negociar", "tu_utilidad": 100, "rival_utilidad": 10, "es_nash": false},
      {"tu_estrategia": "Atacar / Exigir", "rival_estrategia": "Atacar / Exigir", "tu_utilidad": 30, "rival_utilidad": 30, "es_nash": true}
    ]
  }
}`;

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: newMessages.map(msg => ({ role: msg.role === 'model' ? 'model' : 'user', parts: [{ text: msg.text }] }))
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      let botReply = data.candidates[0].content.parts[0].text;

      try {
        let cleanText = botReply.replace(/```json/gi, '').replace(/```/g, '').trim();
        const startIndex = cleanText.indexOf('{');
        const endIndex = cleanText.lastIndexOf('}');
        
        if (startIndex !== -1 && endIndex !== -1) {
          const jsonStr = cleanText.substring(startIndex, endIndex + 1);
          const parsedData = JSON.parse(jsonStr);
          
          if (parsedData.status === 'completed' && parsedData.graficas && parsedData.graficas.matriz_juego) {
            
            // Sanitización y validación estricta
            const sanitizedData = {
              ...parsedData,
              graficas: {
                ...parsedData.graficas,
                nivel_riesgo: Number(parsedData.graficas.nivel_riesgo) || 0,
                utilidad_esperada: parsedData.graficas.utilidad_esperada.map(item => ({
                  estrategia: String(item.estrategia),
                  valor: Number(item.valor) || 0
                })),
                matriz_juego: parsedData.graficas.matriz_juego.map(item => ({
                  tu_estrategia: String(item.tu_estrategia),
                  rival_estrategia: String(item.rival_estrategia),
                  tu_utilidad: Number(item.tu_utilidad) || 0,
                  rival_utilidad: Number(item.rival_utilidad) || 0,
                  es_nash: Boolean(item.es_nash)
                }))
              }
            };

            setResultsData(sanitizedData);
            setMessages([...newMessages, { role: 'model', text: '✅ ANÁLISIS ESTRATÉGICO COMPLETADO. Renderizando matrices y gráficas en el panel derecho...' }]);
            setActiveTab('analisis');
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("Error parseando JSON:", e);
      }
      setMessages([...newMessages, { role: 'model', text: botReply }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'model', text: `⚠️ ERROR: ${error.message}.` }]);
    }
    setLoading(false);
  };

  // NUEVA FÓRMULA: Curva exponencial de crecimiento. x de 0 a 100.
  // A mayor X, la curva sube violentamente (representando mayor exposición al riesgo).
  const renderDataGrowth = Array.from({length: 21}, (_, i) => ({ 
    x: i * 5, 
    y: Math.pow((i * 5), 2) / 100 
  }));

  if (!isApiSet) {
    return (
      <div className="bg-[#050505] text-cyan-400 p-8 font-mono h-screen flex flex-col items-center justify-center relative overflow-y-auto">
        <div className="z-10 bg-[#0a0f16] p-8 rounded-xl border border-gray-800 max-w-xl w-full shadow-[0_0_20px_rgba(0,200,255,0.15)]">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 text-white tracking-wider">TEORÍA DE <span className="text-cyan-500">JUEGOS</span></h1>
            <p className="text-sm text-gray-400 font-bold tracking-widest uppercase mt-2">Motor de Decisiones Acosta-Flores & Nash</p>
          </div>

          <div className="mb-8 p-5 border border-cyan-900/50 rounded-lg bg-cyan-950/10">
            <h2 className="text-cyan-500 font-bold uppercase tracking-widest text-sm mb-3 flex items-center gap-2">
              <ShieldAlert size={16} /> SISTEMA DE CÁLCULO ESTADÍSTICO
            </h2>
            <p className="text-gray-300 text-xs leading-relaxed">
              Esta herramienta utiliza IA para modelar situaciones de riesgo, incertidumbre y asimetría de información. Evalúa decisiones mediante el cálculo de "Equivalentes Bajo Certeza" e identifica el "Equilibrio de Nash" en conflictos interpersonales o de negocios.
            </p>
          </div>

          <input 
            type="password" 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)} 
            onKeyDown={(e) => { if (e.key === 'Enter') setIsApiSet(true); }}
            className="bg-black text-white p-3 w-full rounded border border-gray-700 mb-4 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
            placeholder="Ingresa tu API Key de Gemini"
          />
          <button onClick={() => setIsApiSet(true)} className="bg-cyan-950/30 border border-cyan-500 text-cyan-400 px-6 py-3 w-full font-bold hover:bg-cyan-500 hover:text-black transition-all uppercase tracking-widest shadow-[0_0_10px_rgba(0,255,255,0.2)] hover:shadow-[0_0_20px_rgba(0,255,255,0.6)]">
            INICIALIZAR MOTOR LÓGICO
          </button>
        </div>
      </div>
    );
  }

  // COMPONENTE: MATRIZ DE JUEGO 2x2 CUSTOM
  const renderMatrizJuego = (data) => {
    if (!data || data.length !== 4) return <div className="text-red-500 flex h-full items-center justify-center text-xs">Error: La matriz requiere exactamente 4 cuadrantes.</div>;
    
    // Extraer estrategias únicas
    const tusEstrategias = [...new Set(data.map(d => d.tu_estrategia))];
    const rivalEstrategias = [...new Set(data.map(d => d.rival_estrategia))];

    if (tusEstrategias.length !== 2 || rivalEstrategias.length !== 2) {
      return <div className="text-red-500 flex h-full items-center justify-center text-xs">Alineación de datos incorrecta. El agente no devolvió un formato 2x2 puro.</div>;
    }

    const getCell = (tuEst, rivEst) => data.find(d => d.tu_estrategia === tuEst && d.rival_estrategia === rivEst);

    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-2">
        
        {/* Leyenda de Colores */}
        <div className="flex gap-4 mb-4 text-[10px] uppercase font-bold tracking-widest">
          <span className="flex items-center gap-1"><div className="w-2 h-2 bg-cyan-500 rounded-full"></div> Tu Utilidad</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 bg-purple-500 rounded-full"></div> Utilidad Rival</span>
        </div>

        <div className="grid grid-cols-[auto_1fr_1fr] grid-rows-[auto_1fr_1fr] gap-2 w-full max-w-lg">
          {/* Header Vacío */}
          <div></div>
          
          {/* Headers Rival (Columnas) */}
          <div className="text-center font-bold text-purple-400 text-xs flex flex-col justify-end pb-2">
            <span className="opacity-50 text-[9px] block mb-1">RIVAL JUEGA:</span>
            {rivalEstrategias[0]}
          </div>
          <div className="text-center font-bold text-purple-400 text-xs flex flex-col justify-end pb-2">
            <span className="opacity-50 text-[9px] block mb-1">RIVAL JUEGA:</span>
            {rivalEstrategias[1]}
          </div>

          {/* Fila 1 */}
          <div className="text-right font-bold text-cyan-400 text-xs flex items-center justify-end pr-3">
            <div>
              <span className="opacity-50 text-[9px] block mb-1">TÚ JUEGAS:</span>
              {tusEstrategias[0]}
            </div>
          </div>
          <MatrizCell cell={getCell(tusEstrategias[0], rivalEstrategias[0])} />
          <MatrizCell cell={getCell(tusEstrategias[0], rivalEstrategias[1])} />

          {/* Fila 2 */}
          <div className="text-right font-bold text-cyan-400 text-xs flex items-center justify-end pr-3">
            <div>
              <span className="opacity-50 text-[9px] block mb-1">TÚ JUEGAS:</span>
              {tusEstrategias[1]}
            </div>
          </div>
          <MatrizCell cell={getCell(tusEstrategias[1], rivalEstrategias[0])} />
          <MatrizCell cell={getCell(tusEstrategias[1], rivalEstrategias[1])} />
        </div>
      </div>
    );
  };

  const MatrizCell = ({ cell }) => {
    if (!cell) return <div className="bg-gray-900 border border-gray-800 rounded-lg"></div>;
    const isNash = cell.es_nash;
    
    return (
      <div className={`relative p-4 rounded-xl border flex flex-col items-center justify-center min-h-[90px] transition-all duration-300 ${
        isNash 
          ? 'border-yellow-400 bg-yellow-900/20 shadow-[0_0_20px_rgba(255,255,0,0.15)] scale-105 z-10' 
          : 'border-gray-800 bg-gray-900/40 hover:bg-gray-800/60'
      }`}>
        {isNash && (
          <div className="absolute -top-3 bg-yellow-400 text-black text-[9px] px-2 py-0.5 font-bold uppercase tracking-widest rounded-sm">
            EQUILIBRIO NASH
          </div>
        )}
        <div className="flex items-center gap-3 text-lg font-bold">
          <span className="text-cyan-400 drop-shadow-[0_0_5px_rgba(0,200,255,0.5)]">{cell.tu_utilidad}</span>
          <span className="text-gray-600">,</span>
          <span className="text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">{cell.rival_utilidad}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#050505] text-cyan-400 font-mono overflow-hidden">
      
      {/* PANEL IZQUIERDO: CHAT */}
      <div className="w-full md:w-2/5 h-[40vh] md:h-full p-4 flex flex-col border-b md:border-b-0 md:border-r border-gray-800 bg-[#080b10]">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-800">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Interfaz del Analista</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto mb-4 pr-2 space-y-4 custom-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 max-w-[90%] text-sm whitespace-pre-wrap leading-relaxed shadow-md ${m.role === 'user' ? 'bg-cyan-950/40 text-cyan-100 border border-cyan-800/50 rounded-2xl rounded-tr-sm' : 'bg-[#101520] text-gray-300 border border-gray-800 rounded-2xl rounded-tl-sm'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && <div className="text-cyan-500/70 animate-pulse text-xs tracking-widest uppercase flex items-center gap-2"><div className="w-1 h-1 bg-cyan-500 rounded-full"></div> Procesando variables...</div>}
          <div ref={chatEndRef} />
        </div>
        
        <div className="flex bg-[#050505] border border-gray-800 p-1.5 rounded-lg focus-within:border-cyan-800 transition-colors">
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            placeholder="Describe la situación o responde a las variables..."
            className="flex-1 bg-transparent text-gray-200 p-2 focus:outline-none text-sm placeholder-gray-600"
          />
          <button onClick={handleSend} disabled={loading} className="bg-cyan-900/30 text-cyan-400 px-5 py-2 rounded border border-transparent hover:border-cyan-500 hover:bg-cyan-500 hover:text-black transition-all font-bold">
            ENVIAR
          </button>
        </div>
      </div>

      {/* PANEL DERECHO: DASHBOARD & REFERENCIAS */}
      <div className="w-full md:w-3/5 h-[60vh] md:h-full flex flex-col bg-[#020202] relative">
        
        {/* TABS HEADER */}
        <div className="flex border-b border-gray-800 bg-[#050505] shrink-0">
          <button 
            onClick={() => setActiveTab('analisis')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'analisis' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-950/10' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <BarChart2 size={16} /> Tablero de Análisis
          </button>
          <button 
            onClick={() => setActiveTab('referencias')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'referencias' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-950/10' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <BookOpen size={16} /> Referencias y DOIs
          </button>
        </div>

        {/* CONTENIDO DE LOS TABS */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          
          {/* TAB: ANÁLISIS */}
          {activeTab === 'analisis' && (
            resultsData ? (
              <div className="max-w-4xl mx-auto space-y-6 pb-10 animate-fade-in">
                
                {/* Veredicto de Texto */}
                <div className="bg-[#0a0f16] border border-cyan-900/40 rounded-xl p-6 shadow-[0_0_15px_rgba(0,200,255,0.05)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                  <h3 className="text-cyan-500 font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                    <Target size={18} /> Veredicto Estratégico
                  </h3>
                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {resultsData.analisis_texto}
                  </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  
                  {/* Gráfica 1: Exposición al Riesgo (Corregida: Sube) */}
                  <Card title="Nivel de Riesgo (Incertidumbre)" icon={<ShieldAlert size={16}/>}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={renderDataGrowth} margin={{ top: 20, right: 10, bottom: 20, left: 10 }}>
                        <XAxis dataKey="x" type="number" domain={[0, 100]} hide />
                        <Area type="monotone" dataKey="y" stroke="#ff0055" fill="url(#colorRiesgo)" fillOpacity={0.3} strokeWidth={2}/>
                        <defs>
                          <linearGradient id="colorRiesgo" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff0055" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ff0055" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <ReferenceLine x={30} stroke="rgba(255,255,255,0.1)" label={{ position: 'insideBottom', value: 'Seguro', fill: '#666', fontSize: 10 }} />
                        <ReferenceLine x={70} stroke="rgba(255,255,255,0.1)" label={{ position: 'insideBottom', value: 'Peligro', fill: '#666', fontSize: 10 }} />
                        <ReferenceLine x={resultsData.graficas.nivel_riesgo} stroke="#00ccff" strokeWidth={2} strokeDasharray="3 3" label={{ position: 'top', value: `TU RIESGO: ${resultsData.graficas.nivel_riesgo}%`, fill: '#00ccff', fontSize: 12, fontWeight: 'bold' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Gráfica 2: Utilidad Esperada de Estrategias (Eje Y ampliado) */}
                  <Card title="Utilidad Esperada por Estrategia" icon={<Zap size={16}/>}>
                    <ResponsiveContainer width="100%" height="100%">
                      {/* width=160 garantiza que el texto largo no se corte */}
                      <BarChart data={resultsData.graficas.utilidad_esperada} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} stroke="#444" tick={{ fill: '#888', fontSize: 10 }} />
                        <YAxis dataKey="estrategia" type="category" stroke="#fff" width={160} tick={{ fill: '#ccc', fontSize: 11 }} />
                        <RechartsTooltip cursor={{fill: '#111'}} contentStyle={{backgroundColor: '#000', borderColor: '#333', fontSize: '12px'}}/>
                        <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                          {resultsData.graficas.utilidad_esperada.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.valor > 60 ? '#00ccff' : entry.valor > 30 ? '#bb00ff' : '#ff0055'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Gráfica 3: MATRIZ DE JUEGO (Tablero 2x2) */}
                  <div className="col-span-1 xl:col-span-2">
                    <Card title="Matriz de Juego (Teoría de Juegos)" icon={<Grid size={16}/>}>
                      {renderMatrizJuego(resultsData.graficas.matriz_juego)}
                    </Card>
                  </div>

                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-6 opacity-40">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-2 border-r-2 border-purple-500 rounded-full animate-spin reverse-spin"></div>
                  <div className="absolute inset-4 border-b-2 border-pink-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-white font-bold uppercase tracking-widest text-xs text-center leading-relaxed">
                  Esperando variables del entorno...<br/>Inicia la conversación en el panel izquierdo.
                </p>
              </div>
            )
          )}

          {/* TAB: REFERENCIAS Y BIBLIOGRAFÍA */}
          {activeTab === 'referencias' && (
            <div className="max-w-4xl mx-auto space-y-8 pb-10 animate-fade-in">
              
              <div className="text-center mb-8 border-b border-gray-800 pb-6">
                <h2 className="text-2xl font-bold text-white uppercase tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Fundamentos Matemáticos</h2>
                <p className="text-gray-400 text-sm mt-2">La lógica detrás de las recomendaciones estratégicas.</p>
              </div>

              {/* Referencia 1 */}
              <div className="bg-[#0a0f16] border-l-4 border-cyan-500 p-6 rounded-r-xl shadow-md hover:bg-[#0c131c] transition-colors">
                <h3 className="text-cyan-400 font-bold text-lg mb-1">Algoritmo interactivo para decisiones con varios objetivos, riesgo e incertidumbre (2021)</h3>
                <p className="text-xs text-gray-400 mb-4 font-bold tracking-widest">AUTOR: ACOSTA-FLORES, JOSÉ JESÚS | REVISTA: INGENIERÍA INVESTIGACIÓN Y TECNOLOGÍA</p>
                <p className="text-sm text-gray-300 leading-relaxed mb-4">
                  Expansión del algoritmo original introduciendo distribuciones de probabilidad normales y triangulares. Transforma problemas aleatorios en deterministas mediante "Equivalentes Bajo Certeza" (EBC) y "Permutas Compensatorias" para eliminar variables de dominancia en la toma de decisiones.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-1 rounded">DOI: 10.22201/fi.25940732e.2021.22.2.016</span>
                  <span className="text-[10px] bg-cyan-900/30 text-cyan-400 border border-cyan-800 px-2 py-1 rounded">Teoría de Decisiones</span>
                </div>
              </div>

              {/* Referencia 2 */}
              <div className="bg-[#0a0f16] border-l-4 border-purple-500 p-6 rounded-r-xl shadow-md hover:bg-[#0c131c] transition-colors">
                <h3 className="text-purple-400 font-bold text-lg mb-1">Algoritmo para analizar decisiones con objetivos múltiples bajo incertidumbre (2019)</h3>
                <p className="text-xs text-gray-400 mb-4 font-bold tracking-widest">AUTOR: ACOSTA-FLORES, JOSÉ JESÚS | REVISTA: INGENIERÍA INVESTIGACIÓN Y TECNOLOGÍA</p>
                <p className="text-sm text-gray-300 leading-relaxed mb-4">
                  Establece la base de la toma de decisiones bajo ignorancia estadística (incertidumbre) utilizando distribuciones uniformes. El método mapea el comportamiento del decisor (aversión, neutralidad o propensión al riesgo) basado en la metodología de Keeney y Raiffa.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-1 rounded">DOI: 10.22201/fi.25940732e.2019.20n1.010</span>
                  <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-1 rounded">ISSN: 2594-0732</span>
                </div>
              </div>

              {/* Referencia 3 */}
              <div className="bg-[#0a0f16] border-l-4 border-pink-500 p-6 rounded-r-xl shadow-md hover:bg-[#0c131c] transition-colors">
                <h3 className="text-pink-400 font-bold text-lg mb-1">Equilibrio de Nash y Teoría de Juegos No Cooperativos (1950)</h3>
                <p className="text-xs text-gray-400 mb-4 font-bold tracking-widest">AUTOR: JOHN FORBES NASH JR. | DISCIPLINA: MATEMÁTICAS APLICADAS / ECONOMÍA</p>
                <p className="text-sm text-gray-300 leading-relaxed mb-4">
                  Principio fundamental en el que, en un juego con múltiples jugadores, cada jugador conoce y ha adoptado su mejor estrategia asumiendo que conoce las estrategias de los demás. Un "Equilibrio de Nash" se alcanza cuando ningún jugador tiene incentivos para cambiar su estrategia unilateralmente.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-1 rounded">Premio Nobel (1994)</span>
                  <span className="text-[10px] bg-pink-900/30 text-pink-400 border border-pink-800 px-2 py-1 rounded">Matriz de Pagos</span>
                </div>
              </div>

              {/* Referencia 4: La Nueva Referencia Moderna Agregada */}
              <div className="bg-[#0a0f16] border-l-4 border-yellow-500 p-6 rounded-r-xl shadow-md hover:bg-[#0c131c] transition-colors">
                <h3 className="text-yellow-400 font-bold text-lg mb-1">El Arte de la Estrategia: La Teoría de Juegos como Guía para el Éxito en los Negocios y la Vida (2008)</h3>
                <p className="text-xs text-gray-400 mb-4 font-bold tracking-widest">AUTORES: AVINASH DIXIT & BARRY NALEBUFF | APLICACIÓN MODERNA</p>
                <p className="text-sm text-gray-300 leading-relaxed mb-4">
                  El estándar contemporáneo para aplicar la Teoría de Juegos y el Equilibrio de Nash fuera de la academia. Traduce la matemática pura en modelos de comportamiento predecibles para escenarios de divorcio, negociaciones salariales, subastas y supervivencia corporativa, introduciendo conceptos modernos como credibilidad, compromisos estratégicos y movimientos secuenciales.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-1 rounded">Economía Conductual</span>
                  <span className="text-[10px] bg-yellow-900/30 text-yellow-400 border border-yellow-800 px-2 py-1 rounded">Aplicación Práctica</span>
                </div>
              </div>

              {/* Referencia 5: La base del algoritmo de Acosta-Flores */}
              <div className="bg-[#0a0f16] border-l-4 border-emerald-500 p-6 rounded-r-xl shadow-md hover:bg-[#0c131c] transition-colors">
                <h3 className="text-emerald-400 font-bold text-lg mb-1">Decisions with Multiple Objectives: Preferences and Value Tradeoffs (1976)</h3>
                <p className="text-xs text-gray-400 mb-4 font-bold tracking-widest">AUTORES: KEENEY, R. L. & RAIFFA, H. | EDITORIAL: JOHN WILEY & SONS</p>
                <p className="text-sm text-gray-300 leading-relaxed mb-4">
                  La obra fundacional metodológica mencionada explícitamente y adaptada en los artículos de Acosta-Flores. Establece las bases matemáticas para modelar el riesgo, las funciones de utilidad de atributos múltiples y las permutas compensatorias en la toma de decisiones complejas.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-1 rounded">Teoría de la Utilidad</span>
                  <span className="text-[10px] bg-emerald-900/30 text-emerald-400 border border-emerald-800 px-2 py-1 rounded">Base del Algoritmo</span>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a2333; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #00cccc; }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .reverse-spin { animation-direction: reverse; animation-duration: 1.5s; }
      `}} />
    </div>
  );
}

function Card({ title, icon, children }) {
  return (
    <div className="bg-[#0a0f16] border border-gray-800 rounded-xl p-5 shadow-lg flex flex-col min-h-[300px] hover:border-cyan-900/50 transition-colors">
      <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2 border-b border-gray-800 pb-2">
        {icon} {title}
      </h3>
      <div className="flex-1 w-full relative min-h-[200px] flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
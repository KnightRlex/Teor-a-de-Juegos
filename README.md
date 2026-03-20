🧠 Motor Estratégico: Teoría de Decisiones & Equilibrio de Nash

Una aplicación web interactiva impulsada por Inteligencia Artificial (Gemini 2.5 Flash) que actúa como un Analista Estratégico Experto. La aplicación modela situaciones de la vida real (negocios, relaciones, conflictos laborales) utilizando matemáticas aplicadas para calcular la exposición al riesgo y predecir el comportamiento óptimo mediante la Teoría de Juegos.

Prueba: https://sites.google.com/view/teoriajuegos/p%C3%A1gina-principal

✨ Características Principales

🤖 Agente de IA Coercitivo: Un chat inteligente con un "System Prompt" estricto que entrevista al usuario para descubrir asimetrías de información, riesgos ocultos (legales, financieros, emocionales) y utilidades reales.

📈 Dashboard de Análisis Dinámico: Renderizado de gráficas en tiempo real (basado en el análisis JSON de la IA) que muestra el Nivel de Riesgo (Incertidumbre) y la Utilidad Esperada por estrategia.

♟️ Matriz de Juego 2x2 (Nash): Un tablero interactivo generado dinámicamente que cruza las estrategias del usuario con las del oponente, iluminando automáticamente la celda que representa el Equilibrio de Nash.

📚 Fundamento Académico: Una sección inmutable de referencias bibliográficas (DOIs) que sustentan la lógica del motor, incluyendo el Algoritmo de Acosta-Flores (2019, 2021), Keeney & Raiffa, y John F. Nash.

🎨 UI/UX Cyberpunk/Dashboard: Interfaz oscura de alto contraste diseñada con Tailwind CSS, completamente responsiva.

🛠️ Stack Tecnológico

Frontend Framework: React 18 + Vite

Estilos: Tailwind CSS

Gráficos: Recharts (AreaChart, BarChart)

Iconos: Lucide React

Inteligencia Artificial: Google Gemini API (Modelo gemini-2.5-flash)

⚙️ Instalación y Uso Local

Sigue estos pasos para correr el proyecto en tu máquina local:

1. Clonar el repositorio

git clone 

2. Instalar dependencias

npm install


3. Ejecutar el servidor de desarrollo

npm run dev


4. Uso de la Aplicación

Abre tu navegador en http://localhost:5173.

En la pantalla de inicio, ingresa tu API Key de Gemini (puedes obtener una gratuita en Google AI Studio).

En el panel izquierdo (Terminal de IA), describe tu escenario conflictivo detalladamente.

Responde a las preguntas del agente.

Observa cómo el panel derecho se actualiza con tu matriz de pagos y las gráficas de riesgo.

🧠 Base Teórica y Algoritmos

Este proyecto no es un simple chatbot. La IA está instruida para aplicar rigurosamente dos marcos teóricos:

*Análisis de Decisiones bajo Riesgo (Acosta-Flores): Evalúa si el usuario tiene aversión, propensión o neutralidad al riesgo para determinar su Equivalente Bajo Certeza (EBC).

*Teoría de Juegos No Cooperativos (John Nash): Simula un dilema donde los jugadores interactúan, asumiendo que el oponente también es racional y busca maximizar su utilidad. El sistema busca la estrategia donde ningún jugador tiene incentivos para cambiar su decisión unilateralmente.

⚠️ Descargo de Responsabilidad

Esta aplicación es una herramienta de simulación matemática y lógica con fines educativos y recreativos. Los consejos generados por la IA no constituyen asesoría legal, financiera ni psicológica profesional.
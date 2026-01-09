
Nombre del proyecto: Gorila
Arquitectura del Proyecto: capas orientada a videojuego
Enfoque: Game Loop clásico
Capas:
    - Presentación: Dibuja el estado actual del juego en el canvas.
    - Orquestación del Juego: Controla el Game Loop (update / render) y coordina las demás capas.
    - Reglas del Juego: Implementa la lógica del juego (movimiento, daño, spawns, etc.).
    - Modelo del Dominio (Entities): Representa las entidades del juego.
    - Configuración y Utilidades: Centraliza constantes y funciones auxiliares, evitando números mágicos.

Estructura de carpetas:
src/
  index.html
  main.js
  config/
  entities/
  game/
  libraries/
  style/
  systems/
  utils/
  
  


# Chang@ — Plataforma Inteligente para la Formalización y Protección Social del Trabajo

Proyecto desarrollado para la materia **Inteligencia Artificial Aplicada a Organizaciones** de la **Universidad Tecnológica Nacional — Facultad Regional Buenos Aires (UTN FRBA)**.

## Aplicación publicada

**Web:** https://ch1405041c0.github.io/ChangAI/

Chang@ es un prototipo funcional orientado a trabajadores independientes y personas que necesitan contratar servicios.

La propuesta busca integrar en una misma experiencia:

* publicación y búsqueda de servicios;
* matching entre clientes y trabajadores;
* historial laboral digital;
* formalización de trabajos;
* pagos;
* aportes y cobertura social;
* reputación;
* análisis de riesgo;
* memoria e información acumulada para mejorar futuras recomendaciones.

## Arquitectura

Chang@ fue diseñado bajo una arquitectura multiagente compuesta conceptualmente por:

1. **Agente de Captura:** registra trabajador, cliente, servicio y datos iniciales.
2. **Agente de Matching:** relaciona solicitudes con trabajadores adecuados.
3. **Agente de Pagos:** administra el flujo asociado al pago.
4. **Agente de Formalización:** contempla factura, categoría tributaria y registro.
5. **Agente de Aportes y Cobertura Social:** representa aportes y beneficios sociales.
6. **Agente de Riesgo:** analiza alertas e inconsistencias.
7. **Agente de Reputación:** construye indicadores a partir del historial.
8. **Agente de Aprendizaje:** utiliza información acumulada para mejorar futuras recomendaciones.

La versión web publicada funciona como demostrador del flujo y de la experiencia de usuario. Algunas integraciones transaccionales y componentes de la arquitectura objetivo se encuentran representados o simulados.

## Stack tecnológico

| Componente            | Tecnología                                                    |
| --------------------- | ------------------------------------------------------------- |
| Frontend              | HTML5, CSS3, JavaScript                                       |
| Publicación           | GitHub Pages                                                  |
| Control de versiones  | Git / GitHub                                                  |
| Memoria del prototipo | Estado local / localStorage                                   |
| IA del prototipo      | Motor de interpretación y matching basado en reglas y scoring |
| IA local evaluada     | Ollama + ornith:9b                                            |

## IA y procesamiento de solicitudes

La versión actual incluye lógica de análisis de solicitudes que permite interpretar texto ingresado por el usuario, identificar categorías de trabajo, estimar características de la solicitud y utilizar esa información dentro del proceso de matching.

El enfoque actual mantiene las decisiones de negocio bajo reglas determinísticas y verificables.

## LLM local — Ollama

Como parte de la evaluación de IA local se instaló y ejecutó **Ollama** utilizando el modelo:

`ornith:9b`

El modelo fue probado tanto de manera interactiva como mediante su API HTTP local.

Endpoint utilizado:

`http://localhost:11434/api/generate`

### Prueba de conectividad

Se realizó una llamada POST al servicio local solicitando una respuesta controlada.

Resultado:

```text
model: ornith:9b
response: OK
done: True
```

Esto confirmó que el modelo podía ser consumido programáticamente como servicio local.

### Prueba aplicada al dominio de Chang@

También se evaluó la interpretación de solicitudes expresadas en lenguaje natural.

Ejemplo:

```text
Necesito alguien que arregle una pérdida de agua debajo de la pileta mañana después de las 15.
```

El modelo produjo una salida estructurada equivalente a:

```json
{
  "categoria": "Plomería",
  "problema": "Pérdida de agua debajo de la pileta",
  "urgencia": "alta",
  "fecha": "",
  "franja_horaria": "después de las 15:00",
  "datos_faltantes": [
    "fecha exacta",
    "ciudad/ubicación"
  ],
  "confianza": 0.85
}
```

Durante las pruebas fue necesario proporcionar contexto de dominio para interpretar correctamente expresiones del español rioplatense y restringir las respuestas a la taxonomía utilizada por Chang@.

## Estado de integración del LLM

El LLM local fue **instalado, ejecutado y validado mediante API**, pero todavía **no se encuentra conectado directamente al frontend publicado en GitHub Pages**.

La arquitectura prevista es:

```text
Solicitud del usuario
        ↓
LLM local / capa de interpretación
        ↓
JSON estructurado
        ↓
Reglas de negocio
        ↓
Matching
        ↓
Resultado
        ↓
Memoria / historial
```

Esta separación busca evitar que decisiones sensibles —por ejemplo pagos, reputación o información fiscal— dependan exclusivamente de una respuesta generativa.

El motor actual puede mantenerse además como mecanismo de respaldo cuando el LLM no esté disponible.

## Próximas iteraciones

Las siguientes etapas previstas incluyen:

* integración del LLM local con el flujo de Chang@;
* backend y persistencia de producción;
* autenticación y autorización;
* integración con servicios externos;
* ejecución efectiva de una mayor cantidad de agentes;
* mejora del matching mediante información histórica;
* ampliación de controles de seguridad y privacidad.

## Ejecución del prototipo

El frontend publicado puede utilizarse directamente desde:

https://ch1405041c0.github.io/ChangAI/

Para ejecutar el proyecto localmente también puede clonarse el repositorio y servirse como aplicación web estática.

La ejecución de Ollama **no es necesaria para utilizar la versión web actualmente publicada**.

## Autor

**Juan Manuel García**

Trabajo Final de Ciclo
**Inteligencia Artificial Aplicada a Organizaciones**
Universidad Tecnológica Nacional — Facultad Regional Buenos Aires


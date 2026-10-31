# Arca Valoris — Comparables y homologación SHF para la ZMG

*Arca Valoris* (latín): "el arca del valor".

Herramienta para valuadores: reúne anuncios de inmuebles en venta y renta de la Zona Metropolitana de Guadalajara, los clasifica con Claude, selecciona los comparables del inmueble sujeto y calcula el valor comercial por homologación siguiendo los factores de la metodología SHF.

## Qué hace

1. **Base de datos** de casas, departamentos, locales, oficinas, bodegas y terrenos en los 10 municipios de la ZMG (Guadalajara, Zapopan, Tlaquepaque, Tonalá, Tlajomulco, El Salto, Juanacatlán, Ixtlahuacán de los Membrillos, Zapotlanejo, Acatlán de Juárez).
2. **Clasificación** por operación, tipo, uso de suelo (habitacional / comercial), con o sin construcción, clase SHF (mínima → residencial plus), edad, conservación (nuevo, remodelado, bueno, regular, malo) y ubicación en manzana.
3. **Selección de comparables**: mismo tipo, uso y operación; ordenados por distancia, superficie, edad y clase dentro de un radio configurable.
4. **Homologación**: factores de negociación, zona (editable), ubicación, superficie, edad (vida útil remanente), conservación y calidad/clase. Factor resultante con control de rango, coeficiente de variación y valor concluido.
5. **Reporte** imprimible / PDF.

## Carga de anuncios

| Conector | Automatización | Estado |
|---|---|---|
| Anuncio pegado → Claude | Claude extrae datos y clasifica clase SHF, edad y conservación | Funciona con API key de Anthropic |
| CSV / JSON | Carga masiva (exportaciones de inmobiliarias, captura propia) | Funciona |
| EasyBroker API | Sincronización automática del inventario de inmobiliarias | Implementado, sin probar con key real; puede requerir servidor por CORS |

Los portales públicos (Inmuebles24, Casas y Terrenos, Vivanuncios) prohíben la extracción automatizada en sus términos de uso; la ruta automática prevista es por APIs oficiales y convenios.

**Los 728 anuncios precargados son simulados** (precios y ubicaciones aproximados por colonia) para demostrar el flujo: 52 colonias de los 10 municipios; casas, departamentos, locales, oficinas, bodegas y terrenos; uso habitacional, comercial, industrial y mixto; venta y renta; con recámaras, baños, estacionamientos, niveles y fecha de publicación.

## Uso

Abrir `index.html` desde un servidor estático (por ejemplo GitHub Pages). Sin dependencias ni build: HTML + JavaScript + Leaflet (cdnjs) + OpenStreetMap.

```
js/data.js     catálogos ZMG y base de demostración
js/shf.js      selección de comparables y homologación
js/ingesta.js  conectores: CSV/JSON, Claude, EasyBroker
js/app.js      interfaz
```

## Parámetros

Editables en **Configuración**: factor de negociación (0.95), exponente de superficie (0.125), paso entre clases (8%), rango del factor resultante (0.80–1.20), número y mínimo de comparables, radio de búsqueda. Deben validarse contra la normativa SHF vigente y el criterio del valuador.

## Siguiente fase

- Base en Supabase/PostGIS con actualización programada desde APIs oficiales.
- Geocodificación de direcciones y visión de Claude sobre fotos para clase y conservación.
- Enfoques físico y de capitalización de rentas; formato de avalúo SHF completo.

Proyecto de Karina Bolaños, valuadora · Hackathon 2026.

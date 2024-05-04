// Permite crear etiquetas  HTML dinamicas a partir del objeto json
const { json, select, selectAll, geoOrthographic, geoPath, geoGraticule, scaleBand, scaleLinear, axisBottom, axisLeft } = d3;

// Crear variables globales
let geojson, globe, projection, path, graticule, infoPanel, isMouseDown = false, rotation = {x: 0, y: 0}

const globeSize = {
    w: window.innerWidth/2.5,
    h: window.innerHeight
}

var escalaColor = d3.scaleLinear().domain ([50,85]).range (['#FDFDF5', '#004D4A']);

// Llamar al servidor para traer los datos, para pasar a una funcion init
//json('final_completed_custom.geo.json').then(data => init(data))
json('dataset.json').then(data => init(data))

// Declarar la funcion init
const init = data => {
    geojson = data
    drawGlobe()
    drawGraticule()
    renderInfoPanel()
    createHoverEffect()
    createDraggingEvents()
}

// Funcion de dibujar el globo
const drawGlobe = () => {
    //Crear el entorno del desarrollo
    globe = select('body')
    .append('svg')
    .attr( 'width', window.innerWidth)
    .attr( 'height', window.innerHeight)
    
    projection  = geoOrthographic()
    .fitSize([globeSize.w,globeSize.h], geojson)
    .translate([window.innerWidth-globeSize.w/1.5, window.innerHeight/2])

    path = geoPath().projection(projection)

    // Dibujar un círculo para el océano
    globe.append('circle')
        .attr('cx', window.innerWidth - globeSize.w / 1.5)
        .attr('cy', window.innerHeight / 2)
        .attr('r', globeSize.w / 1.98) // Ajustar el radio al tamaño del globo
        .style('fill', '#000011') // Color de los océanos
        .transition()
        .duration(500) // Duración de la transición en milisegundos
        .style("stroke", "#ffffff1e") // Cambia el color del borde del círculo a blanco para simular el brillo
        .style("stroke-width", 3); // Ajusta el ancho del borde para que se vea más brillante

    globe
    .selectAll('path')
    .data(geojson.features)
    .enter().append('path')
    .attr('d', path)
    .style('fill', d => escalaColor(d.properties.Life_expectancy))
    .style('stroke', d => escalaColor(d.properties.Life_expectancy))
    .attr('class', 'country')
}

// Funcion de dibujar la Graticula
const drawGraticule = ()=>{
    graticule = geoGraticule()

    globe
    .append('path')
    .attr( 'class', 'graticule')
    .attr('d', path(graticule()))
    .attr('fill', 'none')
    .attr('stroke', '#ffffff10')
}

// Funcion del Panel de Informacion
const renderInfoPanel = () => infoPanel = select('body').append('article').attr('class', 'info')

// Funcion  para crear el efecto al pasar  por encima de un pais
const createHoverEffect = () => {
    globe
    .selectAll(	 '.country' )
    .on('mouseover', function(e, d){
        const { name, Life_expectancy, Men, Women, gender } = d.properties
        infoPanel.html(`
        <h1>${name}</h1>
        <p><b>Life Expectancy: </b>${Life_expectancy}</p>
        <hr class="custom-hr">
        <div class="image-container"> <!-- Agregamos una clase al contenedor -->
            <div class="image-info">
                <img src="/assets/men.png" alt="Icono de hombre" width="60" height="60">
                <div>${Men}</div>
                <div><n>Men</n> </div>
            </div>
            <div class="image-info">
                <img src="/assets/women.png" alt="Icono de mujer" width="60" height="60">
                <div>${Women}</div>
                <div><n>Women</n> </div>
            </div>
        </div>
        `);

       
        globe.selectAll('.country').style('fill', d => escalaColor(d.properties.Life_expectancy)).style('stroke', d => escalaColor(d.properties.Life_expectancy)) 
        select(this).style('fill', '#D1A91B').style('stroke', 'gold')
        //createChartBar([{"gender": "Men", "value": Men}, {"gender": "Women", "value": Women}]);
        const dataMen = Object.entries(gender.Men).map(([year, value]) => ({ year: +year, value }));
        const dataWomen = Object.entries(gender.Women).map(([year, value]) => ({ year: +year, value }));
        createLineChart(dataMen, dataWomen);
    })
}

const createDraggingEvents  = () => {
    globe
    .on( 'mousedown', () => isMouseDown  = true)
    .on( 'mouseup', () => isMouseDown  = false)
    .on( 'mousemove', e => {
        
        if (isMouseDown){
            const {movementX, movementY}  = e

            rotation.x += movementX  / 2
            rotation.y += movementY / 2

            projection.rotate([rotation.x, rotation.y])
            selectAll('.country').attr('d', path)        
            selectAll('.graticule').attr('d', path(graticule()))
        }
    })
}

// Funcion para crear la grafica de barras
const createChartBar = (data) => {
    
    const margin = { top: 200, right: 0, bottom: 30, left: 80 },
        width = 300 
        height = 300 

    const svg = select('#bar-chart')
        .html('') // Clear previous
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .style("position","fixed")
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    const x = d3.scaleBand()
        .range([0, width])
        .padding(0.1)
        .domain(data.map(d => d.gender));

    const y = d3.scaleLinear()
        .range([height, 1])
        .domain([0, 86]);

    svg.selectAll('.bar')
        .data(data)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.gender))
        .attr('width', x.bandwidth())
        .attr('y', d => y(d.value))
        .attr('height', d => height - y(d.value))
        .style('fill', d => escalaColor(d.value));

    svg.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x))
        .selectAll('path, line, text')
        .style('color', 'white')
        .style('font-size', '14px')
        
        svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll('path, line, text')
        .style('color', 'white')
        .style('font-size', '14px')
}

// Función para crear la gráfica de líneas
const createLineChart = (dataMen, dataWomen) => {
    const margin = { top: 280, right: 80, bottom: 100, left: 80 },
        width = 450 
        height = 200 

    // Limpia cualquier gráfica existente
    select("#line-chart").html('')

    // Añade el elemento SVG al div
    const svg = select("#line-chart")
      .append("svg")
        .attr("width", width + margin.left + margin.right + 100)
        .attr("height", height + margin.top + margin.bottom)
      .style("position","fixed")
      .append("g")
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    
    // Añade X axis
    const x = scaleLinear()
      .domain([2011, 2020]) // Establece el dominio directamente
      .range([0, width]);
    
      svg.append("g")
      .attr("transform", 'translate(0,' + height + ')')
      .call(axisBottom(x).ticks(10).tickFormat(d3.format("d")))
      .selectAll('path, line, text')
        .style('color', 'white')
        .style('font-size', '14px')

    // Añade Y axis
    const y = scaleLinear()
      .domain([44, 88])
      .range([ height, 0 ]);
    svg.append("g")
      .call(axisLeft(y))
      .selectAll('path, line, text')
        .style('color', 'white')
        .style('font-size', '14px')

    // Función para dibujar la línea
    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.value));

    // Dibuja la línea para Men
    svg.append("path")
      .datum(dataMen)
      .attr("class", "line")
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "#5CA298")
      .attr("stroke-width", 5)
      .call(transition) // Llamar a la función de transición

    // Dibuja la línea para Women
    svg.append("path")
      .datum(dataWomen)
      .attr("fill", "none")
      .attr("stroke", "#E08E97")
      .attr("stroke-width", 5)
      .attr("d", line)
      .call(transition); // Llamar a la función de transición

    // Agrega puntos para Men
    svg.selectAll(".dot-men")
        .data(dataMen)
        .enter().append("circle") // Crea un círculo para cada punto
        .attr("class", "dot-men")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.value))
        .attr("r", 0) // Radio del círculo, ajustable según tus necesidades
        .attr("fill", "#5CA298")
        .transition() // Inicia la transición
        .duration(3000) // Duración de la transición (en milisegundos)
        .delay(function(d, i) { return i * 100; }) // Retardo para cada punto
        .attr("r", 7) // Radio del círculo, ajustable según tus necesidades
    // Agrega puntos para Women
    svg.selectAll(".dot-women")
        .data(dataWomen)
        .enter().append("circle") // Crea un círculo para cada punto
        .attr("class", "dot-Women")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.value))
        .attr("r", 0) // Radio del círculo, ajustable según tus necesidades
        .attr("fill", "#E08E97")
        .transition() // Inicia la transición
        .duration(100) // Duración de la transición (en milisegundos)
        .delay(function(d, i) { return i * 300; }) // Retardo para cada punto
        .attr("r", 7) // Radio del círculo, ajustable según tus necesidades

    // Agregar nombre al eje X
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .style("text-anchor", "middle")
      .text("Year")
      .style('fill', 'white')

    // Agregar nombre al eje Y
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -40)
      .style("text-anchor", "middle")
      .text("Life Expectancy (age)")
      .style('fill', 'white')

}

// Función para la transición
function transition(path) {
    path.transition()
        .duration(3000) // Duración de la transición en milisegundos
        .attrTween("stroke-dasharray", tweenDash);
  }
  
  // Función auxiliar para crear la transición de las líneas punteadas
  function tweenDash() {
    var l = this.getTotalLength(),
        i = d3.interpolateString("0," + l, l + "," + l);
    return function(t) { return i(t); };
  }

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
        .style('fill', '#000011'); // Color de los océanos

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
        const { name, Life_expectancy, Men, Women } = d.properties
        infoPanel.html(`<h1>${name}</h1><hr class="custom-hr"><p><b><u>Life expectancy</u>: </b>${Life_expectancy}</p><p><i><b>Men: </b>${Men}<b>   Women: </b>${Women}</i></p>`)
        globe.selectAll('.country').style('fill', d => escalaColor(d.properties.Life_expectancy)).style('stroke', d => escalaColor(d.properties.Life_expectancy)) 
        select(this).style('fill', '#D1A91B').style('stroke', 'gold')
        createChartBar([{"gender": "Men", "value": Men}, {"gender": "Women", "value": Women}]);
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
};

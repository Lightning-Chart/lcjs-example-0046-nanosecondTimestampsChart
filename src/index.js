const lcjs = require('@lightningchart/lcjs')
const { AxisTickStrategies, emptyFill, lightningChart, Themes } = lcjs

const exampleContainer = document.getElementById('chart') || document.body
if (exampleContainer === document.body) {
    exampleContainer.style.width = '100vw'
    exampleContainer.style.height = '100vh'
    exampleContainer.style.margin = '0px'
}
const containerChart1 = document.createElement('div')
const containerChart2 = document.createElement('div')
exampleContainer.append(containerChart1)
exampleContainer.append(containerChart2)
containerChart1.style.width = '100%'
containerChart1.style.height = '80%'
containerChart2.style.width = '100%'
containerChart2.style.height = '20%'

//
// Example data generation
//
// step between data points = 1 nanosecond
const stepNs = BigInt(1)
// total generated data set time range = 24 hours
const dateRangeNs = BigInt(24) * BigInt(60) * BigInt(60) * BigInt(1000) * BigInt(1000) * BigInt(1000)
const sampleCount = 1_000_000
const data = {
    x: new BigInt64Array(sampleCount),
    y: [Number.NaN],
}
data.x[0] = BigInt('1741946159532000000') // ns big int timestamp
let x = data.x[0] + stepNs
let iArr = 1
const groupCount = 10
for (let i = 0; i < groupCount; i += 1) {
    for (let c = 0; c < Math.floor(sampleCount / groupCount); c += 1) {
        data.x[iArr] = x
        data.y[iArr] = Math.random()
        iArr++
        x += stepNs
    }
    data.x[iArr] = x
    data.y[iArr] = Number.NaN
    iArr++
    x += stepNs
    x += dateRangeNs / BigInt(groupCount)
}
data.y.length = data.x.length
console.log('raw data', data)
//
// Actual nanosecond timestamp chart creation
//
const lc = lightningChart({
            resourcesBaseUrl: new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'resources/',
        })
const chart = lc
    .ChartXY({
        container: containerChart1,
        defaultAxisX: {
            type: 'linear-highPrecision',
        },
        theme: Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined,
    })
    .setTitle('Nanosecond timestamp chart')

// LCJS can't directly consume BigInt64Array
// shift bigint64 data to start from near 0 in order to store it in Float64Array without losing nanosecond precision
const xsShifted = new Float64Array(data.x.length)
const shiftDate = new Date(Number(data.x[0]) / 1_000_000)
shiftDate.setUTCHours(0, 0, 0, 0)
const shiftOrigin = shiftDate.getTime()
const shiftOriginNanos = BigInt(shiftOrigin) * BigInt(1_000_000)
for (let i = 0; i < data.x.length; i++) {
    xsShifted[i] = Number(data.x[i] - shiftOriginNanos) / 1_000_000
}

const series = chart
    .addLineSeries({
        schema: {
            xValues: { pattern: 'progressive' },
            yValues: { pattern: null },
        },
    })
    .setAreaFillStyle(emptyFill)
    .setStrokeStyle((stroke) => stroke.setThickness(-1))
    .appendSamples({ xValues: xsShifted, yValues: data.y })

chart.axisX.setTickStrategy(AxisTickStrategies.DateTime, (strategy) => strategy.setDateOrigin(shiftDate))

// Apply default view for demo purposes. Note that these are shifted millisecond timestamps.
chart.axisX.setInterval({
    end: 78959532.55768886,
    start: 78959532.55760992,
})

// Add ZBC just to show the absurd zoom in capability
const zoomBandChart = lc.ZoomBandChart({ container: containerChart2 })
zoomBandChart.add(series)

// For more details refer to nanosecond timestamps section in developer documentation https://lightningchart.com/js-charts/docs/

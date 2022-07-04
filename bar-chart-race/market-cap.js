// Nombre Símbolo Imagen 12/01/2013 13/01/2013 ... 2/07/2022
// Bitcoin BTC     URL     360          370             639
// Ethereum ....
const request = require('sync-request')
const commaNumber = require('comma-number')
const xl = require('excel4node')

const wb = new xl.Workbook()
const ws = wb.addWorksheet('Top 20 criptomonedas por Market Cap 2013-2022')

const TIMEOUT = 6000
const tableData = []
const header = [
    'Nombre', 'Símbolo', 'Imagen'
]

const sleep = (timeMs) => new Promise(resolve => setTimeout(resolve, timeMs))

function pMinify(number) {
    if (number)
        return commaNumber(number, '.')
    else return '0,00'
}

function createTable(headerColumnName, data) {
    var headerColumnIndex = 1
    headerColumnName.forEach(heading => {
        ws.cell(1, headerColumnIndex++)
            .string(heading)
    })

    var rowIndex = 2
    data.forEach(record => {
        var columIndex = 1
        Object.keys(record).forEach(columName => {
            ws.cell(rowIndex, columIndex++)
                .string(record[columName])
        })

        rowIndex++
    })

    wb.write('market-cap-data.xlsx')
}

async function start(coin, bitcoin) {
    const res = coin.id === 'bitcoin' ? bitcoin :
        JSON.parse(request('GET', `https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=max&interval=daily`,
            { timeout: TIMEOUT }).getBody('utf8'))

    const item = {
        nombre: coin.name,
        symbol: coin.id,
        image: coin.image
    }

    const marketCaps = res
    const size = bitcoin.market_caps.length

    for (var i = 0; i < size; i++) {
        const date = new Date(bitcoin.market_caps[i][0]).toLocaleDateString('es-ES')
        item[date] = ''
    }

    marketCaps.market_caps.forEach((mCap) => {
        const date = new Date(mCap[0]).toLocaleDateString('es-ES')
        item[date] = pMinify(mCap[1] ? mCap[1].toFixed(0) : 0)
    })

    tableData.push(item)
}

async function init() {
    const coins = JSON.parse(request('GET', `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1`,
        { timeout: TIMEOUT }).getBody('utf8'))

    const bitcoin = JSON.parse(request('GET', `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=max&interval=daily`,
        { timeout: TIMEOUT }).getBody('utf8'))

    const dates = bitcoin
    for (var i = 0; i < dates.market_caps.length; i++) {
        const date = new Date(dates.market_caps[i][0]).toLocaleDateString('es-ES')
        header.push(date)
    }

    for (var i = 0; i < 20; i++) {
        const coin = coins[i]
        console.log('Starting...' + coin.id)
        try {
            await start(coin, bitcoin)
        } catch (e) {
            console.log('TIMEOUT')
            i--
        }

        console.log('Waiting...')
        await sleep(2000)
    }

    createTable(header, tableData)
}

init()
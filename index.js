import fs from 'node:fs'
import yargs from 'yargs'

let argv = yargs(process.argv.slice(2)).parse()
let command = argv._[0]?.toLowerCase()
let tracks = []

try {
    tracks = JSON.parse(fs.readFileSync(`expense-tracks.json`))
} catch {
    writeFile()
}

function writeFile() {
    fs.writeFileSync(`expense-tracks.json`, JSON.stringify(tracks))
}

// command = add/list/summary/delete

switch(command) {
    case 'add': addTrack(); break
    case 'list': list(); break
    case 'summary': summary(); break
    case 'delete': deleteTrack(); break
    default:
        console.error(`command should be add/list/summary/delete`); break
}
function addTrack() {
    let newId = tracks.length + 1
    if(tracks.some(item => item.id == newId))
        newId += 1
    try {
        let argvKeys = Object.keys(argv)
        let checkOrder = argvKeys.indexOf('amount') < argvKeys.indexOf('description')
        // The parser coerces the argument if the user doesn't set value, boolean type check is because of this matter  
        if((!argv.description && !argv.amount) || checkOrder || (argv.amount  && !argv.description))
            throw `invalidCommand`
        if(typeof(argv.description) === 'boolean' || !argv.description)
            throw `noDescription`
        if(typeof(argv.amount) === 'boolean' || !argv.amount)
            throw `noAmount`
        if(argv.amount < 0)
            throw `negativeNum`
        if(typeof(argv.amount) !== 'number')
            throw `amountNotNum`
        if(argv.amount)
        tracks.push({
            id: newId,
            date: formattedDate(),
            description: argv.description,
            amount: argv.amount,
        })
        writeFile()
        console.log(`Expense added successfully. ID : ${newId}`)
    } catch(error) {
        switch(error){
            case 'invalidCommand':
                console.error(`The command instructure for adding tracks should be: add --description '<text>' --amount <number>`); break
            case 'noDescription':
                console.error(`Description should not be empty`); break
            case 'noAmount':
                console.error('Amount should not be empty'); break
            case 'negativeNum':
                console.error(`Amount should be positive number`); break
            case 'amountNotNum':
                console.error(`Amount should be a number`); break
            }
    }
}
function formattedDate() {
    let today = new Date()
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const formattedDate = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
    return formattedDate
}
function deleteTrack() {
    let trackId = argv.id
    try {
        if(!trackId || typeof(trackId) === 'boolean')
            throw `emptyId`
        if(typeof(trackId) != 'number')
            throw `notNumber`
        if(!tracks.some(item => item.id == trackId))
            throw `foundNoTrack`
        tracks = tracks.filter(item => item.id !== trackId)
        writeFile()
        console.log(`Expense deleted successfully. ID : ${trackId}`)
    }
    catch(error) {
        if(error === `emptyId`)
            console.error(`For deleting track: delete --id <number>`)
        if(error === `notNumber`)
            console.error(`The ID should be a number`)
        if(error === `foundNoTrack`)
            console.error(`This ID doesn't exist `)
    }
}
function list() {
    console.table(tracks)
}
function summary() {
    let summary = 0
    let monthRange = Array.from({length: 12}, (x, i) => i + 1)
    if(argv.month) {
        try {
            if(typeof(argv.month) === 'boolean')
                throw `empty`
            if(isNaN(argv.month))
                throw `notNum`
            if(!monthRange.includes(argv.month))
                throw `rangeErr`

            let filterTracksByMonth = tracks.filter(item => parseInt(item.date.slice(5,7)) === argv.month)
            filterTracksByMonth.forEach(item => summary += item.amount)
            function numberToMonth(num) {
                return Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(num))
            }
            console.log(`Total expenses for ${numberToMonth(argv.month.toString())}:`, summary)
        }
        catch(error) {
            if(error === `empty`)
                console.error(`You haven't initialized the month`)
            if(error === `notNum`)
                console.error(`Month value should be a number`)
            if(error === `rangeErr`)
                console.error(`Month should be in range of 1-12`)
        }
    }
    else {
        tracks.forEach(item => summary += item.amount)
        console.log(`Total expenses: `, summary)
    }
}
import fs from 'node:fs'
import { json } from 'node:stream/consumers'
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
    let newId
    if(tracks.some(item => item.id === newId))
        newId += 1
    else
        newId = tracks.length + 1
    try {
        if(!argv.description && !argv.amount)
            throw `invalidCommand`
        if(typeof(argv.description) === 'boolean')
            throw `noDescription`
        if(!argv.amount)
            throw `noAmount`
        // here
        console.log(amount)
        
        tracks.push({
            id: newId,
            description: argv.description,
            amount: argv.emount, 
            date:  formattedDate()
        })
    } catch(error) {
        switch(error){
            case 'invalidCommand':
                console.error(`The command for adding tracks should be: add --description '<text>' --amount <number>`); break
            case 'noDescription':
                console.error(`Description should not be empty`); break
            case 'noAmount':
                console.error('Amount should not be empty'); break
            }
    }


    console.log(tracks)
}
function formattedDate() {
    let today = new Date()
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const formattedDate = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
    return formattedDate
}
function list() {

}
function summary() {

}
function deleteTrack() {

}